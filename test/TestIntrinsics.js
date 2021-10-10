/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = 0;
const mocha = require('mocha');
const expect = require('chai').expect;
const bali = require('bali-component-framework').api(debug);
const intrinsics = require('../src/Intrinsics').api(debug);
const generator = bali.generator();
const code = bali.node('/bali/trees/Code');
const angle = bali.angle.PI;
const binary = bali.binary(generator.generateBytes(10));
const complex = bali.component('(3, 4i)');
const duration = bali.component('~P1W');
const indentation = bali.number(4);
const moment = bali.moment();
const name = bali.name(['bali', 'collections', 'Set', 'v1']);
const number = bali.number(0.5);
const tag = bali.tag();
const zero = bali.number(0);
const two = bali.number(2);
const probability = bali.probability(0.5);
const resource = bali.resource('https://google.com/advertizing?foo=bar#home');
const text = bali.text('This is text...');
const source = bali.text('/bali/collections/List');
const association = bali.association('$key', '"value"');
const catalog = bali.catalog({$a: 'a', $b: 'b', $c: 'c', $d: 'd', $e: 'e'});
const list = bali.list([1, 2, 3]);
const percentage = bali.percentage(25);
const queue = bali.queue([2,4,6,8,10,12]);
const range = bali.range(1, '..<', 4);
const set = bali.set([2,4,6,8,10,12]);
const stack = bali.stack([2,4,6,8,10,12]);
const symbol = bali.component('$type');
const node = bali.node('/bali/trees/Node');
const type = bali.component('/bali/collections/Set');
const version = bali.version([1, 2, 3, 4]);
const next = bali.version([1, 2, 4]);
const iterator = list.getIterator();
const comparator = bali.comparator();
const sorter = bali.sorter(comparator);
const procedure = bali.procedure(code, {$foo: 'bar'});
const array = [];
const object = {};
const document = bali.catalog({
    $foo: 'bar'
}, {
    $type: '/nebula/examples/Type/v1',
    $tag: '#8QP2XF6AXHTQJQJWH0BPR79KWM37XD8C',
    $version: 'v1',
    $permissions: '/nebula/permissions/public/v1',
    $previous: 'none'
});
const digest = bali.component("'SG6HC8SJP4NZQ2WVAQD4BS8D8Z0BWK6Y5KSNQT6TAYJ43Y5ZGTJZPBRKCFTHA0KGLQZ0NFJK1ADTXKKX6QT91DNVKZ7FWG0CHPCCDPR'");
const dirtyType = bali.catalog({
    $operations: bali.catalog({
        $dummy: bali.catalog({
            $type: '/bali/examples/Dummy'
        })
    }),
    $methods: bali.catalog({
        $dummy: bali.catalog({
            $procedure: bali.component('{\n    none\n}'),
            $instructions: bali.component('"\n' +
                '    1.EvaluateStatement:\n' +
                '    PUSH LITERAL `none`\n' +
                '    SAVE VARIABLE $result-1\n' +
                '    LOAD VARIABLE $result-1\n' +
                '    PULL RESULT\n' +
                '"($mediaType: "application/basm")'
            ),
            $addresses: bali.catalog({
                '1.EvaluateStatement': 1
            }),
            $bytecode: bali.component("'2801800160015000'(\n" +
                '    $encoding: $base16\n' +
                '    $mediaType: "application/bcod"\n' +
                ')'),
            $arguments: bali.list(['$target']),
            $variables: bali.set(['$result-1']),
            $messages: bali.set()
        })
    }),
    $literals: bali.set(['none'])
});
const cleanType = bali.catalog({
    $operations: bali.catalog({
        $dummy: bali.catalog({
            $type: '/bali/examples/Dummy'
        })
    }),
    $methods: bali.catalog({
        $dummy: bali.catalog({
            $procedure: bali.component('{\n    none\n}')
        })
    })
});

