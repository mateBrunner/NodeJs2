
function generateSessionId() {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 12; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const GAMESTATUS = {
    LOBBY: 'lobby',
    GAME: 'game'
}

const CARDCOLOR = {
    HEARTS: 'H',
    CLUBS: 'C',
    DIAMONDS: 'D',
    SPADES: 'S'
}

const CARDS = [
    { color: CARDCOLOR.HEARTS, value: 2, id: null },
    { color: CARDCOLOR.HEARTS, value: 3, id: null },
    { color: CARDCOLOR.HEARTS, value: 4, id: null },
    { color: CARDCOLOR.HEARTS, value: 5, id: null },
    { color: CARDCOLOR.HEARTS, value: 6, id: null },
    { color: CARDCOLOR.HEARTS, value: 7, id: null },
    { color: CARDCOLOR.HEARTS, value: 8, id: null },
    { color: CARDCOLOR.HEARTS, value: 9, id: null },
    { color: CARDCOLOR.HEARTS, value: 10, id: null },
    { color: CARDCOLOR.HEARTS, value: 11, id: null },
    { color: CARDCOLOR.HEARTS, value: 12, id: null },
    { color: CARDCOLOR.HEARTS, value: 13, id: null },
    { color: CARDCOLOR.HEARTS, value: 14, id: null },
    { color: CARDCOLOR.SPADES, value: 2, id: null },
    { color: CARDCOLOR.SPADES, value: 3, id: null },
    { color: CARDCOLOR.SPADES, value: 4, id: null },
    { color: CARDCOLOR.SPADES, value: 5, id: null },
    { color: CARDCOLOR.SPADES, value: 6, id: null },
    { color: CARDCOLOR.SPADES, value: 7, id: null },
    { color: CARDCOLOR.SPADES, value: 8, id: null },
    { color: CARDCOLOR.SPADES, value: 9, id: null },
    { color: CARDCOLOR.SPADES, value: 10, id: null },
    { color: CARDCOLOR.SPADES, value: 11, id: null },
    { color: CARDCOLOR.SPADES, value: 12, id: null },
    { color: CARDCOLOR.SPADES, value: 13, id: null },
    { color: CARDCOLOR.SPADES, value: 14, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 2, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 3, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 4, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 5, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 6, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 7, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 8, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 9, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 10, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 11, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 12, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 13, id: null },
    { color: CARDCOLOR.DIAMONDS, value: 14, id: null },
    { color: CARDCOLOR.CLUBS, value: 2, id: null },
    { color: CARDCOLOR.CLUBS, value: 3, id: null },
    { color: CARDCOLOR.CLUBS, value: 4, id: null },
    { color: CARDCOLOR.CLUBS, value: 5, id: null },
    { color: CARDCOLOR.CLUBS, value: 6, id: null },
    { color: CARDCOLOR.CLUBS, value: 7, id: null },
    { color: CARDCOLOR.CLUBS, value: 8, id: null },
    { color: CARDCOLOR.CLUBS, value: 9, id: null },
    { color: CARDCOLOR.CLUBS, value: 10, id: null },
    { color: CARDCOLOR.CLUBS, value: 11, id: null },
    { color: CARDCOLOR.CLUBS, value: 12, id: null },
    { color: CARDCOLOR.CLUBS, value: 13, id: null },
    { color: CARDCOLOR.CLUBS, value: 14, id: null },
]

const CARDNUMBER = {
    "DEMO": [10, 3, 1],
    "UP_TO_10": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "DOWN_FROM_10": [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "UP_AND_DOWN_10": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "UP_AND_DOWN_MAX": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
}

function getShuffledCards(numberOfPlayers, cardToDraw) {
    
    var extraDecks = Math.floor((numberOfPlayers * cardToDraw + 1) / 52);

    var res = [];

    for (let i = 0; i < extraDecks + 1; i++) {
        for (let j = 0; j < CARDS.length; j++) {
            res.push({
                color: CARDS[j].color,
                value: CARDS[j].value,
                id: "" + CARDS[j].color + CARDS[j].value + "_" + i,
            })
        }
    }

    return shuffleArray(res);

}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function orderCards(cards) {
    cards.sort((a, b) => 
    (a.color > b.color) ? 1 : 
    (a.color === b.color) ? ((a.value > b.value) ? 1 : -1) : -1 )
}


module.exports = { 
    GAMESTATUS, 
    CARDCOLOR, 
    CARDS, 
    CARDNUMBER,
    getShuffledCards, 
    generateSessionId, 
    orderCards,
    shuffleArray };