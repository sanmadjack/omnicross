"use strict";

import { calculateSortableName, isString, sortByName, sortMapByName, sortSetByName } from "../tools.js";
import { idRegex, generateComparisonName } from "./tools.js";

export class SavedData {
    static #key = "omnicross.savedData";

    comparisons = new Map();

    constructor() {
        const jsonString = localStorage.getItem(SavedData.#key);

        const data = JSON.parse(jsonString);

        if (data) {
            if (data.comparisons) {
                data.comparisons.forEach(e => {
                    const comparison = Comparison.load(e);
                    if (comparison != null) {
                        this.addComparison(comparison);
                    }
                })
            }
        }
    }

    /**
     * 
     * @param {Comparison} comparison 
     */
    addComparison(comparison) {
        if (idRegex.test(comparison.id)) {
            throw Error("Invalid comparison ID: " + comparison.id);
        }
        this.comparisons.set(comparison.id, comparison);
    }
    /**
     * 
     * @param {string} id 
     */
    removeComparison(id) {
        this.comparisons.delete(id);
    }

    save() {
        const saveData = {};
        saveData.comparisons = [];
        this.comparisons.forEach(c => {
            saveData.comparisons.push(c);
        });

        localStorage.setItem(SavedData.#key, JSON.stringify(saveData, (key, value) => {
            if (value instanceof Set) {
                if (value.size > 0) {
                    return [...value];
                }
                return [];
            }
            return value;
        }));
    }

    clear() {
        localStorage.removeItem(this.id);
    }
}

export class Parser {
    constructor() {
    }

    /**
     * 
     * @param {string} path 
     * @returns {Database}
     */
    async parse(path) {
        const output = new Database();
        const response = await fetch(path);
        output.lastModified = response.headers.get('Last-Modified');
        const data = await response.json();
        if (data.compilations) {
            data.compilations.forEach(e => {
                if (output.getCompilationById(e.id) != null) {
                    throw Error("Duplicate compilation ID: " + e.id);
                }

                var compilation = new Compilation(e.id, e.title);
                if (e.format) {
                    compilation.format = e.format;
                }
                if (e.reference) {
                    compilation.reference = e.reference;
                }
                if (e.tags) {
                    compilation.tags = new Set(e.tags);
                }

                if (!e.issues) {
                    console.error(e);
                    throw Error("issues property not found for compilation");
                }
                Object.keys(e.issues).forEach(function (key, index) {
                    let series = output.getSeriesNyName(key);
                    if (series === undefined) {
                        series = new Series(key);
                        output.addSeries(series);
                    }

                    const issueRanges = e.issues[key].toString().split(",");
                    const issueRangeRegex = /^(-?\d+)-(-?\d+)$/;
                    const issueNumberRegex = /^(-?[0-9\.]+)$/;
                    issueRanges.forEach(e => {
                        const m = e.match(issueRangeRegex);
                        if (m) {
                            const startNumber = parseInt(m[1]);
                            const endNumber = parseInt(m[2]);
                            if (endNumber < startNumber) {
                                console.error(e);
                                console.error("End number smaller than start number");
                                return;
                            }
                            for (let i = startNumber; i <= endNumber; i++) {
                                const issue = output.getOrAddIssue(series.id, i);
                                compilation.addIssue(issue);
                            }
                        } else {
                            const m = e.match(issueNumberRegex);
                            if (m) {
                                const issueNumber = parseFloat(e);
                                const issue = output.getOrAddIssue(series.id, issueNumber);
                                compilation.addIssue(issue);
                            } else {
                                console.error("Could not parse issue range: " + e);
                                return;
                            }
                        }
                    });
                });

                output.addCompilation(compilation);
            });
        }
        output.sortData();
        return output;
    }
}


export class Database {
    lastModified;

    /** @type {Map<string, Compilation>} */
    #compilations = new Map();
    /** @type {Map<string, Series>} */
    #series = new Map();
    /** @type {Map<string, Issue>} */
    #issues = new Map();

    sortData() {
        this.#compilations = sortMapByName(this.#compilations);
        this.#series = sortMapByName(this.#series);
        //this.#issues = this.#sortMapByName(this.#issues);
    }

    /**
     * 
     * @param {Compilation} c 
     * @returns {Compilation}
     */
    addCompilation(c) {
        this.#compilations.set(c.id, c);
        return c;
    }
    /**
     * 
     * @param {Series} s 
     * @returns {Series}
     */
    addSeries(s) {
        this.#series.set(s.id, s);
        return s;
    }
    /**
     * 
     * @returns {number}
     */
    countSeries() {
        return this.#series.size;
    }
    /**
     * 
     * @returns {number}
     */
    countCompilations() {
        return this.#compilations.size;
    }

