"use strict";

import { count } from "../tools.js";
import { SeriesViewerElement, IssueViewerElement, CompilationViewerElement, ComparisonViewerElement, CompilationBrowserEntryElement } from "./components.js";
import { Compilation, Database, Issue, SavedData, Comparison } from "./data.js";


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
 * @returns {HTMLAnchorElement}
 */
export function createIssueLink(database, issue) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = issue.number;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openIssueViewer(database, issue, e.clientX, e.clientY);
    };
    return anchorElement;
}
/**
 * 
 * @param {Database} database 
 * @param {HTMLElement} parentElement 
 * @param {Set<string>} issueIds 
 */
export function createIssueLinkListById(database, parentElement, issueIds) {
    let i = 0;
    issueIds.forEach(v => {
        i++;
        const issue = database.getIssueById(v);
        parentElement.appendChild(createIssueLink(database, issue));
        if (i < count(issueIds)) {
            parentElement.appendChild(document.createTextNode(", "));
        }

    });
}
/**
 * 
 * @param {Database} database 
 * @param {HTMLElement} parentElement 
 * @param {Set<Issue>} issues 
 */
export function createIssueLinkList(database, parentElement, issues) {
    let i = 0;
    issues.forEach(issue => {
        i++;
        parentElement.appendChild(createIssueLink(database, issue));
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
 * @returns {HTMLAnchorElement}
 */
export function createCompilationLink(database, data) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = data.name;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openCompilationViewer(database, data, e.clientX, e.clientY);
    };
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