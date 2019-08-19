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
const securityModule = require('bali-digital-notary').ssm(directory + account, debug);
const notary = require('bali-digital-notary').api(securityModule, account, directory, debug);
const repository = require('bali-document-repository').local(directory, debug);
const compiler = require('bali-procedure-compiler').api(debug);
const vm = require('../index').api(repository, compiler, debug);

const EOL = '\n';  // POSIX end of line character

const TASK_TEMPLATE =
        '[\n' +
        '    $tag: #Y29YH82BHG4SPTGWGFRYBL4RQ33GTX59\n' +
        '    $account: ' + account + '\n' +
        '    $balance: 1000\n' +
        '    $status: $active\n' +
        '    $clock: 0\n' +
        '    $stack: []($type: /bali/collections/Stack/v1)\n' +
        '    $contexts: [\n' +
        '        [\n' +
        '            $type: none\n' +
        '            $name: $dummy\n' +
        '            $instruction: 0\n' +
        '            $address: 1\n' +
        '            $bytecode: %bytecode\n' +
        '            $literals: %literals\n' +
        '            $constants: %constants\n' +
        '            $parameters: %parameters\n' +
        '            $variables: %variables\n' +
        '            $procedures: %procedures\n' +
        '            $handlers: []($type: /bali/collections/Stack/v1)\n' +
        '        ]\n' +
        '    ]($type: /bali/collections/Stack/v1)\n' +
        ']';

const DOCUMENT = '[$foo: "bar"](\n' +
        '    $tag: #B11TDWH3C5F8J8Q87XKRAD8BM7L5VYSS\n' +
        '    $version: v1\n' +
        '    $permissions: /bali/permissions/public/v1\n' +
        '    $previous: none\n' +
        ')';

const MESSAGE = '[$foo: "bar"]';

function loadTask(filename) {
    var source = fs.readFileSync(filename, 'utf8');
    var instructions = compiler.parse(source);
    instructions = compiler.format(instructions, 1);

    // create the compiled type context
    var literals = bali.list([
        'true',
        'none',
        '"none"?',
        'false',
        '"five"',
        '"parameter"',
        '"parameter1"',
        '"parameter2"',
        '"two"',
        1,
        3,
        5,
        '$protocol',
        'v1',
        '$tag',
        '#M8G7XJH640RR4YBCLGNDYABD6328741S',
        '$version',
        '$digest',
        "'NS4L6V78FNSHYY3F6LK82MMB8GFRR6FD9H3FY5G8W6C6PFHBMVR1S2SPQNHQ8WPZY155Q1F1Y02GVGLZKR37VK2QZ85SW4LGRQA53P0'",
        '$type',
        '$foo',
        '"bar"',
        bali.parse('{return prefix + name}')
    ]);
    const constants = bali.catalog({$constant: 5});
    const type = bali.catalog();
    type.setValue('$literals', literals);
    type.setValue('$constants', constants);


    // create the compiled procedure context
    var parameters = bali.list(['$y', '$x']);
    var variables = bali.list(['$citation', '$foo', '$queue', '$target', '$type']);
    const procedures = bali.list(['$function1', '$function2', '$message1', '$message2']);
    const addresses = bali.catalog();
    addresses.setValue('"3.PushLiteral"', 3);
    addresses.setValue('"1.3.ConditionClause"', 8);
    addresses.setValue('"1.4.ConditionClause"', 11);
    addresses.setValue('"1.6.ConditionClause"', 17);
    addresses.setValue('"1.IfStatementDone"', 20);
    const procedure = bali.catalog();
    procedure.setValue('$parameters', parameters);
    procedure.setValue('$variables', variables);
    procedure.setValue('$procedures', procedures);
    procedure.setValue('$addresses', addresses);
    procedure.setValue('$instructions', '"' + EOL + instructions + EOL + '"');

    // assemble the procedure into bytecode
    compiler.assemble(type, procedure);

    // retrieve the bytecode
    const bytecode = procedure.getValue('$bytecode');

    // set parameter values
    const iterator = parameters.getIterator();
    parameters = bali.catalog();
    while (iterator.hasNext()) {
        var parameter = iterator.getNext();
        parameters.setValue(parameter, bali.NONE);
    }
    parameters.setValue('$x', bali.parse(DOCUMENT));

    // set variable values
    variables = bali.catalog();
    variables.setValue('$citation', bali.NONE);
    variables.setValue('$foo', bali.NONE);
    variables.setValue('$queue', bali.tag());
    variables.setValue('$target', bali.NONE);
    variables.setValue('$type', bali.NONE);

    // construct the task context
    source = TASK_TEMPLATE;
    source = source.replace(/%bytecode/, bali.format(bytecode, 3));
    source = source.replace(/%literals/, bali.format(literals, 3));
    source = source.replace(/%constants/, bali.format(constants, 3));
    source = source.replace(/%parameters/, bali.format(parameters, 3));
    source = source.replace(/%variables/, bali.format(variables, 3));
    source = source.replace(/%procedures/, bali.format(procedures, 3));
    const task = bali.parse(source);

    return task;
}


describe('Bali Virtual Machine™', function() {
    var task;

    describe('Initialize the environment', function() {

        it('should initialize the nebula API', async function() {
            const certificate = await notary.generateKey();
            const parameters = certificate.getValue('$component').getParameters();
            const certificateId = '' + parameters.getParameter('$tag').getValue() + parameters.getParameter('$version');
            await repository.createDocument(certificateId, certificate);
        });

    });

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
            expect(processor.task.stack.getTop().isEqualTo(bali.NONE)).to.equal(true);
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
            expect(processor.task.stack.getTop().isEqualTo(bali.NONE)).to.equal(true);
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
            await processor.step();
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

});
