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