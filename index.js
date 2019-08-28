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
    // validate the parameters
    debug = debug || false;

    return {

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
