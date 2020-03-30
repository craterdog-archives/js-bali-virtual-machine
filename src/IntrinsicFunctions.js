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
const bali = require('bali-component-framework').api();
const validator = bali.validator();

// This private constant sets the POSIX end of line character
const EOL = '\n';


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

    // $HTML
    function(component, style) {
        validateParameterType('$HTML', '$Reference', style);
        return bali.text(EOL + component.toHTML(style.getValue().toString()) + EOL);
    },

    // $addItem
    function(collection, item) {
        validateParameterInterface('$addItem', '$Collection', collection);
        collection.addItem(item);
        return collection;
    },

    // $addItems
    function(collection, items) {
        validateParameterInterface('$addItems', '$Collection', collection);
        validateParameterInterface('$addItems', '$Collection', items);
        collection.addItems(items);
        return collection;
    },

    // $ancestry
    function(component) {
        return bali.list(component.getAncestry());
    },

    // $and
    function(first, second) {
        validateParameterInterface('$and', '$Logical', first);
        validateParameterInterface('$and', '$Logical', second);
        validateAreSameTypes('$and', first, second);
        return first.constructor.and(first, second);
    },

    // $arccosine
    function(ratio) {
        validateParameterType('$arccosine', '$Number', ratio);
        return bali.angle.arccosine(ratio.toNumber());
    },

    // $arcsine
    function(ratio) {
        validateParameterType('$arcsine', '$Number', ratio);
        return bali.angle.arcsine(ratio.toNumber());
    },

    // $arctangent
    function(opposite, adjacent) {
        validateParameterType('$arctangent', '$Number', opposite);
        validateParameterType('$arctangent', '$Number', adjacent);
        return bali.angle.arctangent(opposite.toNumber(), adjacent.toNumber());
    },

    // $areEqual
    function(first, second) {
        return bali.probability(first.isEqualTo(second));
    },

    // $association
    function(key, value) {
        validateParameterInterface('$association', '$Element', key);
        return bali.association(key, value);
    },

    // $authority
    function(reference) {
        validateParameterType('$authority', '$Reference', reference);
        return bali.text(reference.getAuthority());
    },

    // $base2
    function(binary, indentation) {
        validateParameterType('$base2', '$Binary', binary);
        validateParameterType('$base2', '$Text', indentation);
        return bali.text(binary.toBase2(indentation.getValue()));
    },

    // $base16
    function(binary, indentation) {
        validateParameterType('$base16', '$Binary', binary);
        validateParameterType('$base16', '$Text', indentation);
        return bali.text(binary.toBase16(indentation.getValue()));
    },

    // $base32
    function(binary, indentation) {
        validateParameterType('$base32', '$Binary', binary);
        validateParameterType('$base32', '$Text', indentation);
        return bali.text(binary.toBase32(indentation.getValue()));
    },

    // $base64
    function(binary, indentation) {
        validateParameterType('$base64', '$Binary', binary);
        validateParameterType('$base64', '$Text', indentation);
        return bali.text(binary.toBase64(indentation.getValue()));
    },

    // $binary
    function(number, parameters) {
        validateParameterType('$binary', '$Number', number);
        validateParameterType('$binary', '$Catalog', parameters);
        const bytes = bali.generator.generateBytes(number.toNumber());
        return bali.binary(bytes, parameters.toObject());
    },

    // $boolean
    function(component) {
        validateParameterInterface('$boolean', '$Component', component);
        return bali.probability(component.toBoolean());
    },

    // $bytes
    function(tag) {
        validateParameterType('$bytes', '$Tag', tag);
        return bali.binary(tag.getBytes());
    },

    // $catalog
    function(items, parameters) {
        validateOptionalParameterInterface('$catalog', '$Collection', items);
        validateOptionalParameterType('$catalog', '$Catalog', parameters);
        return bali.catalog(items, parameters);
    },

    // $coinToss
    function(probability) {
        validateParameterType('$coinToss', '$Probability', probability);
        return bali.probability(bali.generator.flipCoin(probability.toNumber()));
    },

    // $comparison
    function(first, second) {
        validateAreSameTypes('$comparison', first, second);
        return bali.number(first.comparedTo(second));
    },

    // $complement
    function(angle) {
        validateParameterType('$complement', '$Angle', angle);
        return bali.angle.complement(angle);
    },

    // $component
    function(source) {
        validateParameterType('$component', '$Text', source);
        return bali.component(source.getValue());
    },

    // $concatenation
    function(first, second) {
        validateParameterInterface('$concatenation', '$Chainable', first);
        validateParameterInterface('$concatenation', '$Chainable', second);
        validateAreSameTypes('$concatenation', first, second);
        return first.constructor.concatenation(first, second);
    },

    // $conjugate
    function(number) {
        validateParameterType('$conjugate', '$Number', number);
        return bali.number.conjugate(number);
    },

    // $containsAll
    function(collection, items) {
        validateParameterInterface('$containsAll', '$Collection', collection);
        validateParameterInterface('$containsAll', '$Collection', items);
        return bali.probability(collection.containsAll(items));
    },

    // $containsAny
    function(collection, items) {
        validateParameterInterface('$containsAny', '$Collection', collection);
        validateParameterInterface('$containsAny', '$Collection', items);
        return bali.probability(collection.containsAny(items));
    },

    // $containsItem
    function(collection, item) {
        validateParameterInterface('$containsItem', '$Collection', collection);
        return bali.probability(collection.containsItem(item));
    },

    // $cosine
    function(angle) {
        validateParameterType('$cosine', '$Angle', angle);
        return bali.number(bali.angle.cosine(angle));
    },

    // $degrees
    function(angle) {
        validateParameterType('$degrees', '$Angle', angle);
        return bali.number(angle.getDegrees());
    },

    // $difference
    function(first, second) {
        validateParameterInterface('$difference', '$Scalable', first);
        validateParameterInterface('$difference', '$Scalable', second);
        validateAreSameTypes('$difference', first, second);
        return first.constructor.difference(first, second);
    },

    // $document
    function(component, indentation) {
        validateParameterType('$document', '$Text', indentation);
        return bali.text(EOL + component.toBDN(indentation.getValue()) + EOL);
    },

    // $duplicate
    function(component) {
        return component.duplicate();
    },

    // $duration
    function(firstMoment, lastMoment) {
        validateParameterType('$duration', '$Moment', firstMoment);
        validateParameterType('$duration', '$Moment', lastMoment);
        return bali.moment.duration(firstMoment, lastMoment);
    },

    // $earlier
    function(moment, duration) {
        validateParameterType('$earlier', '$Moment', moment);
        validateParameterType('$earlier', '$Duration', duration);
        return bali.moment.earlier(moment, duration);
    },

    // $exponential
    function(base, exponent) {
        validateParameterType('$exponential', '$Number', base);
        validateParameterType('$exponential', '$Number', exponent);
        return bali.number.exponential(base, exponent);
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
    function(moment) {
        validateParameterType('$format', '$Moment', moment);
        return bali.Text(moment.getFormat());
    },

    // $fragment
    function(reference) {
        validateParameterType('$fragment', '$Reference', reference);
        return bali.Text(reference.getFragment());
    },

    // $getFirst
    function(range) {
        validateParameterType('$getFirst', '$Range', range);
        return range.getFirstItem();
    },

    // $getHead
    function(queue) {
        validateParameterType('$getHead', '$Queue', queue);
        return queue.headItem();
    },

    // $getIndex
    function(collection, item) {
        validateParameterInterface('$getIndex', '$Collection', collection);
        return bali.number(collection.getIndex(item));
    },

    // $getItem
    function(collection, index) {
        validateParameterInterface('$getItem', '$Collection', collection);
        validateParameterType('$getItem', '$Number', index);
        validateIndex('$getItem', collection.getSize(), index);
        return collection.getItem(index.getNumber());
    },

    // $getItems
    function(collection, range) {
        validateParameterInterface('$getItems', '$Collection', collection);
        validateParameterType('$getItems', '$Range', range);
        return collection.getItems(range);
    },

    // $getLast
    function(range) {
        validateParameterType('$getLast', '$Range', range);
        return range.getLast();
    },

    // $getNext
    function(iterator) {
        validateParameterType('$getNext', '$Iterator', iterator);
        return iterator.getNext();
    },

    // $getParameter
    function(component, key) {
        validateParameterInterface('$getParameter', '$Element', key);
        return component.getParameter(key);
    },

    // $getParameters
    function(component) {
        return component.getParameters();
    },

    // $getPrevious
    function(iterator) {
        validateParameterType('$getPrevious', '$Iterator', iterator);
        return iterator.getNext();
    },

    // $getTop
    function(stack) {
        validateParameterType('$getTop', '$Stack', stack);
        return stack.topItem();
    },

    // $getValue
    function(catalog, key) {
        validateParameterType('$getValue', '$Catalog', catalog);
        validateParameterInterface('$getValue', '$Element', key);
        return catalog.getValue(key) || bali.pattern.NONE;
    },

    // $getValues
    function(catalog, keys) {
        validateParameterType('$getValues', '$Catalog', catalog);
        validateParameterType('$getValues', '$List', keys);
        return catalog.getValues(keys);
    },

    // $hasNext
    function(iterator) {
        validateParameterType('$hasNext', '$Iterator', iterator);
        return iterator.hasNext();
    },

    // $hasPrevious
    function(iterator) {
        validateParameterType('$hasPrevious', '$Iterator', iterator);
        return iterator.hasPrevious();
    },

    // $hash
    function(component) {
        return bali.number(component.getHash());
    },

    // $imaginary
    function(number) {
        validateParameterType('$imaginary', '$Number', number);
        return bali.number(number.getImaginary());
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
        validateParameterInterface('$insertItems', '$Collection', items);
        validateIndex('$insertItems', list.getSize(), index);
        list.insertItems(index.getNumber(), items);
        return list;
    },

    // $interfaces
    function(component) {
        return bali.list(component.getInterfaces());
    },

    // $inverse
    function(scalable) {
        validateParameterInterface('$inverse', '$Scalable', scalable);
        return scalable.constructor.inverse(scalable);
    },

    // $isEmpty
    function(sequential) {
        validateParameterInterface('$isEmpty', '$Sequential', sequential);
        return bali.probability(sequential.isEmpty());
    },

    // $isInfinite
    function(number) {
        validateParameterType('$isInfinite', '$Number', number);
        return bali.probability(number.isInfinite());
    },

    // $isParameterized
    function(component) {
        return bali.probability(component.isParameterized());
    },

    // $isType
    function(component, type) {
        validateParameterType('$isType', '$Name', type);
        return bali.probability(component.isType(type.toString()));
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

    // $key
    function(association) {
        validateParameterType('$key', '$Association', association);
        return association.getKey();
    },

    // $keys
    function(catalog) {
        validateParameterType('$keys', '$Catalog', catalog);
        return catalog.getKeys();
    },

    // $later
    function(moment, duration) {
        validateParameterType('$later', '$Moment', moment);
        validateParameterType('$later', '$Duration', duration);
        return bali.moment.later(moment, duration);
    },

    // $levels
    function(version) {
        validateParameterType('$levels', '$Version' , version);
        return bali.list(version.getValue());
    },

    // $list
    function(items, parameters) {
        validateOptionalParameterInterface('$list', '$Collection', items);
        validateOptionalParameterType('$list', '$Catalog', parameters);
        return bali.list(items, parameters);
    },

    // $logarithm
    function(number) {
        validateParameterType('$logarithm', '$Number', number);
        return bali.number.logarithm(number);
    },

    // $magnitude
    function(number) {
        validateParameterType('$magnitude', '$Number', number);
        return bali.number(number.getMagnitude());
    },

    // $matches
    function(component, pattern) {
        validateParameterType('$matches', '$Pattern', pattern);
        return bali.probability(component.isMatchedBy(pattern));
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
        validateParameterInterface('$not', '$Logical', logical);
        return logical.constructor.not(logical);
    },

    // $now
    function() {
        return bali.moment();
    },

    // $number
    function(numeric) {
        return bali.number(numeric.toNumber());
    },

    // $or
    function(first, second) {
        validateParameterInterface('$or', '$Logical', first);
        validateParameterInterface('$or', '$Logical', second);
        validateAreSameTypes('$or', first, second);
        return first.constructor.or(first, second);
    },

    // $parameters
    function(component) {
        return bali.catalog(component.getParameters());
    },

    // $parent
    function(tree) {
        validateParameterType('$parent', '$Tree', tree);
        return tree.getParent();
    },

    // $path
    function(reference) {
        validateParameterType('$path', '$Reference', reference);
        return bali.text(reference.getPath());
    },

    // $phase
    function(number) {
        validateParameterType('$phase', '$Number', number);
        return number.getPhase();
    },

    // $probability
    function() {
        return bali.probability.random();
    },

    // $procedure
    function(statements, parameters) {
        validateParameterType('$procedure', '$Tree', statements);
        validateParameterType('$procedure', '$Catalog', parameters);
        return bali.procedure(statements, parameters);
    },

    // $product
    function(first, second) {
        validateParameterType('$product', '$Number', first);
        validateParameterType('$product', '$Number', second);
        return bali.number.product(first, second);
    },

    // $query
    function(reference) {
        validateParameterType('$query', '$Reference', reference);
        return bali.text(reference.getQuery());
    },

    // $queue
    function(items, parameters) {
        validateOptionalParameterInterface('$queue', '$Collection', items);
        validateOptionalParameterType('$queue', '$Catalog', parameters);
        return bali.queue(items, parameters);
    },

    // $quotient
    function(first, second) {
        validateParameterType('$quotient', '$Number', first);
        validateParameterType('$quotient', '$Number', second);
        return bali.number.quotient(first, second);
    },

    // $radians
    function(angle) {
        validateParameterType('$radians', '$Angle', angle);
        return bali.number(angle.getRadians());
    },

    // $range
    function(first, last, parameters) {
        validateAreSameType('$range', first, last);
        validateOptionalParameterType('$range', '$Catalog', parameters);
        return bali.range(first, last, parameters);
    },

    // $real
    function(number) {
        validateParameterType('$real', '$Number', number);
        return bali.number(number.getReal());
    },

    // $reciprocal
    function(number) {
        validateParameterType('$reciprocal', '$Number', number);
        return bali.number.reciprocal(number);
    },

    // $remainder
    function(first, second) {
        validateParameterType('$remainder', '$Number', first);
        validateParameterType('$remainder', '$Number', second);
        return bali.number.remainder(first, second);
    },

    // $removeAll
    function(collection) {
        validateParameterInterface('$removeAll', '$Collection', collection);
        collection.removeAll();
        return collection;
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
        validateParameterInterface('$removeItems', '$Collection', items);
        return bali.number(set.removeItems(items));
    },

    // $removeRange
    function(list, range) {
        validateParameterType('$removeRange', '$List', list);
        validateParameterType('$removeRange', '$Range', range);
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
        validateParameterInterface('$removeValue', '$Element', key);
        return catalog.removeValue(key);
    },

    // $removeValues
    function(catalog, keys) {
        validateParameterType('$removeValues', '$Catalog', catalog);
        validateParameterType('$removeValues', '$List', keys);
        return catalog.removeValues(keys);
    },

    // $reverseItems
    function(sortable) {
        validateParameterInterface('$reverseItems', '$Sortable', sortable);
        sortable.reverseItems();
        return sortable;
    },

    // $sans
    function(first, second) {
        validateParameterInterface('$sans', '$Logical', first);
        validateParameterInterface('$sans', '$Logical', second);
        validateAreSameType('$sans', first, second);
        return first.constructor.sans(first, second);
    },

    // $scaled
    function(scalable, factor) {
        validateParameterInterface('$scaled', '$Scalable', scalable);
        validateParameterType('$scaled', '$Number', factor);
        return scalable.constructor.scaled(scalable, factor);
    },

    // $scheme
    function(reference) {
        validateParameterType('$scheme', '$Reference', reference);
        return bali.text(reference.getScheme());
    },

    // $set
    function(items, parameters) {
        validateOptionalParameterInterface('$set', '$Collection', items);
        validateOptionalParameterType('$set', '$Catalog', parameters);
        return bali.set(items, parameters);
    },

    // $setItem
    function(list, index, item) {
        validateParameterType('$setItem', '$List', list);
        validateParameterType('$setItem', '$Number', index);
        validateIndex('$setItem', list.getSize(), index);
        list.setItem(index, item);
        return list;
    },

    // $setValue
    function(catalog, key, value) {
        validateParameterType('$setValue', '$Catalog', catalog);
        validateParameterInterface('$setValue', '$Element', key);
        catalog.setValue(key, value);
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

    // $size
    function(sequential) {
        validateParameterInterface('$size', '$Sequential', sequential);
        return bali.number(sequential.getSize());
    },

    // $sortItems
    function(sortable) {
        validateParameterInterface('$sortItems', '$Sortable', sortable);
        sortable.sortItems();
        return sortable;
    },

    // $stack
    function(items, parameters) {
        validateOptionalParameterInterface('$stack', '$Collection', items);
        validateOptionalParameterType('$stack', '$Catalog', parameters);
        return bali.stack(items, parameters);
    },

    // $statements
    function(procedure) {
        validateParameterType('$statements', '$Procedure', procedure);
        return procedure.getStatements();
    },

    // $sum
    function(first, second) {
        validateParameterInterface('$sum', '$Scalable', first);
        validateParameterInterface('$sum', '$Scalable', second);
        validateAreSameType('$sum', first, second);
        return first.constructor.sum(first, second);
    },

    // $supplement
    function(angle) {
        validateParameterType('$supplement', '$Angle', angle);
        return bali.angle.supplement(angle);
    },

    // $supportsInterface
    function(component, iface) {
        validateParameterType('$supportsInterface', '$Name', iface);
        return component.supportsInterface(iface);
    },

    // $tag
    function(size) {
        validateOptionalParameterType('$tag', '$Number', size);
        return bali.tag(size);
    },

    // $tangent
    function(angle) {
        validateParameterType('$tangent', '$Angle', angle);
        return bali.number(bali.angle.tangent(angle));
    },

    // $toEnd
    function(iterator) {
        validateParameterType('$toEnd', '$Iterator', iterator);
        iterator.toEnd();
        return iterator;
    },

    // $toSlot
    function(iterator, slot) {
        validateParameterType('$toSlot', '$Iterator', iterator);
        validateParameterType('$toSlot', '$Number', slot);
        iterator.toSlot(slot);
        return iterator;
    },

    // $toStart
    function(iterator) {
        validateParameterType('$toStart', '$Iterator', iterator);
        iterator.toStart();
        return iterator;
    },

    // $tree
    function(type, children) {
        validateParameterType('$tree', '$Name', type);
        validateOptionalParameterInterface('$tree', '$Collection', children);
        return bali.tree(type, children);
    },

    // $type
    function(component) {
        return bali.component(component.getType());
    },

    // $validNextVersion
    function(current, next) {
        validateParameterType('$validNextVersion', '$Version', current);
        validateParameterType('$validNextVersion', '$Version', next);
        return bali.probability(bali.version.validNextVersion(current, next));
    },

    // $value
    function(association) {
        validateParameterType('$value', '$Association', association);
        return association.getValue();
    },

    // $xor
    function(first, second) {
        validateParameterInterface('$xor', '$Logical', first);
        validateParameterInterface('$xor', '$Logical', second);
        validateAreSameType('$xor', first, second);
        return first.constructor.xor(first, second);
    }

];


// PRIVATE FUNCTIONS

function validateParameterType(procedure, type, parameter) {
    if (!parameter.isType(type)) {
        throw bali.exception({
            $module: '/bali/vm/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: type,
            $actual: parameter.getAncestry(),
            $message: 'A parameter passed into an intrinsic function does not have the required ancestry.'
        });
    }
}


function validateOptionalParameterType(procedure, type, parameter) {
    if (parameter && !parameter.isEqualTo(bali.pattern.NONE)) {
        validateParameterType(procedure, type, parameter);
    }
}


function validateParameterInterface(procedure, iface, parameter) {
    if (!parameter.supportsInterface(iface)) {
        throw bali.exception({
            $module: '/bali/vm/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterType',
            $expected: iface,
            $actual: parameter.getType(),
            $message: 'A parameter passed into an intrinsic function does not support a required interface.'
        });
    }
}


function validateOptionalParameterInterface(procedure, iface, parameter) {
    if (parameter && !parameter.isEqualTo(bali.pattern.NONE)) {
        validateParameterInterface(procedure, iface, parameter);
    }
}


function validateIndex(procedure, size, index) {
    index = Math.abs(index);
    if (index === 0 || index > size) {
        throw bali.exception({
            $module: '/bali/vm/Intrinsics',
            $procedure: procedure,
            $exception: '$parameterValue',
            $expected: bali.range(1, size),
            $actual: index,
            $message: 'An invalid index was passed into an intrinsic function.'
        });
    }
}
