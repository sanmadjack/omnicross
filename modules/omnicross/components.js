"use strict";

import { FilterableElement, COLLAPSIBLE_ENTRY_EXPANING_EVENT } from "../components.js";
import { Database, Comparitor, Issue, Series, Compilation, Comparison } from "./data.js";
import { areSetsSame } from "../tools.js";
import { createSeriesLink, createIssueLink, createIssueLinkListById, createCompilationLink, createDraggableCompilationEntry, createIssueLinkList } from "./tools.js";

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
                    issueElement.appendChild(createIssueLink(database, issue));
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
                    createIssueLinkListById(database, seriesElement, v);
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
        /** @type {HTMLButtonElement} */
        const deleteButton = shadowRoot.querySelector("button.deleteButton");
        deleteButton.onclick = (e) => {
            if(confirm("Are you sure you want to delete " + data.name + "?")) {
                data.delete();
                this.parentElement.removeChild(this);
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
        const compilationList = this.shadowRoot.getElementById("compilationList");

        compilationList.innerHTML = "";

        const noOverlapsMessage = this.shadowRoot.getElementById("noOverlaps");

        const result = ComparisonViewerElement.#comparitor.process(database, this.#data);

        this.#data.compilations.forEach((id)=> {
            const compilation = database.getCompilationById(id);
            const ul = document.createElement("div");
            ul.appendChild(createCompilationLink(database, compilation));
            const removeElement = document.createElement("button");
            removeElement.innerText = "Remove";
            removeElement.onclick = (e) => {
                this.#data.compilations.delete(id);
                this.#data.save();
                this.#refreshView(database);

            };
            ul.appendChild(removeElement);
            compilationList.appendChild(ul);
        });     

        /** @type {HTMLTableElement} */
        const layoutTable = this.shadowRoot.querySelector(".layoutTable");

        const overlapTable = this.shadowRoot.getElementById("overlapTable");
        overlapTable.innerHTML = "";
        if(result.overlaps.size>0) {
            noOverlapsMessage.style.display = "none";
            /** @type {HTMLTableElement} */

            let tr = document.createElement("tr");
            let th = document.createElement("th");
            th.colSpan = 3;
            th.innerText = "Overlaps";
            tr.appendChild(th);
            overlapTable.appendChild(tr);

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
            overlapTable.appendChild(tr);


            result.overlaps.forEach((issues, series)=> {
                let remainingIssueMaps = new Map(issues);

                /** @type {HTMLTableCellElement} */
                const seriesTd = document.createElement("td");
                seriesTd.appendChild(createSeriesLink(database, series));
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


                    /** @type {HTMLTableCellElement} */
                    const compilationsTd = document.createElement("td");
                    tr.appendChild(compilationsTd);
                    const compilationList = document.createElement("ul");
                    compilationsTd.appendChild(compilationList);
                    currentCompilationSet.forEach(c=> {
                        const li = document.createElement("li");
                        li.appendChild(createCompilationLink(database,c));
                        compilationList.appendChild(li);
                    });

                    /** @type {Set<Issue>} */
                    let filteredIssues = new Set();

                    remainingIssueMaps.forEach((compilations, issue) => {
                        if(areSetsSame(currentCompilationSet, compilations)) {
                            filteredIssues.add(issue);
                        }                        
                    });

                    if(filteredIssues.size==0) {
                        throw Error("Something went wrong, there should always be at least one value in remainingIssueMaps");
                    }
                    createIssueLinkList(database, issueTd, filteredIssues);
                    filteredIssues.forEach(e=> {
                        remainingIssueMaps.delete(e);
                    });
                }
                
                seriesTd.rowSpan = compilationRows.length;
                compilationRows[0].insertBefore(seriesTd, compilationRows[0].firstChild);

                compilationRows.forEach(e=>overlapTable.appendChild(e));
            });
        } else {
            noOverlapsMessage.style.display = "block";
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
     * @param {Database} database 
     * @param {Compilation} data 
     */
    constructor(database, data) {
        super();

        this.#data = data;
        const template = document.getElementById("compilation-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.popup = shadowRoot.querySelector("popup-window");

        const nameField = document.createElement("span");
        nameField.slot = "name";
        nameField.innerText = data.name;
        this.appendChild(nameField);

        const issueTable = this.shadowRoot.getElementById("issueTable");
        database.getSeriesByIds(data.series.keys()).forEach(series=>{
            const tr = document.createElement("tr");
            const nameTd = document.createElement("td");
            tr.appendChild(nameTd);
            nameTd.appendChild(createSeriesLink(database, series));
            const issuesTd = document.createElement("td");
            tr.appendChild(issuesTd);
            createIssueLinkListById(database, issuesTd, series.issues);

            issueTable.appendChild(tr);
        })


    }
}
export class SeriesViewerElement extends HTMLElement {
    /** @type {Series} */
    #data;
    /** @type {PopupWindowElement} */
    popup;

    /**
     * 
     * @param {Database} database 
     * @param {Series} data 
     */
    constructor(database, data) {
        super();

        this.#data = data;
        const template = document.getElementById("series-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.popup = shadowRoot.querySelector("popup-window");

        const nameField = document.createElement("span");
        nameField.slot = "name";
        nameField.innerText = data.name;
        this.appendChild(nameField);

        const issueList = this.shadowRoot.querySelector("div.issueList");
        createIssueLinkListById(database, issueList, new Set([...data.issues.values()]));

        const compilationList = this.shadowRoot.getElementById("compilationList");
        const compilations = database.getCompilationsWithSeries(data.id);
        compilations.forEach(e=> {
            const element = createDraggableCompilationEntry(database, e);
            compilationList.appendChild(element);
        })

    }
}
export class IssueViewerElement extends HTMLElement {
    /** @type {Issue} */
    #data;
    /** @type {PopupWindowElement} */
    popup;


    /**
     * 
     * @param {Database} database 
     * @param {Issue} data 
     */
    constructor(database, data) {
        super();

        this.#data = data;
        const template = document.getElementById("issue-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));
        this.popup = shadowRoot.querySelector("popup-window");

        const series = database.getSeriesById(data.seriesId);

        const nameField = document.createElement("span");
        nameField.slot = "name";
        nameField.innerText = data.name;
        this.appendChild(nameField);

        const compilationList = this.shadowRoot.getElementById("compilationList");
        const compilations = database.getCompilationsWithIssue(data.id);
        compilations.forEach(e=> {
            const element = createDraggableCompilationEntry(database, e);
            compilationList.appendChild(element);
        });
    }
}

export function bootstrapOmnicrossComponents() {
    customElements.define("series-browser-entry", SeriesBrowserEntryElement);
    customElements.define("compilation-browser-entry", CompilationBrowserEntryElement);
    customElements.define("comparison-viewer", ComparisonViewerElement);
    customElements.define("compilation-viewer", CompilationViewerElement);
    customElements.define("issue-viewer", IssueViewerElement);
    customElements.define("series-viewer", SeriesViewerElement);
}