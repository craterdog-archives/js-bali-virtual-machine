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
const Task = require('./Task').Task;
const Context = require('./Context').Context;
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
    var taskBag, eventBag;  // these require asynchronous calls to initialize
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
        return toCatalog().toString();
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
            if (notDone()) await executeInstruction();
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$stepClock',
                $exception: '$unexpected',
                $task: toCatalog(),
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
     *  * the number of tokens for the account has reached zero,  {$frozen}
     *  * the task is waiting to receive a message from a bag,    {$active}
     *  * the end of the instructions has been reached,           {$completed}
     *  * or an unhandled exception has been thrown.              {$failed}
     * </pre>
     */
    this.runClock = async function() {
        try {
            while (notDone()) await executeInstruction();
            if (wasTerminated()) await publishNotification();
            resetProcessor();
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$runClock',
                $exception: '$unexpected',
                $task: toCatalog(),
                $text: 'An unexpected error occurred while attempting to run a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };


    // PRIVATE FUNCTIONS

    const loadBags = async function() {
        taskBag = notary.citeDocument(await repository.readName(TASK_BAG));
        eventBag = notary.citeDocument(await repository.readName(EVENT_BAG));
    };

    const createTask = function(account, tokens) {
        return bali.catalog({
            $account: account,
            $tokens: tokens,
            $state: Task.ACTIVE,
            $clock: 0,
            $components: bali.stack(),
            $contexts: bali.stack()
        });
    };

    const createContext = async function(target, message, args) {
        // retrieve the type of the target and method matching the message
        const ancestry = target.getAncestry();
        var type, method;
        var typeName = target.getParameter('$type') || bali.component(target.getType() + '/v1');  // YUCK!
        while (typeName.toString() !== 'none') {
            const document = await repository.readName(typeName);
            type = document.getValue('$content');
            const methods = type.getValue('$methods');
            method = methods.getValue(message);
            if (method) break;
            typeName = type.getValue('$parent');
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
            $address: 1
        });
    };

    const notDone = function() {
        return task && task.isActive() && context.hasInstruction();
    };

    const wasTerminated = function() {
        return task && !task.isPaused();
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
            // it's a bug in the compiler or processor, convert it to a Bali exception
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
                $procedure: '$handleException',
                $exception: '$processorBug',
                $type: exception.constructor.name,
                $processor: toCatalog(),
                $text: exception.toString(),
                $trace: bali.text(EOL + stack.join(EOL))
            });
            if (debug) console.error('FOUND BUG IN PROCESSOR: ' + exception);
        }
        task.pushComponent(exception.attributes);
        await instructionHandlers[29]();  // HANDLE EXCEPTION instruction
    };

    const publishNotification = async function() {
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
        if (!eventBag) loadBags();
        const document = await notary.notarizeDocument(event);
        await repository.addMessage(eventBag, document);
    };

    const pushContext = async function(target, message, args) {
        task.pushContext(context.toCatalog());  // add the current context to the context stack
        context = new Context(await createContext(target, message, args), debug);
    };

    const popContext = function() {
        context = new Context(task.popContext(), debug);
    };

    const spawnTask = async function(name, message, args) {
        if (!taskBag) await loadBags();
        const target = await repository.readName(name);
        const childTask = createTask(task.getAccount(), task.splitTokens());
        const childContext = await createContext(target, message, args);
        childTask.pushContext(childContext);
        const document = await notary.notarizeDocument(childTask);
        await repository.addMessage(taskBag, document);
    };


    // PRIVATE MACHINE INSTRUCTION HANDLERS (ASYNCHRONOUS)

    const instructionHandlers = [
        // JUMP TO label
        async function(operand) {
            if (operand) {
                context.jumpToAddress(operand);
            } else {
                context.incrementAddress();
            }
        },

        // JUMP TO label ON NONE
        async function(operand) {
            const condition = task.popComponent();
            if (condition.isEqualTo(bali.pattern.NONE)) {
                context.jumpToAddress(operand);
            } else {
                context.incrementAddress();
            }
        },

        // JUMP TO label ON TRUE
        async function(operand) {
            const condition = task.popComponent();
            if (condition.toBoolean()) {
                context.jumpToAddress(operand);
            } else {
                context.incrementAddress();
            }
        },

        // JUMP TO label ON FALSE
        async function(operand) {
            const condition = task.popComponent();
            if (!condition.toBoolean()) {
                context.jumpToAddress(operand);
            } else {
                context.incrementAddress();
            }
        },

        // PUSH HANDLER label
        async function(operand) {
            context.pushHandler(operand);
            context.incrementAddress();
        },

        // PUSH LITERAL literal
        async function(operand) {
            const literal = context.getLiteral(operand);
            task.pushComponent(literal);
            context.incrementAddress();
        },

        // PUSH CONSTANT constant
        async function(operand) {
            const constant = context.getConstant(operand).getValue();
            task.pushComponent(constant);
            context.incrementAddress();
        },

        // PUSH ARGUMENT argument
        async function(operand) {
            const argument = context.getArgument(operand).getValue();
            task.pushComponent(argument);
            context.incrementAddress();
        },

        // POP HANDLER
        async function(operand) {
            context.popHandler();
            context.incrementAddress();
        },

        // POP COMPONENT
        async function(operand) {
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
                $processor: toCatalog(),
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
                $processor: toCatalog(),
                $message: 'An unimplemented POP operation was attempted.'
            });
            if (debug) console.error(exception.toString());
            throw exception;
        },

        // LOAD VARIABLE symbol
        async function(operand) {
            const variable = context.getVariable(operand).getValue();
            task.pushComponent(variable);
            context.incrementAddress();
        },

        // LOAD MESSAGE symbol
        async function(operand) {
            const name = context.getVariable(operand).getValue();
            const messageBag = notary.citeDocument(repository.readName(name));
            const message = await repository.borrowMessage(messageBag);
            if (message) {
                const component = message.getValue('$content');
                task.pushComponent(component);
                context.incrementAddress();
            } else {
                if (!taskBag) await loadBags();
                const document = await notary.notarizeDocument(toCatalog());
                await repository.addMessage(taskBag, document);
                task.pauseTask();  // will retry again on a different processor
            }
        },

        // LOAD DRAFT symbol
        async function(operand) {
            const citation = context.getVariable(operand).getValue();
            const draft = await repository.readDraft(citation);
            await notary.citationMatches(citation, draft);
            const component = draft.getValue('$content');
            task.pushComponent(component);
            context.incrementAddress();
        },

        // LOAD DOCUMENT symbol
        async function(operand) {
            const citation = context.getVariable(operand).getValue();
            const document = await repository.readDocument(citation);
            await notary.citationMatches(citation, document);
            const component = document.getValue('$content');
            task.pushComponent(component);
            context.incrementAddress();
        },

        // STORE VARIABLE symbol
        async function(operand) {
            const component = task.popComponent();
            context.getVariable(operand).setValue(component);
            context.incrementAddress();
        },

        // STORE MESSAGE symbol
        async function(operand) {
            var component = task.popComponent();
            const name = context.getVariable(operand).getValue();
            const messageBag = notary.citeDocument(repository.readName(name));
            const document = await notary.notarizeDocument(component);
            await repository.addMessage(messageBag, document);
            context.incrementAddress();
        },

        // STORE DRAFT symbol
        async function(operand) {
            var component = task.popComponent();
            const draft = await notary.notarizeDocument(component);
            const citation = await repository.writeDraft(draft);
            context.getVariable(operand).setValue(citation);
            context.incrementAddress();
        },

        // STORE DOCUMENT symbol
        async function(operand) {
            const component = task.popComponent();
            const document = await notary.notarizeDocument(component);
            const citation = await repository.writeDocument(document);
            context.getVariable(operand).setValue(citation);
            context.incrementAddress();
        },

        // INVOKE symbol
        async function(operand) {
            const result = compiler.invoke(operand);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // INVOKE symbol WITH 1 ARGUMENT
        async function(operand) {
            const argument = task.popComponent();
            const result = compiler.invoke(operand, argument);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // INVOKE symbol WITH 2 ARGUMENTS
        async function(operand) {
            const argument2 = task.popComponent();
            const argument1 = task.popComponent();
            const result = compiler.invoke(operand, argument1, argument2);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // INVOKE symbol WITH 3 ARGUMENTS
        async function(operand) {
            const argument3 = task.popComponent();
            const argument2 = task.popComponent();
            const argument1 = task.popComponent();
            const result = compiler.invoke(operand, argument1, argument2, argument3);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // SEND symbol TO COMPONENT
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = bali.list();
            const target = task.popComponent();
            await pushContext(target, message, argumentz);
            context.incrementAddress();
        },

        // SEND symbol TO COMPONENT WITH ARGUMENTS
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = task.popComponent();
            const target = task.popComponent();
            await pushContext(target, message, argumentz);
            context.incrementAddress();
        },

        // SEND symbol TO DOCUMENT
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = bali.list();
            const name = task.popComponent();
            await spawnTask(name, message, argumentz);
            context.incrementAddress();
        },

        // SEND symbol TO DOCUMENT WITH ARGUMENTS
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = task.popComponent();
            const name = task.popComponent();
            await spawnTask(name, message, argumentz);
            context.incrementAddress();
        },

        // HANDLE RESULT
        async function(operand) {
            if (task.hasContexts()) {
                popContext();
                context.incrementAddress();
            } else {
                const result = task.popComponent();
                task.completeTask(result);
            }
        },

        // HANDLE EXCEPTION
        async function(operand) {
            while (context) {
                if (context.hasHandlers()) {
                    context.jumpToHandler();
                    break;
                } else {
                    if (task.hasContexts()) {
                        popContext();
                    } else {
                        const exception = task.popComponent();
                        task.abandonTask(exception);
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
                $processor: toCatalog(),
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
                $processor: toCatalog(),
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
