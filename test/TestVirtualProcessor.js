/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = 1;  // set to true for error logging
const directory = 'test/config/';
const pfs = require('fs').promises;
const mocha = require('mocha');
const expect = require('chai').expect;
const bali = require('bali-component-framework').api(debug);
const account = bali.component('#GTDHQ9B8ZGS7WCBJJJBFF6KDCCF55R2P');
const notary = require('bali-digital-notary').test(account, directory, debug);
const repository = require('bali-document-repository').test(notary, directory, debug);
const compiler = require('bali-type-compiler').api(debug);
const vm = require('../index').api(notary, repository, debug);
const EOL = '\n';  // POSIX end of line character


describe('Bali Virtual Machine™', function() {

    describe('Initialize the environment', function() {

        it('should generate the notary key and publish its certificate', async function() {
            const publicKey = await notary.generateKey();
            const certificate = await notary.notarizeDocument(publicKey);
            const citation = await notary.activateKey(certificate);
            expect(citation.isEqualTo(await repository.writeDocument(certificate))).is.true;
        });

        it('should compile example type documents into compiled type documents', async function() {
            const testFolder = 'test/examples/';
            const files = await pfs.readdir(testFolder);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (!file.endsWith('.bali')) continue;
                console.log('      ' + file);
                const prefix = file.split('.').slice(0, 1);
                const typeFile = testFolder + prefix + '.bali';
                const source = await pfs.readFile(typeFile, 'utf8');
                const type = bali.component(source, debug);
                expect(type).to.exist;
                compiler.compileType(type);
                if (prefix.toString() === 'Test') console.log('type: ' + type);
                const document = await notary.notarizeDocument(type);
                const citation = await repository.writeDocument(document);
                expect(citation).to.exist;
                const name = '/bali/tests/' + prefix + '/v1';
                await repository.writeName(name, citation);
            }
        });

    });

});
