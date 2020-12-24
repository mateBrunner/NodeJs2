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

    static get observedAttributes() { return ["color", "value", "card-info", "status", "is-legal", "size"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "color")
            this.shadowRoot.querySelector(".card-color").setAttribute("src", "images/" + newValue + ".png");
        else if (name === "value")
            this.shadowRoot.querySelector(".card-value").innerHTML = this.getCardValueText(newValue);
        else if (name === "card-info")
            this.shadowRoot.querySelector(".card-info").innerHTML = newValue;
        else if (name === "status")
            if (newValue === "legal" || newValue === "illegal" || newValue === "player-card") {
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
            else if (newValue === "small") {
                console.log("szióka");
                var div = this.shadowRoot.querySelector(".full-div");
                div.classList.add("small");
            }                

    }

    getCardValueText(val) {
    switch (val) {
        case "11": return "J";
        case "12": return "Q";
        case "13": return "K";
        case "14": return "A";
        default: return val;
    }
}
}

customElements.define('game-card', GameCard);

