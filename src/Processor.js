/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/
'use strict';

/*
 * This class implements the virtual processor for The Bali Nebula™.
 */
const bali = require('bali-component-framework').api();
const compiler = require('bali-type-compiler').api();
const decoder = bali.decoder();

const ACTIVE = '$active';
const WAITING = '$waiting';
const DONE = '$done';
const EOL = '\n';  // This private constant sets the POSIX end of line character
const TASK_QUEUE = '3F8TVTX4SVG5Z12F3RMYZCTWHV2VPX4K';
const EVENT_QUEUE = '3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';


/**
 * This function creates a new processor to execute the specified task.
 *
 * @constructor
 * @param {Object} notary An object that implements the Bali Nebula™ digital notary interface.
 * @param {Object} repository An object that implements the Bali Nebula™ document repository interface.
 * @param {Catalog} state A catalog containing the current state of the task the processor will execute.
 * @param {Boolean|Number} debug An optional number in the range [0..3] that controls the level of
 * debugging that occurs:
 * <pre>
 *   0 (or false): no logging
 *   1 (or true): log exceptions to console.error
 *   2: perform argument validation and log exceptions to console.error
 *   3: perform argument validation and log exceptions to console.error and debug info to console.log
 * </pre>
 * @returns {VirtualProcessor} The new processor loaded with the task.
 */
