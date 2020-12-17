var counter = 0;

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
    { color: CARDCOLOR.HEARTS, value: 2 },
    { color: CARDCOLOR.HEARTS, value: 3 },
    { color: CARDCOLOR.HEARTS, value: 4 },
    { color: CARDCOLOR.HEARTS, value: 5 },
    { color: CARDCOLOR.HEARTS, value: 6 },
    { color: CARDCOLOR.HEARTS, value: 7 },
    { color: CARDCOLOR.HEARTS, value: 8 },
    { color: CARDCOLOR.HEARTS, value: 9 },
    { color: CARDCOLOR.HEARTS, value: 10 },
    { color: CARDCOLOR.HEARTS, value: 11 },
    { color: CARDCOLOR.HEARTS, value: 12 },
    { color: CARDCOLOR.HEARTS, value: 13 },
    { color: CARDCOLOR.HEARTS, value: 14 },
    { color: CARDCOLOR.SPADES, value: 2 },
    { color: CARDCOLOR.SPADES, value: 3 },
    { color: CARDCOLOR.SPADES, value: 4 },
    { color: CARDCOLOR.SPADES, value: 5 },
    { color: CARDCOLOR.SPADES, value: 6 },
    { color: CARDCOLOR.SPADES, value: 7 },
    { color: CARDCOLOR.SPADES, value: 8 },
    { color: CARDCOLOR.SPADES, value: 9 },
    { color: CARDCOLOR.SPADES, value: 10 },
    { color: CARDCOLOR.SPADES, value: 11 },
    { color: CARDCOLOR.SPADES, value: 12 },
    { color: CARDCOLOR.SPADES, value: 13 },
    { color: CARDCOLOR.SPADES, value: 14 },
    { color: CARDCOLOR.DIAMONDS, value: 2 },
    { color: CARDCOLOR.DIAMONDS, value: 3 },
    { color: CARDCOLOR.DIAMONDS, value: 4 },
    { color: CARDCOLOR.DIAMONDS, value: 5 },
    { color: CARDCOLOR.DIAMONDS, value: 6 },
    { color: CARDCOLOR.DIAMONDS, value: 7 },
    { color: CARDCOLOR.DIAMONDS, value: 8 },
    { color: CARDCOLOR.DIAMONDS, value: 9 },
    { color: CARDCOLOR.DIAMONDS, value: 10 },
    { color: CARDCOLOR.DIAMONDS, value: 11 },
    { color: CARDCOLOR.DIAMONDS, value: 12 },
    { color: CARDCOLOR.DIAMONDS, value: 13 },
    { color: CARDCOLOR.DIAMONDS, value: 14 },
    { color: CARDCOLOR.CLUBS, value: 2 },
    { color: CARDCOLOR.CLUBS, value: 3 },
    { color: CARDCOLOR.CLUBS, value: 4 },
    { color: CARDCOLOR.CLUBS, value: 5 },
    { color: CARDCOLOR.CLUBS, value: 6 },
    { color: CARDCOLOR.CLUBS, value: 7 },
    { color: CARDCOLOR.CLUBS, value: 8 },
    { color: CARDCOLOR.CLUBS, value: 9 },
    { color: CARDCOLOR.CLUBS, value: 10 },
    { color: CARDCOLOR.CLUBS, value: 11 },
    { color: CARDCOLOR.CLUBS, value: 12 },
    { color: CARDCOLOR.CLUBS, value: 13 },
    { color: CARDCOLOR.CLUBS, value: 14 },
]

const CARDNUMBER = {
    "DEMO": [1, 3, 1],
    "UP_TO_10": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "DOWN_FROM_10": [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "UP_AND_DOWN_10": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "UP_AND_DOWN_MAX": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

}


function getShuffledCards() {
    var res = [...CARDS];
    for (let i = res.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
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
    orderCards };