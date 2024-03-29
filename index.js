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

const Processor = require('./src/Processor').Processor;


/**
 * This function returns an object that implements the Bali Virtual Machine™ interface.
 *
 * @param {Boolean|Number} debug An optional number in the range 0..3 that controls the level of
 * debugging that occurs:
 * <pre>
 *   0 (or false): no logging
 *   1 (or true): log exceptions to console.error
 *   2: perform argument validation and log exceptions to console.error
 *   3: perform argument validation and log exceptions to console.error and debug info to console.log
 * </pre>
 * @returns {Object} An object that implements the Bali Virtual Machine™ interface.
 */
exports.api = function(debug) {
    this.debug = debug || 0;  // default is off
    this.processor = function(repository) {
            const processor = new Processor(repository, this.debug);
            return processor;
    };
    return this;
};
