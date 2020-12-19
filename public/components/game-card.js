fetch("components/game-card.html")
    .then(stream => stream.text())
    .then(text => define(text));

function define(html) {
    class GameCard extends HTMLElement {
        set value(value) {
            this._value = value;
            this.valueElement.innerText = this._value;
        }

        get value() {
            return this._value;
        }

        constructor() {
            super();

            var shadow = this.attachShadow({ mode: 'open' });
            shadow.innerHTML = html;
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
                    var a = this.shadowRoot.querySelector(".full-div");
                    a.classList.add("player-card");
                    if (newValue === "legal")
                        a.classList.add("legal");
                    else if (newValue === "illegal")
                        a.classList.add("illegal");
                } 

        }
    }

    customElements.define('game-card', GameCard);

}
