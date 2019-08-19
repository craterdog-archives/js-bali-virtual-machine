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
    return functions[index](args);
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
        validateParameterType('$addChild', bali.types.TREE, tree);
        tree.addChild(child);
        return tree;
    },

    // $addItem
    function(collection, item) {
        validateParameterAbstraction('$addItem', bali.Collection, collection);
        collection.addItem(item);
        return collection;
    },

    // $addItems
    function(collection, items) {
        validateParameterAbstraction('$addItems', bali.Collection, collection);
        collection.addItems(items);
        return collection;
    },

    // $and
    function(first, second) {
        validateParameterAspect('$and', '$Logical', first);
        validateParameterAspect('$and', '$Logical', second);
        return first.constructor.and(first, second);
    },

    // $angle
    function(value, parameters) {
        return constructElement('$angle', value, parameters);
    },

    // $arccosine
    function(ratio) {
        validateParameterType('$arccosine', bali.types.NUMBER, ratio);
        const angle = bali.angle.arccosine(ratio.toNumber());
        return angle;
    },

    // $arcsine
    function(ratio) {
        validateParameterType('$arcsine', bali.types.NUMBER, ratio);
        const angle = bali.angle.arcsine(ratio.toNumber());
        return angle;
    },

    // $arctangent
    function(opposite, adjacent) {
        validateParameterType('$arctangent', bali.types.NUMBER, opposite);
        validateParameterType('$arctangent', bali.types.NUMBER, adjacent);
        const angle = bali.angle.arctangent(opposite.toNumber(), adjacent.toNumber());
        return angle;
    },

    // $association
    function(key, value) {
        validateParameterAbstraction('$association', bali.Element, key);
        const association = bali.association(key, value);
        return association;
    },

    // $base2
    function(binary, indentation) {
        validateParameterType('$base2', bali.types.BINARY, binary);
        validateParameterType('$base2', bali.types.TEXT, indentation);
        return bali.text(binary.toBase2(indentation.toString()));
    },

    // $base16
    function(binary, indentation) {
        validateParameterType('$base16', bali.types.BINARY, binary);
        validateParameterType('$base16', bali.types.TEXT, indentation);
        return bali.text(binary.toBase16(indentation.toString()));
    },

    // $base32
    function(binary, indentation) {
        validateParameterType('$base32', bali.types.BINARY, binary);
        validateParameterType('$base32', bali.types.TEXT, indentation);
        return bali.text(binary.toBase32(indentation.toString()));
    },

    // $base64
    function(binary, indentation) {
        validateParameterType('$base64', bali.types.BINARY, binary);
        validateParameterType('$base64', bali.types.TEXT, indentation);
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
        validateParameterType('$complement', bali.types.ANGLE, angle);
        return bali.angle.complement(angle);
    },

    // $concatenation
    function(first, second) {
        validateParameterAspect('$concatenation', '$Chainable', first);
        validateParameterAspect('$concatenation', '$Chainable', second);
        return first.constructor.concatenation(first, second);
    },

    // $conjugate
    function(number) {
        validateParameterType('$conjugate', bali.types.NUMBER, number);
        return bali.number.conjugate(number);
    },

    // $containsAll
    function(collection, items) {
        validateParameterAbstraction('$containsAll', bali.Collection, collection);
        validateParameterAspect('$containsAll', '$Sequential', items);
        const result = bali.probability(collection.containsAll(items));
        return result;
    },

    // $containsAny
    function(collection, items) {
        validateParameterAbstraction('$containsAny', bali.Collection, collection);
        validateParameterAspect('$containsAny', '$Sequential', items);
        const result = bali.probability(collection.containsAny(items));
        return result;
    },

    // $containsItem
    function(collection, item) {
        validateParameterAbstraction('$containsItem', bali.Collection, collection);
        const result = bali.probability(collection.containsItem(item));
        return result;
    },

    // $cosine
    function(angle) {
        validateParameterType('$cosine', bali.types.ANGLE, angle);
        return bali.number(bali.angle.cosine(angle));
    },

    // $default
    function(proposedValue, defaultValue) {
        return proposedValue.isEqualTo(bali.NONE) ? defaultValue : proposedValue;
    },

    // $deleteAll
    function(collection) {
        validateParameterAbstraction('$deleteAll', bali.Collection, collection);
        collection.deleteAll();
        return collection;
    },

    // $difference
    function(first, second) {
        validateParameterAspect('$difference', '$Scalable', first);
        validateParameterAspect('$difference', '$Scalable', second);
        return first.constructor.difference(first, second);
    },

    // $duration
    function(value, parameters) {
        return constructElement('$duration', value, parameters);
    },

    // $earlier
    function(moment, duration) {
        validateParameterType('$earlier', bali.types.MOMENT, moment);
        validateParameterType('$earlier', bali.types.DURATION, duration);
        return bali.moment.earlier(moment, duration);
    },

    // $exponential
    function(number) {
        validateParameterType('$exponential', bali.types.NUMBER, number);
        return bali.number.exponential(number);
    },

    // $extraction
    function(catalog, keys) {
        validateParameterType('$extraction', bali.types.CATALOG, catalog);
        validateParameterType('$extraction', bali.types.LIST, keys);
        return bali.catalog.extraction(catalog, keys);
    },

    // $factorial
    function(number) {
        validateParameterType('$factorial', bali.types.NUMBER, number);
        return bali.number.factorial(number);
    },

    // $format
    function(component, indentation) {
        validateParameterType('$format', bali.types.TEXT, indentation);
        return bali.text(bali.format(component, indentation.getValue()));
    },

    // $getAssociationKey
    function(association) {
        validateParameterType('$getAssociationKey', bali.types.ASSOCIATION, association);
        return association.getKey();
    },

    // $getAssociationValue
    function(association) {
        validateParameterType('$getAssociationValue', bali.types.ASSOCIATION, association);
        return association.getValue();
    },

    // $getAssociations
    function(catalog) {
        validateParameterType('$getAssociations', bali.types.CATALOG, catalog);
        return catalog.getAssociations();
    },

    // $getBytes
    function(tag) {
        validateParameterType('$getBytes', bali.types.TAG, tag);
        return bali.binary(tag.getBytes());
    },

    // $getChild
    function(tree, index) {
        validateParameterType('$getChild', bali.types.TREE, tree);
        validateParameterType('$getChild', bali.types.NUMBER, index);
        validateIndex('$getChild', tree.getSize(), index);
        return tree.getChild(index.toNumber());
    },

    // $getDegrees
    function(angle) {
        validateParameterType('$getDegrees', bali.types.ANGLE, angle);
        return bali.number(angle.getDegrees());
    },

    // $getFirst
    function(range) {
        validateParameterType('$getFirst', bali.types.RANGE, range);
        return range.getFirst();
    },

    // $getHash
    function(component) {
        return bali.number(component.getHash());
    },

    // $getHead
    function(queue) {
        validateParameterType('$getHead', bali.types.QUEUE, queue);
        return queue.getHead();
    },

    // $getImaginary
    function(number) {
        validateParameterType('$getImaginary', bali.types.NUMBER, number);
        return bali.number(number.getImaginary());
    },

    // $getIndex
    function(collection, item) {
        validateParameterAbstraction('$getIndex', bali.Collection, collection);
        return bali.number(collection.getIndex(item));
    },

    // $getItem
    function(collection, index) {
        validateParameterAbstraction('$getItem', bali.Collection, collection);
        validateParameterType('$getItem', bali.types.NUMBER, index);
        validateIndex('$getItem', collection.getSize(), index);
        return collection.getItem(index.getNumber());
    },

    // $getItems
    function(collection, first, last) {
        validateParameterAbstraction('$getItems', bali.Collection, collection);
        validateParameterType('$getItems', bali.types.NUMBER, first);
        validateParameterType('$getItems', bali.types.NUMBER, last);
        validateIndex('$getItems', collection.getSize(), first);
        validateIndex('$getItems', collection.getSize(), last);
        return collection.getItems(first, last);
    },

    // $getKeys
    function(catalog) {
        validateParameterType('$getKeys', bali.types.CATALOG, catalog);
        return catalog.getKeys();
    },

    // $getLast
    function(range) {
        validateParameterType('$getLast', bali.types.RANGE, range);
        return range.getLast();
    },

    // $getLevels
    function(version) {
        validateParameterType('$getLevels', bali.types.VERSION , version);
        return bali.list(version.getValue());
    },

    // $getMagnitude
    function(number) {
        validateParameterType('$getMagnitude', bali.types.NUMBER, number);
        return bali.number(number.getMagnitude());
    },

    // $getParameter
    function(parameters, key, index) {
        validateParameterType('$getParameter', bali.types.PARAMETERS, parameters);
        validateParameterAbstraction('$getParameter', bali.Element, key);
        validateParameterType('$getParameter', bali.types.NUMBER, index);
        validateIndex('$getParameter', parameters.getSize(), index);
        return parameters.getParameter(key, index);
    },

    // $getParameters
    function(component) {
        return component.getParameters();
    },

    // $getParent
    function(tree) {
        validateParameterType('$getParent', bali.types.TREE, tree);
        return tree.getParent();
    },

    // $getPhase
    function(number) {
        validateParameterType('$getPhase', bali.types.NUMBER, number);
        return number.getPhase();
    },

    // $getProcedure
    function(source) {
        validateParameterType('$getProcedure', bali.types.SOURCE, source);
        return source.getProcedure();
    },

    // $getRadians
    function(angle) {
        validateParameterType('$getRadians', bali.types.ANGLE, angle);
        return bali.number(angle.getRadians());
    },

    // $getReal
    function(number) {
        validateParameterType('$getReal', bali.types.NUMBER, number);
        return bali.number(number.getReal());
    },

    // $getSize
    function(sequence) {
        validateParameterAspect('$getSize', '$Sequential', sequence);
        return bali.number(sequence.getSize());
    },

    // $getTop
    function(stack) {
        validateParameterType('$getTop', bali.types.STACK, stack);
        return stack.getTop();
    },

    // $getType
    function(component) {
        return bali.parse(getType(component));
    },

    // $getValue
    function(catalog, key) {
        validateParameterType('$getValue', bali.types.CATALOG, catalog);
        validateParameterAbstraction('$getValue', bali.Element, key);
        return catalog.getValue(key) || bali.NONE;
    },

    // $getValues
    function(catalog, keys) {
        validateParameterType('$getValues', bali.types.CATALOG, catalog);
        validateParameterType('$getValues', bali.types.LIST, keys);
        return catalog.getValues(keys);
    },

    // $insertItem
    function(list, index, item) {
        validateParameterType('$insertItem', bali.types.LIST, list);
        validateParameterType('$insertItem', bali.types.NUMBER, index);
        validateIndex('$insertItem', list.getSize(), index);
        list.insertItem(index.getNumber(), item);
        return list;
    },

    // $insertItems
    function(list, index, items) {
        validateParameterType('$insertItems', bali.types.LIST, list);
        validateParameterType('$insertItems', bali.types.NUMBER, index);
        validateParameterAbstraction('$insertItems', bali.Collection, items);
        validateIndex('$insertItems', list.getSize(), index);
        list.insertItems(index.getNumber(), items);
        return list;
    },

    // $inverse
    function(scalable) {
        validateParameterAspect('$inverse', '$Scalable', scalable);
        return scalable.constructor.inverse(scalable);
    },

    // $isEmpty
    function(sequence) {
        validateParameterAspect('$isEmpty', '$Sequential', sequence);
        return bali.probability(sequence.isEmpty());
    },

    // $isEqualTo
    function(first, second) {
        return bali.probability(first.isEqualTo(second));
    },

    // $isInRange
    function(range, item) {
        validateParameterType('$isInRange', bali.types.RANGE, range);
        return bali.probability(range.isInRange(item));
    },

    // $isInfinite
    function(number) {
        validateParameterType('$isInfinite', bali.types.NUMBER, number);
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
        validateParameterType('$isUndefined', bali.types.NUMBER, number);
        return bali.probability(number.isUndefined());
    },

    // $isZero
    function(number) {
        validateParameterType('$isZero', bali.types.NUMBER, number);
        return bali.probability(number.isZero());
    },

    // $later
    function(moment, duration) {
        validateParameterType('$later', bali.types.MOMENT, moment);
        validateParameterType('$later', bali.types.DURATION, duration);
        return bali.moment.later(moment, duration);
    },

    // $list
    function(parameters) {
        return constructCollection('$list', parameters);
    },

    // $literal
    function(element, format) {
        validateParameterAbstraction('$literal', bali.Element, element);
        validateParameterType('$literal', bali.types.SYMBOL, format);
        return bali.text(new bali.Formatter().formatLiteral(element, format.getValue()));
    },

    // $logarithm
    function(number) {
        validateParameterType('$logarithm', bali.types.NUMBER, number);
        return bali.number.logarithm(number);
    },

    // $moment
    function(value, parameters) {
        return constructElement('$moment', value, parameters);
    },

    // $nextVersion
    function(version, level) {
        validateParameterType('$nextVersion', bali.types.VERSION, version);
        validateParameterType('$nextVersion', bali.types.NUMBER, level);
        validateIndex('$nextVersion', version.getSize() + 1, level);  // allow for the next subversion
        return bali.version.nextVersion(version, level);
    },

    // $not
    function(logical) {
        validateParameterAspect('$not', '$Logical', logical);
        return logical.constructor.not(logical);
    },

    // $number
    function(value, parameters) {
        return constructElement('$number', value, parameters);
    },

    // $or
    function(first, second) {
        validateParameterAspect('$or', '$Logical', first);
        validateParameterAspect('$or', '$Logical', second);
        return first.constructor.or(first, second);
    },

    // $parameters
    function(collection) {
        validateParameterAbstraction('$parameters', bali.Collection, collection);
        return bali.parameters(collection);
    },

    // $parse
    function(document, parameters, debug) {
        validateParameterType('$parse', bali.types.TEXT, document);
        validateParameterType('$parse', bali.types.PARAMETERS, parameters);
        validateParameterType('$parse', bali.types.PROBABILITY, debug);
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
        validateParameterType('$period', bali.types.MOMENT, first);
        validateParameterType('$period', bali.types.MOMENT, second);
        return bali.moment.period(first, second);
    },

    // $polar
    function(number) {
        validateParameterType('$polar', bali.types.NUMBER, number);
        return bali.text(number.toPolar());
    },

    // $probability
    function(value, parameters) {
        return constructElement('$probability', value, parameters);
    },

    // $product
    function(first, second) {
        validateParameterAspect('$product', '$Numerical', first);
        validateParameterAspect('$product', '$Numerical', second);
        return first.constructor.product(first, second);
    },

    // $queue
    function(parameters) {
        return constructCollection('$queue', parameters);
    },

    // $quotient
    function(first, second) {
        validateParameterAspect('$quotient', '$Numerical', first);
        validateParameterAspect('$quotient', '$Numerical', second);
        return first.constructor.quotient(first, second);
    },

    // $randomBytes
    function(numberOfBytes) {
        validateParameterType('$randomBytes', bali.types.NUMBER, numberOfBytes);
        return bali.binary(bali.random.bytes(numberOfBytes));
    },

    // $randomCoinToss
    function(weighting) {
        validateParameterType('$randomCoinToss', bali.types.PROBABILITY, weighting);
        return bali.probability(bali.random.coinToss(weighting.toNumber()));
    },

    // $randomIndex
    function(length) {
        validateParameterType('$randomIndex', bali.types.NUMBER, length);
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
        validateParameterType('$reciprocal', bali.types.NUMBER, number);
        return bali.number.reciprocal(number);
    },

    // $rectangular
    function(number) {
        validateParameterType('$rectangular', bali.types.NUMBER, number);
        return bali.text(number.toRectangular());
    },

    // $reference
    function(value, parameters) {
        return constructElement('$reference', value, parameters);
    },

    // $remainder
    function(first, second) {
        validateParameterAspect('$remainder', '$Numerical', first);
        validateParameterAspect('$remainder', '$Numerical', second);
        return first.constructor.remainder(first, second);
    },

    // $removeHead
    function(queue) {
        validateParameterType('$removeHead', bali.types.QUEUE, queue);
        return queue.removeItem();
    },

    // $removeIndex
    function(list, index) {
        validateParameterType('$removeIndex', bali.types.LIST, list);
        validateParameterType('$removeIndex', bali.types.NUMBER, index);
        validateIndex('$removeIndex', list.getSize(), index);
        return list.removeItem(index);
    },

    // $removeItem
    function(set, item) {
        validateParameterType('$removeItem', bali.types.SET, set);
        return bali.probability(set.removeItem(item));
    },

    // $removeItems
    function(set, items) {
        validateParameterType('$removeItems', bali.types.SET, set);
        validateParameterAbstraction('$removeItems', bali.Collection, items);
        return bali.number(set.removeItems(items));
    },

    // $removeRange
    function(list, range) {
        validateParameterType('$removeIndex', bali.types.LIST, list);
        validateParameterType('$removeIndex', bali.types.RANGE, range);
        return list.removeItems(range);
    },

    // $removeTop
    function(stack) {
        validateParameterType('$removeTop', bali.types.STACK, stack);
        return stack.removeItem();
    },

    // $removeValue
    function(catalog, key) {
        validateParameterType('$removeValue', bali.types.CATALOG, catalog);
        validateParameterAbstraction('$removeValue', bali.Element, key);
        return catalog.removeValue(key);
    },

    // $removeValues
    function(catalog, keys) {
        validateParameterType('$removeValues', bali.types.CATALOG, catalog);
        validateParameterType('$removeValues', bali.types.LIST, keys);
        return catalog.removeValues(keys);
    },

    // $reverseAssociations
    function(catalog) {
        validateParameterType('$reverseAssociations', bali.types.CATALOG, catalog);
        catalog.reverseItems();
        return catalog;
    },

    // $reverseItems
    function(list) {
        validateParameterType('$reverseItems', bali.types.LIST, list);
        list.reverseItems();
        return list;
    },

    // $sans
    function(first, second) {
        validateParameterAspect('$sans', '$Logical', first);
        validateParameterAspect('$sans', '$Logical', second);
        return first.constructor.sans(first, second);
    },

    // $scaled
    function(scalable, factor) {
        validateParameterAspect('$scaled', '$Scalable', scalable);
        validateParameterAspect('$factor', '$Numerical', factor);
        return scalable.constructor.scaled(scalable, factor);
    },

    // $set
    function(parameters) {
        return constructCollection('$set', parameters);
    },

    // $setAssociationValue
    function(association, value) {
        validateParameterType('$setAssociationValue', bali.types.ASSOCIATION, association, value);
        return association.setValue(value);
    },

    // $setItem
    function(list, index, item) {
        validateParameterType('$setItem', bali.types.LIST, list);
        validateParameterType('$setItem', bali.types.NUMBER, index);
        validateIndex('$setItem', list.getSize(), index);
        list.setItem(index, item);
        return list;
    },

    // $setParameters
    function(element, parameters) {
        validateParameterAbstraction('$setParameters', bali.Element, element);
        element.setParameters(parameters);
        return element;
    },

    // $setValue
    function(catalog, key, value) {
        validateParameterType('$setValue', bali.types.CATALOG, catalog);
        validateParameterAbstraction('$setValue', bali.Element, key);
        catalog.setValue(key, value);
        return catalog;
    },

    // $setValues
    function(catalog, values) {
        validateParameterType('$setValues', bali.types.CATALOG, catalog);
        validateParameterType('$setValues', bali.types.CATALOG, values);
        catalog.setValues(values);
        return catalog;
    },

    // $shuffleItems
    function(list) {
        validateParameterType('$shuffleItems', bali.types.LIST, list);
        list.shuffleItems();
        return list;
    },

    // $sine
    function(angle) {
        validateParameterType('$sine', bali.types.ANGLE, angle);
        return bali.number(bali.angle.sine(angle));
    },

    // $sortAssociations
    function(catalog) {
        validateParameterType('$sortAssociations', bali.types.CATALOG, catalog);
        catalog.sortItems();
        return catalog;
    },

    // $sortItems
    function(list) {
        validateParameterType('$sortItems', bali.types.LIST, list);
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
        validateParameterAspect('$sum', '$Scalable', first);
        validateParameterAspect('$sum', '$Scalable', second);
        return first.constructor.sum(first, second);
    },

    // $supplement
    function(angle) {
        validateParameterType('$supplement', bali.types.ANGLE, angle);
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
        validateParameterType('$tangent', bali.types.ANGLE, angle);
        return bali.number(bali.angle.tangent(angle));
    },

    // $text
    function(value, parameters) {
        return constructElement('$text', value, parameters);
    },

    // $tree
    function(type, complexity) {
        return constructTree(type, complexity);
    },

    // $validNextVersion
    function(current, next) {
        validateParameterType('$validNextVersion', bali.types.VERSION, current);
        validateParameterType('$validNextVersion', bali.types.VERSION, next);
        return bali.probability(bali.version.validNextVersion(current, next));
    },

    // $version
    function(value, parameters) {
        return constructElement('$version', value, parameters);
    },

    // $xor
    function(first, second) {
        validateParameterAspect('$xor', '$Logical', first);
        validateParameterAspect('$xor', '$Logical', second);
        return first.constructor.xor(first, second);
    }

];


