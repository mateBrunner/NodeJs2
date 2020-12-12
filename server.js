//création du serveur web
var express = require('express');
var app = express();
const port = process.env.PORT || 3000; //il récupère le port sois dans la variable d'environnement, sois prend 3000
var server = app.listen(port);
app.use(express.static('public'));

console.log("my socket server is running");

//interaction client
var socket = require('socket.io');
var io = socket(server);
//event lorsqu'il y a une nouvelle connection
io.sockets.on('connection', newConnection);

//ez fut le akkor, ha új kliens csatlakozik
function newConnection(socket) {
    console.log('new connection: ' + socket.id);
    // socket.on('mouse', mouseMsg);
    // //adatokat küldünk minden ügyfélnek
    // function mouseMsg(data) {
    //     socket.broadcast.emit('mouse', data);
    //     console.log(data);
    // }

    socket.on('clicki', clickMsg);
    function clickMsg(data) {
        socket.broadcast.emit('clicki', data);
        console.log('data');
    }

}