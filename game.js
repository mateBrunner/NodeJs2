const { GAMESTATUS } = require("./helper");
const helper = require("./helper");

var sockets = [];
var players = [];
var nextPlayerDict;
var gameStatus = helper.GAMESTATUS.LOBBY;
var round = 0;   //leosztás száma
var turn = 1;
var licits = [];
var tableCards = [];
var dealer;
var trump;
var lastHitSessionId;
var playingSessionId;
var cardnumber;


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
    var res = {
        sessionId: null,
        gameStatus: gameStatus
    }

    var player = players.find(p => p.sessionId === data.sessionId)
    if (player === undefined) {
        return res;   
    }
    else {
        var socket = sockets.find(s => s.sessionId === data.sessionId)
        socket.socketId = data.socketId;
    }

    res.sessionId = data.sessionId;
    
    return res;
}

function getLobbyInfo() {
    return players;
}

function getBoardInfo(sessionId) {
    var res = {
        players: players,
        tableCards: tableCards,
        trump: trump,
        dealerSessionId: dealer.sessionId,
        turns: cardnumber[round - 1],
        shouldLicit: false,
    }

    if (sessionId === null)
        return res;

    if (licits.length != players.length && licits.find(l => l.sessionId === sessionId) === undefined)
        res.shouldLicit = true;

    return res;
}

function startGame(gameType) {

    if (gameStatus === helper.GAMESTATUS.GAME) {
        console.log("game is already in progress");
        return helper.GAMESTATUS.GAME;
    }

    if (players.length === 0)
        return null;

    gameStatus = helper.GAMESTATUS.GAME;
    players.forEach(player => {
        player.points = 0;
    });
    round = 0;
    cardnumber = helper.CARDNUMBER[gameType];

    nextPlayerDict = new Object();
    for (let i = 0; i < players.length - 1; i++) {
        nextPlayerDict[players[i].sessionId] = players[i + 1].sessionId;
    }
    nextPlayerDict[players[players.length - 1].sessionId] = players[0].sessionId;

    return players;
}

function isRoundEnded() {
    if (turn <= cardnumber[round-1])
        return false;
    return true;
   
}

function endRound() {
    players.forEach(p => {

        var gainedPoints;
        if (p.licit === p.hits)
            gainedPoints = 10 + p.licit * 2;
        else
            gainedPoints = -2 * Math.abs(p.licit - p.hits);

        p.points += gainedPoints;
    });
    return players;
}

function startNextRound() {
    round += 1;
    //TODO: mozgatni a dealert
    turn = 1;
    dealer = players[round % players.length];
    licits = [];
    tableCards = [];
    var cardToDraw = cardnumber[round - 1];


    var shuffledCards = helper.getShuffledCards(10, 15);
    for (let i = 0; i < players.length; i++) {
        players[i]["cards"] = shuffledCards.slice(i * cardToDraw, (i + 1) * cardToDraw);
        players[i].hits = 0;
        players[i].licit = 0;
        helper.orderCards(players[i]["cards"]);
    }
    trump = shuffledCards[players.length * cardToDraw];
    return {
        dealerSessionId: dealer.sessionId,
        trump: trump,
        players: players,
        turns: cardToDraw
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

function endTurn() {
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

function isGameEnded() {
    return round === cardnumber.length;
}

function playCard(card) {
    if (card.sessionId != playingSessionId )
        return null;

    var player = players.find(p => p.sessionId === card.sessionId);
    player.cards = 
        player.cards.filter(c => c.id != card.id)

    card["name"] = player.name;
    tableCards.push(card)

    return tableCards;
}

function getLastHitSessionId() {
    //tableCards = [{ color: "D", value: 5, sessionId: 1 }, { color: "D", value: 5, sessionId: 2 }]

    var erosek = tableCards.filter(c => c.color === trump.color);
    if (erosek.length === 0)
        erosek = tableCards.filter(c => c.color === tableCards[0].color);

    maxCard = erosek.reduce((p, c) => p.value > c.value ? p : c);

    return maxCard.sessionId;
}

function quit() {
    gameStatus = GAMESTATUS.LOBBY;
    players = [];
    sockets = [];
}

module.exports = { 
    joinPlayer, 
    checkSession, 
    getLobbyInfo,
    getBoardInfo,
    startGame, 
    startNextRound,
    isRoundEnded,
    endRound,
    isTurnEnded,
    endTurn,
    saveLicit,
    getNewCardData,
    playCard,
    gameStatus,
    isGameEnded,
    quit
};