const helper = require("./helper");

var sockets = [];
var players = [];
var nextPlayerDict;
var gameStatus = helper.GAMESTATUS.LOBBY;
var round = 1;   //leosztás száma
var turn = 1;
var licits = [];
var tableCards = [];
var dealer;
var trump;
var lastHitSessionId;
var playingSessionId;

function joinPlayer(data) {
    //if (gameStatus != helper.GAMESTATUS.LOBBY)
        //TODO

    var player = {
        name: data.name, 
        sessionId: helper.generateSessionId(),
        hits: 0,
        licit: null,
        points: 0,
        cards: []
    }
    players.push(player);
    sockets.push({sessionId: player.sessionId, socketId: data.socketId});
    return player
}

function checkSession(data) {
    var player = players.find(p => p.sessionId === data.sessionId)
    if (player === undefined) {
        return null;   
    }
    else {
        var socket = sockets.find(s => s.sessionId === data.sessionId)
        socket.socketId = data.socketId;
    }
    return data.sessionId;
}

function getLobbyInfo() {
    return players.map( p => p.name );
}

function start() {

    if (gameStatus === helper.GAMESTATUS.GAME) {
        console.log("game is already in progress");
        return null;
    }

    gameStatus = helper.GAMESTATUS.GAME;
    players.forEach(player => {
        player.points = 0;
    });
    round = 0;

    nextPlayerDict = new Object();
    for (let i = 0; i < players.length - 1; i++) {
        nextPlayerDict[players[i].sessionId] = players[i + 1].sessionId;
    }
    nextPlayerDict[players[players.length - 1].sessionId] = players[0].sessionId;

    console.log(JSON.stringify(nextPlayerDict));
    return players;
}

function isRoundEnded() {

}

function startNextRound() {
    //TODO: mozgatni a roundot
    round = 8;
    //TODO: mozgatni a dealert
    turn = 1;
    dealer = players[0];
    licits = [];
    tableCards = [];
    var shuffledCards = helper.getShuffledCards();
    for (let i = 0; i < players.length; i++ ) {
        players[i]["cards"] = shuffledCards.slice(i * round, (i + 1) * round );
        players[i].hits = 0;
        helper.orderCards(players[i]["cards"]);
    }
    trump = shuffledCards[players.length * round]
    return {
        dealer: dealer,
        trump: trump,
        players: players
    };
}

function saveLicit(data) {
    var licitOfThis = licits.find(d => 
        d.sessionId === data.sessionId
    );
    if (licitOfThis === undefined) {
        licits.push(data);
        players.find(p => p.sessionId === data.sessionId).licit = data.licit;
    }
    if (licits.length === players.length) {
        return licits;
    } else
        return null;
}

function isTurnEnded() {
    return tableCards.length === players.length;
}

function startNextTurn() {
    lastHitSessionId = getLastHitSessionId();
    players.find(p => p.sessionId === lastHitSessionId).hits += 1;
    tableCards = [];
    turn += 1;
    return players;
}

function getNewCardData() {
    var startingSessionId;
    if (tableCards.length > 0) {
        startingSessionId = 
            nextPlayerDict[ tableCards[tableCards.length - 1]["sessionId"] ];
    } else {
        if (turn == 1) 
            startingSessionId = dealer.sessionId;
        else
            startingSessionId = lastHitSessionId;
    }

    playingSessionId = startingSessionId;
    var player = players.find(p => p.sessionId === startingSessionId);

    var data = {
        sessionId: startingSessionId,
        name: player.name,
        trumpcolor: trump,
        playerCards: player.cards,
        tableCards: tableCards,
    }

    return data;
}

function playCard(card) {
    if (card.sessionId != playingSessionId )
        return null;

    var player = players.find(p => p.sessionId === card.sessionId);
    player.cards = 
        player.cards.filter(c => !(c.color === card.color && c.value === card.value))

    tableCards.push(card)

    return tableCards;
}

function getLastHitSessionId() {
    var erosek = tableCards.filter(c => c.color === trump.color);
    if (erosek.length === 0)
        erosek = tableCards.filter(c => c.color === tableCards[0].color);

    maxCard = erosek.reduce((p, c) => p.value > c.value ? p : c);
    console.log(JSON.stringify(maxCard));

    return maxCard.sessionId;
}

module.exports = { 
    joinPlayer, 
    checkSession, 
    getLobbyInfo,
    start, 
    startNextRound,
    startNextTurn,
    saveLicit,
    getNewCardData,
    playCard,
    isTurnEnded,
    isRoundEnded,
    gameStatus 
};