const VirtualProcessor = function(notary, repository, state, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    // convert the task state and current context catalogs to JS objects for better performance
    const task = importTask(state);
    var context = importContext(task.contexts.removeItem());


    // PUBLIC METHODS

    /**
     * This method returns a string representation of the current processor state using
     * Bali Document Notation™.
     *
     * @returns {String} A string representation of the current processor state.
     */
    this.toString = function() {
        return exportTask(task, context).toString();
    };

    /**
     * This method executes the next instruction in the current task.
     *
     * @returns {Boolean} Whether or not an instruction was executed.
     */
    this.step = async function() {
        try {
            if (fetchInstruction()) {
                await executeInstruction();
                return true;
            } else {
                await finalizeProcessing();
                return false;
            }
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$step',
                $exception: '$unexpected',
                $task: exportTask(task, context),
                $text: 'An unexpected error occurred while attempting to execute a single step of a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };

    /**
     * This method executes all of the instructions in the current task until one of the
     * following:
     * <pre>
     *  * the end of the instructions is reached,
     *  * an unhandled exception is thrown,
     *  * the account balance reaches zero,
     *  * or the task is waiting to receive a message from a queue.
     * </pre>
     */
    this.run = async function() {
        try {
            while (fetchInstruction()) {
                await executeInstruction();
            }
            await finalizeProcessing();
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$run',
                $exception: '$unexpected',
                $task: exportTask(task, context),
                $text: 'An unexpected error occurred while attempting to run a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };


    // PRIVATE METHODS

    const isRunnable = function() {
        const hasInstructions = context && context.address <= context.bytecode.length;
        const isActive = task.status === ACTIVE;
        const hasTokens = task.balance > 0;
        return hasInstructions && isActive && hasTokens;
    };

    const fetchInstruction = function() {
        if (isRunnable()) {
            const address = context.address;
            const instruction = context.bytecode[address - 1];  // convert to JS indexing
            context.instruction = instruction;
            return true;
        } else {
            return false;
        }
    };

    const executeInstruction = async function() {
        // decode the bytecode instruction
        const instruction = context.instruction;
        const operation = compiler.operation(instruction);
        const modifier = compiler.modifier(instruction);
        const operand = compiler.operand(instruction);

        // pass execution off to the correct operation handler
        const index = (operation << 2) | modifier;  // index: [0..31]
        try {
            await instructionHandlers[index](operand); // operand: [0..2047]
        } catch (exception) {
            try {
                await handleException(exception);
            } catch (exception) {
                if (debug) console.error('Unable to handle exception: ' + exception);
            }
        }

        // update the state of the task context
        task.clock++;
        task.balance--;
    };

    const handleException = async function(exception) {
        if (exception.constructor.name !== 'Exception') {
            // it's a bug in the compiler or processor
            const stack = exception.stack.split(EOL).slice(1);
            stack.forEach(function(line, index) {
                line = '  ' + line;
                if (line.length > 80) {
                    line = line.slice(0, 44) + '..' + line.slice(-35, -1);
                }
                stack[index] = line;
            });
            exception = bali.catalog({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$executeInstruction',
                $exception: '$processorBug',
                $type: exception.constructor.name,
                $processor: exportTask(task, context),
                $text: exception.toString(),
                $trace: bali.text(EOL + stack.join(EOL))
            });
            if (debug) console.error('FOUND BUG IN PROCESSOR: ' + exception);
        }
        task.stack.addItem(exception.attributes);
        await instructionHandlers[29]();  // HANDLE EXCEPTION instruction
    };

    const finalizeProcessing = async function() {
        const status = task.status;
        switch (status) {
            case ACTIVE:
                // the task hit a break point or the account balance is zero so notify any interested parties
                await publishSuspensionEvent();
                break;
            case WAITING:
                // the task is waiting on a message so requeue the task context
                await queueTaskContext();
                break;
            case DONE:
                // the task completed successfully or with an exception so notify any interested parties
                await publishCompletionEvent();
                break;
            default:
        }
    };

    const publishCompletionEvent = async function() {
        const task = exportTask(task, context);
        const event = bali.catalog({
            $eventType: '$completion',
            $tag: task.tag,
            $account: task.account,
            $balance: task.balance,
            $clock: task.clock
        }, bali.parameters({
            $tag: bali.tag(),
            $version: bali.version(),
            $permissions: '/bali/permissions/public/v1',
            $previous: bali.pattern.NONE
        }));
        if (task.result) {
            event.setValue('$result', task.result);
        } else {
            event.setValue('$exception', task.exception);
        }
        event = await notary.notarizeDocument(event);
        await repository.addMessage(EVENT_QUEUE, event);
    };

    const publishSuspensionEvent = async function() {
        const task = exportTask(task, context);
        var event = bali.catalog({
            $eventType: '$suspension',
            $tag: task.tag,
            $task: task
        }, bali.parameters({
            $tag: bali.tag(),
            $version: bali.version(),
            $permissions: '/bali/permissions/public/v1',
            $previous: bali.pattern.NONE
        }));
        event = await notary.notarizeDocument(event);
        await repository.addMessage(EVENT_QUEUE, event);
    };

    const pushContext = async function(target, message, args) {
        task.contexts.addItem(exportContext(context));
        context = await createContext(repository, target, message, args);
    };

    const popContext = function() {
        context = importContext(task.contexts.removeItem());
    };

    const queueTaskContext = async function() {
        // queue up the task for a new virtual processor
        const state = exportTask(task, context);
        state = await notary.notarizeDocument(state);
        await repository.addMessage(TASK_QUEUE, state);
    };

    // PRIVATE MACHINE INSTRUCTION HANDLERS (ASYNCHRONOUS)

    const instructionHandlers = [
        // JUMP TO label
        async function(operand) {
            // if the operand is not zero then use it as the next instruction to be executed,
            // otherwise it is a SKIP INSTRUCTION (aka NOOP)
            if (operand) {
                const address = operand;
                context.address = address;
            } else {
                context.address++;
            }
        },

        // JUMP TO label ON NONE
        async function(operand) {
            const address = operand;
            // pop the condition component off the component stack
            const condition = task.stack.removeItem();
            // if the condition is 'none' then use the address as the next instruction to be executed
            if (condition.isEqualTo(bali.pattern.NONE)) {
                context.address = address;
            } else {
                context.address++;
            }
        },

        // JUMP TO label ON TRUE
        async function(operand) {
            const address = operand;
            // pop the condition component off the component stack
            const condition = task.stack.removeItem();
            // if the condition is 'true' then use the address as the next instruction to be executed
            if (condition.toBoolean()) {
                context.address = address;
            } else {
                context.address++;
            }
        },

        // JUMP TO label ON FALSE
        async function(operand) {
            const address = operand;
            // pop the condition component off the component stack
            const condition = task.stack.removeItem();
            // if the condition is 'false' then use the address as the next instruction to be executed
            if (!condition.toBoolean()) {
                context.address = address;
            } else {
                context.address++;
            }
        },

        // PUSH HANDLER label
        async function(operand) {
            const handlerAddress = operand;
            // push the address of the current exception handlers onto the handlers stack
            context.handlers.addItem(bali.number(handlerAddress));
            context.address++;
        },

        // PUSH LITERAL literal
        async function(operand) {
            const index = operand;
            // lookup the literal associated with the index
            const literal = context.literals.getItem(index);
            task.stack.addItem(literal);
            context.address++;
        },

        // PUSH CONSTANT constant
        async function(operand) {
            const index = operand;
            // lookup the constant associated with the index
            const constant = context.constants.getItem(index).getValue();
            task.stack.addItem(constant);
            context.address++;
        },

        // PUSH ARGUMENT argument
        async function(operand) {
            const index = operand;
            // lookup the argument associated with the index
            const argument = context.argumentz.getItem(index).getValue();
            task.stack.addItem(argument);
            context.address++;
        },

        // POP HANDLER
        async function(operand) {
            // remove the current exception handler address from the top of the handlers stack
            // since it is no longer in scope
            context.handlers.removeItem();
            context.address++;
        },

        // POP COMPONENT
        async function(operand) {
            // remove the component that is on top of the component stack since it was not used
            task.stack.removeItem();
            context.address++;
        },

        // UNIMPLEMENTED POP OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$pop3',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: exportTask(task, context),
                $message: 'An unimplemented POP operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // UNIMPLEMENTED POP OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$pop4',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: exportTask(task, context),
                $message: 'An unimplemented POP operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // LOAD VARIABLE symbol
        async function(operand) {
            const index = operand;
            // lookup the variable associated with the index
            const variable = context.variables.getItem(index).getValue();
            task.stack.addItem(variable);
            context.address++;
        },

        // LOAD MESSAGE symbol
        async function(operand) {
            const index = operand;
            // lookup the queue tag associated with the index
            const queue = context.variables.getItem(index).getValue();
            // TODO: jump to exception handler if queue isn't a tag
            // attempt to receive a message from the queue in the document repository
            var message;
            const source = await repository.borrowMessage(queue);
            if (source) {
                // validate the document
                const document = bali.component(source);
                message = document.getValue('$content');
            }
            if (message) {
                // place the message on the stack
                task.stack.addItem(message);
                context.address++;
            } else {
                // set the task status to 'waiting'
                task.status = WAITING;
            }
        },

        // LOAD DRAFT symbol
        async function(operand) {
            const index = operand;
            // lookup the citation associated with the index
            const citation = context.variables.getItem(index).getValue();
            // TODO: jump to exception handler if the citation isn't a citation
            // retrieve the cited draft from the document repository
            const source = await repository.readDraft(citation);
            const document = bali.component(source);
            await notary.citationMatches(citation, document);
            const draft = document.getValue('$content');
            // push the draft on top of the component stack
            task.stack.addItem(draft);
            context.address++;
        },

        // LOAD DOCUMENT symbol
        async function(operand) {
            const index = operand;
            // lookup the citation associated with the index
            const citation = context.variables.getItem(index).getValue();
            // TODO: jump to exception handler if the citation isn't a citation
            // retrieve the cited document from the document repository
            const source = await repository.readDocument(citation);
            var document = bali.component(source);
            await notary.citationMatches(citation, document);
            document = document.getValue('$content');
            // push the document on top of the component stack
            task.stack.addItem(document);
            context.address++;
        },

        // STORE VARIABLE symbol
        async function(operand) {
            const index = operand;
            // pop the component that is on top of the component stack off the stack
            const component = task.stack.removeItem();
            // and store the component in the variable associated with the index
            context.variables.getItem(index).setValue(component);
            context.address++;
        },

        // STORE MESSAGE symbol
        async function(operand) {
            const index = operand;
            // pop the message that is on top of the component stack off the stack
            var message = task.stack.removeItem();
            // lookup the queue tag associated with the index operand
            const queue = context.variables.getItem(index).getValue();
            // TODO: jump to exception handler if queue isn't a tag
            // send the message to the queue in the document repository
            message = await notary.notarizeDocument(message);
            await repository.addMessage(queue, message);
            context.address++;
        },

        // STORE DRAFT symbol
        async function(operand) {
            const index = operand;
            // pop the draft that is on top of the component stack off the stack
            var draft = task.stack.removeItem();
            // write the draft to the document repository
            draft = await notary.notarizeDocument(draft);
            const citation = await notary.citeDocument(draft);
            await repository.writeDraft(draft);
            // and store the resulting citation in the variable associated with the index
            context.variables.getItem(index).setValue(citation);
            context.address++;
        },

        // STORE DOCUMENT symbol
        async function(operand) {
            const index = operand;
            // pop the document that is on top of the component stack off the stack
            const component = task.stack.removeItem();
            // write the document to the document repository
            const document = await notary.notarizeDocument(component);
            const citation = await notary.citeDocument(document);
            await repository.writeDocument(document);
            await repository.deleteDraft(citation);
            // and store the resulting citation in the variable associated with the index
            context.variables.getItem(index).setValue(citation);
            context.address++;
        },

        // INVOKE symbol
        async function(operand) {
            const index = operand;
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index);
            // push the result of the function call onto the top of the component stack
            task.stack.addItem(result);
            context.address++;
        },

        // INVOKE symbol WITH 1 ARGUMENT
        async function(operand) {
            const index = operand;
            // pop the argument off of the component stack
            const argument = task.stack.removeItem();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument);
            // push the result of the function call onto the top of the component stack
            task.stack.addItem(result);
            context.address++;
        },

        // INVOKE symbol WITH 2 ARGUMENTS
        async function(operand) {
            const index = operand;
            // pop the arguments off of the component stack (in reverse order)
            const argument2 = task.stack.removeItem();
            const argument1 = task.stack.removeItem();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument1, argument2);
            // push the result of the function call onto the top of the component stack
            task.stack.addItem(result);
            context.address++;
        },

        // INVOKE symbol WITH 3 ARGUMENTS
        async function(operand) {
            const index = operand;
            // pop the arguments call off of the component stack (in reverse order)
            const argument3 = task.stack.removeItem();
            const argument2 = task.stack.removeItem();
            const argument1 = task.stack.removeItem();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument1, argument2, argument3);
            // push the result of the function call onto the top of the component stack
            task.stack.addItem(result);
            context.address++;
        },

        // SEND symbol TO COMPONENT
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = bali.list();
            const target = task.stack.removeItem();
            await pushContext(target, message, argumentz);
            context.address++;
        },

        // SEND symbol TO COMPONENT WITH ARGUMENTS
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = task.stack.removeItem();
            const target = task.stack.removeItem();
            await pushContext(target, message, argumentz);
            context.address++;
        },

        // SEND symbol TO DOCUMENT
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = bali.list();
            const name = task.stack.removeItem();
            await queueTask(name, message, argumentz);
            context.address++;
        },

        // SEND symbol TO DOCUMENT WITH ARGUMENTS
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = task.stack.removeItem();
            const name = task.stack.removeItem();
            await queueTask(name, message, argumentz);
            context.address++;
        },

        // HANDLE RESULT
        async function(operand) {
            if (!task.contexts.isEmpty()) {
                // retrieve the previous context from the stack
                popContext();
                context.address++;
            } else {
                // task completed with a result
                task.result = task.stack.removeItem();
                task.status = DONE;
                context = undefined;
            }
        },

        // HANDLE EXCEPTION
        async function(operand) {
            // search up the stack for a handler
            while (context) {
                if (!context.handlers.isEmpty()) {
                    // retrieve the address of the next exception handler
                    var handlerAddress = context.handlers.removeItem().toNumber();
                    // use that address as the next instruction to be executed
                    context.address = handlerAddress;
                    break;
                } else {
                    if (!task.contexts.isEmpty()) {
                        // retrieve the previous context from the stack
                        popContext();
                    } else {
                        // task completed with an unhandled exception
                        task.exception = task.stack.removeItem();
                        task.status = DONE;
                        context = undefined;
                    }
                }
            }
        },

        // UNIMPLEMENTED HANDLE OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$handle3',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: exportTask(task, context),
                $message: 'An unimplemented HANDLE operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // UNIMPLEMENTED HANDLE OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$handle4',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: exportTask(task, context),
                $message: 'An unimplemented HANDLE operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        }

    ];

    return this;
};
VirtualProcessor.prototype.constructor = VirtualProcessor;
exports.VirtualProcessor = VirtualProcessor;


