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
const bali = require('bali-component-framework');
const intrinsics = require('./IntrinsicFunctions');

const ACTIVE = '$active';
const WAITING = '$waiting';
const DONE = '$done';
const EOL = '\n';  // This private constant sets the POSIX end of line character
const WAIT_QUEUE = '3F8TVTX4SVG5Z12F3RMYZCTWHV2VPX4K';
const EVENT_QUEUE = '3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';


// PUBLIC FUNCTIONS

/**
 * This constructor creates a new processor to execute the specified task.
 * 
 * @constructor
 * @param {Object} notary An object that implements the Bali Nebula™ digital notary interface.
 * @param {Object} repository An object that implements the Bali Nebula™ document repository interface.
 * @param {Object} compiler An object that implements the Bali Nebula™ procedure compiler interface.
 * @param {Catalog} task The task for the new processor to execute.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {VirtualProcessor} The new processor loaded with the task.
 */
const VirtualProcessor = function(notary, repository, compiler, task, debug) {
    this.notary = notary;
    this.repository = repository;
    this.compiler = compiler;
    this.task = importTask(task);
    this.debug = debug || false;
    this.context = importCurrentContext(this);
    return this;
};
VirtualProcessor.prototype.constructor = VirtualProcessor;
exports.VirtualProcessor = VirtualProcessor;


/**
 * This method returns a string representation of the current processor state using
 * Bali Document Notation™.
 * 
 * @returns {String} A string representation of the current processor state.
 */
VirtualProcessor.prototype.toString = function() {
    const task = captureState(this);
    return task.toString();
};


/**
 * This method executes the next instruction in the current task.
 * 
 * @returns {Boolean} Whether or not an instruction was executed.
 */
VirtualProcessor.prototype.step = async function() {
    try {
        if (fetchInstruction(this)) {
            await executeInstruction(this);
            return true;
        } else {
            await finalizeProcessing(this);
            return false;
        }
    } catch (cause) {
        const exception = bali.exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$step',
            $exception: '$unexpected',
            $task: captureState(this),
            $text: 'An unexpected error occurred while attempting to execute a single step of a task.'
        }, cause);
        if (this.debug) console.error(exception.toString());
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
VirtualProcessor.prototype.run = async function() {
    try {
        while (fetchInstruction(this)) {
            await executeInstruction(this);
        }
        await finalizeProcessing(this);
    } catch (cause) {
        const exception = bali.exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$run',
            $exception: '$unexpected',
            $task: captureState(this),
            $text: 'An unexpected error occurred while attempting to run a task.'
        }, cause);
        if (this.debug) console.error(exception.toString());
        throw exception;
    }
};


// PRIVATE FUNCTIONS

/**
 * This function extracts the '$tag' and '$version' attributes from the specified catalog
 * and uses them to form a unique identification string.
 * 
 * @param {Catalog} catalog A catalog component.
 * @returns {String} A unique identification string for the component.
 */
const extractId = function(catalog) {
    const id = catalog.getValue('$tag').getValue() + catalog.getValue('$version');
    return id;
};


const importTask = function(catalog) {
    const task = {
        tag: catalog.getValue('$tag'),
        account: catalog.getValue('$account'),
        balance: catalog.getValue('$balance').toNumber(),
        status: catalog.getValue('$status').toString(),
        clock: catalog.getValue('$clock').toNumber(),
        stack: catalog.getValue('$stack'),
        contexts: catalog.getValue('$contexts')
    };
    return task;
};


const exportTask = function(task) {
    const catalog = bali.catalog();
    catalog.setValue('$tag', task.tag);
    catalog.setValue('$account', task.account);
    catalog.setValue('$balance', task.balance);
    catalog.setValue('$status', task.status);
    catalog.setValue('$clock', task.clock);
    catalog.setValue('$stack', task.stack);
    catalog.setValue('$contexts', task.contexts);
    return catalog;
};


const captureState = function(processor) {
    const task = bali.duplicate(exportTask(processor.task));  // copy the task state
    const contexts = task.getValue('$contexts');
    if (processor.context) {
        const currentContext = exportCurrentContext(processor);
        contexts.addItem(bali.duplicate(currentContext));  // add a copy of the context
    }
    return task;
};


