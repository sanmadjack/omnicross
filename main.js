"use strict";

import { bootstrapComponents, CompilationBrowserEntryElement, SeriesBrowserEntryElement, openComparisonViewer } from "./modules/components.js";
import { Comparison, Comparitor, Parser } from "./modules/omnicross.js";


window.addEventListener("load", async (event) => {
    bootstrapComponents();
    const parser = new Parser();
    const data = await parser.parse("data.json");

    console.log(data);

    const seriesBrowserElement = document.getElementById("series-browser");
    const seriesBrowserFilterElement = document.querySelector("#series-browser filterable-list");
    seriesBrowserFilterElement.clearElements();
    data.getAllSeries().forEach(e => {
        const ele = new SeriesBrowserEntryElement(data, e);
        seriesBrowserFilterElement.addElement(ele);
    });
    seriesBrowserFilterElement.updateFiltering();

    const compilationBrowserElement = document.getElementById("compilation-browser");
    const compilationBrowserFilterElement = document.querySelector("#compilation-browser filterable-list");
    compilationBrowserFilterElement.clearElements();
    data.getAllCompilations().forEach(e => {
        const ele = new CompilationBrowserEntryElement(data, e);
        compilationBrowserFilterElement.addElement(ele);
    });
    compilationBrowserFilterElement.updateFiltering();

    const comparitor = new Comparitor();

    document.getElementById("selectCompilationsButton").onclick = (e) => {
        compilationBrowserElement.show(e.clientX, e.clientY);
    };
    document.getElementById("browseSeriesButton").onclick = (e) => {
        seriesBrowserElement.show(e.clientX, e.clientY);
    };
    document.getElementById("createComparisonButton").onclick = (e) => {
        const comparison = new Comparison();
        comparison.save();
        openComparisonViewer(data, comparison, e.clientX, e.clientY);
    };

    // Load saved items, yaahhhh
    // It's been a long road to this working
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const comparison = Comparison.load(key);
        openComparisonViewer(data, comparison);
    }

});