    /** @returns {Issue} */
    getOrAddIssue(seriesId, issueNumber) {
        const series = this.getSeriesById(seriesId);
        if (series.issues.has(issueNumber)) {
            return this.getIssueById(series.issues.get(issueNumber));
        }
        const issue = new Issue(seriesId, issueNumber);
        issue.name = series.name + " #" + issueNumber;
        this.#issues.set(issue.id, issue);
        series.issues.set(issueNumber, issue.id);
        return issue;
    }
    /**
     * 
     * @param {Set<string>} issueIds 
     * @returns {Set<number>}
     */
    getIssueNumbers(issueIds) {
        var output = new Set();
        issueIds.forEach(e => output.add(this.getIssueById(e).number));
        return output;
    }

    // /** @returns {Array<Series>} */
    // getAllSeriesForCompilation(id)
    // {
    //     let allSeriesIds = [];
    //     /** @type {Compilation} */
    //     const compilation = this.getCompilationById(id);
    //     compilation.issues.forEach(e=>allSeriesIds.push(this.getIssueById(e).seriesId));
    //     const uniqueIds = new Set(allSeriesIds);
    //     let output = [];
    //     uniqueIds.forEach(e=>output.push(this.getSeriesById(e)));
    //     return output.sort(sortByName);
    // }
    /**
     * 
     * @param {string} id 
     * @returns {Compilation}
     */
    getCompilationById(id) {
        return this.#compilations.get(id);
    }
    /**
     * 
     * @param {string} id 
     * @returns {Series}
     */
    getSeriesById(id) {
        return this.#series.get(id);
    }
    /**
     * 
     * @param {string} name 
     * @returns {Series}
     */
    getSeriesNyName(name) {
        name = name.toLowerCase().trim();
        let result = undefined;
        for (const [key, value] of this.#series.entries()) {
            if (value.lowerName == name) {
                result = value;
                break;
            }
        }
        return result;
    }
    /**
     * 
     * @param {string} id 
     * @returns {Issue}
     */
    getIssueById(id) {
        return this.#issues.get(id);
    }
    /** @returns {MapIterator<Compilation>} */
    getAllCompilations() {
        return this.#compilations.values();
    }
    /** @returns {MapIterator<Series>} */
    getAllSeries() {
        return this.#series.values();
    }
    /** 
     * @param {Iterable<string>} idList 
     * @returns {Iterable<Series>} */
    getSeriesByIds(idList) {
        const output = new Set();
        idList.forEach(e => output.add(this.getSeriesById(e)));
        return sortSetByName(output);
    }
    /**
     * 
     * @param {string} issueId 
     * @returns {Set<Compilation>}
     */
    getCompilationsWithIssue(issueId) {
        let output = new Set();
        this.#compilations.forEach((v, k) => {
            if (v.issues.has(issueId)) {
                output.add(v);
            }
        });
        return sortSetByName(output);
    }
    /**
     * 
     * @param {string} seriesId 
     * @returns {Set<Series>}
     */
    getCompilationsWithSeries(seriesId) {
        let output = new Set();

        this.#compilations.forEach((v, k) => {
            if (v.series.has(seriesId)) {
                output.add(v);
            }
        });
        return sortSetByName(output);
    }
}

// Represents a collection of issues, an omnibus or other book thing.
export class Compilation {
    /** @type {string} */
    id;
    /** @type {string} */
    name;
    /** @type {string} */
    type;
    /** @type {string} */
    reference;
    /** @type {string} */
    sortableName;
    // A list of uuids of issues within this compilation
    /** @type {Set<string>} */
    issues = new Set();
    // A list of uuids of partial issues within the compilation
    /** @type {Set<string>} */
    partials = new Set();
    // A list of series in the compilation, along with the issues for that series
    /** @type {Map<string, Set<string>>} */
    series = new Map();
    /** @type {Set<string>} */
    tags = new Set();

    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.sortableName = calculateSortableName(name);
    }
    /**
     * 
     * @param {Issue} issue 
     */
    addIssue(issue) {
        this.issues.add(issue.id);
        if (!this.series.has(issue.seriesId)) {
            this.series.set(issue.seriesId, new Set());
        }
        this.series.get(issue.seriesId).add(issue.id);
    }
}
// Represents the series an issue is part of
export class Series {
    /** @type {string} */
    id = crypto.randomUUID();
    /** @type {string} */
    name;
    /** @type {string} */
    sortableName;
    /** @type {string} */
    lowerName;
    // A list of uuids of issues within this series
    /** @type {Map<number, string>} */
    issues = new Map();
    constructor(name) {
        this.name = name;
        this.lowerName = name.toLowerCase().trim();
        this.sortableName = calculateSortableName(name);
    }
}
// Represents an issue contained in a Compilation
export class Issue {
    /** @type {number} */
    number;
    /** @type {string} */
    seriesId;
    /** @type {string} */
    name;
    /** @type {string} */
    id = crypto.randomUUID();
    constructor(seriesId, number) {
        this.seriesId = seriesId;
        this.number = number;
    }
}

