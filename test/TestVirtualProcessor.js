/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = true;  // set to true for error logging
const directory = 'test/config/';
const fs = require('fs');
const mocha = require('mocha');
const expect = require('chai').expect;
const bali = require('bali-component-framework');
const account = bali.parse('#GTDHQ9B8ZGS7WCBJJJBFF6KDCCF55R2P');
const securityModule = require('bali-digital-notary').ssm(directory + account.getValue() + '.keys', debug);
const notary = require('bali-digital-notary').api(securityModule, account, directory, debug);
const repository = require('bali-document-repository').local(directory, debug);
const compiler = require('bali-type-compiler').api(notary, repository, debug);
const vm = require('../index').api(notary, repository, compiler, debug);
const EOL = '\n';  // POSIX end of line character


function extractId(catalog) {
    const parameters = catalog.getParameters();
    const id = parameters.getParameter('$tag').getValue() + parameters.getParameter('$version');
    return id;
}


describe('Bali Nebula™ Virtual Machine™', function() {

    describe('Initialize the environment', function() {

        it('should generate the notary key and publish its certificate', async function() {
            const certificate = await notary.generateKey();
            console.log('certificate: ' + certificate);
            expect(certificate).to.exist;
            const document = await notary.notarizeDocument(certificate);
            console.log('document: ' + document);
            expect(document).to.exist;
            const citation = await notary.activateKey(document);
            console.log('citation: ' + citation);
            expect(citation).to.exist;
            const documentId = extractId(certificate);
            await repository.createDocument(documentId, document);
        });

        it('should compile example type documents into compiled type documents', async function() {
            const testFolder = 'test/examples/';
            const files = fs.readdirSync(testFolder);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (!file.endsWith('.bali')) continue;
                console.log('      ' + file);
                var prefix = file.split('.').slice(0, 1);
                var typeFile = testFolder + prefix + '.bali';
                var document = bali.parse(fs.readFileSync(typeFile, 'utf8'));
                expect(document).to.exist;
                document = await notary.notarizeDocument(document);
                expect(document).to.exist;
                const citation = await notary.citeDocument(document);
                expect(citation).to.exist;
                const name = '/bali/examples/' + prefix + '/v1';
                await repository.createCitation(name, citation);
                const documentId = citation.getValue('$tag').getValue() + citation.getValue('$version');
                expect(documentId).to.exist;
                await repository.createDocument(documentId, document);
                var type = await compiler.compileType(document);
                expect(type).to.exist;
                type = await notary.notarizeDocument(type);
                expect(type).to.exist;
                await repository.createType(documentId, type);
            }
        });

    });

/*
    describe('Test the JUMP instruction.', function() {

        it('should create the initial task context', function() {
            var testFile = 'test/processor/JUMP.basm';
            task = loadTask(testFile);
            expect(task).to.exist;  // jshint ignore:line
        });

        it('should execute the test instructions', async function() {
            const processor = vm.processor(task);
            expect(processor.context.address).to.equal(1);

            // 1.IfStatement:
            // SKIP INSTRUCTION
            await processor.step();
            expect(processor.context.address).to.equal(2);

            // 1.1.ConditionClause:
            // PUSH LITERAL `true`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.probability(true))).to.equal(true);
            expect(processor.context.address).to.equal(3);
            // JUMP TO 1.IfStatementDone ON FALSE
            await processor.step();
            expect(processor.context.address).to.equal(4);

            // 1.1.1.EvaluateStatement:
            // SKIP INSTRUCTION
            await processor.step();
            expect(processor.context.address).to.equal(5);

            // 1.2.ConditionClause:
            // PUSH LITERAL `false`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.probability(false))).to.equal(true);
            expect(processor.context.address).to.equal(6);
            // JUMP TO 1.3.ConditionClause ON FALSE
            await processor.step();
            expect(processor.context.address).to.equal(8);

            // 1.2.1.EvaluateStatement:
            // JUMP TO 1.IfStatementDone

            // 1.3.ConditionClause:
            // PUSH LITERAL `true`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.probability(true))).to.equal(true);
            expect(processor.context.address).to.equal(9);
            // JUMP TO 1.4.ConditionClause ON TRUE
            await processor.step();
            expect(processor.context.address).to.equal(11);

            // 1.3.1.EvaluateStatement:
            // JUMP TO 1.IfStatementDone

            // 1.4.ConditionClause:
            // PUSH LITERAL `false`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.probability(false))).to.equal(true);
            expect(processor.context.address).to.equal(12);
            // JUMP TO 1.IfStatementDone ON TRUE
            await processor.step();
            expect(processor.context.address).to.equal(13);

            // 1.4.1.EvaluateStatement:
            // SKIP INSTRUCTION
            await processor.step();
            expect(processor.context.address).to.equal(14);

            // 1.5.ConditionClause:
            // PUSH LITERAL `none`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.pattern.NONE)).to.equal(true);
            expect(processor.context.address).to.equal(15);
            // JUMP TO 1.6.ConditionClause ON NONE
            await processor.step();
            expect(processor.context.address).to.equal(17);

            // 1.5.1.EvaluateStatement:
            // JUMP TO 1.IfStatementDone

            // 1.6.ConditionClause:
            // PUSH LITERAL `true`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.probability(true))).to.equal(true);
            expect(processor.context.address).to.equal(18);
            // JUMP TO 1.IfStatementDone ON NONE
            await processor.step();
            expect(processor.context.address).to.equal(19);

            // 1.6.1.EvaluateStatement:
            // JUMP TO 1.IfStatementDone
            await processor.step();
            expect(processor.context.address).to.equal(20);

            // 1.IfStatementDone:
            // SKIP INSTRUCTION
            await processor.step();
            expect(processor.context.address).to.equal(21);

            // EOF
            var result = await processor.step();
            expect(result).to.equal(false);
            expect(processor.task.clock).to.equal(17);
            expect(processor.task.balance).to.equal(983);
            expect(processor.task.status).to.equal('$active');
            expect(processor.task.stack.getSize()).to.equal(0);
        });

    });

    describe('Test the PUSH and POP instructions.', function() {

        it('should create the initial task context', function() {
            const testFile = 'test/processor/PUSH-POP.basm';
            task = loadTask(testFile);
            expect(task).to.exist;  // jshint ignore:line
        });

        it('should execute the test instructions', async function() {
            const processor = vm.processor(task);
            expect(processor.context.address).to.equal(1);

            // 1.PushHandler:
            // PUSH HANDLER 3.PushLiteral
            await processor.step();
            expect(processor.context.handlers.getSize()).to.equal(1);
            expect(processor.context.handlers.getTop().toNumber()).to.equal(3);
            expect(processor.context.address).to.equal(2);

            // 2.PushLiteral:
            // PUSH LITERAL `"five"`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().isEqualTo(bali.text('five'))).to.equal(true);
            expect(processor.context.address).to.equal(3);

            // 3.PushLiteral:
            // PUSH LITERAL `{return prefix + name}`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.task.stack.getTop().toString()).to.equal('{return prefix + name}');
            expect(processor.context.address).to.equal(4);

            // 4.PushConstant:
            // PUSH CONSTANT $constant
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.task.stack.getTop().toNumber()).to.equal(5);
            expect(processor.context.address).to.equal(5);

            // 5.PushParameter:
            // PUSH PARAMETER $y
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(4);
            expect(processor.task.stack.getTop().isEqualTo(bali.pattern.NONE)).to.equal(true);
            expect(processor.context.address).to.equal(6);

            // 6.PopHandler:
            // POP HANDLER
            await processor.step();
            expect(processor.context.handlers.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(7);

            // 7.PopComponent:
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.task.stack.getTop().toNumber()).to.equal(5);
            expect(processor.context.address).to.equal(8);
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.task.stack.getTop().toString()).to.equal('{return prefix + name}');
            expect(processor.context.address).to.equal(9);
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().isEqualTo(bali.text('five'))).to.equal(true);
            expect(processor.context.address).to.equal(10);
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(11);

            // EOF
            var result = await processor.step();
            expect(result).to.equal(false);
            expect(processor.task.clock).to.equal(10);
            expect(processor.task.balance).to.equal(990);
            expect(processor.task.status).to.equal('$active');
        });

    });

    describe('Test the LOAD and STORE instructions.', function() {

        it('should create the initial task context', function() {
            const testFile = 'test/processor/LOAD-STORE.basm';
            task = loadTask(testFile);
            expect(task).to.exist;  // jshint ignore:line
        });

        it('should execute the test instructions', async function() {
            const processor = vm.processor(task);
            expect(processor.context.address).to.equal(1);

            // 1.LoadParameter:
            // PUSH PARAMETER $x
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().toString()).to.equal(DOCUMENT);
            expect(processor.context.address).to.equal(2);

            // 2.StoreVariable:
            // STORE VARIABLE $foo
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.variables.getItem(2).getValue().toString()).to.equal(DOCUMENT);
            expect(processor.context.address).to.equal(3);

            // 3.LoadVariable:
            // LOAD VARIABLE $foo
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().toString()).to.equal(DOCUMENT);
            expect(processor.context.address).to.equal(4);

            // 4.StoreDraft:
            // STORE DRAFT $citation
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(5);
            // LOAD DRAFT $citation
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().toString()).to.equal(DOCUMENT);
            expect(processor.context.address).to.equal(6);

            // 5.StoreDocument:
            // STORE DOCUMENT $citation
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(7);

            // 6.LoadDocument:
            // LOAD DOCUMENT $citation
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().toString()).to.equal(DOCUMENT);
            expect(processor.context.address).to.equal(8);

            // 7.StoreMessage:
            // STORE MESSAGE $queue
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(9);

            // 8.LoadMessage:
            // LOAD MESSAGE $queue
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().getValue('$foo').toString()).to.equal('"bar"');
            expect(processor.context.address).to.equal(10);

            // EOF
            var result = await processor.step();
            expect(result).to.equal(false);
            expect(processor.task.clock).to.equal(9);
            expect(processor.task.balance).to.equal(991);
            expect(processor.task.status).to.equal('$active');
        });

    });

    describe('Test the INVOKE instructions.', function() {

        it('should create the initial task context', function() {
            const testFile = 'test/processor/INVOKE.basm';
            task = loadTask(testFile);
            expect(task).to.exist;  // jshint ignore:line
        });

        it('should execute the test instructions', async function() {
            const processor = vm.processor(task);
            expect(processor.context.address).to.equal(1);

            // 1.Invoke:
            // INVOKE $catalog
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(2);

            // 2.InvokeWithParameter:
            // PUSH LITERAL `3`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.number(3))).to.equal(true);
            expect(processor.context.address).to.equal(3);
            // INVOKE $inverse WITH PARAMETER
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.task.stack.getTop().isEqualTo(bali.number(-3))).to.equal(true);
            expect(processor.context.address).to.equal(4);

            // 3.InvokeWith2Parameters:
            // PUSH LITERAL `5`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.number(5))).to.equal(true);
            expect(processor.context.address).to.equal(5);
            // INVOKE $sum WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.task.stack.getTop().isEqualTo(bali.number(2))).to.equal(true);
            expect(processor.context.address).to.equal(6);

            // 4.InvokeWith3Parameters:
            // PUSH LITERAL `"two"`
            await processor.step();
            expect(processor.task.stack.getTop().isEqualTo(bali.text('two'))).to.equal(true);
            expect(processor.context.address).to.equal(7);
            // INVOKE $setValue WITH 3 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.task.stack.getTop().toString()).to.equal('[2: "two"]');
            expect(processor.context.address).to.equal(8);

            // EOF
            var result = await processor.step();
            expect(result).to.equal(false);
            expect(processor.task.clock).to.equal(7);
            expect(processor.task.balance).to.equal(993);
            expect(processor.task.status).to.equal('$active');
        });

    });

    describe('Test the EXECUTE and HANDLE instructions.', function() {

        it('should create the initial task context', function() {
            const testFile = 'test/processor/EXECUTE-HANDLE.basm';
            task = loadTask(testFile);
            expect(task).to.exist;  // jshint ignore:line
        });

        it('should execute the test instructions', async function() {
            const processor = vm.processor(task);
            expect(processor.context.address).to.equal(1);

            // 1.SetupType:
            // INVOKE $catalog
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(2);
            // PUSH LITERAL `$protocol`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(3);
            // PUSH LITERAL `v1`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(4);
            // INVOKE $association WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(5);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(6);
            // PUSH LITERAL `$tag`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(7);
            // PUSH LITERAL `#M8G7XJH640RR4YBCLGNDYABD6328741S`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(8);
            // INVOKE $association WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(9);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(10);
            // PUSH LITERAL `$version`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(11);
            // PUSH LITERAL `v1`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(12);
            // INVOKE $association WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(13);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(14);
            // PUSH LITERAL `$digest`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(15);
            // PUSH LITERAL `'NS4L6V78FNSHYY3F6LK82MMB8GFRR6FD9H3FY5G8W6C6PFHBMVR1S2SPQNHQ8WPZY155Q1F1Y02GVGLZKR37VK2QZ85SW4LGRQA53P0'`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(16);
            // INVOKE $association WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(17);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(18);
            // STORE VARIABLE $type
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(19);

            // 2.SetupParameters:
            // INVOKE $catalog
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(20);
            // PUSH LITERAL `$type`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(21);
            // LOAD VARIABLE $type
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(22);
            // INVOKE $association WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(23);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(24);
            // INVOKE $parameters WITH PARAMETER
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(25);

            // 3.SetupTarget:
            // INVOKE $catalog WITH PARAMETER
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(26);
            // PUSH LITERAL `$foo`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(27);
            // PUSH LITERAL `"bar"`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(28);
            // INVOKE $association WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(29);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(30);
            // STORE VARIABLE $target
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(31);

            // 4.Execute:
            // LOAD VARIABLE $type
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(32);
            // EXECUTE $function1
            console.log('processor before: ' + processor);
            await processor.step();
            console.log('processor after: ' + processor);
                expect(processor.task.contexts.getSize()).to.equal(1);
                expect(processor.context.address).to.equal(1);
                // 1.ReturnStatement:
                // PUSH LITERAL `true`
                await processor.step();
                expect(processor.task.stack.getSize()).to.equal(1);
                expect(processor.context.address).to.equal(2);
                // HANDLE RESULT
                await processor.step();
                expect(processor.task.contexts.getSize()).to.equal(0);
                expect(processor.task.stack.getTop().isEqualTo(bali.probability(true))).to.equal(true);
            expect(processor.context.address).to.equal(33);
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(34);

            // 5.ExecuteWithParameters:
            // LOAD VARIABLE $type
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(35);
            // INVOKE $list
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(36);
            // PUSH LITERAL `"parameter"`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(37);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(38);
            // INVOKE $parameters WITH PARAMETER
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(39);
            // EXECUTE $function2 WITH PARAMETERS
            await processor.step();
                expect(processor.task.contexts.getSize()).to.equal(1);
                expect(processor.context.address).to.equal(1);
                // 1.ThrowStatement:
                // PUSH HANDLER 1.ThrowStatementHandlers
                await processor.step();
                expect(processor.context.handlers.getSize()).to.equal(1);
                expect(processor.context.handlers.getTop().toString()).to.equal('6');
                expect(processor.context.address).to.equal(2);
                // PUSH LITERAL `none`
                await processor.step();
                expect(processor.task.stack.getSize()).to.equal(1);
                expect(processor.task.stack.getTop().toString()).to.equal('none');
                expect(processor.context.address).to.equal(3);
                // HANDLE EXCEPTION
                await processor.step();
                expect(processor.context.handlers.isEmpty()).to.equal(true);
                expect(processor.context.address).to.equal(6);
                
                // 1.ThrowStatementDone:
                // POP HANDLER
                // JUMP TO 1.ThrowStatementSucceeded
                
                // 1.ThrowStatementHandlers:
                // SKIP INSTRUCTION
                await processor.step();
                expect(processor.context.address).to.equal(7);
                
                // 1.1.HandleClause:
                // STORE VARIABLE $exception
                await processor.step();
                expect(processor.context.address).to.equal(8);
                // LOAD VARIABLE $exception
                await processor.step();
                expect(processor.context.address).to.equal(9);
                // LOAD VARIABLE $exception
                await processor.step();
                expect(processor.context.address).to.equal(10);
                // PUSH LITERAL `"none"`
                await processor.step();
                expect(processor.context.address).to.equal(11);
                // INVOKE $isMatchedBy WITH 2 PARAMETERS
                await processor.step();
                expect(processor.context.address).to.equal(12);
                // JUMP TO 1.ThrowStatementFailed ON FALSE
                await processor.step();
                expect(processor.context.address).to.equal(13);
                // POP COMPONENT
                await processor.step();
                expect(processor.context.address).to.equal(14);
                
                // 1.1.1.ReturnStatement:
                // PUSH PARAMETER $first
                await processor.step();
                expect(processor.context.address).to.equal(15);
                // HANDLE RESULT
                await processor.step();
                expect(processor.task.contexts.getSize()).to.equal(0);
                expect(processor.task.stack.getTop().toString()).to.equal('"parameter"');
                
                // 1.1.HandleClauseDone:
                // JUMP TO 1.ThrowStatementSucceeded
                
                // 1.ThrowStatementFailed:
                // HANDLE EXCEPTION
                
                // 1.ThrowStatementSucceeded:
                // SKIP INSTRUCTION
                
                // 2.ReturnStatement:
                // PUSH LITERAL `false`
                // HANDLE RESULT

            expect(processor.context.address).to.equal(40);
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(41);

            // 6.ExecuteOnTarget:
            // LOAD VARIABLE $target
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            const expected = processor.task.stack.getTop();
            expect(expected.toString().includes('[$foo: "bar"]')).to.equal(true);
            expect(processor.context.address).to.equal(42);
            // EXECUTE $message1 ON TARGET
            await processor.step();
            expect(processor.task.contexts.getSize()).to.equal(1);
            expect(processor.task.stack.getSize()).to.equal(0);
                expect(processor.context.address).to.equal(1);
                // 1.ReturnStatement:
                // LOAD VARIABLE $target
                await processor.step();
                expect(processor.task.stack.getSize()).to.equal(1);
                expect(processor.task.stack.getTop().isEqualTo(expected)).to.equal(true);
                expect(processor.context.address).to.equal(2);
                // HANDLE RESULT
                await processor.step();
                expect(processor.task.contexts.getSize()).to.equal(0);
                expect(processor.task.stack.getTop().isEqualTo(expected)).to.equal(true);
            expect(processor.context.address).to.equal(43);
            // POP COMPONENT
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(0);
            expect(processor.context.address).to.equal(44);

            // 7.ExecuteOnTargetWithParameters:
            // LOAD VARIABLE $target
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(1);
            expect(processor.context.address).to.equal(45);
            // INVOKE $list
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(46);
            // PUSH LITERAL `"parameter1"`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(47);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(48);
            // PUSH LITERAL `"parameter2"`
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(3);
            expect(processor.context.address).to.equal(49);
            // INVOKE $addItem WITH 2 PARAMETERS
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(50);
            // INVOKE $parameters WITH PARAMETER
            await processor.step();
            expect(processor.task.stack.getSize()).to.equal(2);
            expect(processor.context.address).to.equal(51);
            // EXECUTE $message2 ON TARGET WITH PARAMETERS
            await processor.step();
            expect(processor.task.contexts.getSize()).to.equal(1);
            expect(processor.task.stack.getSize()).to.equal(0);
                expect(processor.context.address).to.equal(1);
                // 1.ThrowStatement:
                // PUSH HANDLER 1.ThrowStatementHandlers
                await processor.step();
                expect(processor.context.address).to.equal(2);
                // PUSH PARAMETER $second
                await processor.step();
                expect(processor.context.address).to.equal(3);
                // HANDLE EXCEPTION
                await processor.step();
                expect(processor.context.address).to.equal(6);
                
                // 1.ThrowStatementDone:
                // POP HANDLER
                // JUMP TO 1.ThrowStatementSucceeded
                
                // 1.ThrowStatementHandlers:
                // SKIP INSTRUCTION
                await processor.step();
                expect(processor.context.address).to.equal(7);
                
                // 1.1.HandleClause:
                // STORE VARIABLE $exception
                await processor.step();
                expect(processor.context.address).to.equal(8);
                // LOAD VARIABLE $exception
                await processor.step();
                expect(processor.context.address).to.equal(9);
                // LOAD VARIABLE $exception
                await processor.step();
                expect(processor.context.address).to.equal(10);
                // PUSH LITERAL `"none"`
                await processor.step();
                expect(processor.context.address).to.equal(11);
                // INVOKE $isMatchedBy WITH 2 PARAMETERS
                await processor.step();
                expect(processor.context.address).to.equal(12);
                // JUMP TO 1.ThrowStatementFailed ON FALSE
                await processor.step();
                expect(processor.context.address).to.equal(17);
                // POP COMPONENT
                
                // 1.1.1.ReturnStatement:
                // PUSH LITERAL `true`
                // HANDLE RESULT
                
                // 1.1.HandleClauseDone:
                // JUMP TO 1.ThrowStatementSucceeded
                
                // 1.ThrowStatementFailed:
                // HANDLE EXCEPTION
                await processor.step();
                
                // 1.ThrowStatementSucceeded:
                // SKIP INSTRUCTION
                
                // 2.ReturnStatement:
                // PUSH LITERAL `false`
                // HANDLE RESULT

            // POP COMPONENT

            // EOF
            var result = await processor.step();
            expect(result).to.equal(false);
            expect(processor.task.clock).to.equal(79);
            expect(processor.task.balance).to.equal(921);
            expect(processor.task.status).to.equal('$done');
        });

    });
*/

});
