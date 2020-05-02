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

const ACTIVE = '$active';
const WAITING = '$waiting';
const DONE = '$done';
const EOL = '\n';  // This private constant sets the POSIX end of line character
const WAIT_QUEUE = '3F8TVTX4SVG5Z12F3RMYZCTWHV2VPX4K';
const EVENT_QUEUE = '3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';


/**
 * This function creates a new processor to execute the specified task.
 *
 * @constructor
 * @param {Object} notary An object that implements the Bali Nebula™ digital notary interface.
 * @param {Object} repository An object that implements the Bali Nebula™ document repository interface.
 * @param {Catalog} task The task for the new processor to execute.
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
const VirtualProcessor = function(notary, repository, task, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    const bali = require('bali-component-framework').api(debug);
    const compiler = require('bali-type-compiler').api(debug);
    const decoder = bali.decoder();
    var state, context;  // these are JS objects not Bali catalogs (for performance reasons)

    loadState(task);  // convert the Bali task catalog to a JS object
    loadContext();  // extract the current context catalog as a JS object


    // PUBLIC METHODS

    /**
     * This method returns a string representation of the current processor state using
     * Bali Document Notation™.
     *
     * @returns {String} A string representation of the current processor state.
     */
    this.toString = function() {
        const task = captureState();
        return task.toString();
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
                $task: captureState(),
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
                $task: captureState(),
                $text: 'An unexpected error occurred while attempting to run a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };


    // PRIVATE FUNCTIONS

    const loadState = function(task) {
        state = {
            tag: task.getValue('$tag'),
            account: task.getValue('$account'),
            balance: task.getValue('$balance').toNumber(),
            status: task.getValue('$status').toString(),
            clock: task.getValue('$clock').toNumber(),
            stack: task.getValue('$stack'),
            contexts: task.getValue('$contexts')
        };
    };

    const exportTask = function() {
        return bali.catalog({
            $tag: state.tag,
            $account: state.account,
            $balance: state.balance,
            $status: state.status,
            $clock: state.clock,
            $stack: state.stack,
            $contexts: state.contexts
        });
    };

    const loadContext = function() {
        const catalog = state.contexts.removeItem();
        const bytes = catalog.getValue('$bytecode').getValue();
        const bytecode = compiler.bytecode(bytes);
        context = {
            target: catalog.getValue('$target'),
            message: catalog.getValue('$message'),
            argumentz: catalog.getValue('$arguments'),
            address: catalog.getValue('$address').toNumber(),
            instruction: catalog.getValue('$instruction').toNumber(),
            bytecode: bytecode,
            literals: catalog.getValue('$literals'),
            constants: catalog.getValue('$constants'),
            variables: catalog.getValue('$variables'),
            messages: catalog.getValue('$messages'),
            handlers: catalog.getValue('$handlers')
        };
    };

    const exportContext = function() {
        const bytes = compiler.bytes(context.bytecode);
        const bytecode = bali.binary(bytes, {$encoding: '$base16', $mediaType: '"application/bcod"'});
        return bali.catalog({
            $target: context.target,
            $message: context.message,
            $arguments: context.argumentz,
            $address: context.address,
            $instruction: context.instruction,
            $bytecode: bytecode,
            $literals: context.literals,
            $constants: context.constants,
            $variables: context.variables,
            $messages: context.messages,
            $handlers: context.handlers
        });
    };

    const captureState = function() {
        const task = exportTask().duplicate();  // take a snapshot of the task
        const contexts = task.getValue('$contexts');
        if (context) {
            contexts.addItem(exportContext().duplicate());  // and a snapshot of the current context
        }
        return task;
    };

    const isRunnable = function() {
        const hasInstructions = context && context.address <= context.bytecode.length;
        const isActive = state.status === ACTIVE;
        const hasTokens = state.balance > 0;
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
        state.clock++;
        state.balance--;
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
                $processor: captureState(),
                $text: exception.toString(),
                $trace: bali.text(EOL + stack.join(EOL))
            });
            if (debug) console.error('FOUND BUG IN PROCESSOR: ' + exception);
        }
        state.stack.addItem(exception.attributes);
        await instructionHandlers[29]();  // HANDLE EXCEPTION instruction
    };

    const finalizeProcessing = async function() {
        const status = state.status;
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
        const task = exportTask();
        const event = bali.catalog({
            $eventType: '$completion',
            $tag: state.tag,
            $account: state.account,
            $balance: state.balance,
            $clock: state.clock
        }, bali.parameters({
            $tag: bali.tag(),
            $version: bali.version(),
            $permissions: '/bali/permissions/public/v1',
            $previous: bali.pattern.NONE
        }));
        if (state.result) {
            event.setValue('$result', state.result);
        } else {
            event.setValue('$exception', state.exception);
        }
        event = await notary.notarizeDocument(event);
        await repository.addMessage(EVENT_QUEUE, event);
    };

    const publishSuspensionEvent = async function() {
        const task = exportTask();
        var event = bali.catalog({
            $eventType: '$suspension',
            $tag: state.tag,
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

    const queueTaskContext = async function() {
        // queue up the task for a new virtual processor
        const task = exportTask();
        task = await notary.notarizeDocument(task);
        await repository.addMessage(WAIT_QUEUE, task);
    };

    const pushContext = async function(target, message, args) {

        // push the current context onto the context stack
        state.contexts.addItem(exportContext());

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
                $text: 'The message passed to the target component is not supported.'
            });
            if (debug > 0) console.error(exception.toString());
            throw exception;
        }

        // retrieve the bytecode for the method
        const bytes = method.getValue('$bytecode').getValue();
        const bytecode = compiler.bytecode(bytes);

        // retrieve the literals and constants for the type
        const literals = type.getValue('$literals');
        const constants = type.getValue('$constants').duplicate();
        constants.setValue('$target', target);

        // set the argument values for the passed arguments
        const argumentz = bali.catalog();
        var nameIterator = method.getValue('$arguments').getIterator();
        var valueIterator = args.getIterator();
        while (nameIterator.hasNext() && valueIterator.hasNext()) {
            const name = nameIterator.getNext();
            const value = valueIterator.getNext();
            argumentz.setValue(name, value);
        }

        // set the rest of the argument values to 'none' TODO: really should be to the default values
        while (nameIterator.hasNext()) {
            const name = nameIterator.getNext();
            const value = bali.pattern.NONE;
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
        context = {
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
            const condition = state.stack.removeItem();
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
            const condition = state.stack.removeItem();
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
            const condition = state.stack.removeItem();
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
            state.stack.addItem(literal);
            context.address++;
        },

        // PUSH CONSTANT constant
        async function(operand) {
            const index = operand;
            // lookup the constant associated with the index
            const constant = context.constants.getItem(index).getValue();
            state.stack.addItem(constant);
            context.address++;
        },

        // PUSH ARGUMENT argument
        async function(operand) {
            const index = operand;
            // lookup the argument associated with the index
            const argument = context.arguments.getItem(index).getValue();
            state.stack.addItem(argument);
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
            state.stack.removeItem();
            context.address++;
        },

        // UNIMPLEMENTED POP OPERATION
        async function(operand) {
            throw bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$pop3',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: captureState(),
                $message: 'An unimplemented POP operation was attempted.'
            });
        },

        // UNIMPLEMENTED POP OPERATION
        async function(operand) {
            throw bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$pop4',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: captureState(),
                $message: 'An unimplemented POP operation was attempted.'
            });
        },

        // LOAD VARIABLE symbol
        async function(operand) {
            const index = operand;
            // lookup the variable associated with the index
            const variable = context.variables.getItem(index).getValue();
            state.stack.addItem(variable);
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
                state.stack.addItem(message);
                context.address++;
            } else {
                // set the task status to 'waiting'
                state.status = WAITING;
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
            state.stack.addItem(draft);
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
            state.stack.addItem(document);
            context.address++;
        },

        // STORE VARIABLE symbol
        async function(operand) {
            const index = operand;
            // pop the component that is on top of the component stack off the stack
            const component = state.stack.removeItem();
            // and store the component in the variable associated with the index
            context.variables.getItem(index).setValue(component);
            context.address++;
        },

        // STORE MESSAGE symbol
        async function(operand) {
            const index = operand;
            // pop the message that is on top of the component stack off the stack
            var message = state.stack.removeItem();
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
            var draft = state.stack.removeItem();
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
            const component = state.stack.removeItem();
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
            state.stack.addItem(result);
            context.address++;
        },

        // INVOKE symbol WITH 1 ARGUMENT
        async function(operand) {
            const index = operand;
            // pop the argument off of the component stack
            const argument = state.stack.removeItem();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument);
            // push the result of the function call onto the top of the component stack
            state.stack.addItem(result);
            context.address++;
        },

        // INVOKE symbol WITH 2 ARGUMENTS
        async function(operand) {
            const index = operand;
            // pop the arguments off of the component stack (in reverse order)
            const argument2 = state.stack.removeItem();
            const argument1 = state.stack.removeItem();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument1, argument2);
            // push the result of the function call onto the top of the component stack
            state.stack.addItem(result);
            context.address++;
        },

        // INVOKE symbol WITH 3 ARGUMENTS
        async function(operand) {
            const index = operand;
            // pop the arguments call off of the component stack (in reverse order)
            const argument3 = state.stack.removeItem();
            const argument2 = state.stack.removeItem();
            const argument1 = state.stack.removeItem();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument1, argument2, argument3);
            // push the result of the function call onto the top of the component stack
            state.stack.addItem(result);
            context.address++;
        },

        // SEND symbol TO COMPONENT
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = bali.list();
            const target = state.stack.removeItem();
            await pushContext(target, message, argumentz);
            context.address++;
        },

        // SEND symbol TO COMPONENT WITH ARGUMENTS
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = state.stack.removeItem();
            const target = state.stack.removeItem();
            await pushContext(target, message, argumentz);
            context.address++;
        },

        // SEND symbol TO DOCUMENT
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = bali.list();
            const name = state.stack.removeItem();
            await sendMessage(name, message, argumentz);
            context.address++;
        },

        // SEND symbol TO DOCUMENT WITH ARGUMENTS
        async function(operand) {
            const index = operand;
            const message = context.messages.getItem(index);
            const argumentz = state.stack.removeItem();
            const name = state.stack.removeItem();
            await sendMessage(name, message, argumentz);
            context.address++;
        },

        // HANDLE RESULT
        async function(operand) {
            if (!state.contexts.isEmpty()) {
                // retrieve the previous context from the stack
                context = importCurrentContext(processor);
                context.address++;
            } else {
                // task completed with a result
                state.result = state.stack.removeItem();
                state.status = DONE;
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
                    if (!state.contexts.isEmpty()) {
                        // retrieve the previous context from the stack
                        context = importCurrentContext(processor);
                    } else {
                        // task completed with an unhandled exception
                        state.exception = state.stack.removeItem();
                        state.status = DONE;
                        context = undefined;
                    }
                }
            }
        },

        // UNIMPLEMENTED HANDLE OPERATION
        async function(operand) {
            throw bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$handle3',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: captureState(),
                $message: 'An unimplemented HANDLE operation was attempted.'
            });
        },

        // UNIMPLEMENTED HANDLE OPERATION
        async function(operand) {
            throw bali.exception({
                $module: '/bali/processor/VirtualProcessor',
                $procedure: '$handle4',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: captureState(),
                $message: 'An unimplemented HANDLE operation was attempted.'
            });
        }

    ];

    return this;
};
VirtualProcessor.prototype.constructor = VirtualProcessor;
exports.VirtualProcessor = VirtualProcessor;
