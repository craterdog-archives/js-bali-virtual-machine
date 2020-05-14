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
 * This class implements a execution context that can be run in the Bali Nebula™.
 */


/**
 * This constructor creates a new execution context from a catalog containing the context
 * attributes.  The resulting context object has been optimized to run more efficiently on the
 * Bali Virtual Machine™.
 *
 * @param {Object} catalog A catalog containing the attributes for the context.
 * @param {Boolean|Number} debug An optional number in the range [0..3] that controls the level of
 * debugging that occurs:
 * <pre>
 *   0 (or false): no logging
 *   1 (or true): log exceptions to console.error
 *   2: perform argument validation and log exceptions to console.error
 *   3: perform argument validation and log exceptions to console.error and debug info to console.log
 * </pre>
 * @returns {Context} The new context.
 */
const Context = function(catalog, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    const bali = require('bali-component-framework').api(debug);
    const compiler = require('bali-type-compiler').api(debug);

    // PRIVATE ATTRIBUTES

    const target = catalog.getValue('$target');
    const message = catalog.getValue('$message');
    const argumentz = catalog.getValue('$arguments');
    const variables = catalog.getValue('$variables');
    const constants = catalog.getValue('$constants');
    const literals = catalog.getValue('$literals');
    const messages = catalog.getValue('$messages');
    const handlers = catalog.getValue('$handlers');
    const bytes = catalog.getValue('$bytecode').getValue();
    const bytecode = compiler.bytecode(bytes);  // optimization
    var address = catalog.getValue('$address').toNumber();  // optimization


    // PUBLIC METHODS

    this.toCatalog = function() {
        const instruction = bytecode[address - 1];  // convert to JS indexing
        const operation = compiler.operation(instruction);
        const modifier = compiler.modifier(instruction);
        const operand = compiler.operand(instruction);
        return bali.catalog({
            $target: target.duplicate(),  // capture the current state
            $message: message,
            $arguments: argumentz,
            $variables: variables.duplicate(),  // capture the current state
            $constants: constants,
            $literals: literals,
            $messages: messages,
            $handlers: handlers.duplicate(),  // capture the current state
            $bytecode: bali.binary(bytes, {$encoding: '$base16', $mediaType: '"application/bcod"'}),
            $address: address,
            $instruction: compiler.string(operation, modifier, operand)
        });
    };

    this.toString = function() {
        return this.toCatalog().toString();
    };

    this.getTarget = function() {
        return target;
    };

    this.getArgument = function(index) {
        return argumentz.getItem(index);
    };

    this.getVariable = function(index) {
        return variables.getItem(index);
    };

    this.getConstant = function(index) {
        return constants.getItem(index);
    };

    this.getLiteral = function(index) {
        return literals.getItem(index);
    };

    this.getMessage = function(index) {
        return messages.getItem(index);
    };

    this.hasHandlers = function() {
        return !handlers.isEmpty();
    };

    this.pushHandler = function(handler) {
        handlers.addItem(handler);
    };

    this.popHandler = function() {
        return handlers.removeItem().toNumber();
    };

    this.hasInstruction = function() {
        return address <= bytecode.length;
    };

    this.getInstruction = function() {
        return bytecode[address - 1];  // convert to JS indexing
    };

    this.incrementAddress = function() {
        address++;
    };

    this.jumpToAddress = function(address) {
        this.address = address;
    };

    this.jumpToHandler = function() {
        address = handlers.removeItem().toNumber();  // optimized
    };

    return this;
};
Context.prototype.constructor = Context;
exports.Context = Context;
