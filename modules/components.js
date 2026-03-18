"use strict";

import { Database, Compilation, Series, Issue, ComparitorResult, Comparitor, Comparison } from "./omnicross.js";
import { areSetsSame, isString } from "./tools.js";

/**
 * 
 * @param {Series} series 
 * @param {number} x 
 * @param {number} y 
 * @returns {SeriesViewerElement}
 */
export function openSeriesViewer(data, x, y) {
    const element = new SeriesViewerElement(data);
    document.body.appendChild(element);
    element.popup.show(x, y);
    return element;
}
/**
 * 
 * @param {Issue} issue 
 * @param {number} x 
 * @param {number} y 
 * @returns {IssueViewerElement}
 */
export function openIssueViewer(issue, x, y) {
    const element = new IssueViewerElement(issue);
    document.body.appendChild(element);
    element.popup.show(x, y);
    return element;
}
/**
 * 
 * @param {Compilation} compilation 
 * @param {number} x 
 * @param {number} y 
 * @returns {CompilationViewerElement}
 */
export function openCompilationViewer(compilation, x, y) {
    const element = new CompilationViewerElement(compilation);
    document.body.appendChild(element);
    element.popup.show(x, y);
    return element;
}
/**
 * 
 * @param {ComparitorResult} data 
 * @param {number} x 
 * @param {number} y 
 * @returns {ComparisonViewerElement}
 */
export function openComparisonViewer(database, data, x, y) {
    const element = new ComparisonViewerElement(database, data);
    /** @type {HTMLDivElement} */
    const parent = document.getElementById("comparisonList");
    parent.appendChild(element);
    return element;
}

/**
 * 
 * @param {Issue} issue 
 * @returns {HTMLAnchorElement}
 */
function createIssueLink(issue) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = issue.number;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openIssueViewer(issue, e.clientX, e.clientY);
    };
    return anchorElement;
}
/**
 * 
 * @param {Database} database 
 * @param {HTMLElement} parentElement 
 * @param {Set<string>} issueIds 
 */
function createIssueLinkList(database, parentElement, issueIds) {
    let i = 0;
    issueIds.forEach(v => {
        i++;
        const issue = database.getIssueById(v);
        parentElement.appendChild(createIssueLink(issue));
        if (i < issueIds.size) {
            parentElement.innerHTML += ", ";
        }

    });
}
/**
 * 
 * @param {Compilation} data
 * @returns {HTMLAnchorElement}
 */
function createCompilationLink(data) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = data.name;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openCompilationViewer(data, e.clientX, e.clientY);
    };
    return anchorElement;
}
/**
 * 
 * @param {Series} data
 * @returns {HTMLAnchorElement}
 */
function createSeriesLink(data) {
    const anchorElement = document.createElement("a");
    anchorElement.innerText = data.name;
    anchorElement.href = "#";
    anchorElement.onclick = (e) => {
        openSeriesViewer(data, e.clientX, e.clientY);
    };
    return anchorElement;
}

export class CardBoxElement extends HTMLElement {
    static observedAttributes = ["background-color"];
    /** @type {HTMLDivElement} */
    #rootDiv;

    constructor() {
        super();
        const template = document.getElementById("card-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        this.#rootDiv = shadowRoot.querySelector("div.card-root");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "background-color":
                this.#rootDiv.style.backgroundColor = newValue;
        }
    }
}

export class PopupWindowElement extends HTMLElement {
    static observedAttributes = ["height", "width"];
    /** @type {Array<PopupWindowElement>} */
    static #visibleWindows = [];
    /** @type {Array<HTMLElement>} */
    #hostElement;
    /** @type {Array<CardBoxElement>} */
    #cardElement;
    /** @type {Array<HTMLDivElement>} */
    #contentElement;

