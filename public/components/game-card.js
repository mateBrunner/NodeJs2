fetch("components/card.html")
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
            console.log("constructor");

        }


        static get observedAttributes() { return ["type"]; }

        attributeChangedCallback(name, oldValue, newValue) {
            console.log(name + " " + oldValue + " " + newValue)
            this.shadowRoot.querySelector("#mainP").innerHTML = newValue;
        }

    }

    customElements.define('game-card', GameCard);

}
