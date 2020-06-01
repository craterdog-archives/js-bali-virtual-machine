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
const Repository = require('bali-document-repository');
const storage = Repository.test(notary, directory, debug);
const repository = Repository.repository(notary, storage, debug);
const compiler = require('bali-type-compiler').api(debug);
const vm = require('../index').api(repository, debug);
const EOL = '\n';  // POSIX end of line character
const TASK_BAG = '/bali/vm/tasks/v1';
const EVENT_BAG = '/bali/vm/events/v1';
const MESSAGE_BAG = '/bali/vm/messages/v1';

const getInstruction = function(processor) {
    const instruction = processor.getContext().getInstruction();
    return compiler.string(instruction).split(' ').slice(0, 2).join(' ');
};

describe('Bali Virtual Machine™', function() {

    describe('Initialize the environment', function() {

        it('should generate the notary key and publish its certificate', async function() {
            const publicKey = await notary.generateKey();
            const certificate = await notary.notarizeDocument(publicKey);
            const citation = await notary.activateKey(certificate);
            expect(citation.isEqualTo(await storage.writeContract(certificate))).is.true;
        });

        it('should create the task bag in the repository', async function() {
            const taskBag = await notary.notarizeDocument(bali.catalog({
                $description: '"This is the task bag for the VM."'
            }, {
                $type: '/bali/collections/Bag/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/public/v1',
                $previous: bali.pattern.NONE
            }));
            const bagCitation = await storage.writeContract(taskBag);
            await storage.writeName(TASK_BAG, bagCitation);
        });

        it('should create the event bag in the repository', async function() {
            const eventBag = await notary.notarizeDocument(bali.catalog({
                $description: '"This is the event bag for the VM."'
            }, {
                $type: '/bali/collections/Bag/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/public/v1',
                $previous: bali.pattern.NONE
            }));
            const bagCitation = await storage.writeContract(eventBag);
            await storage.writeName(EVENT_BAG, bagCitation);
        });

        it('should create the message bag in the repository', async function() {
            const messageBag = await notary.notarizeDocument(bali.catalog({
                $description: '"This is the message bag for the VM."'
            }, {
                $type: '/bali/collections/Bag/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/public/v1',
                $previous: bali.pattern.NONE
            }));
            const bagCitation = await storage.writeContract(messageBag);
            await storage.writeName(MESSAGE_BAG, bagCitation);
        });

    });

    describe('Test all VM instructions', function() {

        it('should compile example type documents into compiled type documents', async function() {
            const testFolder = 'test/examples/';
            const files = await pfs.readdir(testFolder);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (!file.endsWith('.bali')) continue;

                // compile the type
                console.log('      ' + file);
                const prefix = file.split('.').slice(0, 1);
                const typeFile = testFolder + prefix + '.bali';
                var source = await pfs.readFile(typeFile, 'utf8');
                const type = bali.component(source, debug);
                expect(type).to.exist;
                compiler.compileType(type);

                // check for differences
                source = type.toString() + '\n';  // POSIX compliant <EOL>
                await pfs.writeFile(typeFile, source, 'utf8');
                const expected = await pfs.readFile(typeFile, 'utf8');
                expect(expected).to.exist;
                expect(source).to.equal(expected);

                // publish the type in the repository
                var name = '/bali/types/' + prefix + '/v1';
                await repository.commitDocument(name, type);

                // publish an instance of the type in the repository
                name = '/bali/instances/' + prefix + '/v1';
                const instance = bali.instance(name, {});
                await repository.commitDocument(name, instance);
            }
        });

        it('should cause the VM to step through the control test "good" route successfully', async function() {
            const tokens = bali.number(100);
            const target = await repository.retrieveContract('/bali/instances/Test/v1');
            const message = bali.symbol('test1');
            const args = bali.list(['"good"']);
            const processor = vm.processor();
            expect(processor).to.exist;
            await processor.newTask(account, tokens, target, message, args);
//          1.EvaluateStatement:
//          PUSH HANDLER 1.EvaluateStatementHandler
            expect(getInstruction(processor)).to.equal('PUSH HANDLER');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getContext().hasHandlers()).to.equal(true);
//          PUSH ARGUMENT $target
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $list
            expect(getInstruction(processor)).to.equal('CALL $list');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH ARGUMENT $argument
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $addItem WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $addItem');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SEND $test3 TO COMPONENT WITH ARGUMENTS
            expect(getInstruction(processor)).to.equal('SEND 2');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().hasContexts()).to.equal(true);
//              1.ThrowStatement:
//              PUSH ARGUMENT $text
                expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PULL EXCEPTION
                expect(getInstruction(processor)).to.equal('PULL EXCEPTION');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
                expect(processor.getTask().hasContexts()).to.equal(false);
//          1.EvaluateStatementHandler:
//          SAVE VARIABLE $exception
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.1.HandleBlock:
//          LOAD VARIABLE $exception
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `"good"`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $doesMatch WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $doesMatch');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          JUMP TO 1.2.HandleBlock ON FALSE
            expect(getInstruction(processor)).to.equal('JUMP TO');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.1.1.EvaluateStatement:
//          PUSH CONSTANT $document
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SEND $test2 TO DOCUMENT
            expect(getInstruction(processor)).to.equal('SEND 1');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $result-1
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.1.2.ReturnStatement:
//          PUSH CONSTANT $good
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PULL RESULT
            expect(getInstruction(processor)).to.equal('PULL RESULT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().getState().toString()).to.equal('$completed');
            expect(await processor.stepClock()).to.equal(false);
        });

        it('should cause the VM to step through the control test "bad" route successfully', async function() {
            const tokens = bali.number(100);
            const target = await repository.retrieveContract('/bali/instances/Test/v1');
            const message = bali.symbol('test1');
            const args = bali.list(['"bad"']);
            const processor = vm.processor();
            expect(processor).to.exist;
            await processor.newTask(account, tokens, target, message, args);
//          1.EvaluateStatement:
//          PUSH HANDLER 1.EvaluateStatementHandler
            expect(getInstruction(processor)).to.equal('PUSH HANDLER');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getContext().hasHandlers()).to.equal(true);
//          PUSH ARGUMENT $target
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $list
            expect(getInstruction(processor)).to.equal('CALL $list');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH ARGUMENT $argument
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $addItem WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $addItem');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SEND $test3 TO COMPONENT WITH ARGUMENTS
            expect(getInstruction(processor)).to.equal('SEND 2');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().hasContexts()).to.equal(true);
//              1.ThrowStatement:
//              PUSH ARGUMENT $text
                expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PULL EXCEPTION
                expect(getInstruction(processor)).to.equal('PULL EXCEPTION');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
                expect(processor.getTask().hasContexts()).to.equal(false);
//          1.EvaluateStatementHandler:
//          SAVE VARIABLE $exception
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.1.HandleBlock:
//          LOAD VARIABLE $exception
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `"good"`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $doesMatch WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $doesMatch');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          JUMP TO 1.2.HandleBlock ON FALSE
            expect(getInstruction(processor)).to.equal('JUMP TO');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.2.HandleBlock:
//          LOAD VARIABLE $exception
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `"bad"`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $doesMatch WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $doesMatch');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          JUMP TO 1.EvaluateStatementFailed ON FALSE
            expect(getInstruction(processor)).to.equal('JUMP TO');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.2.1.EvaluateStatement:
//          PUSH ARGUMENT $target
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SEND $test2 TO COMPONENT
            expect(getInstruction(processor)).to.equal('SEND 1');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().hasContexts()).to.equal(true);
//              1.ReturnStatement:
//              PUSH LITERAL `none`
                expect(getInstruction(processor)).to.equal('PUSH LITERAL');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              CALL $catalog
                expect(getInstruction(processor)).to.equal('CALL $catalog');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PUSH LITERAL `$type`
                expect(getInstruction(processor)).to.equal('PUSH LITERAL');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PUSH LITERAL `/bali/collections/Set/v1`
                expect(getInstruction(processor)).to.equal('PUSH LITERAL');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              CALL $setValue WITH 3 ARGUMENTS
                expect(getInstruction(processor)).to.equal('CALL $setValue');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              CALL $set WITH 2 ARGUMENTS
                expect(getInstruction(processor)).to.equal('CALL $set');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PUSH LITERAL `"alpha"`
                expect(getInstruction(processor)).to.equal('PUSH LITERAL');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              CALL $addItem WITH 2 ARGUMENTS
                expect(getInstruction(processor)).to.equal('CALL $addItem');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PULL RESULT
                expect(getInstruction(processor)).to.equal('PULL RESULT');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
                expect(processor.getTask().hasContexts()).to.equal(false);
//          SAVE VARIABLE $result-1
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.2.HandleBlockDone:
//          JUMP TO 1.EvaluateStatementSucceeded
            expect(getInstruction(processor)).to.equal('JUMP TO');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.EvaluateStatementSucceeded:
//          SKIP INSTRUCTION
            expect(getInstruction(processor)).to.equal('SKIP INSTRUCTION');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);

