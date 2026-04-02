"use strict";

import { bootstrapComponents, PopupWindowElement } from "./modules/components.js";
import { bootstrapOmnicrossComponents, CompilationBrowserElement, SeriesBrowserElement, SeriesBrowserEntryElement } from "./modules/omnicross/components.js";
import { createDraggableCompilationEntry, openComparisonViewer } from "./modules/omnicross/tools.js";
import { Comparison, Comparitor, Database, Parser, SavedData } from "./modules/omnicross/data.js";


window.addEventListener("load", async (event) => {
    console.time("everything");
    console.time("bootstrap");
    bootstrapComponents();
    bootstrapOmnicrossComponents();
    console.timeEnd("bootstrap");
    const loadingWindow = document.getElementById("loadingScreen");
    const parser = new Parser();
    const database = await parser.parse("data.json");

    database.calculateComplateComparison();


    const footer = document.querySelector("footer");
    footer.innerHTML += " Data updated " + database.lastModified + ".";

    const seriesBrowserElement = new SeriesBrowserElement(database);
    document.body.appendChild(seriesBrowserElement);

    const compilationBrowserElement = new CompilationBrowserElement(database);
    document.body.appendChild(compilationBrowserElement);

    const saveData = new SavedData();

    document.getElementById("cascadeWindowsButton").onclick = (e) => {
        PopupWindowElement.arrangeWindows();
    };
    const browseCompilationsButton = document.getElementById("selectCompilationsButton");
    browseCompilationsButton.innerText += " (" + database.countCompilations() + ")";
    browseCompilationsButton.onclick = (e) => {
        compilationBrowserElement.popup.show(e.clientX, e.clientY);
    };
    const browseSeriesButton = document.getElementById("browseSeriesButton");
    browseSeriesButton.innerText += " (" + database.countSeries() + ")";
    browseSeriesButton.onclick = (e) => {
        seriesBrowserElement.popup.show(e.clientX, e.clientY);
    };
    document.getElementById("createComparisonButton").onclick = (e) => {
        const comparison = new Comparison();
        saveData.addComparison(comparison);
        saveData.save();
        openComparisonViewer(database, comparison, saveData, e.clientX, e.clientY);
    };

    saveData.comparisons.values().forEach(e => {

        openComparisonViewer(database, e, saveData);
    });

    loadingWindow.style.display = "none";
    console.timeEnd("everything");
});