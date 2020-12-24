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

    static get observedAttributes() { return [
        "name", 
        "points", 
        "hits", 
        "is-loading", 
        "is-dealer", 
        "is-card-visible", 
        "card-props"]; }

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
                this.shadowRoot.querySelector(".name-p").classList.remove("underlined");
        else if (name === "is-card-visible")
            if (newValue === "true")
                this.shadowRoot.querySelector(".card").classList.remove("hidden");
            else
                this.shadowRoot.querySelector(".card").classList.add("hidden");
        else if (name === "card-props") {
            this.shadowRoot.querySelector(".card").setAttribute("color", newValue.split("_")[0])
            this.shadowRoot.querySelector(".card").setAttribute("value", newValue.split("_")[1])
            this.shadowRoot.querySelector(".card").setAttribute("status", "small")
        }


    }
}

customElements.define('player-box', PlayerBox);