//          2.EvaluateStatement:
//          PUSH CONSTANT $document
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $list
            expect(getInstruction(processor)).to.equal('CALL $list');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH ARGUMENT $argument
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $addItem WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $addItem');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SEND $test3 TO DOCUMENT WITH ARGUMENTS
            expect(getInstruction(processor)).to.equal('SEND 2');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $result-1
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);

//          3.ReturnStatement:
//          PUSH CONSTANT $good
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $not WITH 1 ARGUMENT
            expect(getInstruction(processor)).to.equal('CALL $not');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PULL RESULT
            expect(getInstruction(processor)).to.equal('PULL RESULT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().getState().toString()).to.equal('$completed');
            expect(await processor.stepClock()).to.equal(false);
        });

        it('should cause the VM to step through the control test "ugly" route successfully', async function() {
            const tokens = bali.number(100);
            const target = await repository.retrieveContract('/bali/instances/Test/v1');
            const message = bali.symbol('test1');
            const args = bali.list([]);
            const processor = vm.processor();
            expect(processor).to.exist;
            await processor.newTask(account, tokens, target, message, args);
//          1.EvaluateStatement:
//          PUSH HANDLER 1.EvaluateStatementHandler
            expect(getInstruction(processor)).to.equal('PUSH HANDLER');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getContext().hasHandlers()).to.equal(true);
//          PUSH ARGUMENT $target
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $list
            expect(getInstruction(processor)).to.equal('CALL $list');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH ARGUMENT $argument
            expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $addItem WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $addItem');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SEND $test3 TO COMPONENT WITH ARGUMENTS
            expect(getInstruction(processor)).to.equal('SEND 2');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().hasContexts()).to.equal(true);