// PRIVATE FUNCTIONS

function getType(component) {
    var reference;
    var type = component.getTypeId();
    if (type === bali.types.CATALOG && component.isParameterized()) {
        const value = component.getParameters().getParameter('$type');
        const formatter = new bali.Formatter();
        const string = formatter.formatLiteral(value);
        if (value && value.getTypeId() === bali.types.SYMBOL) {
            // the value is a symbol for a system type
            reference = bali.types.typeForSymbol(string);
        } else {
            // the value is a reference to a user defined type
            reference = string;
        }
    } else {
        // the type is a system type
        reference = bali.types.typeReference(type);
    }
    return reference;
}


function constructElement(procedure, value, parameters) {
    if (value.getTypeId() !== bali.types.TEXT) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Text',
            $actual: bali.types.symbolForType(value.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (parameters.getTypeId() !== bali.types.PARAMETERS && parameters !== bali.NONE) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: bali.types.symbolForType(parameters.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const element = bali[procedure.slice(1)](value, parameters);
    return element;
}


function constructSource(procedure, parameters) {
    if (procedure.getTypeId() !== bali.types.TREE) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Tree',
            $actual: bali.types.symbolForType(procedure.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (parameters.getTypeId() !== bali.types.PARAMETERS && parameters !== bali.NONE) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: bali.types.symbolForType(parameters.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const source = bali.source(procedure, parameters);
    return source;
}


function constructRange(first, last, parameters) {
    if (!(first instanceof bali.Element)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$range',
            $exception: '$parameterType',
            $expected: '$Element',
            $actual: bali.types.symbolForType(first.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (first.getTypeId() !== last.getTypeId()) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$range',
            $exception: '$parameterType',
            $expected: bali.types.symbolForType(first.getTypeId()),
            $actual: bali.types.symbolForType(last.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (parameters.getTypeId() !== bali.types.PARAMETERS && parameters !== bali.NONE) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$range',
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: bali.types.symbolForType(parameters.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const range = bali.range(first, last, parameters);
    return range;
}


function constructTree(symbol, complexity) {
    if (symbol.getTypeId() !== bali.types.SYMBOL) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$tree',
            $exception: '$parameterType',
            $expected: '$Symbol',
            $actual: bali.types.symbolForType(symbol.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    if (complexity.getTypeId() !== bali.types.NUMBER) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: '$tree',
            $exception: '$parameterType',
            $expected: '$Number',
            $actual: bali.types.symbolForType(complexity.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const tree = bali.tree(bali.types.typeForSymbol(symbol), complexity.toNumber());
    return tree;
}


function constructCollection(procedure, parameters) {
    if (parameters && parameters.getTypeId() !== bali.types.PARAMETERS && !parameters.isEqualTo(bali.NONE)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$Parameters',
            $actual: bali.types.symbolForType(parameters.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
    const collection = bali[procedure.slice(1)](undefined, parameters);
    return collection;
}


function validateParameterType(procedure, type, parameter) {
    if (parameter.getTypeId() !== type) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: bali.types.symbolForType(type),
            $actual: bali.types.symbolForType(parameter.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
}


function validateParameterAbstraction(procedure, abstraction, parameter) {
    if (!(parameter instanceof abstraction)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: '$' + abstraction.name,
            $actual: bali.types.symbolForType(parameter.getTypeId()),
            $message: 'An invalid parameter type was passed into an intrinsic function.'
        });
    }
}


function validateParameterAspect(procedure, aspect, parameter) {
    const type = parameter.getTypeId();
    if (!bali.types['is' + aspect.slice(1)](type)) {
        throw bali.exception({
            $module: '/bali/compiler/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: aspect,
            $actual: bali.types.symbolForType(type),
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
