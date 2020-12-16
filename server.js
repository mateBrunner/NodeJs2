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
    socket.on('start', start);
    socket.on('licit', licit);
    socket.on('playCard', playCard);
}

function join(data) {
    var player = game.joinPlayer(data);
    io.to(basicRoom).emit('join', player);
    io.to(data.socketId).emit('joinWithSession', player)
}

function checkSession(data) {
    var result = {
        sessionId: game.checkSession(data),
        gameStatus: game.gameStatus 
    }
    io.to(data["socketId"]).emit('checkSession', result)
}

function getLobbyInfo(socketId) {
    io.to(socketId).emit('getLobbyInfo', game.getLobbyInfo());
}

function start() {
    var gameInfo = game.start();
    io.to(basicRoom).emit('start', gameInfo);

    var data = game.startNextRound();
    io.to(basicRoom).emit('startRound', data)
}

function licit(data) {
    var licits = game.saveLicit(data);
    if (licits != null) {
        io.to(basicRoom).emit('licitEnd', licits);
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

                io.to(basicRoom).emit('startTurn', game.startNextTurn())

                if (game.isRoundEnded()) 
                    io.to(basicRoom).emit('startRound', game.startNextRound())

                var newData = game.getNewCardData();
                io.to(basicRoom).emit('newCard', newData);

            }, 1800);
        } else {
            var newData = game.getNewCardData();
            io.to(basicRoom).emit('newCard', newData);
        }
        
    }

}