//              1.ThrowStatement:
//              PUSH ARGUMENT $text
                expect(getInstruction(processor)).to.equal('PUSH ARGUMENT');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
//              PULL EXCEPTION
                expect(getInstruction(processor)).to.equal('PULL EXCEPTION');
                expect(await processor.stepClock()).to.equal(true);
                expect(processor.getTask().hasComponents()).to.equal(true);
                expect(processor.getTask().hasContexts()).to.equal(false);
//          1.EvaluateStatementHandler:
//          SAVE VARIABLE $exception
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.1.HandleBlock:
//          LOAD VARIABLE $exception
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `"good"`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $doesMatch WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $doesMatch');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          JUMP TO 1.2.HandleBlock ON FALSE
            expect(getInstruction(processor)).to.equal('JUMP TO');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.2.HandleBlock:
//          LOAD VARIABLE $exception
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `"bad"`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $doesMatch WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $doesMatch');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          JUMP TO 1.EvaluateStatementFailed ON FALSE
            expect(getInstruction(processor)).to.equal('JUMP TO');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          1.EvaluateStatementFailed:
//          LOAD VARIABLE $exception
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PULL EXCEPTION
            expect(getInstruction(processor)).to.equal('PULL EXCEPTION');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().getState().toString()).to.equal('$abandoned');
            expect(await processor.stepClock()).to.equal(false);
        });

        it('should cause the VM to step through the document management test successfully', async function() {
            const tokens = bali.number(100);
            const target = await repository.retrieveContract('/bali/instances/Test/v1');
            const message = bali.symbol('test4');
            const args = bali.list([]);
            const processor = vm.processor();
            expect(processor).to.exist;
            await processor.newTask(account, tokens, target, message, args);
//          1.CheckoutStatement:
//          ---- Save the name of the document.
//          PUSH CONSTANT $firstVersion
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $name-2
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Load a draft copy of the named document from the repository.
//          LOAD DOCUMENT $name-2
            expect(getInstruction(processor)).to.equal('LOAD DOCUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $duplicate WITH 1 ARGUMENT
            expect(getInstruction(processor)).to.equal('CALL $duplicate');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $draft-3
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Calculate the new version string for the draft and save it.
//          LOAD VARIABLE $draft-3
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `$version`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $parameter WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $parameter');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `0`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $nextVersion WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $nextVersion');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $version-4
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Set the new version string parameter for the draft document.
//          LOAD VARIABLE $draft-3
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `$version`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          LOAD VARIABLE $version-4
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $setParameter WITH 3 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $setParameter');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PULL COMPONENT
            expect(getInstruction(processor)).to.equal('PULL COMPONENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Set the new draft document as the value of the recipient.
//          LOAD VARIABLE $draft-3
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $draft
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//
//          2.CommitStatement:
//          ---- Save the name of the document.
//          PUSH CONSTANT $secondVersion
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $name-5
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Commit the named document to the repository.
//          LOAD VARIABLE $draft
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE DOCUMENT $name-5
            expect(getInstruction(processor)).to.equal('SAVE DOCUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//
//          3.CheckoutStatement:
//          ---- Save the name of the document.
//          PUSH CONSTANT $secondVersion
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $name-6
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Load a draft copy of the named document from the repository.
//          LOAD DOCUMENT $name-6
            expect(getInstruction(processor)).to.equal('LOAD DOCUMENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $duplicate WITH 1 ARGUMENT
            expect(getInstruction(processor)).to.equal('CALL $duplicate');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $draft-7
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Calculate the new version string for the draft and save it.
//          LOAD VARIABLE $draft-7
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `$version`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $parameter WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $parameter');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `2`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $nextVersion WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $nextVersion');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $version-8
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Set the new version string parameter for the draft document.
//          LOAD VARIABLE $draft-7
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `$version`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          LOAD VARIABLE $version-8
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $setParameter WITH 3 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $setParameter');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PULL COMPONENT
            expect(getInstruction(processor)).to.equal('PULL COMPONENT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Set the new draft document as the value of the recipient.
//          LOAD VARIABLE $draft-7
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $draft
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//
//          4.SaveStatement:
//          ---- Save the draft document.
//          LOAD VARIABLE $draft
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE DRAFT $citation-9
            expect(getInstruction(processor)).to.equal('SAVE DRAFT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          LOAD VARIABLE $citation-9
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $citation
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//
//          5.DiscardStatement:
//          ---- Save the citation to the draft document.
//          LOAD VARIABLE $citation
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $citation-10
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Drop the cited draft document from the repository.
//          DROP DRAFT $citation-10
            expect(getInstruction(processor)).to.equal('DROP DRAFT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//
//          6.PublishStatement:
//          ---- Save the name of the global event bag.
//          PUSH LITERAL `/bali/vm/events/v1`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $bag-11
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Publish an event to the global event bag.
//          PUSH CONSTANT $event
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE MESSAGE $bag-11
            expect(getInstruction(processor)).to.equal('SAVE MESSAGE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//
//          7.PostStatement:
//          ---- Save the name of the message bag.
//          PUSH CONSTANT $bag
            expect(getInstruction(processor)).to.equal('PUSH CONSTANT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE VARIABLE $bag-12
            expect(getInstruction(processor)).to.equal('SAVE VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          ---- Post a message to the named message bag.
//          CALL $catalog
            expect(getInstruction(processor)).to.equal('CALL $catalog');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          ---- Add an item to the catalog.
//          PUSH LITERAL `$text`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PUSH LITERAL `"This is a message..."`
            expect(getInstruction(processor)).to.equal('PUSH LITERAL');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $association WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $association');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          CALL $addItem WITH 2 ARGUMENTS
            expect(getInstruction(processor)).to.equal('CALL $addItem');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          SAVE MESSAGE $bag-12
            expect(getInstruction(processor)).to.equal('SAVE MESSAGE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
//          LOAD VARIABLE $result-1
            expect(getInstruction(processor)).to.equal('LOAD VARIABLE');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(true);
//          PULL RESULT
            expect(getInstruction(processor)).to.equal('PULL RESULT');
            expect(await processor.stepClock()).to.equal(true);
            expect(processor.getTask().hasComponents()).to.equal(false);
            expect(processor.getTask().getState().toString()).to.equal('$completed');
            expect(await processor.stepClock()).to.equal(false);
        });

    });

});
