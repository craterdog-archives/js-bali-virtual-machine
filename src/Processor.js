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

const debug = 0;  // set to [0..3] for debug logging
const bali = require('bali-component-framework').api(debug);
const compiler = require('bali-type-compiler').api(debug);

/*
 * This class implements the processor for The Bali Virtual Machine™.
 */
const Task = require('./Task');
const Context = require('./Context');
const EOL = '\n';  // This private constant sets the POSIX end of line character


/**
 * This function creates a new processor.  The processor has not been initialized with any task.
 *
 * @constructor
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
const Processor = function(repository, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    const decoder = bali.decoder();
    var task, context;  // these are optimized versions of their corresponding catalogs


    // PUBLIC METHODS

    // These functions introduce a security risk and should only be needed for debugging.
    if (debug) {
        this.getTask = function() { return task; };
        this.getContext = function() { return context; };
    }

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
     * account information, target document name or citation, and message with any arguments
     * that were passed with it.  Once created, the task is activated and ready to run.
     *
     * @param {Tag} account The tag for the account to which this task execution should be billed.
     * @param {Number} tokens The maximum number of tokens that should be used during execution.
     * @param {String|Name|Catalog} target The name of or citation to the target document.
     * @param {Symbol} message The symbol for the message corresponding to the method to be
     * executed.
     * @param {List} args The list of argument values (if any) that were passed with the message.
     */
    this.newTask = async function(account, tokens, target, message, args) {
        task = Task.create(account, tokens, debug);
        const document = await repository.retrieveDocument(target);
        context = await createContext(document, message, args);
    };

    /**
     * This method loads an existing task into this processor for execution.  Once loaded, the
     * task is activated and ready to run.
     *
     * @param {Catalog} catalog A catalog containing the current state of the existing task.
     */
    this.loadTask = function(catalog) {
        task = Task.fromCatalog(catalog, debug);
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
            }
            return false;
        } catch (cause) {
            const exception = bali.exception({
                $module: '/bali/vm/Processor',
                $procedure: '$stepClock',
                $exception: '$unexpected',
                $processor: toCatalog(),
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
     *  * the task is waiting to retrieve a message from a bag,    {$active}
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
                $processor: toCatalog(),
                $text: 'An unexpected error occurred while attempting to run a task.'
            }, cause);
            if (debug) console.error(exception.toString());
            throw exception;
        }
    };


    // PRIVATE FUNCTIONS

    const toCatalog = function() {
        const catalog = task.toCatalog();
        catalog.getAttribute('$contexts').addItem(context.toCatalog());
        return catalog;
    };

    const createContext = async function(target, message, args) {
        // retrieve the type of the target component and the method matching the message
        const ancestry = target.getAncestry();
        var type, method;
        var typeName = target.getType() + '/v1';  // YUCK!
        while (typeName.toString() !== 'none') {
            type = await repository.retrieveDocument(typeName);
            const methods = type.getAttribute('$methods');
            method = methods.getAttribute(message);
            if (method) break;
            typeName = type.getAttribute('$parent');
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
        const literals = type.getAttribute('$literals') || bali.set();
        const constants = type.getAttribute('$constants') || bali.catalog();

        // retrieve the bytecode for the method
        const bytes = method.getAttribute('$bytecode').getValue();
        const bytecode = bali.binary(bytes, {$encoding: '$base16', $mediaType: '"application/bcod"'});

        // set the argument values for the passed arguments
        var nameIterator = method.getAttribute('$arguments').getIterator();
        nameIterator.getNext();  // skip the $target name
        const argumentz = bali.catalog({$target: target});
        var valueIterator = args.getIterator();
        while (nameIterator.hasNext() && valueIterator.hasNext()) {
            const name = nameIterator.getNext();
            const value = valueIterator.getNext();
            argumentz.setAttribute(name, value);
        }

        // set the rest of the argument values to their default values (or 'none')
        const procedure = method.getAttribute('$procedure');
        while (nameIterator.hasNext()) {
            const name = nameIterator.getNext();
            const value = procedure.getParameter(name) || bali.pattern.NONE;
            argumentz.setAttribute(name, value);
        }

        // set the initial values of the variables to 'none'
        const variables = bali.catalog();
        const iterator = method.getAttribute('$variables').getIterator();
        while (iterator.hasNext()) {
            const name = iterator.getNext();
            variables.setAttribute(name, bali.pattern.NONE);
        }

        // retrieve the sent messages from the method
        const messages = method.getAttribute('$messages');

        // create an empty exception handler stack
        const handlers = bali.stack();

        // create the new method context
        return Context.fromCatalog(bali.catalog({
            $target: target,
            $message: message,
            $arguments: argumentz,
            $variables: variables,
            $constants: constants,
            $literals: literals,
            $messages: messages,
            $handlers: handlers,
            $bytecode: bytecode,
            $address: 1
        }), debug);
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
                throw exception;
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
        await instructionHandlers[11]();  // PULL EXCEPTION instruction
    };

    const publishNotification = async function() {
        const event = bali.instance('/bali/aspects/Event/v1', {
            $tag: task.getTag(),
            $type: '/bali/vm/' + task.getState().slice(1) + '/v1',  // remove leading '$'
            $task: task.toCatalog()
        });
        await repository.postMessage('/bali/vm/events/v1', event);
    };

    const pushContext = async function(component, message, args) {
        task.pushContext(context.toCatalog());  // add the current context to the context stack
        context = await createContext(component, message, args);
    };

    const popContext = function() {
        context = Context.fromCatalog(task.popContext(), debug);
    };

    const spawnTask = async function(target, message, args) {
        const document = await repository.retrieveDocument(target);
        const childTask = Task.create(task.getAccount(), task.splitTokens(), debug);
        const childContext = await createContext(document, message, args);
        childTask.pushContext(childContext.toCatalog());
        const tag = childTask.getTag();
        await repository.postMessage('/bali/vm/tasks/v1', childTask.toCatalog());
        return tag;
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

        // JUMP TO label ON EMPTY
        async function(operand) {
            if (!task.hasComponents()) {
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

        // PULL HANDLER
        async function(operand) {
            context.popHandler();
            context.incrementAddress();
        },

        // PULL COMPONENT
        async function(operand) {
            task.popComponent();
            context.incrementAddress();
        },

        // PULL RESULT
        async function(operand) {
            if (task.hasContexts()) {
                popContext();
            } else {
                const result = task.popComponent();
                task.completeTask(result);
            }
        },

        // PULL EXCEPTION
        async function(operand) {
            while (context) {
                if (context.hasHandlers()) {
                    context.jumpToHandler();  // try this handler
                    break;
                } else {
                    if (task.hasContexts()) {
                        popContext();  // check calling context for a handler
                    } else {
                        const exception = task.popComponent();
                        task.abandonTask(exception);  // unhandled exception
                        break;
                    }
                }
            }
        },

        // LOAD VARIABLE variable
        async function(operand) {
            const variable = context.getVariable(operand).getValue();
            task.pushComponent(variable);
            context.incrementAddress();
        },

        // LOAD DOCUMENT citation
        async function(operand) {
            const citation = context.getVariable(operand).getValue();
            const document = await repository.retrieveDocument(citation);
            task.pushComponent(document);
            context.incrementAddress();
        },

        // LOAD CONTRACT name
        async function(operand) {
            const name = context.getVariable(operand).getValue();
            const contract = await repository.retrieveContract(name);
            task.pushComponent(contract);
            context.incrementAddress();
        },

        // LOAD MESSAGE bag
        async function(operand) {
            const bag = context.getVariable(operand).getValue();
            const message = await repository.retrieveMessage(bag);
            if (message) {
                task.pushComponent(message);
                context.incrementAddress();
            } else {
                const currentTask = toCatalog();
                await repository.postMessage('/bali/vm/tasks/v1', currentTask);
                task.pauseTask();  // will retry again on a different processor
            }
        },

        // SAVE VARIABLE variable
        async function(operand) {
            const component = task.popComponent();
            context.getVariable(operand).setValue(component);
            context.incrementAddress();
        },

        // SAVE DOCUMENT citation
        async function(operand) {
            var document = task.popComponent();
            const citation = await repository.saveDocument(document);
            context.getVariable(operand).setValue(citation);
            context.incrementAddress();
        },

        // SAVE CONTRACT name
        async function(operand) {
            const document = task.popComponent();
            const name = context.getVariable(operand).getValue();
            await repository.commitDocument(name, document);
            context.incrementAddress();
        },

        // SAVE MESSAGE bag
        async function(operand) {
            var message = task.popComponent();
            const bag = context.getVariable(operand).getValue();
            await repository.postMessage(bag, message);
            context.incrementAddress();
        },

        // DROP VARIABLE variable
        async function(operand) {
            const none = bali.pattern.NONE;
            context.getVariable(operand).setValue(none);
            context.incrementAddress();
        },

        // DROP DOCUMENT citation
        async function(operand) {
            const citation = context.getVariable(operand).getValue();
            await repository.discardDocument(citation);
            context.incrementAddress();
        },

        // DROP CONTRACT name
        async function(operand) {
            const name = context.getVariable(operand).getValue();
            await repository.deleteContract(name);
            context.incrementAddress();
        },

        // DROP MESSAGE message
        async function(operand) {
            const message = context.getVariable(operand).getValue();
            await repository.acceptMessage(message);
            context.incrementAddress();
        },

        // CALL function
        async function(operand) {
            const result = compiler.invoke(operand);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // CALL function WITH 1 ARGUMENT
        async function(operand) {
            const argument = task.popComponent();
            const result = compiler.invoke(operand, argument);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // CALL function WITH 2 ARGUMENTS
        async function(operand) {
            const argument2 = task.popComponent();
            const argument1 = task.popComponent();
            const result = compiler.invoke(operand, argument1, argument2);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // CALL function WITH 3 ARGUMENTS
        async function(operand) {
            const argument3 = task.popComponent();
            const argument2 = task.popComponent();
            const argument1 = task.popComponent();
            const result = compiler.invoke(operand, argument1, argument2, argument3);
            task.pushComponent(result);
            context.incrementAddress();
        },

        // SEND message TO COMPONENT
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = bali.list();
            const component = task.popComponent();
            context.incrementAddress();  // MUST do before pushing context
            await pushContext(component, message, argumentz);
        },

        // SEND message TO COMPONENT WITH ARGUMENTS
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = task.popComponent();
            const component = task.popComponent();
            context.incrementAddress();  // MUST do before pushing context
            await pushContext(component, message, argumentz);
        },

        // SEND message TO DOCUMENT
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = bali.list();
            const target = task.popComponent();
            const tag = await spawnTask(target, message, argumentz);
            task.pushComponent(tag);
            context.incrementAddress();
        },

        // SEND message TO DOCUMENT WITH ARGUMENTS
        async function(operand) {
            const message = context.getMessage(operand);
            const argumentz = task.popComponent();
            const target = task.popComponent();
            const tag = await spawnTask(target, message, argumentz);
            task.pushComponent(tag);
            context.incrementAddress();
        }

    ];

    return this;
};
Processor.prototype.constructor = Processor;
exports.Processor = Processor;
