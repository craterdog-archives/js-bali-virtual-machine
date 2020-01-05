/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = 0;  // set to true for error logging
const directory = 'test/config/';
const pfs = require('fs').promises;
const mocha = require('mocha');
const expect = require('chai').expect;
const bali = require('bali-component-framework').api();
const account = bali.component('#GTDHQ9B8ZGS7WCBJJJBFF6KDCCF55R2P');
const api = require('bali-digital-notary');
const securityModule = api.ssm(directory);
const notary = api.notary(securityModule, account, directory);
const repository = require('bali-document-repository').local(directory, debug);
const compiler = require('bali-type-compiler').api(notary, repository, debug);
const vm = require('../index').api(notary, repository, compiler, debug);
const EOL = '\n';  // POSIX end of line character


function extractId(catalog) {
    const parameters = catalog.getParameters();
    const id = parameters.getValue('$tag').getValue() + parameters.getValue('$version');
    return id;
}


describe('Bali Nebula™ Virtual Machine™', function() {

    describe('Initialize the environment', function() {

        it('should generate the notary key and publish its certificate', async function() {
            const certificate = await notary.generateKey();
            expect(certificate).to.exist;
            const document = await notary.notarizeComponent(certificate);
            expect(document).to.exist;
            const citation = await notary.activateKey(document);
            expect(citation).to.exist;
            const documentId = extractId(certificate);
            await repository.createDocument(documentId, document);
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
                const component = bali.component(source, debug);
                expect(component).to.exist;
                var document = await notary.notarizeDocument(component);
                expect(document).to.exist;
                const citation = await notary.citeDocument(document);
                expect(citation).to.exist;
                const name = '/bali/examples/' + prefix + '/v1';
                await repository.createCitation(name, citation);
                const documentId = citation.getValue('$tag').getValue() + citation.getValue('$version');
                expect(documentId).to.exist;
                await repository.createDocument(documentId, document);
                const type = await compiler.compileType(document);
                expect(type).to.exist;
                document = await notary.notarizeComponent(type);
                expect(document).to.exist;
                await repository.createType(documentId, document);
            }
        });

    });

});
