"use strict";

import { count, sortByName, sortSetByNumber } from "../tools.js";
import { SeriesViewerElement, IssueViewerElement, CompilationViewerElement, ComparisonViewerElement, CompilationBrowserEntryElement } from "./components.js";
import { Compilation, Database, Issue, SavedData, Comparison, ComparitorResult } from "./data.js";


export const idRegex = /[0-9a-f]{9}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/


/** @type {Map<string,SeriesViewerElement>} */
let windowCache = new Map();

/**
 * 
 * @param {Database} database 
 * @param {Series} series 
 * @param {number} x 
 * @param {number} y 
 * @returns {SeriesViewerElement}
 */
export function openSeriesViewer(database, data, x, y) {
    let element;
    if (windowCache.has(data.id)) {
        element = windowCache.get(data.id);
    }
    else {
        element = new SeriesViewerElement(database, data);
        document.body.appendChild(element);
        windowCache.set(data.id, element);
    }
    element.popup.show(x, y);
    return element;
}

/**
 * 
 * @param {Database} database 
 * @param {Issue} data 
 * @param {number} x 
 * @param {number} y 
 * @returns {IssueViewerElement}
 */
export function openIssueViewer(database, data, x, y) {
    let element;
    if (windowCache.has(data.id)) {
        element = windowCache.get(data.id);
    }
    else {
        element = new IssueViewerElement(database, data);
        document.body.appendChild(element);
        windowCache.set(data.id, element);
    }
    element.popup.show(x, y);
    return element;
}

/**
 * 
 * @param {Database} database 
 * @param {Compilation} data 
 * @param {number} x 
 * @param {number} y 
 * @returns {CompilationViewerElement}
 */
export function openCompilationViewer(database, data, x, y) {
    let element;
    if (windowCache.has(data.id)) {
        element = windowCache.get(data.id);
    }
    else {
        element = new CompilationViewerElement(database, data);
        document.body.appendChild(element);
        windowCache.set(data.id, element);
    }
    element.popup.show(x, y);
    return element;
}
/**
 * 
 * @param {Database} database 
 * @param {ComparitorResult} data 
 * @param {SavedData} saveData 
 * @param {number} x 
 * @param {number} y 
 * @returns {ComparisonViewerElement}
 */
export function openComparisonViewer(database, data, saveData, x, y) {
    const element = new ComparisonViewerElement(database, data, saveData);
    /** @type {HTMLDivElement} */
    const parent = document.getElementById("comparisonList");
    parent.appendChild(element);
    element.popup.show();
    return element;
}

/**
 * 
 * @param {Database} database 
 * @param {Issue} issue 
 * @param {ComparitorResult} result 
 * @returns {HTMLAnchorElement}
 */
export function createIssueLink(database, issue, result) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = issue.number;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openIssueViewer(database, issue, e.clientX, e.clientY);
    };
    if (result != null) {
        if (result.overlappingIssues.has(issue.id)) {
            anchorElement.classList.add("overlapping");
        } else {
            anchorElement.classList.add("unique");
        }
    }
    return anchorElement;
}
/**
 * 
 * @param {Database} database 
 * @param {HTMLElement} parentElement 
 * @param {Set<string>} issueIds 
 * @param {Set<string>} partialIds 
 * @param {ComparitorResult} result 
 */
export function createIssueLinkListById(database, parentElement,
    issueIds, partialIds, result) {

    /** @type {Set<Issue>} */
    let issues = new Set();
    issueIds.forEach(v => {
        const issue = database.getIssueById(v);
        issues.add(issue);
    });
    createIssueLinkList(database, parentElement, issues, partialIds, result);
}
/**
 * 
 * @param {Database} database 
 * @param {HTMLElement} parentElement 
 * @param {Set<Issue>} issues 
 * @param {Set<string>} partialIds 
 * @param {ComparitorResult} result 
 */
export function createIssueLinkList(database, parentElement,
    issues, partialIds, result) {
    let i = 0;
    sortSetByNumber(issues).forEach(issue => {
        i++;
        const anchorElement = createIssueLink(database, issue, result);
        parentElement.appendChild(anchorElement);
        if (partialIds != null && partialIds.has(issue.id)) {
            const superEle = document.createElement("sup");
            superEle.innerText = "†";
            parentElement.appendChild(superEle);
        }
        if (i < count(issues)) {
            parentElement.appendChild(document.createTextNode(", "));
        }

    });
}
/**
 * 
 * @param {Database} database 
 * @param {Compilation} data 
 * @returns {CompilationBrowserEntryElement}
 */
export function createDraggableCompilationEntry(database, data) {
    const ele = new CompilationBrowserEntryElement(database, data);
    return ele;
}
/**
 * 
 * @param {Database} database 
 * @param {Compilation} data
 * @param {ComparitorResult} result
 * @returns {HTMLAnchorElement}
 */
export function createCompilationLink(database, data, result) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = data.name;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openCompilationViewer(database, data, e.clientX, e.clientY);
    };
    if (result != null) {
        if (result.uniqueCompilations.has(data)) {
            anchorElement.classList.add("unique");
        }
        if (result.nonUniqueCompilations.has(data)) {
            anchorElement.classList.add("overlapping");
        }
        if (result.redundantCompilations.has(data)) {
            anchorElement.classList.add("redundant");
        }
    }
    return anchorElement;
}

/**
 * 
 * @param {Database} database 
 * @param {Series} data
 * @returns {HTMLAnchorElement}
 */
export function createSeriesLink(database, data) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = data.name;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openSeriesViewer(database, data, e.clientX, e.clientY);
    };
    return anchorElement;
}

const defaultComparisonNamePrefix = "New ";
/**
 * 
 * @returns {string}
 */
export function generateComparisonName() {
    let i = 1;
    let name = defaultComparisonNamePrefix + i;
    while (Comparison.checkNames(name)) {
        i++;
        name = defaultComparisonNamePrefix + i;
    }
    return name;
}

export function jsonStringifyReplacer(key, value) {
    if (value instanceof Set) {
        if (value.size > 0) {
            return [...value];
        }
        return [];
    }
    return value;
}