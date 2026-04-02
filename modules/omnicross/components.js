"use strict";

import { FilterableElement, FilterableListElement, COLLAPSIBLE_ENTRY_EXPANING_EVENT, PopupWindowElement } from "../components.js";
import { Database, Comparitor, Issue, Series, Compilation, Comparison, SavedData, ComparitorResult } from "./data.js";
import { areSetsSame } from "../tools.js";
import { createSeriesLink, createIssueLink, createIssueLinkListById, createCompilationLink, createDraggableCompilationEntry, createIssueLinkList } from "./tools.js";

const COMPILATIONS_HEADER = "Compilation(s)";
const SERIES_HEADER = "Series(s)";
const ISSUES_HEADER = "Issue(s)";

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
        const lowerCaseName = data.name.toLowerCase();
        this.checkFilter = (filterValue) => {
            return lowerCaseName.includes(filterValue);
        }
        const template = document.getElementById("series-browser-entry-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        const setName = document.createElement("div");
        setName.appendChild(createSeriesLink(database, data));
        this.shadowRoot.appendChild(setName);

        // let rendered = false;
        // this.addEventListener(COLLAPSIBLE_ENTRY_EXPANING_EVENT,
        //     function (event) {
        //         if (rendered) {
        //             return;
        //         }
        //         rendered = true;
        //         const issuesList = document.createElement("ul");
        //         issuesList.slot = "issues";
        //         data.issues.forEach((v, k) => {
        //             const issueElement = document.createElement("li");
        //             const issue = database.getIssueById(v);
        //             issueElement.appendChild(createIssueLink(database, issue));
        //             issuesList.appendChild(issueElement);
        //         });
        //         thisElement.appendChild(issuesList);
        //         event.stopPropagation();
        //     });
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

        const lowerCaseName = data.name.toLowerCase();
        this.checkFilter = (filterValue) => {
            if (lowerCaseName.includes(filterValue)) {
                return true;
            }
            if (data.tags != null) {
                let result = false;
                data.tags.forEach(e => {
                    if (e.toLocaleLowerCase().includes(filterValue)) {
                        result = true;
                    }
                });
                return result;
            }
            return false;
        }

        const template = document.getElementById("compilation-browser-entry-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        const setName = document.createElement("b");
        setName.slot = "name";
        setName.appendChild(createCompilationLink(database, data));
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

    /** @type {PopupWindowElement} */
    popup;

    /** @type {SavedData} */
    #saveData;

    /**
     * 
     * @param {Database} database 
     * @param {Comparison} data 
     * @param {SavedData} saveData 
     */
    constructor(database, data, saveData) {
        super();

        this.#data = data;
        this.#saveData = saveData;

        const template = document.getElementById("comparison-viewer-template");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(document.importNode(templateContent, true));

        this.popup = shadowRoot.querySelector("popup-window");
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
            saveData.save();
            this.#refreshView(database);
        }, false);

        /** @type {HTMLButtonElement} */
        const renameButton = shadowRoot.querySelector("button.renameButton");
        renameButton.onclick = (e) => {
            const response = window.prompt("Please specify name", data.name);
            if (response !== null) {
                nameElement.innerText = response;
                data.name = response;
                saveData.save();
            }
        };
        /** @type {HTMLButtonElement} */
        const deleteButton = shadowRoot.querySelector("button.deleteButton");
        deleteButton.onclick = (e) => {
            if (confirm("Are you sure you want to delete " + data.name + "?")) {
                saveData.removeComparison(data.id);
                saveData.save();
                this.popup.hide();
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


        /** @type {HTMLTableElement} */
        const layoutTable = this.shadowRoot.querySelector(".layoutTable");

        const result = ComparisonViewerElement.#comparitor.process(database, this.#data);

        if (result.compilations.size == 0) {
            layoutTable.style.display = "none";
            return;
        } else {
            layoutTable.style.display = "block";
        }

        this.#data.compilations.forEach((id) => {
            const compilation = database.getCompilationById(id);
            if (compilation == null) {
                this.#data.compilations.delete(id);
                return;
            }
            const ul = document.createElement("div");
            const link = createCompilationLink(database, compilation, result);
            ul.appendChild(link);
            const removeElement = document.createElement("button");
            removeElement.innerText = "Remove";
            removeElement.onclick = (e) => {
                this.#data.compilations.delete(id);
                this.#saveData.save();
                this.#refreshView(database);

            };
            ul.appendChild(removeElement);
            compilationList.appendChild(ul);
        });


        const noOverlapsMessage = this.shadowRoot.getElementById("noOverlaps");
        const overlapTable = this.shadowRoot.getElementById("overlapTable");
        overlapTable.innerHTML = "";
        if (result.overlaps.size > 0) {
            noOverlapsMessage.style.display = "none";
            /** @type {HTMLTableElement} */

            let tr = document.createElement("tr");
            let th = document.createElement("th");
            th.colSpan = 3;
            th.innerText = "Duplicated Issue(s)";
            tr.appendChild(th);
            overlapTable.appendChild(tr);

            tr = document.createElement("tr");
            th = document.createElement("th");
            th.innerText = SERIES_HEADER;
            tr.appendChild(th);
            th = document.createElement("th");
            th.innerText = ISSUES_HEADER;
            tr.appendChild(th);
            th = document.createElement("th");
            th.innerText = COMPILATIONS_HEADER;
            tr.appendChild(th);
            overlapTable.appendChild(tr);


            result.overlaps.forEach((issues, series) => {
                let remainingIssueMaps = new Map(issues);

                /** @type {HTMLTableCellElement} */
                const seriesTd = document.createElement("td");
                seriesTd.appendChild(createSeriesLink(database, series));
                seriesTd.rowSpan = issues.size;

                let compilationRows = [];

                while (remainingIssueMaps.size > 0) {
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
                    currentCompilationSet.forEach(c => {
                        const li = document.createElement("li");
                        li.appendChild(createCompilationLink(database, c, result));
                        compilationList.appendChild(li);
                    });

                    /** @type {Set<Issue>} */
                    let filteredIssues = new Set();

                    remainingIssueMaps.forEach((compilations, issue) => {
                        if (areSetsSame(currentCompilationSet, compilations)) {
                            filteredIssues.add(issue);
                        }
                    });

                    if (filteredIssues.size == 0) {
                        throw Error("Something went wrong, there should always be at least one value in remainingIssueMaps");
                    }
                    createIssueLinkList(database, issueTd, filteredIssues);
                    filteredIssues.forEach(e => {
                        remainingIssueMaps.delete(e);
                    });
                }

                seriesTd.rowSpan = compilationRows.length;
                compilationRows[0].insertBefore(seriesTd, compilationRows[0].firstChild);

                compilationRows.forEach(e => overlapTable.appendChild(e));
            });
        } else {
            noOverlapsMessage.style.display = "block";
        }

        const noUniquesMessage = this.shadowRoot.getElementById("noUniques");
        const uniquesTable = this.shadowRoot.getElementById("uniqueTable");
        uniquesTable.innerHTML = "";
        if (result.uniques.size > 0) {
            noUniquesMessage.style.display = "none";
            /** @type {HTMLTableElement} */

            let tr = document.createElement("tr");
            let th = document.createElement("th");
            th.colSpan = 3;
            th.innerText = "Unique issue(s)";
            tr.appendChild(th);
            uniquesTable.appendChild(tr);

            tr = document.createElement("tr");
            th = document.createElement("th");
            th.innerText = COMPILATIONS_HEADER;
            tr.appendChild(th);
            th = document.createElement("th");
            th.innerText = SERIES_HEADER;
            tr.appendChild(th);
            th = document.createElement("th");
            th.innerText = ISSUES_HEADER;
            tr.appendChild(th);
            uniquesTable.appendChild(tr);


            result.uniques.forEach((seriesMap, compilation) => {
                /** @type {HTMLTableCellElement} */
                const compilationTd = document.createElement("td");
                compilationTd.appendChild(createCompilationLink(database, compilation, result));
                compilationTd.rowSpan = seriesMap.size;
                let seriesRows = [];

                seriesMap.forEach((issues, series) => {

                    /** @type {HTMLTableRowElement} */
                    const tr = document.createElement("tr");
                    /** @type {HTMLTableCellElement} */
                    const seriesTd = document.createElement("td");
                    seriesTd.appendChild(createSeriesLink(database, series));
                    tr.appendChild(seriesTd);
                    const issueTd = document.createElement("td");
                    createIssueLinkList(database, issueTd, issues);
                    tr.appendChild(issueTd);
                    seriesRows.push(tr);
                });


                compilationTd.rowSpan = seriesRows.length;
                seriesRows[0].insertBefore(compilationTd, seriesRows[0].firstChild);

                seriesRows.forEach(e => uniquesTable.appendChild(e));
            });
        } else {
            noUniquesMessage.style.display = "block";
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
        const formatElement = document.createElement("span");
        formatElement.slot = "format";
        switch (data.format) {
            case "tpb":
                formatElement.innerText = "Trade Paperback";
                break;
            case "omnibus":
                formatElement.innerText = "Omnibus";
                break;
            case "ohc":
                formatElement.innerText = "Oversized Hardcover";
                break;
            case "absolute":
                formatElement.innerText = "Absolute Edition";
                break;
            default:
                formatElement.innerText = data.type;
                break;
        }
        this.appendChild(formatElement)
        this.appendChild(nameField);
        if (data.reference) {
            const referenceElement = document.createElement("a");
            referenceElement.innerText = "Open reference";
            referenceElement.target = "_blank";
            referenceElement.href = data.reference;
            referenceElement.slot = "reference";
            this.appendChild(referenceElement);
        }

        const issueTable = this.shadowRoot.getElementById("issueTable");

        const tr = document.createElement("tr");
        let th = document.createElement("th");
        th.innerText = SERIES_HEADER;
        tr.appendChild(th);
        th = document.createElement("th");
        th.innerText = ISSUES_HEADER;
        tr.appendChild(th);
        issueTable.appendChild(tr);
        database.getSeriesByIds(data.series.keys()).forEach(
            /** @param {Series} series */
            series => {
                const tr = document.createElement("tr");
                const nameTd = document.createElement("td");
                tr.appendChild(nameTd);
                nameTd.appendChild(createSeriesLink(database, series));
                const issuesTd = document.createElement("td");
                tr.appendChild(issuesTd);
                const compilationSeriesIssues = [...series.issues.keys()].filter(
                    e => data.issues.has(e));
                createIssueLinkListById(database, issuesTd, data.series.get(series.id), database.completeComparisonResult);

                issueTable.appendChild(tr);
            });
        const overlappingCompilationsElement = this.shadowRoot.getElementById("overlappingCompilations");
        let overlapsFound = false;
        database.getOverlappingCompilations(data.id).forEach(c => {
            const newElement = createDraggableCompilationEntry(database, c);
            overlappingCompilationsElement.appendChild(newElement);
            overlapsFound = true;
        });
        if (overlapsFound === false) {
            overlappingCompilationsElement.style.display = "none";
        }
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
        createIssueLinkListById(database, issueList, new Set([...data.issues.values()]), database.completeComparisonResult);

        const compilationList = this.shadowRoot.getElementById("compilationList");
        const compilations = database.getCompilationsWithSeries(data.id);
        compilations.forEach(e => {
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
        compilations.forEach(e => {
            const element = createDraggableCompilationEntry(database, e);
            compilationList.appendChild(element);
        });
    }
}

export class SeriesBrowserElement extends FilterableListElement {
    /** @type {PopupWindowElement} */
    popup;

    /**
     * 
     * @param {Database} database 
     */
    constructor(database) {
        super("series-browser-template");
        this.popup = this.shadowRoot.querySelector("popup-window");
        const element = this;
        database.getAllSeries().forEach(e => {
            const ele = new SeriesBrowserEntryElement(database, e);
            element.add(ele);
        });
        this.refresh();

    }
}
export class CompilationBrowserElement extends FilterableListElement {
    /** @type {PopupWindowElement} */
    popup;

    /**
     * 
     * @param {Database} database 
     */
    constructor(database) {
        super("compilation-browser-template");
        this.popup = this.shadowRoot.querySelector("popup-window");
        const element = this;
        database.getAllCompilations().forEach(e => {
            const ele = createDraggableCompilationEntry(database, e);
            element.add(ele);
        });
        this.refresh();

    }
}

export function bootstrapOmnicrossComponents() {
    customElements.define("series-browser-entry", SeriesBrowserEntryElement);
    customElements.define("compilation-browser-entry", CompilationBrowserEntryElement);
    customElements.define("comparison-viewer", ComparisonViewerElement);
    customElements.define("compilation-viewer", CompilationViewerElement);
    customElements.define("issue-viewer", IssueViewerElement);
    customElements.define("series-viewer", SeriesViewerElement);
    customElements.define("series-browser", SeriesBrowserElement);
    customElements.define("compilation-browser", CompilationBrowserElement);
}