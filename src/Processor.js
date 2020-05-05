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
 * This class implements the processor for The Bali Virtual Machine™.
 */

const EOL = '\n';  // This private constant sets the POSIX end of line character
const TASK_BAG = '/bali/vm/tasks/v1';
const EVENT_BAG = '/bali/vm/events/v1';


/**
 * This function creates a new processor.  The processor has not been initialized with any task.
 *
 * @constructor
 * @param {Object} notary An object that implements the Bali Digital Notary™ interface.
 * @param {Object} repository An object that implements the Bali Document Repository™ interface.
 * @param {Boolean|Number} debug An optional number in the range [0..3] that controls the level of
 * debugging that occurs:
 * <pre>
 *   0 (or false): no logging
 *   1 (or true): log exceptions to console.error
 *   2: perform argument validation and log exceptions to console.error
 *   3: perform argument validation and log exceptions to console.error and debug info to console.log
 * </pre>
 * @returns {Processor} A new processor.
 */
const Processor = function(notary, repository, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    const bali = require('bali-component-framework').api(debug);
    const compiler = require('bali-type-compiler').api(debug);
    const decoder = bali.decoder();
    const taskBag = notary.citeDocument(repository.readName(TASK_BAG));
    const eventBag = notary.citeDocument(repository.readName(EVENT_BAG));
    var task, context;  // these are optimized versions of their corresponding catalogs


    // PUBLIC METHODS

    /**
     * This method returns a catalog containing a copy of the current processor state.
     *
     * @returns {Catalog} The current processor state.
     */
    this.toCatalog = function() {
        const catalog = task.toCatalog();
        catalog.getValue('$contexts').addItem(context.toCatalog());
        return catalog;
    };

    /**
     * This method returns a string representation of the current processor state using
     * Bali Document Notation™.
     *
     * @returns {String} A string representation of the current processor state.
     */
    this.toString = function() {
        return this.toCatalog().toString();
    };

    /**
     * This method creates a new task for this processor to execute based on the specified
     * account information, target component, and message with any arguments that were passed
     * with it.  Once created, the task is activated and ready to run.
     *
     * @param {Tag} account The tag for the account to which this task execution should be billed.
     * @param {Number} tokens The maximum number of tokens that should be used during execution.
     * @param {Component} target The component that received the specified message.
     * @param {Symbol} message The symbol for the message corresponding to the method to be
     * executed.
     * @param {List} args The list of argument values (if any) that were passed with the message.
     */
    this.newTask = async function(account, tokens, target, message, args) {
        task = new Task(createTask(account, tokens), debug);
        context = new Context(await createContext(target, message, args), debug);
    };

    /**
     * This method loads an existing task into this processor for execution.  Once loaded, the
     * task is activated and ready to run.
     *
     * @param {Catalog} catalog A catalog containing the current state of the existing task.
     */
    this.loadTask = function(catalog) {
        task = new Task(catalog, debug);
        popContext();
    };

    /**
     * This method executes the next instruction in the current task.  The task must be in an
     * active state and at least one token must remain.
     *
     * @returns {Boolean} Whether or not an instruction was executed.
     */
    this.stepClock = async function() {
        try {
            if (notDone()) {
                await executeInstruction();
                return true;
            } else {
                await finalizeProcessing();
                return false;
            }
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$stepClock',
                $exception: '$unexpected',
                $task: this.toCatalog(),
                $text: 'An unexpected error occurred while attempting to execute a single step of a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };

    /**
     * This method executes all of the instructions in the current task until one of the
     * following occurs:
     * <pre>
     *  * the number of tokens for the account has reached zero,  {$active}
     *  * the task is waiting to receive a message from a bag,    {$passive}
     *  * the end of the instructions has been reached,           {$completed}
     *  * or an unhandled exception has been thrown.              {$failed}
     * </pre>
     */
    this.runClock = async function() {
        try {
            while (notDone()) {
                await executeInstruction();
            }
            await finalizeProcessing();
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$runClock',
                $exception: '$unexpected',
                $task: this.toCatalog(),
                $text: 'An unexpected error occurred while attempting to run a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };


    // PRIVATE FUNCTIONS

    const notDone = function() {
        return task && task.isActive() && context.hasInstruction();
    };

    this.createTask = async function(account, tokens) {
        return bali.catalog({
            $tag: bali.tag(),  // new unique task tag
            $account: account,
            $tokens: tokens,
            $status: Task.ACTIVE,
            $clock: 0,
            $components: bali.stack(),
            $contexts: bali.stack()
        });
    };

    const createContext = async function(target, message, args) {
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
                $module: '/bali/vm/Processor',
                $procedure: '$createContext',
                $exception: '$unsupportedMessage',
                $message: message,
                $ancestry: ancestry,
                $text: 'The message passed to the target component is not supported by any of its types.'
            });
            if (debug > 0) console.error(exception.toString());
            throw exception;
        }

        // retrieve the literals and constants for the type
        const literals = type.getValue('$literals') || bali.set();
        const constants = type.getValue('$constants') || bali.catalog();

        // retrieve the bytecode for the method
        const bytes = method.getValue('$bytecode').getValue();
        const bytecode = bali.binary(bytes, {$encoding: '$base16', $mediaType: '"application/bcod"'});

        // set the argument values for the passed arguments
        var nameIterator = method.getValue('$arguments').getIterator();
        nameIterator.getNext();  // skip the $target name
        const argumentz = bali.catalog({$target: target});
        var valueIterator = args.getIterator();
        while (nameIterator.hasNext() && valueIterator.hasNext()) {
            const name = nameIterator.getNext();
            const value = valueIterator.getNext();
            argumentz.setValue(name, value);
        }

        // set the rest of the argument values to their default values (or 'none')
        const procedure = method.getValue('$procedure');
        while (nameIterator.hasNext()) {
            const name = nameIterator.getNext();
            const value = procedure.getParameter(name) || bali.pattern.NONE;
            argumentz.setValue(name, value);
        }

        // set the initial values of the variables to 'none'
        const variables = bali.catalog();
        const iterator = method.getValue('$variables').getIterator();
        while (iterator.hasNext()) {
            const name = iterator.getNext();
            variables.setValue(name, bali.pattern.NONE);
        }

        // retrieve the sent messages from the method
        const messages = method.getValue('$messages');

        // create an empty exception handler stack
        const handlers = bali.stack();

        // create the new method context
        return bali.catalog({
            $target: target,
            $message: message,
            $argumentz: argumentz,
            $variables: variables,
            $constants: constants,
            $literals: literals,
            $messages: messages,
            $handlers: handlers,
            $bytecode: bytecode,
            $instruction: 0,
            $address: 0  // this will be incremented before the next instruction is executed
        });
    };

    const executeInstruction = async function() {
        // decode the bytecode instruction
        const instruction = context.getInstruction();
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
        task.tickClock();
    };

    const handleException = async function(exception) {
        if (exception.constructor.name !== 'Exception') {
            // it's a bug in the compiler or processor
            const stack = exception.stack.split(EOL).slice(1);  // remove the first line of the stack
            stack.forEach(function(line, index) {
                line = '  ' + line;
                if (line.length > 80) {
                    line = line.slice(0, 44) + '..' + line.slice(-35, -1);
                }
                stack[index] = line;
            });
            exception = bali.catalog({
                $module: '/bali/vm/Processor',
                $procedure: '$executeInstruction',
                $exception: '$processorBug',
                $type: exception.constructor.name,
                $processor: this.toCatalog(),
                $text: exception.toString(),
                $trace: bali.text(EOL + stack.join(EOL))
            });
            if (debug) console.error('FOUND BUG IN PROCESSOR: ' + exception);
        }
        task.pushComponent(exception.attributes);
        await instructionHandlers[29]();  // HANDLE EXCEPTION instruction
    };

    const finalizeProcessing = async function() {
        const event = bali.catalog({
            $tag: task.getTag(),
            $type: '/bali/vm/' + task.getState().slice(1) + '/v1',  // remove leading '$'
            $task: task.toCatalog()
        }, bali.parameters({
            $tag: bali.tag(),
            $version: bali.version(),
            $permissions: '/bali/permissions/public/v1',
            $previous: bali.pattern.NONE
        }));
        const message = await notary.notarizeDocument(event);
        await repository.addMessage(eventBag, message);
    };

    const pushContext = async function(target, message, args) {
        task.pushContext(context.toCatalog());
        context = new Context(await createContext(target, message, args), debug);
    };

    const popContext = function() {
        context = new Context(task.popContext(), debug);
    };

    const bagTask = async function(target, message, args) {
        const t = createTask(task.getAccount(), task.getTokens());  // TODO: how many tokens should it be??
        const c = await createContext(target, message, args);
        t.pushContext(c);
        const message = await notary.notarizeDocument(t);
        await repository.addMessage(taskBag, message);
    };

    const rebagTask = async function() {
        // store this task in the task bag for a new virtual processor to process
        const message = await notary.notarizeDocument(this.toCatalog());
        await repository.addMessage(taskBag, message);
        task = undefined;
        context = undefined;
    };

    // PRIVATE MACHINE INSTRUCTION HANDLERS (ASYNCHRONOUS)

    const instructionHandlers = [
        // JUMP TO label
        async function(operand) {
            // if the operand is not zero then use it as the next instruction to be executed,
            // otherwise it is a SKIP INSTRUCTION (aka NOOP)
            if (operand) {
                const address = operand;
                context.jumpToAddress(address);
            } else {
                context.incrementAddress();
            }
        },

        // JUMP TO label ON NONE
        async function(operand) {
            const address = operand;
            // pop the condition component off the component stack
            const condition = task.popComponent();
            // if the condition is 'none' then use the address as the next instruction to be executed
            if (condition.isEqualTo(bali.pattern.NONE)) {
                context.jumpToAddress(address);
            } else {
                context.incrementAddress();
            }
        },

        // JUMP TO label ON TRUE
        async function(operand) {
            const address = operand;
            // pop the condition component off the component stack
            const condition = task.popComponent();
            // if the condition is 'true' then use the address as the next instruction to be executed
            if (condition.toBoolean()) {
                context.jumpToAddress(address);
            } else {
                context.incrementAddress();
            }
        },

        // JUMP TO label ON FALSE
        async function(operand) {
            const address = operand;
            // pop the condition component off the component stack
            const condition = task.popComponent();
            // if the condition is 'false' then use the address as the next instruction to be executed
            if (!condition.toBoolean()) {
                context.jumpToAddress(address);
            } else {
                context.incrementAddress();
            }
        },

        // PUSH HANDLER label
        async function(operand) {
            const handlerAddress = operand;
            // push the address of the current exception handlers onto the handlers stack
            context.pushHandler(handlerAddress);
            context.incrementAddress();
        },

        // PUSH LITERAL literal
        async function(operand) {
            const index = operand;
            // lookup the literal associated with the index
            const literal = context.getLiteral(index);
            task.pushComponent(literal);
            context.incrementAddress();
        },

        // PUSH CONSTANT constant
        async function(operand) {
            const index = operand;
            // lookup the constant associated with the index
            const constant = context.getConstant(index).getValue();
            task.pushComponent(constant);
            context.incrementAddress();
        },

        // PUSH ARGUMENT argument
        async function(operand) {
            const index = operand;
            // lookup the argument associated with the index
            const argument = context.getArgument(index).getValue();
            task.pushComponent(argument);
            context.incrementAddress();
        },

        // POP HANDLER
        async function(operand) {
            // remove the current exception handler address from the top of the handlers stack
            // since it is no longer in scope
            context.popHandler();
            context.incrementAddress();
        },

        // POP COMPONENT
        async function(operand) {
            // remove the component that is on top of the component stack since it was not used
            task.popComponent();
            context.incrementAddress();
        },

        // UNIMPLEMENTED POP OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$pop3',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: this.toCatalog(),
                $message: 'An unimplemented POP operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // UNIMPLEMENTED POP OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$pop4',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: this.toCatalog(),
                $message: 'An unimplemented POP operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // LOAD VARIABLE symbol
        async function(operand) {
            const index = operand;
            // lookup the variable associated with the index
            const variable = context.getVariable(index).getValue();
            task.pushComponent(variable);
            context.incrementAddress();
        },

        // LOAD MESSAGE symbol
        async function(operand) {
            const index = operand;
            // lookup the bag name associated with the index
            const name = context.getVariable(index).getValue();
            // TODO: jump to exception handler if name isn't a name
            const bag = notary.citeDocument(repository.readName(name));
            // attempt to retrieve a message from the bag in the document repository
            const message = await repository.borrowMessage(bag);
            if (message) {
                const component = message.getValue('$content');
                // place the message on the stack
                task.pushComponent(component);
                context.incrementAddress();
            } else {
                await rebagTask();  // the new processor will retry this last instruction
            }
        },

        // LOAD DRAFT symbol
        async function(operand) {
            const index = operand;
            // lookup the citation associated with the index
            const citation = context.getVariable(index).getValue();
            // TODO: jump to exception handler if the citation isn't a citation
            // retrieve the cited draft from the document repository
            const source = await repository.readDraft(citation);
            const document = bali.component(source);
            await notary.citationMatches(citation, document);
            const draft = document.getValue('$content');
            // push the draft on top of the component stack
            task.pushComponent(draft);
            context.incrementAddress();
        },

        // LOAD DOCUMENT symbol
        async function(operand) {
            const index = operand;
            // lookup the citation associated with the index
            const citation = context.getVariable(index).getValue();
            // TODO: jump to exception handler if the citation isn't a citation
            // retrieve the cited document from the document repository
            const source = await repository.readDocument(citation);
            var document = bali.component(source);
            await notary.citationMatches(citation, document);
            document = document.getValue('$content');
            // push the document on top of the component stack
            task.pushComponent(document);
            context.incrementAddress();
        },

        // STORE VARIABLE symbol
        async function(operand) {
            const index = operand;
            // pop the component that is on top of the component stack off the stack
            const component = task.popComponent();
            // and store the component in the variable associated with the index
            context.getVariable(index).setValue(component);
            context.incrementAddress();
        },

        // STORE MESSAGE symbol
        async function(operand) {
            const index = operand;
            // pop the component that is on top of the component stack off the stack
            var component = task.popComponent();
            // lookup the bag name associated with the index operand
            const name = context.getVariable(index).getValue();
            // TODO: jump to exception handler if name isn't a name
            const bag = notary.citeDocument(repository.readName(name));
            // store the message in the bag in the document repository
            message = await notary.notarizeDocument(component);
            await repository.addMessage(bag, message);
            context.incrementAddress();
        },

        // STORE DRAFT symbol
        async function(operand) {
            const index = operand;
            // pop the draft that is on top of the component stack off the stack
            var draft = task.popComponent();
            // write the draft to the document repository
            draft = await notary.notarizeDocument(draft);
            const citation = await notary.citeDocument(draft);
            await repository.writeDraft(draft);
            // and store the resulting citation in the variable associated with the index
            context.getVariable(index).setValue(citation);
            context.incrementAddress();
        },

        // STORE DOCUMENT symbol
        async function(operand) {
            const index = operand;
            // pop the document that is on top of the component stack off the stack
            const component = task.popComponent();
            // write the document to the document repository
            const document = await notary.notarizeDocument(component);
            const citation = await notary.citeDocument(document);
            await repository.writeDocument(document);
            await repository.deleteDraft(citation);
            // and store the resulting citation in the variable associated with the index
            context.getVariable(index).setValue(citation);
            context.incrementAddress();
        },

        // INVOKE symbol
        async function(operand) {
            const index = operand;
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index);
            // push the result of the function call onto the top of the component stack
            task.pushComponent(result);
            context.incrementAddress();
        },

        // INVOKE symbol WITH 1 ARGUMENT
        async function(operand) {
            const index = operand;
            // pop the argument off of the component stack
            const argument = task.popComponent();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument);
            // push the result of the function call onto the top of the component stack
            task.pushComponent(result);
            context.incrementAddress();
        },

        // INVOKE symbol WITH 2 ARGUMENTS
        async function(operand) {
            const index = operand;
            // pop the arguments off of the component stack (in reverse order)
            const argument2 = task.popComponent();
            const argument1 = task.popComponent();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument1, argument2);
            // push the result of the function call onto the top of the component stack
            task.pushComponent(result);
            context.incrementAddress();
        },

        // INVOKE symbol WITH 3 ARGUMENTS
        async function(operand) {
            const index = operand;
            // pop the arguments call off of the component stack (in reverse order)
            const argument3 = task.popComponent();
            const argument2 = task.popComponent();
            const argument1 = task.popComponent();
            // call the intrinsic function associated with the index operand
            const result = compiler.invoke(index, argument1, argument2, argument3);
            // push the result of the function call onto the top of the component stack
            task.pushComponent(result);
            context.incrementAddress();
        },

        // SEND symbol TO COMPONENT
        async function(operand) {
            const index = operand;
            const message = context.getMessage(index);
            const argumentz = bali.list();
            const target = task.popComponent();
            await pushContext(target, message, argumentz);
            context.incrementAddress();
        },

        // SEND symbol TO COMPONENT WITH ARGUMENTS
        async function(operand) {
            const index = operand;
            const message = context.getMessage(index);
            const argumentz = task.popComponent();
            const target = task.popComponent();
            await pushContext(target, message, argumentz);
            context.incrementAddress();
        },

        // SEND symbol TO DOCUMENT
        async function(operand) {
            const index = operand;
            const message = context.getMessage(index);
            const argumentz = bali.list();
            const name = task.popComponent();
            await bagTask(name, message, argumentz);
            context.incrementAddress();
        },

        // SEND symbol TO DOCUMENT WITH ARGUMENTS
        async function(operand) {
            const index = operand;
            const message = context.getMessage(index);
            const argumentz = task.popComponent();
            const name = task.popComponent();
            await bagTask(name, message, argumentz);
            context.incrementAddress();
        },

        // HANDLE RESULT
        async function(operand) {
            if (task.hasContexts()) {
                // retrieve the previous context from the stack
                popContext();
                context = new Context(task.popContext(), debug);
                context.incrementAddress();
            } else {
                // task completed with a result
                const result = task.popComponent();
                task.complete(result);
                context = undefined;
            }
        },

        // HANDLE EXCEPTION
        async function(operand) {
            // search up the stack for a handler
            while (context) {
                if (context.hasHandlers()) {
                    // jump to the next exception handler
                    context.jumpToHandler();
                    break;
                } else {
                    if (task.hasContexts()) {
                        // retrieve the previous context from the stack
                        popContext();
                    } else {
                        // task completed with an unhandled exception
                        const exception = task.popComponent();
                        task.fail(exception);
                        context = undefined;
                    }
                }
            }
        },

        // UNIMPLEMENTED HANDLE OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$handle3',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: this.toCatalog(),
                $message: 'An unimplemented HANDLE operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // UNIMPLEMENTED HANDLE OPERATION
        async function(operand) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$handle4',
                $exception: '$notImplemented',
                $operand: operand,
                $processor: this.toCatalog(),
                $message: 'An unimplemented HANDLE operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        }

    ];

    return this;
};
Processor.prototype.constructor = Processor;
exports.Processor = Processor;
