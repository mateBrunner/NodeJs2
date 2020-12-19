const playerBoxTemplate = document.createElement('template');

fetch("components/player-box.html")
    .then(stream => stream.text())
    .then(text => playerBoxTemplate.innerHTML = text);

class PlayerBox extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(playerBoxTemplate.content.cloneNode(true));
    }

    static get observedAttributes() { return ["name", "points", "hits", "is-loading", "is-dealer"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "name")
            this.shadowRoot.querySelector(".name-p").innerHTML = newValue;
        else if (name === "points")
            this.shadowRoot.querySelector(".point-p").innerHTML = newValue;
        else if (name === "hits")
            this.shadowRoot.querySelector(".hits").innerHTML = newValue;
        else if (name === "is-loading")
            if (newValue === "true")
                this.shadowRoot.querySelector("img").classList.remove("hidden");
            else 
                this.shadowRoot.querySelector("img").classList.add("hidden");
        else if (name === "is-dealer")
            if (newValue === "true")
                this.shadowRoot.querySelector(".name-p").classList.add("underlined");
            else 
                this.shadowRoot.querySelector("name-p").classList.remove("underlined");

        

    }
}

customElements.define('player-box', PlayerBox);