/*
 * This function determines whether or not the task assigned to the specified processor is runnable.
 */
const isRunnable = function(processor) {
    const hasInstructions = processor.context && processor.context.address <= processor.context.bytecode.length;
    const isActive = processor.task.status === ACTIVE;
    const hasTokens = processor.task.balance > 0;
    return hasInstructions && isActive && hasTokens;
};


/*
 * This function fetches the next 16 bit bytecode instruction from the current procedure context.
 */
const fetchInstruction = function(processor) {
    if (isRunnable(processor)) {
        const address = processor.context.address;
        const instruction = processor.context.bytecode[address - 1];
        processor.context.instruction = instruction;
        return true;
    } else {
        return false;
    }
};


const importCurrentContext = function(processor) {
    const catalog = processor.task.contexts.removeItem();
    const bytes = catalog.getValue('$bytecode').getValue();
    const bytecode = processor.compiler.bytecode(bytes);
    const context = {
        type: catalog.getValue('$type'),
        name: catalog.getValue('$name'),
        instruction: catalog.getValue('$instruction').toNumber(),
        address: catalog.getValue('$address').toNumber(),
        bytecode: bytecode,
        literals: catalog.getValue('$literals'),
        constants: catalog.getValue('$constants'),
        parameters: catalog.getValue('$parameters'),
        variables: catalog.getValue('$variables'),
        procedures: catalog.getValue('$procedures'),
        handlers: catalog.getValue('$handlers')
    };
    return context;
};


const exportCurrentContext = function(processor) {
    const context = processor.context;
    const bytes = processor.compiler.bytes(context.bytecode);
    const base16 = bali.codex.base16Encode(bytes);
    var source = "'%bytecode'($encoding: $base16, $mediatype: \"application/bcod\")";
    source = source.replace(/%bytecode/, base16);
    const bytecode = bali.parse(source);
    const catalog = bali.catalog();
    catalog.setValue('$type', context.type);
    catalog.setValue('$name', context.name);
    catalog.setValue('$instruction', context.instruction);
    catalog.setValue('$address', context.address);
    catalog.setValue('$bytecode', bytecode);
    catalog.setValue('$literals', context.literals);
    catalog.setValue('$constants', context.constants);
    catalog.setValue('$parameters', context.parameters);
    catalog.setValue('$variables', context.variables);
    catalog.setValue('$procedures', context.procedures);
    catalog.setValue('$handlers', context.handlers);
    return catalog;
};


/*
 * This function executes the current 16 bit bytecode instruction.
 */
const executeInstruction = async function(processor) {
    // decode the bytecode instruction
    const instruction = processor.context.instruction;
    const operation = processor.compiler.operation(instruction);
    const modifier = processor.compiler.modifier(instruction);
    const operand = processor.compiler.operand(instruction);

    // pass execution off to the correct operation handler
    const index = (operation << 2) | modifier;  // index: [0..31]
    try {
        await instructionHandlers[index](processor, operand); // operand: [0..2047]
    } catch (exception) {
        try {
            await handleException(processor, exception);
        } catch (exception) {
            console.error('Unable to handle exception: ' + exception);
        }
    }

    // update the state of the task context
    processor.task.clock++;
    processor.task.balance--;
};


const handleException = async function(processor, exception) {
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
            $processor: captureState(processor),
            $text: exception.toString(),
            $trace: bali.text(EOL + stack.join(EOL))
        });
        console.error('FOUND BUG IN PROCESSOR: ' + exception);
    }
    processor.task.stack.addItem(exception.attributes);
    await instructionHandlers[29](processor);  // HANDLE EXCEPTION instruction
};


/*
 * This function finalizes the processing depending on the status of the task.
 */
const finalizeProcessing = async function(processor) {
    const status = processor.task.status;
    switch (status) {
        case ACTIVE:
            // the task hit a break point or the account balance is zero so notify any interested parties
            await publishSuspensionEvent(processor);
            break;
        case WAITING:
            // the task is waiting on a message so requeue the task context
            await queueTaskContext(processor);
            break;
        case DONE:
            // the task completed successfully or with an exception so notify any interested parties
            await publishCompletionEvent(processor);
            break;
        default:
    }
};


