"use strict";

/**
 * 
 * @param {any} value 
 * @returns {boolean}
 */
export function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

/**
 * 
 * @param {*} input 
 * @returns {number}}
 */
export function count(input)
{
    if(input instanceof Set || input instanceof Map) {
        return input.size;
    }
    if(Array.isArray(input)) {
        return input.length;
    }
    return input.length;
}

/**
 * 
 * @param {Set} a 
 * @param {Set} b 
 * @returns {boolean}
 */
export function areSetsSame(a,b) {
    if(a===b) {
        // These are the same set object
        return true;
    }
    if(a.size!==b.size) {
        return false
    }
    const same = true;
    a.forEach(aValue=> {
        if(!b.has(aValue)) {
            same = false;
        }
    });
    return same;
}

/**
 * 
 * @param {Map} input 
 * @returns {Map}
 */
export function sortMapByName(input) {
    let output = new Map();
    Array.from(input.values()).sort(sortByName).forEach(v=>{
        output.set(v.id, v);
    });
    return output;
}
/**
 * 
 * @param {Set} input 
 * @returns {Set}
 */
export function sortSetByName(input) {
    return new Set([...input].sort(sortByName));
}
/**
 * 
 * @param {Array} input 
 * @returns {Array}
 */
export function sortArrayByName(input) {
    return input.sort(sortByName);
}

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns {number}
 */
export function sortByName(a,b) {    
    return a.sortableName.localeCompare(b.sortableName);
}
/**
 * 
 * @param {string} input 
 * @returns {string}
 */
export function calculateSortableName(input) {
    let output = input.toLowerCase();
    if(output.startsWith("the ")) {
        output = output.substring(4) + ", " + output.substring(0, 4);
    }
    return output;
}
