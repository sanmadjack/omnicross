"use strict";

import { bootstrapComponents, PopupWindowElement } from "./modules/components.js";
import { bootstrapOmnicrossComponents, SeriesBrowserEntryElement } from "./modules/omnicross/components.js";
import { createDraggableCompilationEntry, openComparisonViewer } from "./modules/omnicross/tools.js";
import { Comparison, Database, Parser, SavedData } from "./modules/omnicross/data.js";


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

    const saveData = new SavedData();
    
    document.getElementById("cascadeWindowsButton").onclick = (e) => {
        PopupWindowElement.arrangeWindows();
    };
    document.getElementById("selectCompilationsButton").onclick = (e) => {
        compilationBrowserElement.show(e.clientX, e.clientY);
    };
    document.getElementById("browseSeriesButton").onclick = (e) => {
        seriesBrowserElement.show(e.clientX, e.clientY);
    };
    document.getElementById("createComparisonButton").onclick = (e) => {
        const comparison = new Comparison();
        saveData.addComparison(comparison);
        saveData.save();
        openComparisonViewer(database, comparison, saveData, e.clientX, e.clientY);
    };

    saveData.comparisons.values().forEach(e=> {

        openComparisonViewer(database, e, saveData);
    });
});