    onhide;
    constructor() {
        super();
        // if(height&&height>-1) {
        //     this.style.height = height + "px";
        // }
        // if(width&& width>-1) {
        //     this.style.width = width + "px";
        // }
        const template = document.getElementById("popup-window-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });

        const nodeCopy = document.importNode(templateContent, true);

        shadowRoot.appendChild(nodeCopy);

        shadowRoot.querySelector("button.popup-window-close-button").onclick = (e) => {
            this.hide();
        };
        this.#cardElement = shadowRoot.querySelector("card-box");
        this.#contentElement = shadowRoot.querySelector("div.content");
        const header = shadowRoot.querySelector("header.windowHeader");
        this.#hostElement = this;
        header.onmousedown = (e) => {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            let pos3 = e.clientX;
            let pos4 = e.clientY;
            // Bring this window to the top

            this.bringToFront();
            const maxRight = window.innerWidth - this.#hostElement.offsetWidth;
            const maxBottom = window.innerHeight - this.#hostElement.offsetHeight;

            document.onmouseup = (e) => {
                // stop moving when mouse button is released:
                document.onmouseup = null;
                document.onmousemove = null;
            };
            // call a function whenever the cursor moves:
            document.onmousemove = (e) => {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                const pos1 = pos3 - e.clientX;
                const pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                let top = (this.#hostElement.offsetTop - pos2);
                let left = (this.#hostElement.offsetLeft - pos1);
                if(top<0) {
                    top = 0;
                } else if(top >maxBottom) {
                    top = maxBottom;
                }
                if(left<0) {
                    left = 0;
                } else if(left>maxRight) {
                    left = maxRight;
                }
                // set the element's new position:
                this.#hostElement.style.top = top + "px";
                this.#hostElement.style.left = left + "px";
            };
        };
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "height":
                // this.#cardElement.style.height = newValue;
                this.#contentElement.style.height = newValue;
                this.style.height = newValue;
                break;
            case "width":
                // this.#cardElement.style.width = newValue;
                this.#contentElement.style.width = newValue;
                this.style.width = newValue;
                break;
        }
    }

    static #windowSpacingIncrement = 20;
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    static #checkIfLocationIsClear(x,y)
    {
        for(let i = 0; i < PopupWindowElement.#visibleWindows.length; i++)
        {
            const window = PopupWindowElement.#visibleWindows[i];
            if(Math.abs(window.offsetLeft-x) < this.#windowSpacingIncrement
                && Math.abs(window.offsetTop-y) < this.#windowSpacingIncrement) 
                {
                    return false;
                }
        }
        return true;
    }
    
    /**
     * 
    * @param {number} x 
    * @param {number} y 
     */
    show(x, y) {
        this.bringToFront();
        this.style.display = "block";

        const minX = 10, minY = 125, increments = 40;

        // Doing auto-placement for now
        x = minX;
        y = minY;

        let i = 1;
        while(true) {
            while(!PopupWindowElement.#checkIfLocationIsClear(x,y)) {
                x += increments;
                y += increments;
            }
            if(this.offsetWidth>window.innerWidth) {
                break;
            }
            if(x+this.offsetWidth > window.innerWidth ) {
                i++;
                // Too wide for the screen, move it down and go again
                x = minX;
                y = minY * i;
            } 
            else {
                break;
            }
        }
        this.style.left = x + "px";
        this.style.top = y + "px";

    }
    hide() {
        this.style.display = "none";
        PopupWindowElement.#removeWindow(this);
        if(this.onhide) {
            this.onhide(this);
        }
    }
    bringToFront() {
        const i = PopupWindowElement.#visibleWindows.indexOf(this);
        let changed = false;
        if (i === -1) {
            PopupWindowElement.#visibleWindows.unshift(this);
            changed = true;
        } else if (i >= 0) {
            PopupWindowElement.#visibleWindows.splice(i, 1);
            PopupWindowElement.#visibleWindows.unshift(this);
            changed = true;
        }

        if (changed === true) {
            PopupWindowElement.#setZIndexes();
        }
    }
    static #setZIndexes() {
        let i = 0;
        PopupWindowElement.#visibleWindows.slice().reverse().forEach(element => {
            element.style.zIndex = 1000 + i;
            i++;
        });
    }
    static #removeWindow(window) {
        const i = PopupWindowElement.#visibleWindows.indexOf(this);
        if (i > -1) {
            PopupWindowElement.#visibleWindows.splice(i, 1);
        }
    }
}
export const COLLAPSIBLE_ENTRY_EXPANING_EVENT = "collapsible-entry-expanding";
export class CollapsibleEntryElement extends HTMLElement {
    constructor() {
        super();
        const thisElement = this;
        const template = document.getElementById("collapsible-entry-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));


        const buttonElement = shadowRoot.querySelector("button.collapsible");
        const contentElement = shadowRoot.querySelector("div.content");
        buttonElement.addEventListener("click", function () {
            this.classList.toggle("active");
            if (contentElement.style.display === "block") {
                contentElement.style.display = "none";
            } else {
                this.dispatchEvent(new CustomEvent(COLLAPSIBLE_ENTRY_EXPANING_EVENT, {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    //detail: thisElement
                }));

                contentElement.style.display = "block";
            }
        });
    }
}

export class FilterableListElement extends HTMLElement {
    /** @type {HTMLDivElement} */
    #elementsContainer;
    /** @type {HTMLInputElement} */
    #searchElement;
    /** @type {Array} */
    #elements;
    constructor() {
        super();
        const template = document.getElementById("filterable-list-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.#elements = [];
        this.#searchElement = shadowRoot.querySelector("input");
        this.#elementsContainer = shadowRoot.querySelector("span");
        this.#searchElement.onkeyup = (e) => {
            this.updateFiltering();
        };
    }

