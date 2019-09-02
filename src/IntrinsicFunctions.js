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
 * This library encapsulates the intrinsic functions supported by the Nebula
 * Virtual Processor.
 */
const bali = require('bali-component-framework');


// PUBLIC INTRINSIC FUNCTIONS

/**
 * This function invokes the intrinsic function associated with the specified index using
 * the specified arguments.
 * 
 * @param {Number} index The index of the intrinsic function to invoke.
 * @param {Array} args The arguments to be passed to the function invocation.
 * @returns {Object} The result of the intrinsic function invocation.
 */
exports.invoke = function(index, ...args) {
    return functions[index](args[0], args[1], args[2]);
};

// Note: for better performance this is implemented as an array rather than an object with
//       function name keys. We don't want to have to look up the functions at runtime.
const functions = [
    // <invalid>
    function() {
        throw new Error('PROCESSOR: No intrinsic function should have an index of zero.');
    },

    // $addChild
    function(tree, child) {
        validateParameterType('$addChild', '$Tree', tree);
        tree.addChild(child);
        return tree;
    },

    // $addItem
    function(collection, item) {
        validateParameterAbstraction('$addItem', '$Collection', collection);
        collection.addItem(item);
        return collection;
    },

    // $addItems
    function(collection, items) {
        validateParameterAbstraction('$addItems', '$Collection', collection);
        collection.addItems(items);
        return collection;
    },

    // $and
    function(first, second) {
        validateParameterAbstraction('$and', '$Logical', first);
        validateParameterAbstraction('$and', '$Logical', second);
        return first.constructor.and(first, second);
    },

    // $angle
    function(value, parameters) {
        return constructElement('$angle', value, parameters);
    },

    // $arccosine
    function(ratio) {
        validateParameterType('$arccosine', '$Number', ratio);
        const angle = bali.angle.arccosine(ratio.toNumber());
        return angle;
    },

    // $arcsine
    function(ratio) {
        validateParameterType('$arcsine', '$Number', ratio);
        const angle = bali.angle.arcsine(ratio.toNumber());
        return angle;
    },

    // $arctangent
    function(opposite, adjacent) {
        validateParameterType('$arctangent', '$Number', opposite);
        validateParameterType('$arctangent', '$Number', adjacent);
        const angle = bali.angle.arctangent(opposite.toNumber(), adjacent.toNumber());
        return angle;
    },

    // $association
    function(key, value) {
        validateParameterAbstraction('$association', '$Element', key);
        const association = bali.association(key, value);
        return association;
    },

    // $base2
    function(binary, indentation) {
        validateParameterType('$base2', '$Binary', binary);
        validateParameterType('$base2', '$Text', indentation);
        return bali.text(binary.toBase2(indentation.toString()));
    },

    // $base16
    function(binary, indentation) {
        validateParameterType('$base16', '$Binary', binary);
        validateParameterType('$base16', '$Text', indentation);
        return bali.text(binary.toBase16(indentation.toString()));
    },

    // $base32
    function(binary, indentation) {
        validateParameterType('$base32', '$Binary', binary);
        validateParameterType('$base32', '$Text', indentation);
        return bali.text(binary.toBase32(indentation.toString()));
    },

    // $base64
    function(binary, indentation) {
        validateParameterType('$base64', '$Binary', binary);
        validateParameterType('$base64', '$Text', indentation);
        return bali.text(binary.toBase64(indentation.toString()));
    },

    // $binary
    function(value, parameters) {
        return constructElement('$binary', value, parameters);
    },

    // $catalog
    function(parameters) {
        return constructCollection('$catalog', parameters);
    },

    // $complement
    function(angle) {
        validateParameterType('$complement', '$Angle', angle);
        return bali.angle.complement(angle);
    },

    // $concatenation
    function(first, second) {
        validateParameterAbstraction('$concatenation', '$Chainable', first);
        validateParameterAbstraction('$concatenation', '$Chainable', second);
        return first.constructor.concatenation(first, second);
    },

    // $conjugate
    function(number) {
        validateParameterType('$conjugate', '$Number', number);
        return bali.number.conjugate(number);
    },

    // $containsAll
    function(collection, items) {
        validateParameterAbstraction('$containsAll', '$Collection', collection);
        validateParameterAbstraction('$containsAll', '$Sequential', items);
        const result = bali.probability(collection.containsAll(items));
        return result;
    },

    // $containsAny
    function(collection, items) {
        validateParameterAbstraction('$containsAny', '$Collection', collection);
        validateParameterAbstraction('$containsAny', '$Sequential', items);
        const result = bali.probability(collection.containsAny(items));
        return result;
    },

    // $containsItem
    function(collection, item) {
        validateParameterAbstraction('$containsItem', '$Collection', collection);
        const result = bali.probability(collection.containsItem(item));
        return result;
    },

    // $cosine
    function(angle) {
        validateParameterType('$cosine', '$Angle', angle);
        return bali.number(bali.angle.cosine(angle));
    },

    // $default
    function(proposedValue, defaultValue) {
        return proposedValue.isEqualTo(bali.pattern.NONE) ? defaultValue : proposedValue;
    },

    // $deleteAll
    function(collection) {
        validateParameterAbstraction('$deleteAll', '$Collection', collection);
        collection.deleteAll();
        return collection;
    },

    // $difference
    function(first, second) {
        validateParameterAbstraction('$difference', '$Scalable', first);
        validateParameterAbstraction('$difference', '$Scalable', second);
        return first.constructor.difference(first, second);
    },

    // $duration
    function(value, parameters) {
        return constructElement('$duration', value, parameters);
    },

    // $earlier
    function(moment, duration) {
        validateParameterType('$earlier', '$Moment', moment);
        validateParameterType('$earlier', '$Duration', duration);
        return bali.moment.earlier(moment, duration);
    },

    // $exponential
    function(number) {
        validateParameterType('$exponential', '$Number', number);
        return bali.number.exponential(number);
    },

    // $extraction
    function(catalog, keys) {
        validateParameterType('$extraction', '$Catalog', catalog);
        validateParameterType('$extraction', '$List', keys);
        return bali.catalog.extraction(catalog, keys);
    },

    // $factorial
    function(number) {
        validateParameterType('$factorial', '$Number', number);
        return bali.number.factorial(number);
    },

    // $format
    function(component, indentation) {
        validateParameterType('$format', '$Text', indentation);
        return bali.text(bali.format(component, indentation.getValue()));
    },

    // $getAssociationKey
    function(association) {
        validateParameterType('$getAssociationKey', '$Association', association);
        return association.getKey();
    },

    // $getAssociationValue
    function(association) {
        validateParameterType('$getAssociationValue', '$Association', association);
        return association.getValue();
    },

    // $getAssociations
    function(catalog) {
        validateParameterType('$getAssociations', '$Catalog', catalog);
        return catalog.getAssociations();
    },

    // $getBytes
    function(tag) {
        validateParameterType('$getBytes', '$Tag', tag);
        return bali.binary(tag.getBytes());
    },

    // $getChild
    function(tree, index) {
        validateParameterType('$getChild', '$Tree', tree);
        validateParameterType('$getChild', '$Number', index);
        validateIndex('$getChild', tree.getSize(), index);
        return tree.getChild(index.toNumber());
    },

    // $getDegrees
    function(angle) {
        validateParameterType('$getDegrees', '$Angle', angle);
        return bali.number(angle.getDegrees());
    },

    // $getFirst
    function(range) {
        validateParameterType('$getFirst', '$Range', range);
        return range.getFirst();
    },

    // $getHash
    function(component) {
        return bali.number(component.getHash());
    },

    // $getHead
    function(queue) {
        validateParameterType('$getHead', '$Queue', queue);
        return queue.getHead();
    },

    // $getImaginary
    function(number) {
        validateParameterType('$getImaginary', '$Number', number);
        return bali.number(number.getImaginary());
    },

    // $getIndex
    function(collection, item) {
        validateParameterAbstraction('$getIndex', '$Collection', collection);
        return bali.number(collection.getIndex(item));
    },

    // $getItem
    function(collection, index) {
        validateParameterAbstraction('$getItem', '$Collection', collection);
        validateParameterType('$getItem', '$Number', index);
        validateIndex('$getItem', collection.getSize(), index);
        return collection.getItem(index.getNumber());
    },

    // $getItems
    function(collection, first, last) {
        validateParameterAbstraction('$getItems', '$Collection', collection);
        validateParameterType('$getItems', '$Number', first);
        validateParameterType('$getItems', '$Number', last);
        validateIndex('$getItems', collection.getSize(), first);
        validateIndex('$getItems', collection.getSize(), last);
        return collection.getItems(first, last);
    },

    // $getKeys
    function(catalog) {
        validateParameterType('$getKeys', '$Catalog', catalog);
        return catalog.getKeys();
    },

    // $getLast
    function(range) {
        validateParameterType('$getLast', '$Range', range);
        return range.getLast();
    },

    // $getLevels
    function(version) {
        validateParameterType('$getLevels', '$Version' , version);
        return bali.list(version.getValue());
    },

    // $getMagnitude
    function(number) {
        validateParameterType('$getMagnitude', '$Number', number);
        return bali.number(number.getMagnitude());
    },

    // $getParameter
    function(parameters, key, index) {
        validateParameterType('$getParameter', '$Parameters', parameters);
        validateParameterAbstraction('$getParameter', '$Element', key);
        validateParameterType('$getParameter', '$Number', index);
        validateIndex('$getParameter', parameters.getSize(), index);
        return parameters.getParameter(key, index);
    },

    // $getParameters
    function(component) {
        return component.getParameters();
    },

    // $getParent
    function(tree) {
        validateParameterType('$getParent', '$Tree', tree);
        return tree.getParent();
    },

    // $getPhase
    function(number) {
        validateParameterType('$getPhase', '$Number', number);
        return number.getPhase();
    },

    // $getProcedure
    function(source) {
        validateParameterType('$getProcedure', '$Source', source);
        return source.getProcedure();
    },

    // $getRadians
    function(angle) {
        validateParameterType('$getRadians', '$Angle', angle);
        return bali.number(angle.getRadians());
    },

    // $getReal
    function(number) {
        validateParameterType('$getReal', '$Number', number);
        return bali.number(number.getReal());
    },

    // $getSize
    function(sequence) {
        validateParameterAbstraction('$getSize', '$Sequential', sequence);
        return bali.number(sequence.getSize());
    },

    // $getTop
    function(stack) {
        validateParameterType('$getTop', '$Stack', stack);
        return stack.getTop();
    },

    // $getType
    function(component) {
        return getType(component);
    },

    // $getValue
    function(catalog, key) {
        validateParameterType('$getValue', '$Catalog', catalog);
        validateParameterAbstraction('$getValue', '$Element', key);
        return catalog.getValue(key) || bali.pattern.NONE;
    },

    // $getValues
    function(catalog, keys) {
        validateParameterType('$getValues', '$Catalog', catalog);
        validateParameterType('$getValues', '$List', keys);
        return catalog.getValues(keys);
    },

    // $insertItem
    function(list, index, item) {
        validateParameterType('$insertItem', '$List', list);
        validateParameterType('$insertItem', '$Number', index);
        validateIndex('$insertItem', list.getSize(), index);
        list.insertItem(index.getNumber(), item);
        return list;
    },

    // $insertItems
    function(list, index, items) {
        validateParameterType('$insertItems', '$List', list);
        validateParameterType('$insertItems', '$Number', index);
        validateParameterAbstraction('$insertItems', '$Collection', items);
        validateIndex('$insertItems', list.getSize(), index);
        list.insertItems(index.getNumber(), items);
        return list;
    },

    // $inverse
    function(scalable) {
        validateParameterAbstraction('$inverse', '$Scalable', scalable);
        return scalable.constructor.inverse(scalable);
    },

    // $isEmpty
    function(sequence) {
        validateParameterAbstraction('$isEmpty', '$Sequential', sequence);
        return bali.probability(sequence.isEmpty());
    },

    // $isEqualTo
    function(first, second) {
        return bali.probability(first.isEqualTo(second));
    },

    // $isInRange
    function(range, item) {
        validateParameterType('$isInRange', '$Range', range);
        return bali.probability(range.isInRange(item));
    },

    // $isInfinite
    function(number) {
        validateParameterType('$isInfinite', '$Number', number);
        return bali.probability(number.isInfinite());
    },

    // $isLessThan
    function(first, second) {
        return bali.probability(first.comparedTo(second) < 0);
    },

    // $isMatchedBy
    function(component, pattern) {
        return bali.probability(component.isMatchedBy(pattern));
    },

    // $isMoreThan
    function(first, second) {
        return bali.probability(first.comparedTo(second) > 0);
    },

    // $isParameterized
    function(component) {
        return bali.probability(component.isParameterized());
    },

    // $isSameAs
    function(first, second) {
        return bali.probability(first === second);
    },

    // $isUndefined
    function(number) {
        validateParameterType('$isUndefined', '$Number', number);
        return bali.probability(number.isUndefined());
    },

    // $isZero
    function(number) {
        validateParameterType('$isZero', '$Number', number);
        return bali.probability(number.isZero());
    },

    // $later
    function(moment, duration) {
        validateParameterType('$later', '$Moment', moment);
        validateParameterType('$later', '$Duration', duration);
        return bali.moment.later(moment, duration);
    },

    // $list
    function(parameters) {
        return constructCollection('$list', parameters);
    },

    // $literal
    function(element) {
        validateParameterAbstraction('$literal', '$Element', element);
        return bali.text(bali.literal(element));
    },

    // $logarithm
    function(number) {
        validateParameterType('$logarithm', '$Number', number);
        return bali.number.logarithm(number);
    },

    // $moment
    function(value, parameters) {
        return constructElement('$moment', value, parameters);
    },

    // $nextVersion
    function(version, level) {
        validateParameterType('$nextVersion', '$Version', version);
        validateParameterType('$nextVersion', '$Number', level);
        validateIndex('$nextVersion', version.getSize() + 1, level);  // allow for the next subversion
        return bali.version.nextVersion(version, level);
    },

    // $not
    function(logical) {
        validateParameterAbstraction('$not', '$Logical', logical);
        return logical.constructor.not(logical);
    },

    // $number
    function(value, parameters) {
        return constructElement('$number', value, parameters);
    },

    // $or
    function(first, second) {
        validateParameterAbstraction('$or', '$Logical', first);
        validateParameterAbstraction('$or', '$Logical', second);
        return first.constructor.or(first, second);
    },

    // $parameters
    function(collection) {
        validateParameterAbstraction('$parameters', '$Collection', collection);
        return bali.parameters(collection);
    },

    // $parse
    function(document, parameters, debug) {
        validateParameterType('$parse', '$Text', document);
        validateParameterType('$parse', '$Parameters', parameters);
        validateParameterType('$parse', '$Probability', debug);
        return bali.parse(document.getValue(), parameters, debug.toBoolean());
    },

    // $pattern
    function(value, parameters) {
        return constructElement('$pattern', value, parameters);
    },

    // $percent
    function(value, parameters) {
        return constructElement('$percent', value, parameters);
    },

    // $period
    function(first, second) {
        validateParameterType('$period', '$Moment', first);
        validateParameterType('$period', '$Moment', second);
        return bali.moment.period(first, second);
    },

    // $polar
    function(number) {
        validateParameterType('$polar', '$Number', number);
        return bali.text(number.toPolar());
    },

    // $probability
    function(value, parameters) {
        return constructElement('$probability', value, parameters);
    },

    // $product
    function(first, second) {
        validateParameterAbstraction('$product', '$Numerical', first);
        validateParameterAbstraction('$product', '$Numerical', second);
        return first.constructor.product(first, second);
    },

    // $queue
    function(parameters) {
        return constructCollection('$queue', parameters);
    },

    // $quotient
    function(first, second) {
        validateParameterAbstraction('$quotient', '$Numerical', first);
        validateParameterAbstraction('$quotient', '$Numerical', second);
        return first.constructor.quotient(first, second);
    },

    // $randomBytes
    function(numberOfBytes) {
        validateParameterType('$randomBytes', '$Number', numberOfBytes);
        return bali.binary(bali.random.bytes(numberOfBytes));
    },

    // $randomCoinToss
    function(weighting) {
        validateParameterType('$randomCoinToss', '$Probability', weighting);
        return bali.probability(bali.random.coinToss(weighting.toNumber()));
    },

    // $randomIndex
    function(length) {
        validateParameterType('$randomIndex', '$Number', length);
        return bali.number(bali.random.index(length));
    },

    // $randomInteger
    function() {
        return bali.number(bali.random.integer());
    },

    // $randomProbability
    function() {
        return bali.probability(bali.random.probability());
    },

    // $range
    function(first, last, parameters) {
        return constructRange(first, last, parameters);
    },

    // $reciprocal
    function(number) {
        validateParameterType('$reciprocal', '$Number', number);
        return bali.number.reciprocal(number);
    },

    // $rectangular
    function(number) {
        validateParameterType('$rectangular', '$Number', number);
        return bali.text(number.toRectangular());
    },

    // $reference
    function(value, parameters) {
        return constructElement('$reference', value, parameters);
    },

    // $remainder
    function(first, second) {
        validateParameterAbstraction('$remainder', '$Numerical', first);
        validateParameterAbstraction('$remainder', '$Numerical', second);
        return first.constructor.remainder(first, second);
    },

    // $removeHead
    function(queue) {
        validateParameterType('$removeHead', '$Queue', queue);
        return queue.removeItem();
    },

    // $removeIndex
    function(list, index) {
        validateParameterType('$removeIndex', '$List', list);
        validateParameterType('$removeIndex', '$Number', index);
        validateIndex('$removeIndex', list.getSize(), index);
        return list.removeItem(index);
    },

    // $removeItem
    function(set, item) {
        validateParameterType('$removeItem', '$Set', set);
        return bali.probability(set.removeItem(item));
    },

    // $removeItems
    function(set, items) {
        validateParameterType('$removeItems', '$Set', set);
        validateParameterAbstraction('$removeItems', '$Collection', items);
        return bali.number(set.removeItems(items));
    },

    // $removeRange
    function(list, range) {
        validateParameterType('$removeIndex', '$List', list);
        validateParameterType('$removeIndex', '$Range', range);
        return list.removeItems(range);
    },

    // $removeTop
    function(stack) {
        validateParameterType('$removeTop', '$Stack', stack);
        return stack.removeItem();
    },

    // $removeValue
    function(catalog, key) {
        validateParameterType('$removeValue', '$Catalog', catalog);
        validateParameterAbstraction('$removeValue', '$Element', key);
        return catalog.removeValue(key);
    },

    // $removeValues
    function(catalog, keys) {
        validateParameterType('$removeValues', '$Catalog', catalog);
        validateParameterType('$removeValues', '$List', keys);
        return catalog.removeValues(keys);
    },

    // $reverseAssociations
    function(catalog) {
        validateParameterType('$reverseAssociations', '$Catalog', catalog);
        catalog.reverseItems();
        return catalog;
    },

    // $reverseItems
    function(list) {
        validateParameterType('$reverseItems', '$List', list);
        list.reverseItems();
        return list;
    },

    // $sans
    function(first, second) {
        validateParameterAbstraction('$sans', '$Logical', first);
        validateParameterAbstraction('$sans', '$Logical', second);
        return first.constructor.sans(first, second);
    },

    // $scaled
    function(scalable, factor) {
        validateParameterAbstraction('$scaled', '$Scalable', scalable);
        validateParameterAbstraction('$factor', '$Numerical', factor);
        return scalable.constructor.scaled(scalable, factor);
    },

    // $set
    function(parameters) {
        return constructCollection('$set', parameters);
    },

    // $setAssociationValue
    function(association, value) {
        validateParameterType('$setAssociationValue', '$Association', association, value);
        return association.setValue(value);
    },

    // $setItem
    function(list, index, item) {
        validateParameterType('$setItem', '$List', list);
        validateParameterType('$setItem', '$Number', index);
        validateIndex('$setItem', list.getSize(), index);
        list.setItem(index, item);
        return list;
    },

    // $setParameters
    function(element, parameters) {
        validateParameterAbstraction('$setParameters', '$Element', element);
        element.setParameters(parameters);
        return element;
    },

    // $setValue
    function(catalog, key, value) {
        validateParameterType('$setValue', '$Catalog', catalog);
        validateParameterAbstraction('$setValue', '$Element', key);
        catalog.setValue(key, value);
        return catalog;
    },

    // $setValues
    function(catalog, values) {
        validateParameterType('$setValues', '$Catalog', catalog);
        validateParameterType('$setValues', '$Catalog', values);
        catalog.setValues(values);
        return catalog;
    },

    // $shuffleItems
    function(list) {
        validateParameterType('$shuffleItems', '$List', list);
        list.shuffleItems();
        return list;
    },

    // $sine
    function(angle) {
        validateParameterType('$sine', '$Angle', angle);
        return bali.number(bali.angle.sine(angle));
    },

    // $sortAssociations
    function(catalog) {
        validateParameterType('$sortAssociations', '$Catalog', catalog);
        catalog.sortItems();
        return catalog;
    },

    // $sortItems
    function(list) {
        validateParameterType('$sortItems', '$List', list);
        list.sortItems();
        return list;
    },

    // $source
    function(procedure, parameters) {
        return constructSource(procedure, parameters);
    },

    // $stack
    function(parameters) {
        return constructCollection('$stack', parameters);
    },

    // $sum
    function(first, second) {
        validateParameterAbstraction('$sum', '$Scalable', first);
        validateParameterAbstraction('$sum', '$Scalable', second);
        return first.constructor.sum(first, second);
    },

    // $supplement
    function(angle) {
        validateParameterType('$supplement', '$Angle', angle);
        return bali.angle.supplement(angle);
    },

    // $symbol
    function(value, parameters) {
        return constructElement('$symbol', value, parameters);
    },

    // $tag
    function(value, parameters) {
        return constructElement('$tag', value, parameters);
    },

    // $tangent
    function(angle) {
        validateParameterType('$tangent', '$Angle', angle);
        return bali.number(bali.angle.tangent(angle));
    },

    // $text
    function(value, parameters) {
        return constructElement('$text', value, parameters);
    },

    // $tree
    function(type) {
        return constructTree(type);
    },

    // $validNextVersion
    function(current, next) {
        validateParameterType('$validNextVersion', '$Version', current);
        validateParameterType('$validNextVersion', '$Version', next);
        return bali.probability(bali.version.validNextVersion(current, next));
    },

    // $version
    function(value, parameters) {
        return constructElement('$version', value, parameters);
    },

    // $xor
    function(first, second) {
        validateParameterAbstraction('$xor', '$Logical', first);
        validateParameterAbstraction('$xor', '$Logical', second);
        return first.constructor.xor(first, second);
    }

];


