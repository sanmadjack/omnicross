"use strict";

import { bootstrapComponents } from "./modules/components.js";
import { bootstrapOmnicrossComponents, SeriesBrowserEntryElement } from "./modules/omnicross/components.js";
import { createDraggableCompilationEntry, openComparisonViewer } from "./modules/omnicross/tools.js";
import { Comparison, Database, Parser } from "./modules/omnicross/data.js";


window.addEventListener("load", async (event) => {
    bootstrapComponents();
    bootstrapOmnicrossComponents();

    const parser = new Parser();
    const database = await parser.parse("data.json");

    console.log(database);

    const seriesBrowserElement = document.getElementById("series-browser");
    const seriesBrowserFilterElement = document.querySelector("#series-browser filterable-list");
    seriesBrowserFilterElement.clearElements();
    database.getAllSeries().forEach(e => {
        const ele = new SeriesBrowserEntryElement(database, e);
        seriesBrowserFilterElement.addElement(ele);
    });
    seriesBrowserFilterElement.updateFiltering();

    const compilationBrowserElement = document.getElementById("compilation-browser");
    const compilationBrowserFilterElement = document.querySelector("#compilation-browser filterable-list");
    compilationBrowserFilterElement.clearElements();
    database.getAllCompilations().forEach(e => {
        const ele = createDraggableCompilationEntry(database, e);
        compilationBrowserFilterElement.addElement(ele);
    });
    compilationBrowserFilterElement.updateFiltering();

    document.getElementById("selectCompilationsButton").onclick = (e) => {
        compilationBrowserElement.show(e.clientX, e.clientY);
    };
    document.getElementById("browseSeriesButton").onclick = (e) => {
        seriesBrowserElement.show(e.clientX, e.clientY);
    };
    document.getElementById("createComparisonButton").onclick = (e) => {
        const comparison = new Comparison();
        comparison.save();
        openComparisonViewer(database, comparison, e.clientX, e.clientY);
    };

    // Load saved items, yaahhhh
    // It's been a long road to this working
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const comparison = Comparison.load(key);
        openComparisonViewer(database, comparison);
    }

});