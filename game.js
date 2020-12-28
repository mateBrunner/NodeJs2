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
var lastHitCard;
var playingSessionId;
var cardnumber;
var pointHistory;


function joinPlayer(data) {
    //if (gameStatus != helper.GAMESTATUS.LOBBY)
        //TODO

    if (players.find(p => p.name === data.name) != undefined)
        return "error";

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
        //var socket = sockets.find(s => s.sessionId === data.sessionId)
        //socket.socketId = data.socketId;
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
        round: round,
        numberOfRounds: cardnumber.length,
        pointHistory: pointHistory
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

    players = helper.shuffleArray(players);

    pointHistory = [];

    gameStatus = helper.GAMESTATUS.GAME;

    for (let i = 0; i < players.length; i++) {
        players[i].points = 0;
        players[i].color = helper.COLORS[i];
    }

    round = 0;
    cardnumber = helper.CARDNUMBER[gameType];

    nextPlayerDict = new Object();
    for (let i = 0; i < players.length - 1; i++) {
        nextPlayerDict[players[i].sessionId] = players[i + 1].sessionId;
    }
    nextPlayerDict[players[players.length - 1].sessionId] = players[0].sessionId;

    var result = {
        players: players,
        numberOfRounds: cardnumber.length
    }

    return result;
}

function isRoundEnded() {
    if (turn <= cardnumber[round-1])
        return false;
    return true;
   
}

function endRound() {
    var newPoints = [];
    players.forEach(p => {

        var gainedPoints;
        if (p.licit === p.hits)
            gainedPoints = 10 + p.licit * 2;
        else
            gainedPoints = -2 * Math.abs(p.licit - p.hits);

        p.points += gainedPoints;
        newPoints.push(p.points);
    });
    pointHistory.push(newPoints);

    var data = {
        players: players,
        round: round,
        dealer: dealer,
        cardnumber: cardnumber,
        pointHistory: pointHistory,
        nextPlayerDict: nextPlayerDict
    }

    return data;
}

function startNextRound() {
    round += 1;
    turn = 1;
    dealer = players[round % players.length];
    licits = [];
    tableCards = [];
    var cardToDraw = cardnumber[round - 1];

    var shuffledCards = helper.getShuffledCards(players.length, cardToDraw);
    for (let i = 0; i < players.length; i++) {
        players[i]["cards"] = shuffledCards.slice(i * cardToDraw, (i + 1) * cardToDraw);
        players[i].cards.forEach(c => c.sessionId = players[i].sessionId);
        players[i].hits = 0;
        players[i].licit = 0;
        helper.orderCards(players[i]["cards"]);
    }
    trump = shuffledCards[players.length * cardToDraw];
    return {
        dealerSessionId: dealer.sessionId,
        trump: trump,
        players: players,
        turns: cardToDraw,
        round: round
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

        var playersWithCards = null;
        if (turn === 1) {
            playersWithCards = [];
            players.forEach(p => playersWithCards.push({
                sessionId: p.sessionId,
                cards: p.cards
            }));
        }
        
        var result = {
            licits: licits,
            players: playersWithCards
        }

        return result;
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

    var result = {
        players: players,
        lastHitCard: lastHitCard,
    }

    return result;
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

    var lastCardSessionId = null;
    if (tableCards.length > 0)
        lastCardSessionId = tableCards[tableCards.length - 1]["sessionId"];

    var data = {
        sessionId: startingSessionId,
        lastCardSessionId: lastCardSessionId,
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
    var erosek = tableCards.filter(c => c.color === trump.color);
    if (erosek.length === 0)
        erosek = tableCards.filter(c => c.color === tableCards[0].color);

    lastHitCard = erosek.reduce((p, c) => p.value > c.value ? p : c);

    return lastHitCard.sessionId;
}

function quit() {
    gameStatus = GAMESTATUS.LOBBY;
    players = [];
    sockets = [];
}

function loadGame(data) {
    gameStatus = helper.GAMESTATUS.GAME;
    players = data.players;
    round = data.round;
    licits = [];
    cardnumber = data.cardnumber;
    dealer = data.dealer;
    nextPlayerDict = data.nextPlayerDict;
    pointHistory = data.pointHistory;
    players.forEach(p => {
        p.licit = null;
        p.hits = 0;
    })
    startNextRound();
}

function getNameBySessionId(sessionId) {
    var player = players.find(p => p.sessionId === sessionId);
    if (player === undefined)
        return "Valaki";
    else
        return player.name;
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
    getNameBySessionId,
    quit,
    loadGame
};