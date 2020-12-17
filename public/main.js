var socket;
var legalCardsCopy = [];

function myOnLoad() {
    socket = io();
  
    socket.on('join', joinCallback)
    socket.on('joinWithSession', joinWithSessionCallback)
    socket.on('checkSession', checkSessionCallback)
    socket.on('startGame', startGameCallback)
    socket.on('startRound', startRoundCallback)
    socket.on('endRound', endRoundCallback)
    socket.on('endTurn', endTurnCallback)
    socket.on('licitEnd', licitEnd)    
    socket.on('showTableCards', showTableCardsCallback)
    socket.on('newCard', newCardCallback)
    socket.on('quit', quitCallback)
    socket.on('getLobbyInfo', getLobbyInfoCallback)
    socket.on('getBoardInfo', getBoardInfoCallback)

    socket.on("connect", () => {
        checkSession();
    });
}

function checkSession() {
    var sessionId = window.localStorage.getItem('sessionId') 
    var data = {
        "sessionId": sessionId,
        "socketId": socket.id
    }
    socket.emit('checkSession', data);
}

function checkSessionCallback(result) {
    if (result.sessionId === null)  // ez a sessionId nincs játékban, töröljük a storage-ból
        window.localStorage.removeItem('sessionId');
    else
        window.localStorage.setItem('sessionId', result.sessionId);

    var data = {
        sessionId: window.localStorage.getItem('sessionId'),
        socketId: socket.id
    }
    if (result.gameStatus == "lobby") {
        showLobby();
        socket.emit('getLobbyInfo', data);
    } else if (result.gameStatus == "game") {
        showBoard();        
        socket.emit('getBoardInfo', data);
    }

}

function showLobby() {
    $("#lobbyDiv").removeClass("hidden-div");
    $("#boardDiv").addClass("hidden-div");
}

function getLobbyInfoCallback(players) {
    
    $("joinedPlayers").empty();
    players.forEach(player => {
        $("#joinedPlayers").append(createLobbyPlayer(player));
    });
}

function showBoard() {
    $("#lobbyDiv").addClass("hidden-div");
    $("#boardDiv").removeClass("hidden-div");
}

function getBoardInfoCallback(data) {

    showPlayerList(data.players);

    showTableCardsCallback(data.tableCards);

    showTrumpAndPlayerCards(data);

    showHitsAndDealer(data.players, data.dealerSessionId);

    if (data.shouldLicit)
        showLicitDiv(data.turns);
    else {
        data.players.forEach(p => {
            $("#hits-" + p.sessionId).html("" + p.hits + " / " + p.licit);
        })

        socket.emit('getNewCardData', socket.id);
    }
        

}

function join() {
    var name = $("#newPlayerName").val();

    if (name === "") {
        $("#joinErrorMsg").text("Név nem megfelelő")
        return;
    } else
        $("#joinErrorMsg").text("");

    var data = { name: name, socketId: socket.id }

    if (window.localStorage.getItem('sessionId') === null)
        socket.emit('join', data);
    else 
        $("#joinErrorMsg").text("Te már beléptél, nyughass!")
}

function joinCallback(player) {
    $("#joinedPlayers").append(createLobbyPlayer(player));
 
}

function joinWithSessionCallback(player) {
    window.localStorage.setItem('sessionId', player.sessionId)
}

function startGame() {
    var res = window.prompt("Kilépés", "Nem úgy van az! Add meg a jelszót!");
    if (res === "eper") {
        var val = $("#game-types :selected").val();
        socket.emit('startGame', val);
    }    
}

function startGameCallback(players) {
    //TODO - ez nem szép
    if (players === null) {
        console.log("már megy a játék")
        return;
    }

    showBoard();

    showPlayerList(players);
}

function startRoundCallback(data) {

    showTrumpAndPlayerCards(data);

    showLicitDiv(data.turns);

    showHitsAndDealer(data.players, data.dealerSessionId);
}

function endRoundCallback(players) {
    players.forEach(p => {
        $("#player-points-" + p.sessionId).html(p.points);
        $("#player-name-" + p.sessionId).removeClass("underlined");
    });
}

function endTurnCallback(players) {
    players.forEach(p => {
        $("#hits-" + p.sessionId).html("" + p.hits + " / " + p.licit);
    })
    $("#tableCards").empty();
}

function licitSelect(value) {
    var elems = document.querySelectorAll(".selected-licit");

    elems.forEach(e => {
        e.classList.remove("selected-licit");
    })

    $("#licit" + value).addClass("selected-licit");
}

function licit() {
    var elems = document.querySelectorAll(".selected-licit");
    if (elems.length === 0)
        return;

    var data = {
        licit: parseInt(elems[0].innerHTML),
        sessionId: window.localStorage.getItem('sessionId')
    }

    $("#licitDiv").addClass("hidden-div");
    socket.emit('licit', data);
}

function licitEnd(licits) {
    licits.forEach(p => {
        $("#hits-" + p.sessionId).html("0 / " + p.licit);
    })
}

function showTableCardsCallback(tableCards) {
    $("#tableCards").empty();
    tableCards.forEach(c => {
        $("#tableCards").append(createCard(c, false, c.name));
    });
}

