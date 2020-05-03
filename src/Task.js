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
 * This class implements a task that can be run in the Bali Nebula™.
 */


/**
 * This constructor creates a new task from a catalog containing the task attributes.  The
 * resulting task object has been optimized to run more efficiently on the Bali Virtual Machine™.
 *
 * @param {Object} catalog A catalog containing the attributes for the task.
 * @param {Boolean|Number} debug An optional number in the range [0..3] that controls the level of
 * debugging that occurs:
 * <pre>
 *   0 (or false): no logging
 *   1 (or true): log exceptions to console.error
 *   2: perform argument validation and log exceptions to console.error
 *   3: perform argument validation and log exceptions to console.error and debug info to console.log
 * </pre>
 * @returns {Task} The new task.
 */
const Task = async function(catalog, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    const bali = require('bali-component-framework').api(debug);

    // PRIVATE ATTRIBUTES

    const tag = catalog.getValue('$tag') || bali.tag();
    const account = catalog.getValue('$account');
    var balance = catalog.getValue('$balance').toNumber();  // optimization
    var status = catalog.getValue('$status').toString();  // optimization
    var clock = catalog.getValue('$clock').toNumber();  // optimization
    const components = catalog.getValue('$components') || bali.stack();
    const contexts = catalog.getValue('$contexts') || bali.stack();


    // PUBLIC METHODS

    this.toString = function() {
        return this.toCatalog().toString();
    };

    this.toCatalog = function() {
        return bali.catalog({
            $tag: tag,
            $account: account,
            $balance: balance,
            $status: status,
            $clock: clock,
            $components: components.duplicate(),  // capture current state
            $contexts: contexts.duplicate()  // capture current state
        });
    };

    this.getTag = function() {
        return tag;
    };

    this.getAccount = function() {
        return account;
    };

    this.getBalance = function() {
        return balance;
    };

    this.addTokens = function(tokens) {
        balance += tokens;
    };

    this.getClock = function() {
        return clock;
    };

    this.tickClock = function() {
        clock++;
        if (--balance) status = Task.DONE;
    };

    this.getStatus = function() {
        return status;
    };

    this.activate = function() {
        status = Task.RUNNING;
    };

    this.passivate = function() {
        status = Task.WAITING;
    };

    this.complete = function() {
        status = Task.DONE;
    };

    this.pushComponent = function(component) {
        components.addItem(component);
    };

    this.popComponent = function() {
        return components.removeItem();
    };

    this.pushContext = function(context) {
        contexts.addItem(context);
    };

    return this;
    this.popContext = function(context) {
        return contexts.removeItem();
    };

    return this;
};
Task.prototype.constructor = Task;
Task.RUNNING = '$running';
Task.WAITING = '$waiting';
Task.DONE = '$done';
exports.Task = Task;