describe('Bali Intrinsic Functions', function() {

    describe('Test each intrinsic function', function() {

        it('should fail to invoke invalid intrinsic functions', function() {
            expect(
                function() {
                    const index = intrinsics.index('$foobar');
                    intrinsics.invoke(index, 1, 2, 3);
                }
            ).to.throw();
            expect(
                function() {
                    const index = intrinsics.index('$invalid');
                    intrinsics.invoke(index, 1, 2, 3);
                }
            ).to.throw();
        });

        it('should invoke $addItem intrinsic function', function() {
            const index = intrinsics.index('$addItem');
            intrinsics.invoke(index, catalog, association);
            intrinsics.invoke(index, list, angle);
            intrinsics.invoke(index, set, number);
            intrinsics.invoke(index, queue, text);
            intrinsics.invoke(index, stack, symbol);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, '$foo');
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, array, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, object, association);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, range, 6);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, association, 6);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 'foobar', 6);
                }
            ).to.throw();
        });

        it('should invoke $ancestry intrinsic function', function() {
            const index = intrinsics.index('$ancestry');
            intrinsics.invoke(index, angle);
            intrinsics.invoke(index, association);
            intrinsics.invoke(index, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 6);
                }
            ).to.throw();
        });

        it('should invoke $and intrinsic function', function() {
            const index = intrinsics.index('$and');
            intrinsics.invoke(index, binary, binary);
            intrinsics.invoke(index, probability, probability);
            intrinsics.invoke(index, set, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set, association);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set, probability);
                }
            ).to.throw();
        });

        it('should invoke $arccosine intrinsic function', function() {
            const index = intrinsics.index('$arccosine');
            intrinsics.invoke(index, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
        });

        it('should invoke $arcsine intrinsic function', function() {
            const index = intrinsics.index('$arcsine');
            intrinsics.invoke(index, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $arctangent intrinsic function', function() {
            const index = intrinsics.index('$arctangent');
            intrinsics.invoke(index, number, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, list);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, angle);
                }
            ).to.throw();
        });

        it('should invoke $areEqual intrinsic function', function() {
            const index = intrinsics.index('$areEqual');
            intrinsics.invoke(index, angle, angle);
            intrinsics.invoke(index, angle, number);
            intrinsics.invoke(index, list, set);
            intrinsics.invoke(index, catalog, association);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 5, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle, 0);
                }
            ).to.throw();
        });

        it('should invoke $areSame intrinsic function', function() {
            const index = intrinsics.index('$areSame');
            intrinsics.invoke(index, probability, probability);
            intrinsics.invoke(index, angle, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, two, 2);
                }
            ).to.throw();
        });

        it('should invoke $association intrinsic function', function() {
            const index = intrinsics.index('$association');
            intrinsics.invoke(index, number, list);
            intrinsics.invoke(index, symbol, text);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, symbol);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, symbol, 5);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 'foo', number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, probability);
                }
            ).to.throw();
        });

        it('should invoke $attribute intrinsic function', function() {
            const index = intrinsics.index('$attribute');
            const list = bali.list([1, 2, 3]);
            intrinsics.invoke(index, list, two);
            intrinsics.invoke(index, catalog, symbol);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, 5);
                }
            ).to.throw();
        });

        it('should invoke $authority intrinsic function', function() {
            const index = intrinsics.index('$authority');
            intrinsics.invoke(index, resource);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
        });

        it('should invoke $base02 intrinsic function', function() {
            const index = intrinsics.index('$base02');
            intrinsics.invoke(index, binary);
            intrinsics.invoke(index, binary, indentation);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, binary, 4);
                }
            ).to.throw();
        });

        it('should invoke $base16 intrinsic function', function() {
            const index = intrinsics.index('$base16');
            intrinsics.invoke(index, binary);
            intrinsics.invoke(index, binary, indentation);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, binary, 4);
                }
            ).to.throw();
        });

        it('should invoke $base32 intrinsic function', function() {
            const index = intrinsics.index('$base32');
            intrinsics.invoke(index, binary);
            intrinsics.invoke(index, binary, indentation);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, binary, 4);
                }
            ).to.throw();
        });

        it('should invoke $base64 intrinsic function', function() {
            const index = intrinsics.index('$base64');
            intrinsics.invoke(index, binary);
            intrinsics.invoke(index, binary, indentation);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, binary, 4);
                }
            ).to.throw();
        });

        it('should invoke $binary intrinsic function', function() {
            const index = intrinsics.index('$binary');
            intrinsics.invoke(index, two);
            intrinsics.invoke(index, two, bali.catalog({$encoding: '$base16'}));
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 10);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, two, {$encoding: '$base16'});
                }
            ).to.throw();
        });

        it('should invoke $boolean intrinsic function', function() {
            const index = intrinsics.index('$boolean');
            intrinsics.invoke(index, angle);
            intrinsics.invoke(index, number);
            intrinsics.invoke(index, association);
            intrinsics.invoke(index, list);
            intrinsics.invoke(index, range);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, false);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, [1, 2, 3]);
                }
            ).to.throw();
        });

        it('should invoke $bytes intrinsic function', function() {
            const index = intrinsics.index('$bytes');
            intrinsics.invoke(index, tag);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, binary);
                }
            ).to.throw();
        });

        it('should invoke $catalog intrinsic function', function() {
            const index = intrinsics.index('$catalog');
            intrinsics.invoke(index);
            intrinsics.invoke(index, bali.catalog({$type: '/bali/notary/Document'}));
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, type);
                }
            ).to.throw();
        });

        it('should invoke $chain intrinsic function', function() {
            const index = intrinsics.index('$chain');
            intrinsics.invoke(index, list, list);
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, catalog);
                }
            ).to.throw();
        });

        it('should invoke $citation intrinsic function', function() {
            const index = intrinsics.index('$citation');
            const citation = intrinsics.invoke(index, document);
            expect(bali.areEqual(digest, citation.getAttribute('$digest'))).to.equal(true);
        });

        it('should invoke $code intrinsic function', function() {
            const index = intrinsics.index('$code');
            intrinsics.invoke(index, procedure);
            intrinsics.invoke(index, procedure, bali.catalog({$foo: 'bar'}));
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $coinToss intrinsic function', function() {
            const index = intrinsics.index('$coinToss');
            intrinsics.invoke(index, probability);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 0.5);
                }
            ).to.throw();
        });

        it('should invoke $comparator intrinsic function', function() {
            const index = intrinsics.index('$comparator');
            expect(bali.areEqual(intrinsics.invoke(index), comparator)).to.equal(true);
        });

        it('should invoke $complement intrinsic function', function() {
            const index = intrinsics.index('$complement');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 0);
                }
            ).to.throw();
        });

        it('should invoke $component intrinsic function', function() {
            const index = intrinsics.index('$component');
            intrinsics.invoke(index, source);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, '/bali/collections/List');
                }
            ).to.throw();
        });

        it('should invoke $conjugate intrinsic function', function() {
            const index = intrinsics.index('$conjugate');
            intrinsics.invoke(index, complex);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
        });

        it('should invoke $connector intrinsic function', function() {
            const index = intrinsics.index('$connector');
            intrinsics.invoke(index, range);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $cosine intrinsic function', function() {
            const index = intrinsics.index('$cosine');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 0);
                }
            ).to.throw();
        });

        it('should invoke $day intrinsic function', function() {
            const index = intrinsics.index('$day');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $days intrinsic function', function() {
            const index = intrinsics.index('$days');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $default intrinsic function', function() {
            const index = intrinsics.index('$default');
            intrinsics.invoke(index, number, number);
            intrinsics.invoke(index, bali.pattern.NONE, angle);
            intrinsics.invoke(index, bali.pattern.NONE, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, undefined, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.pattern.NONE, 5);
                }
            ).to.throw();
        });

        it('should invoke $degrees intrinsic function', function() {
            const index = intrinsics.index('$degrees');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 0);
                }
            ).to.throw();
        });

        it('should invoke $difference intrinsic function', function() {
            const index = intrinsics.index('$difference');
            intrinsics.invoke(index, angle, angle);
            intrinsics.invoke(index, duration, duration);
            intrinsics.invoke(index, number, number);
            intrinsics.invoke(index, percentage, percentage);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, list);
                }
            ).to.throw();
        });

        it('should invoke $document intrinsic function', function() {
            const index = intrinsics.index('$document');
            intrinsics.invoke(index, number);
            intrinsics.invoke(index, text);
            intrinsics.invoke(index, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, '/bali/collections/List');
                }
            ).to.throw();
        });

        it('should invoke $doesMatch intrinsic function', function() {
            const index = intrinsics.index('$doesMatch');
            intrinsics.invoke(index, probability, bali.pattern.ANY);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 2, bali.pattern.ANY);
                }
            ).to.throw();
        });

        it('should invoke $duplicate intrinsic function', function() {
            const index = intrinsics.index('$duplicate');
            intrinsics.invoke(index, number);
            intrinsics.invoke(index, text);
            intrinsics.invoke(index, association);
            intrinsics.invoke(index, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, [1, 2, 3]);
                }
            ).to.throw();
        });

        it('should invoke $duration intrinsic function', function() {
            const index = intrinsics.index('$duration');
            intrinsics.invoke(index, moment, moment);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment, duration);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, duration, duration);
                }
            ).to.throw();
        });

        it('should invoke $earlier intrinsic function', function() {
            const index = intrinsics.index('$earlier');
            intrinsics.invoke(index, moment, duration);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment, moment);
                }
            ).to.throw();
        });

        it('should invoke $effective intrinsic function', function() {
            const index = intrinsics.index('$effective');
            intrinsics.invoke(index, range);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
        });

        it('should invoke $exponential intrinsic function', function() {
            const index = intrinsics.index('$exponential');
            intrinsics.invoke(index, number, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, 5);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 3, number);
                }
            ).to.throw();
        });

        it('should invoke $factorial intrinsic function', function() {
            const index = intrinsics.index('$factorial');
            intrinsics.invoke(index, two);
            intrinsics.invoke(index, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 5);
                }
            ).to.throw();
        });

        it('should invoke $first intrinsic function', function() {
            const index = intrinsics.index('$first');
            intrinsics.invoke(index, range);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $format intrinsic function', function() {
            const index = intrinsics.index('$format');
            intrinsics.invoke(index, moment);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, duration);
                }
            ).to.throw();
        });

        it('should invoke $fragment intrinsic function', function() {
            const index = intrinsics.index('$fragment');
            intrinsics.invoke(index, resource);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 'https://google.com#home');
                }
            ).to.throw();
        });

        it('should invoke $hash intrinsic function', function() {
            const index = intrinsics.index('$hash');
            intrinsics.invoke(index, probability);
            intrinsics.invoke(index, catalog);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 5);
                }
            ).to.throw();
        });

        it('should invoke $hasNext intrinsic function', function() {
            const index = intrinsics.index('$hasNext');
            intrinsics.invoke(index, iterator);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $hasPrevious intrinsic function', function() {
            const index = intrinsics.index('$hasPrevious');
            intrinsics.invoke(index, iterator);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $head intrinsic function', function() {
            const index = intrinsics.index('$head');
            intrinsics.invoke(index, queue);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, stack);
                }
            ).to.throw();
        });

        it('should invoke $hour intrinsic function', function() {
            const index = intrinsics.index('$hour');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $hours intrinsic function', function() {
            const index = intrinsics.index('$hours');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $html intrinsic function', function() {
            const index = intrinsics.index('$html');
            intrinsics.invoke(index, catalog, text, resource);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, type);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 'This is a document');
                }
            ).to.throw();
        });

        it('should invoke $imaginary intrinsic function', function() {
            const index = intrinsics.index('$imaginary');
            intrinsics.invoke(index, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
        });

        it('should invoke $insertItem intrinsic function', function() {
            const index = intrinsics.index('$insertItem');
            intrinsics.invoke(index, list, two, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, two, 5);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, 2, symbol);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, two, association);
                }
            ).to.throw();
        });

        it('should invoke $integer intrinsic function', function() {
            const index = intrinsics.index('$integer');
            intrinsics.invoke(index, number);
            intrinsics.invoke(index, probability);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, percentage);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, duration);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set);
                }
            ).to.throw();
        });

        it('should invoke $interfaces intrinsic function', function() {
            const index = intrinsics.index('$interfaces');
            intrinsics.invoke(index, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 5);
                }
            ).to.throw();
        });

        it('should invoke $inverse intrinsic function', function() {
            const index = intrinsics.index('$inverse');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $isEnumerable intrinsic function', function() {
            const index = intrinsics.index('$isEnumerable');
            intrinsics.invoke(index, range);
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $isLess intrinsic function', function() {
            const index = intrinsics.index('$isLess');
            intrinsics.invoke(index, zero, two);
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $isMore intrinsic function', function() {
            const index = intrinsics.index('$isMore');
            intrinsics.invoke(index, zero, two);
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $item intrinsic function', function() {
            const index = intrinsics.index('$item');
            intrinsics.invoke(index, binary, two);
            intrinsics.invoke(index, name, two);
            intrinsics.invoke(index, symbol, two);
            intrinsics.invoke(index, text, two);
            intrinsics.invoke(index, version, two);
            intrinsics.invoke(index, catalog, two);
            intrinsics.invoke(index, list, two);
            intrinsics.invoke(index, set, two);
            expect(
                function() {
                    intrinsics.invoke(index, queue, two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, stack, two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, 5);
                }
            ).to.throw();
        });

        it('should invoke $iterator intrinsic function', function() {
            var index = intrinsics.index('$iterator');
            var iterator = intrinsics.invoke(index, binary);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, name);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, range);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, symbol);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, text);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, version);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, catalog);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, list);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, queue);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, set);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            iterator = intrinsics.invoke(index, stack);
            index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);

            index = intrinsics.index('$iterator');
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $key intrinsic function', function() {
            const index = intrinsics.index('$key');
            intrinsics.invoke(index, association);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog);
                }
            ).to.throw();
        });

        it('should invoke $keys intrinsic function', function() {
            const index = intrinsics.index('$keys');
            intrinsics.invoke(index, catalog);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $last intrinsic function', function() {
            const index = intrinsics.index('$last');
            intrinsics.invoke(index, range);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, stack);
                }
            ).to.throw();
        });

        it('should invoke $later intrinsic function', function() {
            const index = intrinsics.index('$later');
            intrinsics.invoke(index, moment, duration);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, duration, duration);
                }
            ).to.throw();
        });

        it('should invoke $levels intrinsic function', function() {
            const index = intrinsics.index('$levels');
            intrinsics.invoke(index, version);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 'v1.2.3');
                }
            ).to.throw();
        });

        it('should invoke $list intrinsic function', function() {
            const index = intrinsics.index('$list');
            intrinsics.invoke(index);
            intrinsics.invoke(index, bali.catalog({$type: '/bali/collections/List'}));
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $logarithm intrinsic function', function() {
            const index = intrinsics.index('$logarithm');
            intrinsics.invoke(index, number, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle, number);
                }
            ).to.throw();
        });

        it('should invoke $magnitude intrinsic function', function() {
            const index = intrinsics.index('$magnitude');
            intrinsics.invoke(index, complex);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
        });

        it('should invoke $millisecond intrinsic function', function() {
            const index = intrinsics.index('$millisecond');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $milliseconds intrinsic function', function() {
            const index = intrinsics.index('$milliseconds');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $minute intrinsic function', function() {
            const index = intrinsics.index('$minute');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $minutes intrinsic function', function() {
            const index = intrinsics.index('$minutes');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $month intrinsic function', function() {
            const index = intrinsics.index('$month');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $months intrinsic function', function() {
            const index = intrinsics.index('$months');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $next intrinsic function', function() {
            const index = intrinsics.index('$next');
            intrinsics.invoke(index, iterator);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $nextVersion intrinsic function', function() {
            const index = intrinsics.index('$nextVersion');
            intrinsics.invoke(index, version);
            intrinsics.invoke(index, version, two);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $node intrinsic function', function() {
            const index = intrinsics.index('$node');
            intrinsics.invoke(index, type);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
        });

        it('should invoke $not intrinsic function', function() {
            const index = intrinsics.index('$not');
            intrinsics.invoke(index, probability);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, true);
                }
            ).to.throw();
        });

        it('should invoke $now intrinsic function', function() {
            const index = intrinsics.index('$now');
            intrinsics.invoke(index);
        });

        it('should invoke $or intrinsic function', function() {
            const index = intrinsics.index('$or');
            intrinsics.invoke(index, probability, probability);
            intrinsics.invoke(index, set, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set, probability);
                }
            ).to.throw();
        });

        it('should invoke $parameters intrinsic function', function() {
            const index = intrinsics.index('$parameters');
            intrinsics.invoke(index, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, key);
                }
            ).to.throw();
        });

        it('should invoke $path intrinsic function', function() {
            const index = intrinsics.index('$path');
            intrinsics.invoke(index, resource);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
        });

        it('should invoke $phase intrinsic function', function() {
            const index = intrinsics.index('$phase');
            intrinsics.invoke(index, complex);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
        });

        it('should invoke $previous intrinsic function', function() {
            const index = intrinsics.index('$previous');
            intrinsics.invoke(index, iterator);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $procedure intrinsic function', function() {
            const index = intrinsics.index('$procedure');
            intrinsics.invoke(index, code);
            intrinsics.invoke(index, code, catalog);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, node);
                }
            ).to.throw();
        });

        it('should invoke $product intrinsic function', function() {
            const index = intrinsics.index('$product');
            intrinsics.invoke(index, number, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle, number);
                }
            ).to.throw();
        });

        it('should invoke $query intrinsic function', function() {
            const index = intrinsics.index('$query');
            intrinsics.invoke(index, resource);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
        });

        it('should invoke $queue intrinsic function', function() {
            const index = intrinsics.index('$queue');
            intrinsics.invoke(index);
            intrinsics.invoke(index, bali.catalog({$type: '/bali/collections/Queue'}));
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $quotient intrinsic function', function() {
            const index = intrinsics.index('$quotient');
            intrinsics.invoke(index, number, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability, number);
                }
            ).to.throw();
        });

        it('should invoke $radians intrinsic function', function() {
            const index = intrinsics.index('$radians');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
        });

        it('should invoke $random intrinsic function', function() {
            const index = intrinsics.index('$random');
            intrinsics.invoke(index);
        });

        it('should invoke $range intrinsic function', function() {
            const index = intrinsics.index('$range');
            intrinsics.invoke(index, bali.text('..<'));
            intrinsics.invoke(index, bali.NONE, bali.catalog({$collection: [0, 1, 2]}));
            expect(
                function() {
                    intrinsics.invoke(index, [zero, 2]);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([zero, two]), '..');
                }
            ).to.throw();
        });

        it('should invoke $ranking intrinsic function', function() {
            const index = intrinsics.index('$ranking');
            intrinsics.invoke(index, number, number);
            intrinsics.invoke(index, text, text);
            intrinsics.invoke(index, list, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, two, 3);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 5, 6);
                }
            ).to.throw();
        });

        it('should invoke $real intrinsic function', function() {
            const index = intrinsics.index('$real');
            intrinsics.invoke(index, number);
            intrinsics.invoke(index, angle);
            intrinsics.invoke(index, percentage);
            intrinsics.invoke(index, probability);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, moment);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, duration);
                }
            ).to.throw();
        });

        it('should invoke $reciprocal intrinsic function', function() {
            const index = intrinsics.index('$reciprocal');
            intrinsics.invoke(index, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
        });

        it('should invoke $remainder intrinsic function', function() {
            const index = intrinsics.index('$remainder');
            intrinsics.invoke(index, number, number);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability, number);
                }
            ).to.throw();
        });

        it('should invoke $emptyCollection intrinsic function', function() {
            const index = intrinsics.index('$emptyCollection');
            intrinsics.invoke(index, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, range);
                }
            ).to.throw();
        });

        it('should invoke $removeAttribute intrinsic function', function() {
            const index = intrinsics.index('$removeAttribute');
            intrinsics.invoke(index, catalog, symbol);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, association);
                }
            ).to.throw();
        });

        it('should invoke $removeHead intrinsic function', function() {
            const index = intrinsics.index('$removeHead');
            intrinsics.invoke(index, queue);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $removeIndex intrinsic function', function() {
            const index = intrinsics.index('$removeIndex');
            intrinsics.invoke(index, bali.list([1, 2, 3, 4, 5]), two);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog, symbol);
                }
            ).to.throw();
        });

        it('should invoke $removeItem intrinsic function', function() {
            const index = intrinsics.index('$removeItem');
            intrinsics.invoke(index, set, symbol);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, two);
                }
            ).to.throw();
        });

        it('should invoke $removeTop intrinsic function', function() {
            const index = intrinsics.index('$removeTop');
            intrinsics.invoke(index, stack);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, queue);
                }
            ).to.throw();
        });

        it('should invoke $reverseItems intrinsic function', function() {
            const index = intrinsics.index('$reverseItems');
            intrinsics.invoke(index, list);
            intrinsics.invoke(index, catalog);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set);
                }
            ).to.throw();
        });

        it('should invoke $sans intrinsic function', function() {
            const index = intrinsics.index('$sans');
            intrinsics.invoke(index, probability, probability);
            intrinsics.invoke(index, set, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set, probability);
                }
            ).to.throw();
        });

        it('should invoke $scaled intrinsic function', function() {
            const index = intrinsics.index('$scaled');
            intrinsics.invoke(index, duration, number);
            intrinsics.invoke(index, angle, two);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability, two);
                }
            ).to.throw();
        });

        it('should invoke $scheme intrinsic function', function() {
            const index = intrinsics.index('$scheme');
            intrinsics.invoke(index, resource);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
        });

        it('should invoke $second intrinsic function', function() {
            const index = intrinsics.index('$second');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $seconds intrinsic function', function() {
            const index = intrinsics.index('$seconds');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $set intrinsic function', function() {
            const index = intrinsics.index('$set');
            intrinsics.invoke(index);
            intrinsics.invoke(index, bali.catalog({$type: '/bali/collections/Set'}));
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, queue);
                }
            ).to.throw();
        });

        it('should invoke $setAttribute intrinsic function', function() {
            const index = intrinsics.index('$setAttribute');
            intrinsics.invoke(index, bali.list([0, 1, 2]), two, angle);
            intrinsics.invoke(index, bali.catalog({$foo: "bar", $type: "baz"}), symbol, type);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]));
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]), two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]), 2, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]), two, 5);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.set([0, 1, 2]), two, probability);
                }
            ).to.throw();
        });

        it('should invoke $setFirst intrinsic function', function() {
            const index = intrinsics.index('$setFirst');
            const value = bali.component('3');
            intrinsics.invoke(index, bali.range(), value);
        });

        it('should invoke $setItem intrinsic function', function() {
            const index = intrinsics.index('$setItem');
            intrinsics.invoke(index, bali.list([0, 1, 2]), two, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]));
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]), two);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]), 2, probability);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.list([0, 1, 2]), two, 5);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, bali.set([0, 1, 2]), two, probability);
                }
            ).to.throw();
        });

        it('should invoke $setLast intrinsic function', function() {
            const index = intrinsics.index('$setLast');
            const value = bali.component('5');
            intrinsics.invoke(index, bali.range(), value);
        });

        it('should invoke $setParameter intrinsic function', function() {
            const index = intrinsics.index('$setParameter');
            const key = bali.component('$version');
            const value = bali.component('v2');
            intrinsics.invoke(index, document, key, value);
        });

        it('should invoke $setValue intrinsic function', function() {
            const index = intrinsics.index('$setValue');
            const value = bali.component('v2');
            intrinsics.invoke(index, association, value);
        });

        it('should invoke $shuffleItems intrinsic function', function() {
            const index = intrinsics.index('$shuffleItems');
            intrinsics.invoke(index, list);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog);
                }
            ).to.throw();
        });

        it('should invoke $sine intrinsic function', function() {
            const index = intrinsics.index('$sine');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $size intrinsic function', function() {
            const index = intrinsics.index('$size');
            intrinsics.invoke(index, binary);
            intrinsics.invoke(index, name);
            intrinsics.invoke(index, symbol);
            intrinsics.invoke(index, text);
            intrinsics.invoke(index, version);
            intrinsics.invoke(index, catalog);
            intrinsics.invoke(index, list);
            intrinsics.invoke(index, queue);
            intrinsics.invoke(index, set);
            intrinsics.invoke(index, stack);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, [1, 2, 3]);
                }
            ).to.throw();
        });

        it('should invoke $sorter intrinsic function', function() {
            const index = intrinsics.index('$sorter');
            expect(bali.areEqual(intrinsics.invoke(index), sorter)).to.equal(true);
            expect(bali.areEqual(intrinsics.invoke(index, comparator), sorter)).to.equal(true);
        });

        it('should invoke $sortItems intrinsic function', function() {
            const index = intrinsics.index('$sortItems');
            intrinsics.invoke(index, list);
            intrinsics.invoke(index, list, bali.sorter());
            intrinsics.invoke(index, list, sorter);
            intrinsics.invoke(index, catalog);
            intrinsics.invoke(index, catalog, bali.sorter());
            intrinsics.invoke(index, catalog, sorter);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, queue);
                }
            ).to.throw();
        });

        it('should invoke $source intrinsic function', function() {
            const index = intrinsics.index('$source');
            intrinsics.invoke(index, number);
            intrinsics.invoke(index, number, indentation);
            intrinsics.invoke(index, text);
            intrinsics.invoke(index, text, indentation);
            intrinsics.invoke(index, list);
            intrinsics.invoke(index, list, indentation);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, '/bali/collections/List');
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list, 5);
                }
            ).to.throw();
        });

        it('should invoke $stack intrinsic function', function() {
            const index = intrinsics.index('$stack');
            intrinsics.invoke(index);
            intrinsics.invoke(index, bali.catalog({$type: '/bali/collections/Stack'}));
            expect(
                function() {
                    intrinsics.invoke(index, text);
                }
            ).to.throw();
        });

        it('should invoke $sum intrinsic function', function() {
            const index = intrinsics.index('$sum');
            intrinsics.invoke(index, duration, duration);
            intrinsics.invoke(index, number, number);
            intrinsics.invoke(index, angle, angle);
            intrinsics.invoke(index, percentage, percentage);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, angle, two);
                }
            ).to.throw();
        });

        it('should invoke $supplement intrinsic function', function() {
            const index = intrinsics.index('$supplement');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, probability);
                }
            ).to.throw();
        });

        it('should invoke $tag intrinsic function', function() {
            const index = intrinsics.index('$tag');
            intrinsics.invoke(index, two);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, 20);
                }
            ).to.throw();
        });

        it('should invoke $tangent intrinsic function', function() {
            const index = intrinsics.index('$tangent');
            intrinsics.invoke(index, angle);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, number);
                }
            ).to.throw();
        });

        it('should invoke $toEnd intrinsic function', function() {
            const index = intrinsics.index('$toEnd');
            intrinsics.invoke(index, iterator);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $top intrinsic function', function() {
            const index = intrinsics.index('$top');
            intrinsics.invoke(index, stack);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $toSlot intrinsic function', function() {
            const index = intrinsics.index('$toSlot');
            intrinsics.invoke(index, iterator, two);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, iterator);
                }
            ).to.throw();
        });

        it('should invoke $toStart intrinsic function', function() {
            const index = intrinsics.index('$toStart');
            intrinsics.invoke(index, iterator);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, list);
                }
            ).to.throw();
        });

        it('should invoke $value intrinsic function', function() {
            const index = intrinsics.index('$value');
            intrinsics.invoke(index, association);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, catalog);
                }
            ).to.throw();
        });

        it('should invoke $validVersion intrinsic function', function() {
            const index = intrinsics.index('$validVersion');
            intrinsics.invoke(index, version, next);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, version);
                }
            ).to.throw();
        });

        it('should invoke $weeks intrinsic function', function() {
            const index = intrinsics.index('$weeks');
            intrinsics.invoke(index, duration);
        });

        it('should invoke $xor intrinsic function', function() {
            const index = intrinsics.index('$xor');
            intrinsics.invoke(index, probability, probability);
            intrinsics.invoke(index, set, set);
            expect(
                function() {
                    intrinsics.invoke(index);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set);
                }
            ).to.throw();
            expect(
                function() {
                    intrinsics.invoke(index, set, probability);
                }
            ).to.throw();
        });

        it('should invoke $year intrinsic function', function() {
            const index = intrinsics.index('$year');
            intrinsics.invoke(index, moment);
        });

        it('should invoke $years intrinsic function', function() {
            const index = intrinsics.index('$years');
            intrinsics.invoke(index, duration);
        });

    });

});
