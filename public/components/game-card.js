const gameCardTemplate = document.createElement('template');

fetch("components/game-card.html")
    .then(stream => stream.text())
    .then(text => gameCardTemplate.innerHTML = text);

class GameCard extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(gameCardTemplate.content.cloneNode(true));
    }

    static get observedAttributes() { return ["color", "value", "card-info", "status", "is-legal"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "color")
            this.shadowRoot.querySelector(".card-color").setAttribute("src", "images/" + newValue + ".png");
        else if (name === "value")
            this.shadowRoot.querySelector(".card-value").innerHTML = newValue;
        else if (name === "card-info")
            this.shadowRoot.querySelector(".card-info").innerHTML = newValue;
        else if (name === "status")
            if (newValue != null) {
                var div = this.shadowRoot.querySelector(".full-div");
                div.classList.add("player-card");
                if (newValue === "legal")
                    div.classList.add("legal");
                else if (newValue === "illegal")
                    div.classList.add("illegal");
                else {
                    div.classList.remove("legal");
                    div.classList.remove("illegal");
                }
            } 

    }
}

customElements.define('game-card', GameCard);