function newCardCallback(data) {
    $("#notification").html(data.name + " lapot játszik ki");

    if (data.tableCards.length === 0)
        $("#tableCards").empty();

    if (data.sessionId === window.localStorage.getItem('sessionId')) {

        var legalCards;

        if (data.tableCards.length === 0)
            legalCards = data.playerCards;
        else {
            legalCards = data.playerCards.filter(c => c.color === data.tableCards[0].color);
            if (legalCards.length === 0)
                legalCards = data.playerCards;
        }
        legalCardsCopy = legalCards;

        data.playerCards.forEach(c => {
            if (legalCardsCopy.includes(c)) {
                $("#" + c.id).removeClass("illegalCard");
                $("#" + c.id).addClass("legalCard");
                $("#" + c.id).click(function () { playCard(c) });
            } else {
                $("#" + c.id).removeClass("legalCard");
                $("#" + c.id).addClass("illegalCard");
            }
        })
    }

}


function playCard(card) {
    if (!legalCardsCopy.includes(card))
        return;

    $("#notification").html("");

    legalCardsCopy = [];
    $("#" + card.id ).remove()

    var elems = document.querySelectorAll(".legalCard, .illegalCard");

    elems.forEach(e => {
        e.classList.remove("legalCard");
        e.classList.remove("illegalCard");
    })

    socket.emit('playCard', { 
        sessionId: window.localStorage.getItem('sessionId'),
        color: card.color,
        value: card.value,
        id: card.id
    });
    
}

function quit() {
    var res = window.prompt("Kilépés", "Nem úgy van az! Add meg a jelszót!");
    if (res === "bölény")
        socket.emit('quit');
}

function quitCallback() {
    window.localStorage.removeItem('sessionId');
    location.reload();
}

function showPlayerList(players) {
    $("#playerList").empty();
    players.forEach(p => {
        $("#playerList").append(createPlayerDiv(p));
    });
}

function showLicitDiv(numberOfTurns) {
    $("#notification").html("LICITÁLÁS");

    if (window.localStorage.getItem("sessionId") === null)
        return;

    $("#licitDiv").removeClass("hidden-div")

    var elems = document.querySelectorAll(".selected-licit");
    elems.forEach(e => {
        e.classList.remove("selected-licit");
    })

    //TODO - megcsinálni nem beégetett buttonökkel
    for (let i = 0; i <= 12; i++) {
        if (i <= numberOfTurns)
            $("#licit" + i).removeClass("hidden-div")
        else
            $("#licit" + i).addClass("hidden-div")
    }
}

function showTrumpAndPlayerCards(data) {
    $("#trump").html(createCard(data.trump, false, "adu"));

    var sessionId = window.localStorage.getItem('sessionId')
    if (sessionId === null)
        return;

    //kártyák és adu mutatása
    var cards = data.players.find(p => p["sessionId"] == sessionId).cards;
    $("#cardList").empty();
    cards.forEach(c => {
        $("#cardList").append(createCard(c, true, null));
    })
}

function showHitsAndDealer(players, dealerSessionId) {
    players.forEach(p => {
        $("#hits-" + p.sessionId).html("");
    })

    $("#player-name-" + dealerSessionId).addClass("underlined");
}



function createCard(card, isPlayerCard, text) {
  var div = document.createElement("DIV");
  div.id = card.id;
  div.classList.add("card-div");
  var img = document.createElement("IMG");
  img.setAttribute("src", "images/" + card.color + ".png");
  img.classList.add("card-color");
  var p = document.createElement("p");
  var node = document.createTextNode(getCardValueText(card.value));
  p.appendChild(node);
  p.classList.add("card-value");

  if (isPlayerCard)
    div.classList.add("player-card");

  
  if (text != null) {
    var pText = document.createElement("p");
    var nodeText = document.createTextNode(text);
    pText.appendChild(nodeText);
    pText.classList.add("card-text");
    div.appendChild(pText);
  }
  
  div.appendChild(img);
  div.appendChild(p);
  div.appendChild(p);
  return div; 
}

function getCardValueText(val) {
  switch(val) {
    case 11: return "J";
    case 12: return "Q";
    case 13: return "K";
    case 14: return "A";
    default: return val;
  }
}

function createPlayerDiv(player) {
  var divMain = document.createElement("DIV");
  divMain.classList.add("player-div");
  var divLeft = document.createElement("DIV");
  divLeft.classList.add("player-div-left");
  var pHits = document.createElement("p");
  var nodeHits = document.createTextNode("");
  if (player.licits === null)
    nodeHits = document.createTextNode("" + player.hits + " / " + player.licit);
  pHits.appendChild(nodeHits);
  pHits.classList.add("hits");
  pHits.id = "hits-" + player.sessionId;
  divLeft.appendChild(pHits);

  var divRight = document.createElement("DIV");
  var pName = document.createElement("p");
  var nodeName = document.createTextNode(player.name);
  pName.appendChild(nodeName);
  pName.classList.add("name-p");
    pName.classList.add("player-line");
    pName.id = "player-name-" + player.sessionId;
  divRight.appendChild(pName);
  var pPoint = document.createElement("p");
  var nodePoint = document.createTextNode(player.points);
  pPoint.appendChild(nodePoint);
  pPoint.classList.add("point-p");
    pPoint.classList.add("player-line");
    pPoint.id = "player-points-" + player.sessionId;
  divRight.appendChild(pPoint);

  divMain.appendChild(divLeft);
  divMain.appendChild(divRight);

  return divMain;  
}

function createLobbyPlayer(player) {
    var div = document.createElement("DIV");
    div.id = "lobby-player-" + player.sessionId;
    div.classList.add("lobby-player");
    var p = document.createElement("p");
    p.classList.add("lobby-player-text");
    var node = document.createTextNode(player.name);
    p.appendChild(node);

    div.appendChild(p);

    return div;
}