// PRIVATE FUNCTIONS

/*
 * This function returns the type name for the specified component
 */
function getType(component) {
    var reference;
    if (component.isType('$Catalog') && component.isParameterized()) {
        const value = component.getParameters().getParameter('$type');
        if (value && value.isType('$Name')) {
            // the type is a explicitly named type
            reference = value;
        }
    } else {
        // the type is the component type
        reference = bali.parse(bali.type(component));
    }
    return reference;
}


function constructElement(procedure, value, parameters) {
    if (value.isType('$Text')) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Text',
            $actual: procedure.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (!parameters.isType('$Parameters') && !parameters.isEqualTo(bali.pattern.NONE)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: parameters.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const element = bali[procedure.slice(1)](value, parameters);
    return element;
}


function constructSource(procedure, parameters) {
    if (!procedure.isProcedural()) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Tree',
            $actual: procedure.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (!parameters.isType('$Parameters') && !parameters.isEqualTo(bali.pattern.NONE)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: parameters.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const source = bali.source(procedure, parameters);
    return source;
}


function constructRange(first, last, parameters) {
    if (!first.isElement()) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$range',
            $exception: '$parameterType',
            $expected: '$Element',
            $actual: first.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (first.getType() !== last.getType()) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$range',
            $exception: '$parameterType',
            $expected: first.getType(),
            $actual: last.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (!parameters.isType('$Parameters') && !parameters.isEqualTo(bali.pattern.NONE)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$range',
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: parameters.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const range = bali.range(first, last, parameters);
    return range;
}


function constructTree(symbol) {
    if (!symbol.isType('$Symbol')) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$tree',
            $exception: '$parameterType',
            $expected: '$Symbol',
            $actual: symbol.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const tree = bali.tree(symbol.getType());
    return tree;
}


function constructCollection(procedure, parameters) {
    if (parameters && !parameters.isType('$Parameters') && !parameters.isEqualTo(bali.pattern.NONE)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: parameters.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const collection = bali[procedure.slice(1)](undefined, parameters);
    return collection;
}


function validateParameterType(procedure, type, parameter) {
    if (!parameter.isType(type)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: type,
            $actual: parameter.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
}


function validateParameterAbstraction(procedure, abstraction, parameter) {
    if (!(parameter['is' + abstraction.slice(1)]())) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: abstraction,
            $actual: parameter.getType(),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
}


function validateIndex(procedure, size, index) {
    index = Math.abs(index);
    if (index === 0 || index > size) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterValue',
            $expected: bali.range(1, size),
            $actual: index,
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
}