    addElement(element) {
        this.#elements.push(element);
    }
    clearElements() {
        this.#elements = [];
        this.#searchElement.innerHTML = "";
    }
    updateFiltering() {
        this.#elementsContainer.innerHTML = "";
        const filterValue = this.#searchElement.value.toLowerCase().trim();
        this.#elements.forEach(e => {
            if (filterValue === "" || e.filterableValue.includes(filterValue)) {
                this.#elementsContainer.appendChild(e);
            }
        })
    }
}
class FilterableElement extends HTMLElement {
    /** @type {string} */
    filterableValue;
}
export class SeriesBrowserEntryElement extends FilterableElement {
    /** @type {Series} */
    data;
    /**
     * 
     * @param {Database} database 
     * @param {Series} data 
     */
    constructor(database, data) {
        super();
        this.data = data;
        const thisElement = this;
        this.filterableValue = data.name.toLowerCase();
        const template = document.getElementById("series-browser-entry-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        const setName = document.createElement("b");
        setName.slot = "name";
        setName.innerText = data.name;
        this.appendChild(setName);

        let rendered = false;
        this.addEventListener(COLLAPSIBLE_ENTRY_EXPANING_EVENT,
            function (event) {
                if (rendered) {
                    return;
                }
                rendered = true;
                const issuesList = document.createElement("ul");
                issuesList.slot = "issues";
                data.issues.forEach((v, k) => {
                    const issueElement = document.createElement("li");
                    const issue = database.getIssueById(v);
                    issueElement.appendChild(createIssueLink(issue));
                    issuesList.appendChild(issueElement);
                });
                thisElement.appendChild(issuesList);
                event.stopPropagation();
            });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(
            `Attribute ${name} has changed from ${oldValue} to ${newValue}.`,
        );
    }
}
export class CompilationBrowserEntryElement extends FilterableElement {
    /** @type {Compilation} */
    data;
    /**
     * 
     * @param {Database} database 
     * @param {Compilation} data 
     */
    constructor(database, data) {
        super();
        const thisElement = this;
        this.data = data;
        this.filterableValue = data.name.toLowerCase();
        const template = document.getElementById("compilation-browser-entry-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        const setName = document.createElement("b");
        setName.slot = "name";
        setName.innerText = data.name;
        this.appendChild(setName);

        let rendered = false;

        /** @type {CardBoxElement} */
        const cardElement = shadowRoot.querySelector("card-box");
        cardElement.addEventListener("dragstart", (event) => {
            // Set the data type and the value of the dragged data
            event.dataTransfer.setData("text/plain", data.id);
            event.dataTransfer.effectAllowed = "copy";
        }, false);

        this.addEventListener(COLLAPSIBLE_ENTRY_EXPANING_EVENT,
            function (event) {
                if (rendered) {
                    return;
                }
                rendered = true;
                const seriesList = document.createElement("ul");
                seriesList.slot = "series";
                data.series.forEach((v, k) => {
                    const series = database.getSeriesById(k);
                    const seriesElement = document.createElement("li");
                    seriesElement.innerText = series.name + " - ";
                    createIssueLinkList(database, seriesElement, v);
                    seriesList.appendChild(seriesElement);
                });
                thisElement.appendChild(seriesList);
                event.stopPropagation();
            });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(
            `Attribute ${name} has changed from ${oldValue} to ${newValue}.`,
        );
    }
}

export class ComparisonViewerElement extends HTMLElement {
    /** @type {Comparitor} */
    static #comparitor = new Comparitor();