/*
 * This function publishes a task completion event to the global event queue.
 */
const publishCompletionEvent = async function(processor) {
    const task = processor.task;
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
    event = await processor.notary.notarizeDocument(event);
    await processor.repository.queueMessage(EVENT_QUEUE, event);
};


/*
 * This function publishes a task step event to the global event queue.
 */
const publishSuspensionEvent = async function(processor) {
    const task = exportTask(processor.task);
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
    event = await processor.notary.notarizeDocument(event);
    await processor.repository.queueMessage(EVENT_QUEUE, event);
};


/*
 * This function places the current task context on the queue for tasks awaiting messages
 */
const queueTaskContext = async function(processor) {
    // convert the task context into its corresponding source document
    var task = exportTask(processor.task).toString();
    // queue up the task for a new virtual processor
    task = await processor.notary.notarizeDocument(task);
    await processor.repository.queueMessage(WAIT_QUEUE, task);
};


const validateDocument = async function(notary, repository, document) {
    // TODO: actually do it
};


const pushContext = async function(processor, target, citation, passedParameters, index) {

    // save the current procedure context
    const currentContext = processor.context;

    // retrieve the cited type definition
    const typeId = extractId(citation);
    const source = await processor.repository.fetchDocument(typeId);
    const document = bali.parse(source);
    await processor.notary.citationMatches(citation, document);
    await validateDocument(processor.notary, processor.repository, document);
    const type = document.getValue('$component');

    // retrieve the procedures for this type
    const name = currentContext.procedures.getItem(index);
    var procedures = type.getValue('$procedures');
    const procedure = procedures.getValue(name);

    // retrieve the bytecode from the compiled procedure
    const bytes = procedure.getValue('$bytecode').getValue();
    const bytecode = processor.compiler.bytecode(bytes);

    // retrieve the literals and constants from the compiled type
    const literals = type.getValue('$literals');
    const constants = type.getValue('$constants');

    // set the parameter values
    var counter = 1;
    const parameters = bali.catalog();
    var iterator = procedure.getValue('$parameters').getIterator();
    while (iterator.hasNext()) {
        var key = iterator.getNext();
        var value = passedParameters.getParameter(key, counter++);
        value = value || bali.pattern.NONE;
        parameters.setValue(key, value);
    }

    // set the initial values of the variables to 'none' except for the 'target' variable
    const variables = bali.catalog();
    iterator = procedure.getValue('$variables').getIterator();
    while (iterator.hasNext()) {
        var variable = iterator.getNext();
        variables.setValue(variable, bali.pattern.NONE);
    }
    variables.setValue('$target', target);

    // retrieve the called procedure names from the procedure
    procedures = procedure.getValue('$procedures');

    // create an empty exception handler stack
    const handlers = bali.stack();

    // construct the next procedure context
    const nextContext = {
        type: citation,
        name: name,
        instruction: 0,
        address: 0,  // this will be incremented before the next instruction is executed
        bytecode: bytecode,
        literals: literals,
        constants: constants,
        parameters: parameters,
        variables: variables,
        procedures: procedures,
        handlers: handlers
    };

    // push the current procedure context onto the stack
    processor.task.contexts.addItem(exportCurrentContext(processor));

    // set the next procedure as the current procedure
    processor.context = nextContext;
};


// PRIVATE MACHINE INSTRUCTION HANDLERS (ASYNCHRONOUS)

