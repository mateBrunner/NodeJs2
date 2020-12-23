const game = require("./game");
const helper = require("./helper");
const basicRoom = 'basic room';

var express = require('express');
var app = express();
const port = process.env.PORT || 3000;
var server = app.listen(port);
app.use(express.static('public'));
console.log('server started')

var socket = require('socket.io');
const { GAMESTATUS } = require("./helper");
var io = socket(server);

io.sockets.on('connection', newConnection);

//ez fut le akkor, ha új kliens csatlakozik
function newConnection(socket) {
    console.log('new connection: ' + socket.id);
    socket.join(basicRoom);
    socket.on('join', join);   
    socket.on('checkSession', checkSession);
    socket.on('getLobbyInfo', getLobbyInfo);
    socket.on('getBoardInfo', getBoardInfo);
    socket.on('startGame', startGame);
    socket.on('licit', licit);
    socket.on('playCard', playCard);
    socket.on('getNewCardData', getNewCardData);
    socket.on('quit', quit);
}

function join(data) {
    var result = game.joinPlayer(data);
    //később lehet beletenni mást az error-ba
    if (result === "error")
        io.to(data.socketId).emit('joinError');
    else {
        io.to(basicRoom).emit('join', result);
        io.to(data.socketId).emit('joinWithSession', result) //ebből tudjuk egyelőre, mit mentünk localStorage-ba
    }

}

function checkSession(data) {
    var result = game.checkSession(data);
    io.to(data["socketId"]).emit('checkSession', result)
}

function getLobbyInfo(data) {
    io.to(data.socketId).emit('getLobbyInfo', game.getLobbyInfo());
}

function getBoardInfo(data) {
    io.to(data.socketId).emit('getBoardInfo', game.getBoardInfo(data.sessionId));
}

function startGame(gameType) {
    var gameInfo = game.startGame(gameType);
    if ( gameInfo === null )
        return;

    io.to(basicRoom).emit('startGame', gameInfo);

    var data = game.startNextRound();
    io.to(basicRoom).emit('startRound', data)
}

function licit(data) {
    var result = game.saveLicit(data);
    io.to(basicRoom).emit('someoneLicited', data.sessionId);
    if (result != null) {
        io.to(basicRoom).emit('licitEnd', result);
        var data = game.getNewCardData();
        io.to(basicRoom).emit('newCard', data);
    }    
}

function playCard(data) {
    var tableCards = game.playCard(data);
    if (tableCards != null) {
        io.to(basicRoom).emit('showTableCards', tableCards)
        if (game.isTurnEnded()) {
            setTimeout(function() {

                io.to(basicRoom).emit('endTurn', game.endTurn())

                if (game.isRoundEnded()) {
                    io.to(basicRoom).emit('endRound', game.endRound());

                    if (game.isGameEnded())
                        io.to(basicRoom).emit('endGame');
                    else 
                        io.to(basicRoom).emit('startRound', game.startNextRound())
                    
                } else {
                    var newData = game.getNewCardData();
                    io.to(basicRoom).emit('newCard', newData);
                }             
                

            }, 1800);
        } else {
            var newData = game.getNewCardData();
            io.to(basicRoom).emit('newCard', newData);
        }
        
    }

}

function getNewCardData(socketId) {
    var newData = game.getNewCardData();
    io.to(socketId).emit('newCard', newData);
}

function quit() {
    game.quit();
    io.to(basicRoom).emit('quit');
}