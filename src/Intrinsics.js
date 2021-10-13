/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM). All Rights Reserved.    *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.       *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative.(See http://opensource.org/licenses/MIT)          *
 ************************************************************************/
'use strict';

/**
 * This library encapsulates the intrinsic functions supported by the Bali Nebula™
 * Virtual Processor. The functions use the following naming convention:
 * <pre>
 *  1. Functions that return a component or part of a component are named using noun or
 *     adjective phrases.
 *  2. Functions that modify something are named using verb phrases.
 *  3. Functions that ask a question return a boolean value.
 * </pre>
 */
const hasher = require('crypto');
const bali = require('bali-component-framework').api();

// This private constant sets the POSIX end of line character
const EOL = '\n';


/**
 * This function returns the public interace for the virtual machine intrinsic functions.
 *
 * @param {Boolean|Number} debug An optional number in the range 0..3 that controls
 * the level of debugging that occurs:
 * <pre>
 *   0 (or false): debugging turned off
 *   1 (or true): log exceptions to console.error
 *   2: perform argument validation and log exceptions to console.error
 *   3: perform argument validation and log exceptions to console.error and debug info to console.log
 * </pre>
 * @returns {Object} An object that implements the intrinsic functions interface.
 */
exports.api = function(debug) {
    this.debug = debug || 0;  // default is off
    const generator = bali.generator(this.debug);

    // PUBLIC FUNCTIONS

    /**
     * This function returns the virtual machine index for the specified intrinsic function name.
     *
     * @param {Number} index The index of the intrinsic function.
     * @returns {String} The name of the corresponding intrinsic function.
     */
    this.name = function(index) {
        const result = names[index];
        if (!result) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: '$name',
                $exception: '$invalidIndex',
                $name: name,
                $text: 'Attempted to retrieve the name of an invalid intrinsic function.'
            });
            if (this.debug > 0) console.error(exception.toString());
            throw exception;
        }
        return result;
    };

    /**
     * This function returns the virtual machine index for the specified intrinsic function name.
     *
     * @param {String} name The name of the intrinsic function.
     * @returns {Number} The index of the corresponding intrinsic function.
     */
    this.index = function(name) {
        const result = names.indexOf(name);
        if (result < 1) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: '$index',
                $exception: '$invalidName',
                $name: name,
                $text: 'Attempted to retrieve the index of an invalid intrinsic function.'
            });
            if (this.debug > 0) console.error(exception.toString());
            throw exception;
        }
        return result;
    };

    /**
     * This function invokes the intrinsic function associated with the specified index using
     * the specified arguments.
     *
     * @param {Number} index The index of the intrinsic function to invoke.
     * @param {Component} argument1 The first argument.
     * @param {Component} argument2 The second argument.
     * @param {Component} argument3 The second argument.
     * @returns {Object} The result of the intrinsic function invocation.
     */
    this.invoke = function(index, argument1, argument2, argument3) {
        if (index < 1 || index >= names.length) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: '$invoke',
                $exception: '$invalidIndex',
                $index: index,
                $text: 'Attempted to invoke an intrinsic function using an invalid index.'
            });
            if (this.debug > 0) console.error(exception.toString());
            throw exception;
        }
        return functions[index](argument1, argument2, argument3);
    };


    // PRIVATE FUNCTIONS

    const validateTypeArgument = function(procedure, type, argument) {
        if (argument && argument.isComponent && (argument.isType(type) || argument.supportsInterface(type))) return;
        const exception = bali.exception({
            $module: '/bali/vm/Intrinsics',
            $procedure: procedure,
            $exception: '$argumentType',
            $expected: type,
            $actual: bali.component.canonicalType(argument),
            $text: 'An argument passed into an intrinsic function does not have the required type.'
        });
        throw exception;
    };

    const validateOptionalTypeArgument = function(procedure, type, argument) {
        if (argument === null || argument === undefined || bali.areEqual(bali.pattern.NONE, argument)) return undefined;
        validateTypeArgument(procedure, type, argument);
        return argument;
    };

    const validateSameType = function(procedure, first, second) {
        const firstType = first.getType();
        const secondType = second.getType();
        if (firstType !== secondType) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: procedure,
                $exception: '$argumentType',
                $first: firstType,
                $second: secondType,
                $text: 'The arguments passed into the intrinsic function are not the same type.'
            });
            throw exception;
        }
    };

    const validateIndex = function(procedure, size, index) {
        if (size === 0) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: procedure,
                $exception: '$argumentValue',
                $text: 'An empty sequence cannot be accessed with an index.'
            });
            throw exception;
        }
        if (Math.round(index) !== index) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: procedure,
                $exception: '$argumentType',
                $index: index,
                $text: 'The index passed into the intrinsic function is not an integer.'
            });
            throw exception;
        }
        index = Math.abs(index);  // handle reverse indexing
        if (index === 0 || index > size) {
            const exception = bali.exception({
                $module: '/bali/vm/Intrinsics',
                $procedure: procedure,
                $exception: '$argumentValue',
                $expected: bali.range(1, size),
                $actual: index,
                $text: 'An invalid index was passed into an intrinsic function.'
            });
            throw exception;
        }
    };

    const citeDocument = function(document) {
        // extract the required attributes
        const tag = document.getParameter('$tag');
        const version = document.getParameter('$version');

        // generate a digest of the document
        const bytes = Buffer.from(document.toString(), 'utf8');
        const hash = hasher.createHash('sha512');
        hash.update(bytes);
        const digest = bali.binary(hash.digest());

        // create the citation
        const citation = bali.catalog({
            $protocol: 'v2',
            $tag: tag,
            $version: version,
            $digest: digest
        }, {
            $type: '/nebula/notary/Citation/v1'
        });

        return citation;
    };


    /*
     * The list of intrinsic functions supported by the virtual machine.
     */
    const intrinsics = {

        $invalid: function() {
            throw new Error('PROCESSOR: No intrinsic function should have an index of zero.');
        },

        $addItem: function(collection, item) {
            validateTypeArgument('$addItem', '/bali/abstractions/Collection', collection);
            validateTypeArgument('$addItem', '/bali/abstractions/Component', item);
            collection.addItem(item);
            return collection;
        },

        $ancestry: function(component) {
            validateTypeArgument('$ancestry', '/bali/abstractions/Component', component);
            return bali.list(component.getAncestry());
        },

        $and: function(first, second) {
            validateTypeArgument('$and', '/bali/libraries/Logical', first);
            validateTypeArgument('$and', '/bali/libraries/Logical', second);
            validateSameType('$and', first, second);
            return first.constructor.and(first, second);
        },

        $arccosine: function(ratio) {
            validateTypeArgument('$arccosine', '/bali/interfaces/Continuous', ratio);
            return bali.angle.arccosine(ratio.toReal());
        },

        $arcsine: function(ratio) {
            validateTypeArgument('$arcsine', '/bali/interfaces/Continuous', ratio);
            return bali.angle.arcsine(ratio.toReal());
        },

        $arctangent: function(opposite, adjacent) {
            validateTypeArgument('$arctangent', '/bali/interfaces/Continuous', opposite);
            validateTypeArgument('$arctangent', '/bali/interfaces/Continuous', adjacent);
            return bali.angle.arctangent(opposite.toReal(), adjacent.toReal());
        },

        $areEqual: function(first, second) {
            validateTypeArgument('$areEqual', '/bali/abstractions/Component', first);
            validateTypeArgument('$areEqual', '/bali/abstractions/Component', second);
            return bali.boolean(bali.areEqual(first, second));
        },

        $areSame: function(first, second) {
            validateTypeArgument('$areSame', '/bali/abstractions/Component', first);
            validateTypeArgument('$areSame', '/bali/abstractions/Component', second);
            return bali.boolean(first === second);
        },

        $association: function(key, value) {
            validateTypeArgument('$association', '/bali/abstractions/Element', key);
            validateTypeArgument('$association', '/bali/abstractions/Component', value);
            return bali.association(key, value);
        },

        $attribute: function(composite, key) {
            validateTypeArgument('$attribute', '/bali/interfaces/Composite', composite);
            validateTypeArgument('$attribute', '/bali/abstractions/Element', key);
            return composite.getAttribute(key) || bali.pattern.NONE;
        },

        $authority: function(resource) {
            validateTypeArgument('$authority', '/bali/elements/Resource', resource);
            return bali.text(resource.getAuthority());
        },

        $base02: function(binary, indentation) {
            validateTypeArgument('$base02', '/bali/strings/Binary', binary);
            indentation = validateOptionalTypeArgument('$base02', '/bali/interfaces/Discrete', indentation);
            indentation = indentation || 0;
            if (indentation) {
                indentation = indentation.toInteger();
                validateIndex('$base02', 10, indentation);
            }
            const decoder = bali.decoder(indentation);
            return bali.text(decoder.base02Encode(binary.getValue()));
        },

        $base16: function(binary, indentation) {
            validateTypeArgument('$base16', '/bali/strings/Binary', binary);
            indentation = validateOptionalTypeArgument('$base16', '/bali/interfaces/Discrete', indentation);
            indentation = indentation || 0;
            if (indentation) {
                indentation = indentation.toInteger();
                validateIndex('$base16', 10, indentation);
            }
            const decoder = bali.decoder(indentation);
            return bali.text(decoder.base16Encode(binary.getValue()));
        },

        $base32: function(binary, indentation) {
            validateTypeArgument('$base32', '/bali/strings/Binary', binary);
            indentation = validateOptionalTypeArgument('$base32', '/bali/interfaces/Discrete', indentation);
            indentation = indentation || 0;
            if (indentation) {
                indentation = indentation.toInteger();
                validateIndex('$base32', 10, indentation);
            }
            const decoder = bali.decoder(indentation);
            return bali.text(decoder.base32Encode(binary.getValue()));
        },

        $base64: function(binary, indentation) {
            validateTypeArgument('$base64', '/bali/strings/Binary', binary);
            indentation = validateOptionalTypeArgument('$base64', '/bali/interfaces/Discrete', indentation);
            indentation = indentation || 0;
            if (indentation) {
                indentation = indentation.toInteger();
                validateIndex('$base64', 10, indentation);
            }
            const decoder = bali.decoder(indentation);
            return bali.text(decoder.base64Encode(binary.getValue()));
        },

        $binary: function(size, parameters) {
            validateTypeArgument('$binary', '/bali/interfaces/Discrete', size);
            parameters = validateOptionalTypeArgument('$binary', '/bali/collections/Catalog', parameters);
            size = size.toInteger();
            validateIndex('$binary', 1024, size);
            const bytes = generator.generateBytes(size);
            return bali.binary(bytes, parameters);
        },

        $bytes: function(tag) {
            validateTypeArgument('$bytes', '/bali/elements/Tag', tag);
            return bali.binary(tag.getBytes());
        },

        $catalog: function(parameters) {
            parameters = validateOptionalTypeArgument('$catalog', '/bali/collections/Catalog', parameters);
            return bali.catalog(undefined, parameters);
        },

        $chain: function(first, second) {
            validateTypeArgument('$chain', '/bali/libraries/Chainable', first);
            validateTypeArgument('$chain', '/bali/libraries/Chainable', second);
            validateSameType('$chain', first, second);
            return first.constructor.chain(first, second);
        },

        $citation: function(document) {
            validateTypeArgument('$citation', '/bali/collections/Catalog', document);
            return citeDocument(document);
        },

        $code: function(procedure) {
            validateTypeArgument('$code', '/bali/trees/Procedure', procedure);
            return procedure.getCode();
        },

        $coinToss: function(weight) {
            validateTypeArgument('$coinToss', '/bali/elements/Probability', weight);
            return bali.boolean(generator.flipCoin(weight.toReal()));
        },

        $comparator: function() {
            return bali.comparator();
        },

        $complement: function(angle) {
            validateTypeArgument('$complement', '/bali/elements/Angle', angle);
            return bali.angle.complement(angle);
        },

        $component: function(source) {
            validateTypeArgument('$component', '/bali/strings/Text', source);
            return bali.component(source.getValue());
        },

        $conjugate: function(numerical) {
            validateTypeArgument('$conjugate', '/bali/libraries/Numerical', numerical);
            return numerical.constructor.conjugate(numerical);
        },

        $connector: function(range) {
            validateTypeArgument('$connector', '/bali/collections/Range', range);
            return bali.text(range.getConnector());
        },

        $cosine: function(angle) {
            validateTypeArgument('$cosine', '/bali/elements/Angle', angle);
            return bali.number(bali.angle.cosine(angle));
        },

        $day: function(moment) {
            validateTypeArgument('$day', '/bali/elements/Moment', moment);
            return bali.number(moment.getDay(moment));
        },

        $days: function(duration) {
            validateTypeArgument('$days', '/bali/elements/Duration', duration);
            return bali.number(duration.getDays(duration));
        },

        $default: function(component, value) {
            validateTypeArgument('$default', '/bali/abstractions/Component', component);
            validateTypeArgument('$default', '/bali/abstractions/Component', value);
            return !bali.areEqual(component, bali.pattern.NONE) ? component : value;
        },

        $degrees: function(angle) {
            validateTypeArgument('$degrees', '/bali/elements/Angle', angle);
            return bali.number(angle.getDegrees());
        },

        $difference: function(first, second) {
            validateTypeArgument('$difference', '/bali/libraries/Scalable', first);
            validateTypeArgument('$difference', '/bali/libraries/Scalable', second);
            validateSameType('$difference', first, second);
            return first.constructor.difference(first, second);
        },

        $document: function(component) {
            validateTypeArgument('$document', '/bali/abstractions/Component', component);
            return bali.text(EOL + bali.document(component) + EOL);
        },

        $doesMatch: function(component, pattern) {
            validateTypeArgument('$doesMatch', '/bali/abstractions/Component', component);
            validateTypeArgument('$doesMatch', '/bali/abstractions/Component', pattern);
            return bali.boolean(bali.doesMatch(component, pattern));
        },

        $duplicate: function(component) {
            validateTypeArgument('$duplicate', '/bali/abstractions/Component', component);
            return bali.duplicate(component);
        },

        $duration: function(first, second) {
            validateTypeArgument('$duration', '/bali/elements/Moment', first);
            validateTypeArgument('$duration', '/bali/elements/Moment', second);
            return bali.moment.duration(first, second);
        },

        $earlier: function(moment, duration) {
            validateTypeArgument('$earlier', '/bali/elements/Moment', moment);
            validateTypeArgument('$earlier', '/bali/elements/Duration', duration);
            return bali.moment.earlier(moment, duration);
        },

        $effective: function(range) {
            validateTypeArgument('$effective', '/bali/collections/Range', range);
            return bali.range.effective(range);
        },

        $emptyCollection: function(collection) {
            validateTypeArgument('$emptyCollection', '/bali/abstractions/Collection', collection);
            collection.emptyCollection();
            return collection;
        },

        $exponential: function(base, exponent) {
            validateTypeArgument('$exponential', '/bali/libraries/Numerical', base);
            validateTypeArgument('$exponential', '/bali/libraries/Numerical', exponent);
            validateSameType('$exponential', base, exponent);
            return base.constructor.exponential(base, exponent);
        },

        $factorial: function(numerical) {
            validateTypeArgument('$factorial', '/bali/libraries/Numerical', numerical);
            return numerical.constructor.factorial(numerical);
        },

        $first: function(range) {
            validateTypeArgument('$first', '/bali/collections/Range', range);
            const first = range.getFirst();
            return (first === undefined) ? bali.pattern.NONE : bali.number(first);
        },

        $format: function(moment) {
            validateTypeArgument('$format', '/bali/elements/Moment', moment);
            return bali.text(moment.getFormat());
        },

        $fragment: function(resource) {
            validateTypeArgument('$fragment', '/bali/elements/Resource', resource);
            return bali.text(resource.getFragment());
        },

        $hash: function(component) {
            validateTypeArgument('$hash', '/bali/abstractions/Component', component);
            return bali.number(component.getHash());
        },

        $hasNext: function(iterator) {
            validateTypeArgument('$hasNext', '/bali/abstractions/Iterator', iterator);
            return iterator.hasNext();
        },

        $hasPrevious: function(iterator) {
            validateTypeArgument('$hasPrevious', '/bali/abstractions/Iterator', iterator);
            return iterator.hasPrevious();
        },

        $head: function(queue) {
            validateTypeArgument('$head', '/bali/collections/Queue', queue);
            return queue.headItem();
        },

        $hour: function(moment) {
            validateTypeArgument('$hour', '/bali/elements/Moment', moment);
            return bali.number(moment.getHour(moment));
        },

        $hours: function(duration) {
            validateTypeArgument('$hours', '/bali/elements/Duration', duration);
            return bali.number(duration.getHours(duration));
        },

        $html: function(component, title, style) {
            validateTypeArgument('$html', '/bali/abstractions/Component', component);
            validateTypeArgument('$html', '/bali/strings/Text', title);
            validateTypeArgument('$html', '/bali/elements/Resource', style);
            return bali.text(EOL + bali.html(component, title.getValue(), style.getValue().toString()) + EOL);
        },

        $imaginary: function(number) {
            validateTypeArgument('$imaginary', '/bali/elements/Number', number);
            return bali.number(number.getImaginary());
        },

        $insertItem: function(list, slot, item) {
            validateTypeArgument('$insertItem', '/bali/collections/List', list);
            validateTypeArgument('$insertItem', '/bali/interfaces/Discrete', slot);
            validateTypeArgument('$insertItem', '/bali/abstractions/Component', item);
            slot = slot.toInteger();
            list.insertItem(slot, item);
            return list;
        },

        $insertItems: function(list, slot, items) {
            validateTypeArgument('$insertItems', '/bali/collections/List', list);
            validateTypeArgument('$insertItems', '/bali/interfaces/Discrete', slot);
            validateTypeArgument('$insertItems', '/bali/interfaces/Sequential', items);
            slot = slot.toInteger();
            list.insertItems(slot, items);
            return list;
        },

        $integer: function(discrete) {
            validateTypeArgument('$integer', '/bali/interfaces/Discrete', discrete);
            return bali.number(discrete.toInteger());
        },

        $interfaces: function(component) {
            validateTypeArgument('$interfaces', '/bali/abstractions/Component', component);
            return bali.list(component.getInterfaces());
        },

        $inverse: function(scalable) {
            validateTypeArgument('$inverse', '/bali/libraries/Scalable', scalable);
            return scalable.constructor.inverse(scalable);
        },

        $isEnumerable: function(range) {
            validateTypeArgument('$isEnumerable', '/bali/collections/Range', range);
            return range.isEnumerable();
        },

        $isLess: function(first, second) {
            validateTypeArgument('$isLess', '/bali/abstractions/Component', first);
            validateTypeArgument('$isLess', '/bali/abstractions/Component', second);
            return bali.boolean(bali.ranking(first, second) < 0);
        },

        $isMore: function(first, second) {
            validateTypeArgument('$isMore', '/bali/abstractions/Component', first);
            validateTypeArgument('$isMore', '/bali/abstractions/Component', second);
            return bali.boolean(bali.ranking(first, second) > 0);
        },

        $isNegative: function(polarized) {
            validateTypeArgument('$isNegative', '/bali/abstractions/Component', polarized);
            return bali.boolean(polarized.isNegative());
        },

        $isSignificant: function(component) {
            validateTypeArgument('$isSignificant', '/bali/abstractions/Component', component);
            return bali.boolean(component.isSignificant());
        },

        $item: function(sequential, index) {
            validateTypeArgument('$item', '/bali/interfaces/Sequential', sequential);
            validateTypeArgument('$item', '/bali/interfaces/Discrete', index);
            index = index.toInteger();
            validateIndex('$item', sequential.getSize(), index);
            return sequential.componentize(sequential.getItem(index));
        },

        $iterator: function(sequential) {
            validateTypeArgument('$iterator', '/bali/interfaces/Sequential', sequential);
            return sequential.getIterator();
        },

        $key: function(association) {
            validateTypeArgument('$key', '/bali/collections/Association', association);
            return association.getKey();
        },

        $keys: function(catalog) {
            validateTypeArgument('$keys', '/bali/collections/Catalog', catalog);
            return catalog.getKeys();
        },

        $last: function(range) {
            validateTypeArgument('$last', '/bali/collections/Range', range);
            const last = range.getLast();
            return (last === undefined) ? bali.pattern.NONE : bali.number(last);
        },

        $later: function(moment, duration) {
            validateTypeArgument('$later', '/bali/elements/Moment', moment);
            validateTypeArgument('$later', '/bali/elements/Duration', duration);
            return bali.moment.later(moment, duration);
        },

        $levels: function(version) {
            validateTypeArgument('$levels', '/bali/strings/Version' , version);
            return bali.list(version.getValue());
        },

        $list: function(parameters) {
            parameters = validateOptionalTypeArgument('$list', '/bali/collections/Catalog', parameters);
            return bali.list(undefined, parameters);
        },

        $logarithm: function(base, value) {
            validateTypeArgument('$logarithm', '/bali/libraries/Numerical', base);
            validateTypeArgument('$logarithm', '/bali/libraries/Numerical', value);
            validateSameType('$logarithm', base, value);
            return base.constructor.logarithm(base, value);
        },

        $magnitude: function(number) {
            validateTypeArgument('$magnitude', '/bali/elements/Number', number);
            return bali.number(number.getMagnitude());
        },

        $matchesText: function(pattern, text) {
            validateTypeArgument('$matchesText', '/bali/elements/Pattern', pattern);
            validateTypeArgument('$matchesText', '/bali/elements/Text', text);
            return bali.boolean(pattern.matchesString(text.toString()));
        },

        $millisecond: function(moment) {
            validateTypeArgument('$millisecond', '/bali/elements/Moment', moment);
            return bali.number(moment.getMillisecond(moment));
        },

        $milliseconds: function(duration) {
            validateTypeArgument('$milliseconds', '/bali/elements/Duration', duration);
            return bali.number(duration.getMilliseconds(duration));
        },

        $minute: function(moment) {
            validateTypeArgument('$minute', '/bali/elements/Moment', moment);
            return bali.number(moment.getMinute(moment));
        },

        $minutes: function(duration) {
            validateTypeArgument('$minutes', '/bali/elements/Duration', duration);
            return bali.number(duration.getMinutes(duration));
        },

        $month: function(moment) {
            validateTypeArgument('$month', '/bali/elements/Moment', moment);
            return bali.number(moment.getMonth(moment));
        },

        $months: function(duration) {
            validateTypeArgument('$months', '/bali/elements/Duration', duration);
            return bali.number(duration.getMonths(duration));
        },

        $next: function(iterator) {
            validateTypeArgument('$next', '/bali/abstractions/Iterator', iterator);
            return iterator.componentize(iterator.getNext());
        },

        $nextVersion: function(version, level) {
            validateTypeArgument('$nextVersion', '/bali/strings/Version', version);
            validateOptionalTypeArgument('$nextVersion', '/bali/interfaces/Discrete', level);
            if (level) {
                level = level.toInteger();
                if (level) validateIndex('$nextVersion', version.getSize() + 1, level);  // allow for the next subversion
            }
            return bali.version.nextVersion(version, level);
        },

        $node: function(type) {
            validateTypeArgument('$node', '/bali/strings/Name', type);
            return bali.node(type.toString());
        },

        $not: function(logical) {
            validateTypeArgument('$not', '/bali/libraries/Logical', logical);
            return logical.constructor.not(logical);
        },

        $now: function() {
            return bali.moment();
        },

        $or: function(first, second) {
            validateTypeArgument('$or', '/bali/libraries/Logical', first);
            validateTypeArgument('$or', '/bali/libraries/Logical', second);
            validateSameType('$or', first, second);
            return first.constructor.or(first, second);
        },

        $parameters: function(component) {
            validateTypeArgument('$parameters', '/bali/abstractions/Component', component);
            return component.getParameters();
        },

        $path: function(resource) {
            validateTypeArgument('$path', '/bali/elements/Resource', resource);
            return bali.text(resource.getPath());
        },

        $phase: function(number) {
            validateTypeArgument('$phase', '/bali/elements/Number', number);
            return number.getPhase();
        },

        $previous: function(iterator) {
            validateTypeArgument('$previous', '/bali/abstractions/Iterator', iterator);
            return iterator.componentize(iterator.getPrevious());
        },

        $procedure: function(code, parameters) {
            validateTypeArgument('$procedure', '/bali/trees/Code', code);
            parameters = validateOptionalTypeArgument('$procedure', '/bali/collections/Catalog', parameters);
            return bali.procedure(code, parameters);
        },

        $product: function(first, second) {
            validateTypeArgument('$product', '/bali/libraries/Numerical', first);
            validateTypeArgument('$product', '/bali/libraries/Numerical', second);
            validateSameType('$product', first, second);
            return first.constructor.product(first, second);
        },

        $query: function(resource) {
            validateTypeArgument('$query', '/bali/elements/Resource', resource);
            return bali.text(resource.getQuery());
        },

        $queue: function(parameters) {
            parameters = validateOptionalTypeArgument('$queue', '/bali/collections/Catalog', parameters);
            return bali.queue(undefined, parameters);
        },

        $quotient: function(first, second) {
            validateTypeArgument('$quotient', '/bali/libraries/Numerical', first);
            validateTypeArgument('$quotient', '/bali/libraries/Numerical', second);
            validateSameType('$quotient', first, second);
            return first.constructor.quotient(first, second);
        },

        $radians: function(angle) {
            validateTypeArgument('$radians', '/bali/elements/Angle', angle);
            return bali.number(angle.getRadians());
        },

        $random: function() {
            return bali.probability.random();
        },

        $range: function(connector, parameters) {
            connector = validateOptionalTypeArgument('$range', '/bali/strings/Text', connector);
            parameters = validateOptionalTypeArgument('$range', '/bali/collections/Catalog', parameters);
            connector = connector ? connector.getValue() : undefined;
            return bali.range(undefined, connector, undefined, parameters);
        },

        $ranking: function(first, second) {
            validateTypeArgument('$ranking', '/bali/abstractions/Component', first);
            validateTypeArgument('$ranking', '/bali/abstractions/Component', second);
            return bali.number(bali.ranking(first, second));
        },

        $real: function(continuous) {
            validateTypeArgument('$real', '/bali/interfaces/Continuous', continuous);
            return bali.number(continuous.toReal());
        },

        $reciprocal: function(numerical) {
            validateTypeArgument('$reciprocal', '/bali/libraries/Numerical', numerical);
            return numerical.constructor.reciprocal(numerical);
        },

        $remainder: function(first, second) {
            validateTypeArgument('$remainder', '/bali/libraries/Numerical', first);
            validateTypeArgument('$remainder', '/bali/libraries/Numerical', second);
            validateSameType('$remainder', first, second);
            return first.constructor.remainder(first, second);
        },

        $removeAttribute: function(catalog, key) {
            validateTypeArgument('$removeAttribute', '/bali/collections/Catalog', catalog);
            validateTypeArgument('$removeAttribute', '/bali/abstractions/Element', key);
            return catalog.removeAttribute(key);
        },

        $removeHead: function(queue) {
            validateTypeArgument('$removeHead', '/bali/collections/Queue', queue);
            return queue.removeItem();
        },

        $removeIndex: function(list, index) {
            validateTypeArgument('$removeIndex', '/bali/collections/List', list);
            validateTypeArgument('$removeIndex', '/bali/interfaces/Discrete', index);
            index = index.toInteger();
            validateIndex('$removeIndex', list.getSize(), index);
            return list.removeItem(index);
        },

        $removeIndices: function(list, indices) {
            validateTypeArgument('$removeIndices', '/bali/collections/List', list);
            validateTypeArgument('$removeIndices', '/bali/interfaces/Sequential', indices);
            return list.removeItems(indices);
        },

        $removeItem: function(set, item) {
            validateTypeArgument('$removeItem', '/bali/collections/Set', set);
            validateTypeArgument('$removeItem', '/bali/abstractions/Component', item);
            return set.removeItem(item);
        },

        $removeTop: function(stack) {
            validateTypeArgument('$removeTop', '/bali/collections/Stack', stack);
            return stack.removeItem();
        },

        $reverseItems: function(sortable) {
            validateTypeArgument('$reverseItems', '/bali/interfaces/Sortable', sortable);
            sortable.reverseItems();
            return sortable;
        },

        $sans: function(first, second) {
            validateTypeArgument('$sans', '/bali/libraries/Logical', first);
            validateTypeArgument('$sans', '/bali/libraries/Logical', second);
            validateSameType('$sans', first, second);
            return first.constructor.sans(first, second);
        },

        $scaled: function(scalable, factor) {
            validateTypeArgument('$scaled', '/bali/libraries/Scalable', scalable);
            validateTypeArgument('$scaled', '/bali/elements/Number', factor);
            return scalable.constructor.scaled(scalable, factor);
        },

        $scheme: function(resource) {
            validateTypeArgument('$scheme', '/bali/elements/Resource', resource);
            return bali.text(resource.getScheme());
        },

        $second: function(moment) {
            validateTypeArgument('$second', '/bali/elements/Moment', moment);
            return bali.number(moment.getSecond(moment));
        },

        $seconds: function(duration) {
            validateTypeArgument('$seconds', '/bali/elements/Duration', duration);
            return bali.number(duration.getSeconds(duration));
        },

        $set: function(parameters) {
            parameters = validateOptionalTypeArgument('$set', '/bali/collections/Catalog', parameters);
            return bali.set(undefined, parameters);
        },

        $setAttribute: function(composite, key, value) {
            validateTypeArgument('$setAttribute', '/bali/interfaces/Composite', composite);
            validateTypeArgument('$setAttribute', '/bali/abstractions/Element', key);
            validateTypeArgument('$setAttribute', '/bali/abstractions/Component', value);
            composite.setAttribute(key, value);
            return composite;
        },

        $setFirst: function(range, value) {
            validateTypeArgument('$setFirst', '/bali/collections/Range', range);
            validateTypeArgument('$setFirst', '/bali/abstractions/Component', value);
            range.setFirst(value);
            return range;
        },

        $setItem: function(list, index, item) {
            validateTypeArgument('$setItem', '/bali/collections/List', list);
            validateTypeArgument('$setItem', '/bali/interfaces/Discrete', index);
            validateTypeArgument('$setItem', '/bali/abstractions/Component', item);
            index = index.toInteger();
            validateIndex('$setItem', list.getSize(), index);
            list.setItem(index, item);
            return list;
        },

        $setLast: function(range, value) {
            validateTypeArgument('$setLast', '/bali/collections/Range', range);
            validateTypeArgument('$setLast', '/bali/abstractions/Component', value);
            range.setLast(value);
            return range;
        },

        $setParameter: function(component, key, value) {
            validateTypeArgument('$setParameter', '/bali/abstractions/Component', component);
            validateTypeArgument('$setParameter', '/bali/abstractions/Element', key);
            validateTypeArgument('$setParameter', '/bali/abstractions/Component', value);
            component.setParameter(key, value);
            return component;
        },

        $setValue: function(association, value) {
            validateTypeArgument('$setValue', '/bali/collections/Association', association);
            validateTypeArgument('$setValue', '/bali/abstractions/Component', value);
            association.setValue(value);
            return association;
        },

        $shuffleItems: function(list) {
            validateTypeArgument('$shuffleItems', '/bali/collections/List', list);
            list.shuffleItems();
            return list;
        },

        $sine: function(angle) {
            validateTypeArgument('$sine', '/bali/elements/Angle', angle);
            return bali.number(bali.angle.sine(angle));
        },

        $size: function(sequential) {
            validateTypeArgument('$size', '/bali/interfaces/Sequential', sequential);
            return bali.number(sequential.getSize());
        },

        $sorter: function(comparator) {
            comparator = validateOptionalTypeArgument('$sorter', '/bali/agents/CanonicalComparator', comparator);
            return bali.sorter(comparator);
        },

        $sortItems: function(sortable, sorter) {
            validateTypeArgument('$sortItems', '/bali/interfaces/Sortable', sortable);
            sorter = validateOptionalTypeArgument('$sortItems', '/bali/agents/MergeSorter', sorter);
            sortable.sortItems(sorter);
            return sortable;
        },

        $source: function(component, indentation) {
            validateTypeArgument('$source', '/bali/abstractions/Component', component);
            indentation = validateOptionalTypeArgument('$source', '/bali/interfaces/Discrete', indentation);
            if (indentation) {
                indentation = indentation.toInteger();
                validateIndex('$source', 10, indentation);
            }
            return bali.text(EOL + bali.source(component, indentation) + EOL);
        },

        $stack: function(parameters) {
            parameters = validateOptionalTypeArgument('$stack', '/bali/collections/Catalog', parameters);
            return bali.stack(undefined, parameters);
        },

        $sum: function(first, second) {
            validateTypeArgument('$sum', '/bali/libraries/Scalable', first);
            validateTypeArgument('$sum', '/bali/libraries/Scalable', second);
            validateSameType('$sum', first, second);
            return first.constructor.sum(first, second);
        },

        $supplement: function(angle) {
            validateTypeArgument('$supplement', '/bali/elements/Angle', angle);
            return bali.angle.supplement(angle);
        },

        $tag: function(size) {
            size = validateOptionalTypeArgument('$tag', '/bali/interfaces/Discrete', size);
            size = size.toInteger();
            validateIndex('$tag', 64, size);
            return bali.tag(size);
        },

        $tangent: function(angle) {
            validateTypeArgument('$tangent', '/bali/elements/Angle', angle);
            return bali.number(bali.angle.tangent(angle));
        },

        $toEnd: function(iterator) {
            validateTypeArgument('$toEnd', '/bali/abstractions/Iterator', iterator);
            iterator.toEnd();
            return iterator;
        },

        $top: function(stack) {
            validateTypeArgument('$top', '/bali/collections/Stack', stack);
            return stack.topItem();
        },

        $toSlot: function(iterator, slot) {
            validateTypeArgument('$toSlot', '/bali/abstractions/Iterator', iterator);
            validateTypeArgument('$toSlot', '/bali/interfaces/Discrete', slot);
            iterator.toSlot(slot.toInteger());
            return iterator;
        },

        $toStart: function(iterator) {
            validateTypeArgument('$toStart', '/bali/abstractions/Iterator', iterator);
            iterator.toStart();
            return iterator;
        },

        $validVersion: function(current, next) {
            validateTypeArgument('$validVersion', '/bali/strings/Version', current);
            validateTypeArgument('$validVersion', '/bali/strings/Version', next);
            return bali.version.validNextVersion(current, next);
        },

        $value: function(association) {
            validateTypeArgument('$value', '/bali/collections/Association', association);
            return association.getValue();
        },

        $weeks: function(duration) {
            validateTypeArgument('$weeks', '/bali/elements/Duration', duration);
            return bali.number(duration.getWeeks(duration));
        },

        $xor: function(first, second) {
            validateTypeArgument('$xor', '/bali/libraries/Logical', first);
            validateTypeArgument('$xor', '/bali/libraries/Logical', second);
            validateSameType('$xor', first, second);
            return first.constructor.xor(first, second);
        },

        $year: function(moment) {
            validateTypeArgument('$year', '/bali/elements/Moment', moment);
            return bali.number(moment.getYear(moment));
        },

        $years: function(duration) {
            validateTypeArgument('$years', '/bali/elements/Duration', duration);
            return bali.number(duration.getYears(duration));
        }

    };

    /*
     * A list of the names of the intrinsic functions supported by the virtual machine.
     */
    const names = Object.keys(intrinsics);  // javascript now preserves the chronological order of keys

    /*
     * A list of the implementations of the intrinsic functions supported by the virtual machine.
     */
    const functions = [];
    names.forEach((name) => {
        functions.push(intrinsics[name]);
    });

    // return the actual API
    return this;
};
