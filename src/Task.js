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
 * @param {Boolean|Number} debug An optional number in the range 0..3 that controls the level of
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

    // PRIVATE ATTRIBUTES

    const type = catalog.getParameter('$type');
    const tag = catalog.getParameter('$tag');
    const version = catalog.getParameter('$version');
    const permissions = catalog.getParameter('$permissions');
    const previous = catalog.getParameter('$previous');
    const account = catalog.getAttribute('$account');
    var tokens = catalog.getAttribute('$tokens').toInteger();  // optimization
    const controller = bali.controller(REQUESTS, STATES, catalog.getAttribute('$state').toString(), debug);
    var clock = catalog.getAttribute('$clock').toInteger();  // optimization
    const components = catalog.getAttribute('$components') || bali.stack();
    const contexts = catalog.getAttribute('$contexts') || bali.stack();
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
            $components: bali.duplicate(components),  // capture current state
            $contexts: bali.duplicate(contexts)  // capture current state
        }, {  // requires parameterization since it is saved in the repository
            $type: type,
            $tag: tag,
            $version: version,
            $permissions: permissions,
            $previous: previous
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

    this.isPaused = function() {
        return controller.getState() === Task.PAUSED;
    };

    this.isFrozen = function() {
        return controller.getState() === Task.FROZEN;
    };

    this.hasCompleted = function() {
        return controller.getState() === Task.COMPLETED;
    };

    this.wasAbandoned = function() {
        return controller.getState() === Task.ABANDONED;
    };

    this.activateTask = function(tokens) {
        controller.validateEvent('$activate');  // check before adding tokens
        this.tokens += tokens;
        controller.transitionState('$activate');
    };

    this.pauseTask = function() {
        controller.transitionState('$pause');
    };

    this.completeTask = function(result) {
        controller.validateEvent('$complete');  // check before setting the response
        response = result;
        controller.transitionState('$complete');
    };

    this.abandonTask = function(exception) {
        controller.validateEvent('$abandon');  // check before setting the response
        response = exception;
        controller.transitionState('$abandon');
    };

    this.getClock = function() {
        return clock;
    };

    this.tickClock = function() {
        clock++;
        if (--tokens < 1) {
            // the task has run out of tokens
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


// Export the task constructors

exports.create = function(account, tokens, debug) {
    return new Task(bali.catalog({
        $account: account,
        $tokens: tokens,
        $state: Task.ACTIVE,
        $clock: 0,
        $components: bali.stack(),
        $contexts: bali.stack()
    }, {  // requires parameterization since it is saved in the repository
        $type: '/bali/vm/Task/v1',
        $tag: bali.tag(),
        $version: bali.version(),
        $permissions: '/bali/permissions/public/v1',
        $previous: bali.pattern.NONE
    }), debug);
};

exports.fromCatalog = function(catalog, debug) {
    return new Task(catalog, debug);
};