    /** @type {Comparison} */
    #data;
    
    /**
     * 
     * @param {Database} database 
     * @param {Comparison} data 
     */
    constructor(database, data) {
        super();

        this.#data = data;

        const template = document.getElementById("comparison-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        const nameElement = document.createElement("span");
        nameElement.innerText = data.name;
        nameElement.slot = "name";
        this.appendChild(nameElement);

        this.addEventListener("dragover", (event) => {
            // Prevent default behavior to allow drop
            event.preventDefault();
        }, false);

        this.addEventListener("drop", (event) => {
            // Prevent default behavior (prevent opening as a link on drop)
            event.preventDefault();
            // Get the data, which is the id of the dragged element
            const id = event.dataTransfer.getData("text/plain");
            // Append the dragged element to the drop target

            this.#data.compilations.add(id);
            this.#data.save();
            this.#refreshView(database);
        }, false);

        /** @type {HTMLButtonElement} */
        const renameButton = shadowRoot.querySelector("button.renameButton");
        renameButton.onclick = (e) => {
            const response = window.prompt("Please specify name", data.name);
            if(response!==null) {
                nameElement.innerText = response;
                data.name = response;
                data.save();
            }
        };
        this.#refreshView(database);

    }


    /**
     * 
     * @param {Database} database 
     */
    #refreshView(database) {
        /** @type {HTMLUListElement} */
        const compilationList = this.shadowRoot.querySelector(".compilationList");

        compilationList.innerHTML = "";

        const result = ComparisonViewerElement.#comparitor.process(database, this.#data);

        this.#data.compilations.forEach((id)=> {
            const ul = document.createElement("li");
            const element = document.createElement("div");
            ul.appendChild(element);
            const compilation = database.getCompilationById(id);
            element.textContent = compilation.name;
            compilationList.appendChild(ul);
        });     

        /** @type {HTMLTableElement} */
        const layoutTable = this.shadowRoot.querySelector(".layoutTable");

