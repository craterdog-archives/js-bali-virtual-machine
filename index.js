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

const bali = require('bali-component-framework');
const VirtualProcessor = require('./src/VirtualProcessor').VirtualProcessor;


/**
 * This function returns an object that implements the Bali Nebula™ virtual machine interface.
 * 
 * @param {Object} notary An object that implements the Bali Nebula™ digital notary interface.
 * @param {Object} repository An object that implements the Bali Nebula™ document repository interface.
 * @param {Object} compiler An object that implements the Bali Nebula™ procedure compiler interface.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} An object that implements the Bali Nebula™ virtual machine interface.
 */
exports.api = function(notary, repository, compiler, debug) {
    debug = debug || false;

    return {

        /**
         * This function returns a new message that can be sent to a target component.
         * 
         * @param {Symbol} procedure The name of the procedure defined by the target's type.
         * @param {Parameters} parameters The parameters that are passed.
         * @param {Tag} queue The queue on which to place the result of the message handling.
         * @returns {Catalog} The new message.
         */
        message: function(procedure, parameters, queue) {
            return bali.catalog({
                $account: notary.getAccountTag(),
                $timestamp: bali.moment(),
                $procedure: procedure,
                $parameters: parameters,
                $queue: queue
            }, bali.parameters({
                $type: '/bali/vm/Message/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/private/v1',
                $previous: bali.pattern.NONE
            }));
        },


        /**
         * This function returns a new task that is ready to execute on a virtual processor.
         * 
         * @param {Component} target The component that is the target of the message.
         * @param {Catalog} message The message and parameters to be sent to the target.
         * @param {Number} tokens The maximum number of tokens that can be spent on this task.
         * @returns {Catalog} The new task.
         */
        task: async function(target, message, tokens) {

            // create a new task
            const task = bali.catalog({
                $account: notary.getAccountTag(),
                $timestamp: bali.moment(),
                $balance: tokens,
                $message: message,
                $status: '$active',
                $clock: 0,
                $stack: bali.stack(),
                $contexts: bali.stack()
            }, bali.parameters({
                $type: '/bali/vm/Task/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/private/v1',
                $previous: bali.pattern.NONE
            }));

            // fetch the type definition of the target
            const typeName = target.getType();
            const citation = bali.parse(repository.fetchCitation(typeName));
            const typeId = citation.getValue('$tag').getValue() + citation.getValue('$version');
            const source = await repository.fetchDocument(typeId);
            const document = bali.parse(source);
            const type = document.getValue('$component');

            // fetch the procedure to be executed
            const procedureName = message.getValue('$procedure');
            const procedures = type.getValue('$procedures');
            const procedure = procedures.getValue(procedureName);

            // retrieve the bytecode from the compiled procedure
            const bytes = procedure.getValue('$bytecode').getValue();
            const bytecode = compiler.bytecode(bytes);

            // retrieve the literals and constants from the compiled type
            const literals = type.getValue('$literals');
            const constants = type.getValue('$constants');

            // set the parameter values
            const parameters = bali.catalog();
            var iterator = procedure.getValue('$parameters').getIterator();
            while (iterator.hasNext()) {
                var key = iterator.getNext();
                var value = message.getParameters().getValue(key);
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

            // create the initial context
            const context = bali.catalog({
                type: typeName,
                procedure: procedureName,
                parameters: parameters,
                literals: literals,
                constants: constants,
                variables: variables,
                procedures: procedures,
                handlers: handlers,
                instruction: 0,
                address: 0,  // this will be incremented before the next instruction is executed
                bytecode: bytecode
            }, bali.parameters({
                $type: '/bali/vm/Context/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/private/v1',
                $previous: bali.pattern.NONE
            }));

            // push the current procedure context onto the stack
            task.contexts.addItem(context);

            return task;
        },


        /**
         * This function returns a new virtual process for the specified task.
         * 
         * @param {Catalog} task A catalog containing the task definition for the processor.
         * @returns {VirtualProcessor} A new virtual processor initialized with the task.
         */
        processor: function(task) {
            const processor = new VirtualProcessor(notary, repository, compiler, task, debug);
            return processor;
        }

    };
};