const instructionHandlers = [
    // JUMP TO label
    async function(processor, operand) {
        // if the operand is not zero then use it as the next instruction to be executed,
        // otherwise it is a SKIP INSTRUCTION (aka NOOP)
        if (operand) {
            const address = operand;
            processor.context.address = address;
        } else {
            processor.context.address++;
        }
    },

    // JUMP TO label ON NONE
    async function(processor, operand) {
        const address = operand;
        // pop the condition component off the component stack
        const condition = processor.task.stack.removeItem();
        // if the condition is 'none' then use the address as the next instruction to be executed
        if (condition.isEqualTo(bali.pattern.NONE)) {
            processor.context.address = address;
        } else {
            processor.context.address++;
        }
    },

    // JUMP TO label ON TRUE
    async function(processor, operand) {
        const address = operand;
        // pop the condition component off the component stack
        const condition = processor.task.stack.removeItem();
        // if the condition is 'true' then use the address as the next instruction to be executed
        if (condition.toBoolean()) {
            processor.context.address = address;
        } else {
            processor.context.address++;
        }
    },

    // JUMP TO label ON FALSE
    async function(processor, operand) {
        const address = operand;
        // pop the condition component off the component stack
        const condition = processor.task.stack.removeItem();
        // if the condition is 'false' then use the address as the next instruction to be executed
        if (!condition.toBoolean()) {
            processor.context.address = address;
        } else {
            processor.context.address++;
        }
    },

    // PUSH HANDLER label
    async function(processor, operand) {
        const handlerAddress = operand;
        // push the address of the current exception handlers onto the handlers stack
        processor.context.handlers.addItem(bali.number(handlerAddress));
        processor.context.address++;
    },

    // PUSH LITERAL literal
    async function(processor, operand) {
        const index = operand;
        // lookup the literal associated with the index
        const literal = processor.context.literals.getItem(index);
        processor.task.stack.addItem(literal);
        processor.context.address++;
    },

    // PUSH CONSTANT constant
    async function(processor, operand) {
        const index = operand;
        // lookup the constant associated with the index
        const constant = processor.context.constants.getItem(index).getValue();
        processor.task.stack.addItem(constant);
        processor.context.address++;
    },

    // PUSH PARAMETER parameter
    async function(processor, operand) {
        const index = operand;
        // lookup the parameter associated with the index
        const parameter = processor.context.parameters.getItem(index).getValue();
        processor.task.stack.addItem(parameter);
        processor.context.address++;
    },

    // POP HANDLER
    async function(processor, operand) {
        // remove the current exception handler address from the top of the handlers stack
        // since it is no longer in scope
        processor.context.handlers.removeItem();
        processor.context.address++;
    },

    // POP COMPONENT
    async function(processor, operand) {
        // remove the component that is on top of the component stack since it was not used
        processor.task.stack.removeItem();
        processor.context.address++;
    },

    // UNIMPLEMENTED POP OPERATION
    async function(processor, operand) {
        throw bali.exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$pop3',
            $exception: '$notImplemented',
            $operand: operand,
            $processor: captureState(processor),
            $message: 'An unimplemented POP operation was attempted.'
        });
    },

    // UNIMPLEMENTED POP OPERATION
    async function(processor, operand) {
        throw bali.exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$pop4',
            $exception: '$notImplemented',
            $operand: operand,
            $processor: captureState(processor),
            $message: 'An unimplemented POP operation was attempted.'
        });
    },

    // LOAD VARIABLE symbol
    async function(processor, operand) {
        const index = operand;
        // lookup the variable associated with the index
        const variable = processor.context.variables.getItem(index).getValue();
        processor.task.stack.addItem(variable);
        processor.context.address++;
    },

    // LOAD MESSAGE symbol
    async function(processor, operand) {
        const index = operand;
        // lookup the queue tag associated with the index
        const queue = processor.context.variables.getItem(index).getValue();
        // TODO: jump to exception handler if queue isn't a tag
        // attempt to receive a message from the queue in the document repository
        var message;
        const source = await processor.repository.dequeueMessage(queue);
        if (source) {
            // validate the document
            const document = bali.parse(source);
            await validateDocument(processor.notary, processor.repository, document);
            message = document.getValue('$component');
        }
        if (message) {
            // place the message on the stack
            processor.task.stack.addItem(message);
            processor.context.address++;
        } else {
            // set the task status to 'waiting'
            processor.task.status = WAITING;
        }
    },

    // LOAD DRAFT symbol
    async function(processor, operand) {
        const index = operand;
        // lookup the citation associated with the index
        const citation = processor.context.variables.getItem(index).getValue();
        // TODO: jump to exception handler if the citation isn't a citation
        // retrieve the cited draft from the document repository
        const documentId = extractId(citation);
        const source = await processor.repository.fetchDraft(documentId);
        const document = bali.parse(source);
        await processor.notary.citationMatches(citation, document);
        await validateDocument(processor.notary, processor.repository, document);
        const draft = document.getValue('$component');
        // push the draft on top of the component stack
        processor.task.stack.addItem(draft);
        processor.context.address++;
    },

    // LOAD DOCUMENT symbol
    async function(processor, operand) {
        const index = operand;
        // lookup the citation associated with the index
        const citation = processor.context.variables.getItem(index).getValue();
        // TODO: jump to exception handler if the citation isn't a citation
        // retrieve the cited document from the document repository
        const documentId = extractId(citation);
        const source = await processor.repository.fetchDocument(documentId);
        var document = bali.parse(source);
        await processor.notary.citationMatches(citation, document);
        await validateDocument(processor.notary, processor.repository, document);
        document = document.getValue('$component');
        // push the document on top of the component stack
        processor.task.stack.addItem(document);
        processor.context.address++;
    },

    // STORE VARIABLE symbol
    async function(processor, operand) {
        const index = operand;
        // pop the component that is on top of the component stack off the stack
        const component = processor.task.stack.removeItem();
        // and store the component in the variable associated with the index
        processor.context.variables.getItem(index).setValue(component);
        processor.context.address++;
    },

    // STORE MESSAGE symbol
    async function(processor, operand) {
        const index = operand;
        // pop the message that is on top of the component stack off the stack
        var message = processor.task.stack.removeItem();
        // lookup the queue tag associated with the index operand
        const queue = processor.context.variables.getItem(index).getValue();
        // TODO: jump to exception handler if queue isn't a tag
        // send the message to the queue in the document repository
        message = await processor.notary.notarizeDocument(message);
        await processor.repository.queueMessage(queue, message);
        processor.context.address++;
    },

    // STORE DRAFT symbol
    async function(processor, operand) {
        const index = operand;
        // pop the draft that is on top of the component stack off the stack
        var draft = processor.task.stack.removeItem();
        // write the draft to the document repository
        draft = await processor.notary.notarizeDocument(draft);
        const citation = await processor.notary.citeDocument(draft);
        const draftId = extractId(citation);
        await processor.repository.saveDraft(draftId, draft);
        // and store the resulting citation in the variable associated with the index
        processor.context.variables.getItem(index).setValue(citation);
        processor.context.address++;
    },

    // STORE DOCUMENT symbol
    async function(processor, operand) {
        const index = operand;
        // pop the document that is on top of the component stack off the stack
        var document = processor.task.stack.removeItem();
        // write the document to the document repository
        document = await processor.notary.notarizeDocument(document);
        const citation = await processor.notary.citeDocument(document);
        const documentId = extractId(citation);
        await processor.repository.createDocument(documentId, document);
        await processor.repository.deleteDraft(documentId);
        // and store the resulting citation in the variable associated with the index
        processor.context.variables.getItem(index).setValue(citation);
        processor.context.address++;
    },

    // INVOKE symbol
    async function(processor, operand) {
        const index = operand;
        // call the intrinsic function associated with the index operand
        const result = intrinsics.invoke(index);
        // push the result of the function call onto the top of the component stack
        processor.task.stack.addItem(result);
        processor.context.address++;
    },

    // INVOKE symbol WITH PARAMETER
    async function(processor, operand) {
        const index = operand;
        // pop the parameter off of the component stack
        const parameter = processor.task.stack.removeItem();
        // call the intrinsic function associated with the index operand
        const result = intrinsics.invoke(index, parameter);
        // push the result of the function call onto the top of the component stack
        processor.task.stack.addItem(result);
        processor.context.address++;
    },

    // INVOKE symbol WITH 2 PARAMETERS
    async function(processor, operand) {
        const index = operand;
        // pop the parameters off of the component stack (in reverse order)
        const parameter2 = processor.task.stack.removeItem();
        const parameter1 = processor.task.stack.removeItem();
        // call the intrinsic function associated with the index operand
        const result = intrinsics.invoke(index, parameter1, parameter2);
        // push the result of the function call onto the top of the component stack
        processor.task.stack.addItem(result);
        processor.context.address++;
    },

    // INVOKE symbol WITH 3 PARAMETERS
    async function(processor, operand) {
        const index = operand;
        // pop the parameters call off of the component stack (in reverse order)
        const parameter3 = processor.task.stack.removeItem();
        const parameter2 = processor.task.stack.removeItem();
        const parameter1 = processor.task.stack.removeItem();
        // call the intrinsic function associated with the index operand
        const result = intrinsics.invoke(index, parameter1, parameter2, parameter3);
        // push the result of the function call onto the top of the component stack
        processor.task.stack.addItem(result);
        processor.context.address++;
    },

    // EXECUTE symbol
    async function(processor, operand) {
        // setup the new procedure context
        const index = operand;
        const parameters = bali.parameters(bali.list());
        const target = bali.pattern.NONE;
        const type = processor.task.stack.removeItem();
        await pushContext(processor, target, type, parameters, index);
        processor.context.address++;
    },

    // EXECUTE symbol WITH PARAMETERS
    async function(processor, operand) {
        // setup the new procedure context
        const index = operand;
        const parameters = processor.task.stack.removeItem();
        const target = bali.pattern.NONE;
        const type = processor.task.stack.removeItem();
        await pushContext(processor, target, type, parameters, index);
        processor.context.address++;
    },

    // EXECUTE symbol ON TARGET
    async function(processor, operand) {
        // setup the new procedure context
        const index = operand;
        const parameters = bali.parameters(bali.list());
        const target = processor.task.stack.removeItem();
        const type = target.getParameters().getParameter('$type');
        await pushContext(processor, target, type, parameters, index);
        processor.context.address++;
    },

    // EXECUTE symbol ON TARGET WITH PARAMETERS
    async function(processor, operand) {
        // setup the new procedure context
        const index = operand;
        const parameters = processor.task.stack.removeItem();
        const target = processor.task.stack.removeItem();
        const type = target.getParameters().getParameter('$type');
        await pushContext(processor, target, type, parameters, index);
        processor.context.address++;
    },

    // HANDLE RESULT
    async function(processor, operand) {
        if (!processor.task.contexts.isEmpty()) {
            // retrieve the previous context from the stack
            processor.context = importCurrentContext(processor);
            processor.context.address++;
        } else {
            // task completed with a result
            processor.task.result = processor.task.stack.removeItem();
            processor.task.status = DONE;
            processor.context = undefined;
        }
    },

    // HANDLE EXCEPTION
    async function(processor, operand) {
        // search up the stack for a handler
        while (processor.context) {
            if (!processor.context.handlers.isEmpty()) {
                // retrieve the address of the next exception handler
                var handlerAddress = processor.context.handlers.removeItem().toNumber();
                // use that address as the next instruction to be executed
                processor.context.address = handlerAddress;
                break;
            } else {
                if (!processor.task.contexts.isEmpty()) {
                    // retrieve the previous context from the stack
                    processor.context = importCurrentContext(processor);
                } else {
                    // task completed with an unhandled exception
                    processor.task.exception = processor.task.stack.removeItem();
                    processor.task.status = DONE;
                    processor.context = undefined;
                }
            }
        }
    },

    // UNIMPLEMENTED HANDLE OPERATION
    async function(processor, operand) {
        throw bali.exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$handle3',
            $exception: '$notImplemented',
            $operand: operand,
            $processor: captureState(processor),
            $message: 'An unimplemented HANDLE operation was attempted.'
        });
    },

    // UNIMPLEMENTED HANDLE OPERATION
    async function(processor, operand) {
        throw bali.exception({
            $module: '/bali/processor/VirtualProcessor',
            $procedure: '$handle4',
            $exception: '$notImplemented',
            $operand: operand,
            $processor: captureState(processor),
            $message: 'An unimplemented HANDLE operation was attempted.'
        });
    }

];

