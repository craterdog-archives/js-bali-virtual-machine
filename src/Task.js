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

// define the finite state machine for a task
const REQUESTS = [  //               possible request types
                 '$activate',  '$pause',  '$freeze',   '$complete',   '$abandon'
];
const STATES = {
//   current                          allowed next states
    $active:    [ '$active',  '$paused',  '$frozen',  '$completed',  '$abandoned' ],
    $frozen:    [ '$active',  undefined,  undefined,     undefined,  '$abandoned' ],
    $paused:    [ undefined,  undefined,  undefined,     undefined,     undefined ],
    $completed: [ undefined,  undefined,  undefined,     undefined,     undefined ],
    $abandoned: [ undefined,  undefined,  undefined,     undefined,     undefined ]
};


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
const Task = function(catalog, debug) {
    if (debug === null || debug === undefined) debug = 0;  // default is off
    const bali = require('bali-component-framework').api(debug);

    // PRIVATE ATTRIBUTES

    const tag = catalog.getParameter('$tag') || bali.tag();
    const account = catalog.getValue('$account');
    var tokens = catalog.getValue('$tokens').toNumber();  // optimization
    const controller = bali.controller(REQUESTS, STATES, catalog.getValue('$state').toString(), debug);
    var clock = catalog.getValue('$clock').toNumber();  // optimization
    const components = catalog.getValue('$components') || bali.stack();
    const contexts = catalog.getValue('$contexts') || bali.stack();
    var response;


    // PUBLIC METHODS

    this.toString = function() {
        return this.toCatalog().toString();
    };

    this.toCatalog = function() {
        return bali.catalog({
            $account: account,
            $tokens: tokens,
            $state: controller.getState(),
            $clock: clock,
            $components: components.duplicate(),  // capture current state
            $contexts: contexts.duplicate()  // capture current state
        }, {
            $tag: tag,
            $version: bali.version(),
            $permissions: '/bali/permissions/public/v1',
            $previous: bali.pattern.NONE
        });
    };

    this.getTag = function() {
        return tag;
    };

    this.getAccount = function() {
        return account;
    };

    this.hasTokens = function() {
        return tokens > 0;
    };

    this.splitTokens = function() {
        const split = Math.floor(tokens / 2);
        tokens -= split;
        return split;
    };

    this.getState = function() {
        return controller.getState();
    };

    this.isActive = function() {
        return controller.getState() === Task.ACTIVE;
    };

    this.activateTask = function(tokens) {
        controller.validateEvent('$activate');
        this.tokens += tokens;
        controller.transitionState('$activate');
    };

    this.isFrozen = function() {
        return controller.getState() === Task.FROZEN;
    };

    this.freezeTask = function() {
        controller.transitionState('$freeze');
    };

    this.isPaused = function() {
        return controller.getState() === Task.PAUSED;
    };

    this.pauseTask = function() {
        controller.transitionState('$pause');
    };

    this.hasCompleted = function() {
        return controller.getState() === Task.COMPLETED;
    };

    this.completeTask = function(result) {
        controller.validateEvent('$complete');
        response = result;
        controller.transitionState('$complete');
    };

    this.wasAbandoned = function() {
        return controller.getState() === Task.ABANDONED;
    };

    this.abandonTask = function(exception) {
        controller.validateEvent('$abandon');
        response = exception;
        controller.transitionState('$abandon');
    };

    this.getClock = function() {
        return clock;
    };

    this.tickClock = function() {
        clock++;
        if (--tokens < 1) {
            controller.transitionState('$freeze');
        }
    };

    this.hasComponents = function() {
        return !components.isEmpty();
    };

    this.pushComponent = function(component) {
        components.addItem(component);
    };

    this.popComponent = function() {
        return components.removeItem();
    };

    this.hasContexts = function() {
        return !contexts.isEmpty();
    };

    this.pushContext = function(context) {
        contexts.addItem(context);
    };

    this.popContext = function() {
        return contexts.removeItem();
    };

    return this;
};
Task.prototype.constructor = Task;
Task.ACTIVE = '$active';
Task.FROZEN = '$frozen';
Task.PAUSED = '$paused';
Task.COMPLETED = '$completed';
Task.ABANDONED = '$abandoned';
exports.Task = Task;
