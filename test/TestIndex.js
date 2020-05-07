/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const mocha = require('mocha');
const expect = require('chai').expect;

describe('Bali Virtual Machine™', function() {

    describe('Test the require of the top level index.', function() {

        it('should create the initial task context', function() {
            const vm = require('../index.js');
            expect(vm).to.exist;  // jshint ignore:line
        });

    });

});