        if(result.overlaps.size>0) {
            /** @type {HTMLTableElement} */
            const overlapList = this.shadowRoot.querySelector(".overlapList");
            overlapList.innerHTML = "";

            let tr = document.createElement("tr");
            let th = document.createElement("th");
            th.colSpan = 3;
            th.innerText = "Overlaps";
            tr.appendChild(th);
            overlapList.appendChild(tr);

            tr = document.createElement("tr");
            th = document.createElement("th");
            th.innerText = "Series";
            tr.appendChild(th);
            th = document.createElement("th");
            th.innerText = "Issue(s)";
            tr.appendChild(th);
            th = document.createElement("th");
            th.innerText = "Compilations";
            tr.appendChild(th);
            overlapList.appendChild(tr);


            result.overlaps.forEach((issues, series)=> {
                let remainingIssueMaps = new Map(issues);

                /** @type {HTMLTableCellElement} */
                const seriesTd = document.createElement("td");
                seriesTd.appendChild(createSeriesLink(series));
                seriesTd.rowSpan = issues.size;
                
                let compilationRows = [];

                while(remainingIssueMaps.size>0) {
                    let currentCompilationSet = remainingIssueMaps.values().next().value;

                    /** @type {HTMLTableRowElement} */
                    const tr = document.createElement("tr");
                    compilationRows.push(tr);
                    /** @type {HTMLTableCellElement} */
                    const issueTd = document.createElement("td");
                    tr.appendChild(issueTd);                    
                    const issueList = document.createElement("ul");
                    issueTd.appendChild(issueList);


                    /** @type {HTMLTableCellElement} */
                    const compilationsTd = document.createElement("td");
                    tr.appendChild(compilationsTd);
                    const compilationList = document.createElement("ul");
                    compilationsTd.appendChild(compilationList);
                    currentCompilationSet.forEach(c=> {
                        const li = document.createElement("li");
                        li.appendChild(createCompilationLink(c));
                        compilationList.appendChild(li);
                    });

                    /** @type {Set<Issue} */
                    let filteredIssues = new Set();

                    remainingIssueMaps.forEach((compilations, issue) => {
                        if(areSetsSame(currentCompilationSet, compilations)) {
                            filteredIssues.add(issue);
                        }                        
                    });

                    if(filteredIssues.size==0) {
                        throw Error("Something went wrong, there should always be at least one value in remainingIssueMaps");
                    }
                    filteredIssues.forEach(e=> {
                        const li = document.createElement("li");
                        li.appendChild(createIssueLink(e));
                        issueList.appendChild(li);
                        remainingIssueMaps.delete(e);
                    });
                }
                
                seriesTd.rowSpan = compilationRows.length;
                compilationRows[0].insertBefore(seriesTd, compilationRows[0].firstChild);

                compilationRows.forEach(e=>overlapList.appendChild(e));
            });
        }
    }
}
export class CompilationViewerElement extends HTMLElement {
    /** @type {Compilation} */
    #data;
    /** @type {PopupWindowElement} */
    popup;

    /**
     * 
     * @param {Compilation} data 
     */
    constructor(data) {
        super();

        this.#data = data;
        const template = document.getElementById("compilation-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.popup = shadowRoot.querySelector("popup-window");

    }
}
export class SeriesViewerElement extends HTMLElement {
    /** @type {Compilation} */
    #data;
    /** @type {PopupWindowElement} */
    popup;

    /**
     * 
     * @param {Compilation} data 
     */
    constructor(data) {
        super();

        this.#data = data;
        const template = document.getElementById("series-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.popup = shadowRoot.querySelector("popup-window");

    }
}
export class IssueViewerElement extends HTMLElement {
    /** @type {Issue} */
    #data;
    /** @type {PopupWindowElement} */
    popup;


    /**
     * 
     * @param {Issue} data 
     */
    constructor(data) {
        super();

        this.#data = data;
        const template = document.getElementById("issue-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.popup = shadowRoot.querySelector("popup-window");
    }
}
export function bootstrapComponents() {
    customElements.define("card-box", CardBoxElement);
    customElements.define("filterable-list", FilterableListElement);
    customElements.define("collapsible-entry", CollapsibleEntryElement);
    customElements.define("popup-window", PopupWindowElement);

    customElements.define("series-browser-entry", SeriesBrowserEntryElement);
    customElements.define("compilation-browser-entry", CompilationBrowserEntryElement);
    customElements.define("comparison-viewer", ComparisonViewerElement);
    customElements.define("compilation-viewer", CompilationViewerElement);
    customElements.define("issue-viewer", IssueViewerElement);
    customElements.define("series-viewer", SeriesViewerElement);
}