export class Comparison {
    static #comparisonNames = new Set();

    /**
     * 
     * @param {string} name 
     * @returns bool
     */
    static checkNames(name) {
        return Comparison.#comparisonNames.has(name);
    }

    /** @type {string} */
    id;
    /** @type {string} */
    name;
    /** @type {Set<string>} */
    compilations = new Set();

    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        if (name == null) {
            name = generateComparisonName();
        }
        this.id = crypto.randomUUID();
        this.name = name;
        Comparison.#comparisonNames.add(name);
    }

    /**
     * 
     * @param {string} stringData 
     * @returns {Comparison}
     */
    static load(data) {
        const output = new Comparison(data.name);
        output.id = data.id;
        output.compilations = new Set(data.compilations);
        return output;
    }
}

export class ComparitorResult {
    /** @type {Set<Compilation>} */
    compilations = new Set();

    /** @type {Set<Compilation>} */
    uniqueCompilations = new Set();
    /** @type {Set<Compilation>} */
    overlappingCompilations = new Set();
    /** @type {Set<Compilation>} */
    redundantCompilations = new Set();

    /** @type {Set<Series>} */
    series = new Set();
    /** @type {Set<Issue>} */
    issues = new Set();

    /** @type {Map<Series, Map<Issue, Set<Compilation>>>} */
    overlaps = new Map();
    /** @type {Map<Compilation, Map<Series, Set<Issue>>>} */
    uniques = new Map();

    /**
     * 
     * @param {Compilation} compilation 
     */
    addUniqueCompilation(compilation) {
        this.uniqueCompilations.add(compilation);
    }
    /**
     * 
     * @param {Compilation} compilation 
     */
    addRedundantCompilation(compilation) {
        this.redundantCompilations.add(compilation);
    }

    /**
     * 
     * @param {Issue} issue 
     * @param {Compilation} compilation 
     */
    addOverlapIssue(series, issue, compilation) {
        if (!this.overlaps.has(series)) {
            this.overlaps.set(series, new Map());
        }
        const issueMap = this.overlaps.get(series);

        if (!issueMap.has(issue)) {
            issueMap.set(issue, new Set())
        }
        const compilationSet = issueMap.get(issue);

        compilationSet.add(compilation);

        this.series.add(series);
        this.issues.add(issue);
        this.compilations.add(compilation);
        this.overlappingCompilations.add(compilation);
    }
    /**
     * 
     * @param {Issue} issue 
     * @param {Compilation} compilation 
     */
    addUniqueIssue(series, issue, compilation) {
        if (!this.uniques.has(compilation)) {
            this.uniques.set(compilation, new Map());
        }
        const compilationMap = this.uniques.get(compilation);

        if (!compilationMap.has(series)) {
            compilationMap.set(series, new Set());
        }

        const issueSet = compilationMap.get(series);

        issueSet.add(issue);

        this.series.add(series);
        this.issues.add(issue);
        this.compilations.add(compilation);
    }
}

export class Comparitor {
    /**
     * 
     * @param {Database} database 
     * @param {Comparison} comparison 
     * @returns {ComparitorResult}
     */
    process(database, comparison) {
        /** @type {ComparitorResult} */
        const output = new ComparitorResult();

        /** @type {Array<Compilation>} */
        output.compilations = new Set([...comparison.compilations].map(id => database.getCompilationById(id)).sort(sortByName));

        output.compilations.forEach(a => {
            if (a == undefined) {
                return;
            }
            let redundant = true;
            let unique = true;

            a.issues.forEach(i => {
                const issue = database.getIssueById(i);
                const series = database.getSeriesById(issue.seriesId);
                let found = false;
                output.compilations.forEach(b => {
                    if (b == undefined || b.id === a.id) {
                        return;
                    }
                    if (b.issues.has(i)) {
                        output.addOverlapIssue(series, issue, a);
                        output.addOverlapIssue(series, issue, b);
                        found = true;
                    }
                });
                if (found === false) {
                    redundant = false;
                    output.addUniqueIssue(series, issue, a);
                } else {
                    unique = false;
                }
            });
            if (unique === true) {
                output.addUniqueCompilation(a);
            }
            if (redundant === true) {
                output.addRedundantCompilation(a);
            }
        });
        return output;
    }
}