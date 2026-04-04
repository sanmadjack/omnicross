"use strict";

/**
 * 
 * @param {any} value 
 * @returns {boolean}
 */
export function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

export function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (isString(value)) {
        return value == "";
    }
    return count(value) == 0;
}

/**
 * 
 * @param {*} input 
 * @returns {number}}
 */
export function count(input) {
    if (input instanceof Set || input instanceof Map) {
        return input.size;
    }
    if (Array.isArray(input)) {
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
export function areSetsSame(a, b) {
    if (a === b) {
        // These are the same set object
        return true;
    }
    if (a.size !== b.size) {
        return false
    }
    let same = true;
    a.forEach(aValue => {
        if (!b.has(aValue)) {
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
    Array.from(input.values()).sort(sortByName).forEach(v => {
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
 * @param {Set} input 
 * @returns {Set}
 */
export function sortSetByNumber(input) {
    return new Set([...input].sort(sortByNumber));
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
export function sortByName(a, b) {
    return a.sortableName.localeCompare(b.sortableName);
}
/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns {number}
 */
export function sortByNumber(a, b) {
    return a.number - b.number;
}
/**
 * 
 * @param {string} input 
 * @returns {string}
 */
export function calculateSortableName(input) {
    let output = input.toLowerCase();
    if (output.startsWith("the ")) {
        output = output.substring(4) + ", " + output.substring(0, 4);
    }
    return output;
}

/**
 * 
 * @param {string} content 
 * @param {string} fileName 
 */
export function downloadJsonFile(content, fileName) {
    const blob = new Blob([content], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}