const createTask = async function(repository, account, balance, target, message, args) {
    const task = {
        tag: bali.tag(),
        account: account,
        balance: balance,
        status: WAITING,
        clock: 0,
        stack: bali.stack(),
        contexts: bali.stack()
    };
    task.contexts.addItem(exportContext(createContext(repository, target, message, args)));
    return task;
};
exports.createTask = createTask;


// PRIVATE FUNCTIONS

const createContext = async function(repository, target, message, args) {
    // retrieve the type of the target and method matching the message
    const ancestry = target.getAncestry();
    var type, method;
    for (i = 0; i < ancestry.length; i++) {
        const typeName = ancestry[i];
        const document = await repository.readName(typeName);
        type = document.getValue('$content');
        const methods = type.getValue('$methods');
        method = methods.getValue(message);
        if (method) break;
    };
    if (!method) {
        const exception = new Exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$createContext',
            $exception: '$unsupportedMessage',
            $message: message,
            $ancestry: ancestry,
            $text: 'The message passed to the target component is not supported by any of its types.'
        });
        if (debug > 0) console.error(exception.toString());
        throw exception;
    }

    // retrieve the bytecode for the method
    const bytes = method.getValue('$bytecode').getValue();
    const bytecode = compiler.bytecode(bytes);

    // retrieve the literals and constants for the type
    const literals = type.getValue('$literals') || bali.set();
    const constants = type.getValue('$constants') || bali.catalog();

    // set the argument values for the passed arguments
    const argumentz = bali.catalog({$target: target});
    var nameIterator = method.getValue('$arguments').getIterator();
    nameIterator.getNext();  // skip the $target name
    var valueIterator = args.getIterator();
    while (nameIterator.hasNext() && valueIterator.hasNext()) {
        const name = nameIterator.getNext();
        const value = valueIterator.getNext();
        argumentz.setValue(name, value);
    }

    // set the rest of the argument values to their default values
    const procedure = method.getValue('$procedure');
    while (nameIterator.hasNext()) {
        const name = nameIterator.getNext();
        const value = procedure.getParameter(name);
        argumentz.setValue(name, value);
    }

    // set the initial values of the variables to 'none'
    const variables = bali.catalog();
    const iterator = method.getValue('$variables').getIterator();
    while (iterator.hasNext()) {
        const variable = iterator.getNext();
        variables.setValue(variable, bali.pattern.NONE);
    }

    // retrieve the sent messages from the method
    const messages = method.getValue('$messages');

    // create an empty exception handler stack
    const handlers = bali.stack();

    // create the new method context
    return {
        target: target,
        message: message,
        argumentz: argumentz,
        variables: variables,
        constants: constants,
        literals: literals,
        messages: messages,
        handlers: handlers,
        bytecode: bytecode,
        address: 0,  // this will be incremented before the next instruction is executed
        instruction: 0
    };
};