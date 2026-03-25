"use strict";

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

    /** @type {boolean} */
    #visible = false;;
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
                    //top = maxBottom;
                }
                if(left<0) {
                    left = 0;
                } else if(left>maxRight) {
                    //left = maxRight;
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
    static arrangeWindows() {
        const windows = [...PopupWindowElement.#visibleWindows];
        windows.forEach(e=> {
            e.hide();
        });
        windows.forEach(e=> {
            e.bringToFront();
            e.show();
        });
    }
    
    /**
     * 
    * @param {number} x 
    * @param {number} y 
     */
    show(x, y) {
        this.bringToFront();
        if(this.#visible===true) {
            return;
        }
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
            if(x > window.innerWidth ) {
                i++;
                // Too wide for the screen, move it down and go again
                x = minX;
                y = minY * i;
                continue;
            } 
            else {
                break;
            }
            break;
        }
        this.style.left = x + "px";
        this.style.top = y + "px";
        this.#visible = true;
    }
    hide() {
        this.style.display = "none";
        PopupWindowElement.#removeWindow(this);
        this.#visible = false;
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
export class FilterableElement extends HTMLElement {
    /** @type {string} */
    filterableValue;
}
export function bootstrapComponents() {
    customElements.define("card-box", CardBoxElement);
    customElements.define("filterable-list", FilterableListElement);
    customElements.define("collapsible-entry", CollapsibleEntryElement);
    customElements.define("popup-window", PopupWindowElement);
}