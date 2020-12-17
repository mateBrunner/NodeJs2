var socket;
var socketId;
var cards;
var legalCardsCopy = [];

function myOnLoad() {
    socket = io();
  
    socket.on('join', joinCallback)
    socket.on('joinWithSession', joinWithSessionCallback)
    socket.on('checkSession', checkSessionCallback)
    socket.on('start', startCallback)
    socket.on('startRound', startRoundCallback)
    socket.on('endTurn', endTurnCallback)
    socket.on('licitEnd', licitEnd)
    socket.on('endRound', endRoundCallback)
    socket.on('showTableCards', showTableCardsCallback)
    socket.on('newCard', newCardCallback)
    socket.on('quit', quitCallback)
    socket.on('getLobbyInfo', getLobbyInfoCallback)
    socket.on('getBoardInfo', getBoardInfoCallback)
    console.log('feliratkozás megtörtént')

  socket.on("connect", () => {
    socketId = socket.id;
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
    if (result.sessionId === null) {
        window.localStorage.removeItem('sessionId');
    } else {
        window.localStorage.setItem('sessionId', result.sessionId);
    }

    //hogy hivatkozunk külső js fájlt????
    if (result.gameStatus == "lobby") {
        showLobby();
        socket.emit('getLobbyInfo', socket.id);
    } else if (result.gameStatus == "game") {
        showBoard();
        var data = {
            sessionId: window.localStorage.getItem('sessionId'),
            socketId: socket.id
        }
        socket.emit('getBoardInfo', data);
    }

}

function showLobby() {
    $("#lobbyDiv").removeClass("hidden-div");
    $("#boardDiv").addClass("hidden-div");
}

function getLobbyInfoCallback(data) {
    $("joinedPlayers").empty();
    data.forEach(player => {
        $("#joinedPlayers").append(createLobbyPlayer(player));
  });
}

function showBoard() {
    $("#lobbyDiv").addClass("hidden-div");
    $("#boardDiv").removeClass("hidden-div");
}

function getBoardInfoCallback(data) {

    $("#playerList").empty();
    data.players.forEach(p => {
        $("#playerList").append(createPlayerDiv(p));
    });

    $("#tableCards").empty();
    data.tableCards.forEach(c => {
        $("#tableCards").append(createCard(c, false, c.name));
    });

    $("#trump").html(createCard(data.trump, false, "adu"));

    var sessionId = window.localStorage.getItem("sessionId");
    if (sessionId != null) {
        cards = data.players.find(p => p["sessionId"] == sessionId).cards;
        $("#cardList").empty();
        cards.forEach(c => {
            $("#cardList").append(createCard(c, true, null));
        })
    }

    if (data.shouldLicit) {
        //licitDiv mutatása
        $("#notification").html("LICITÁLÁS");
        $("#licitDiv").removeClass("hidden-div")
        var elems = document.querySelectorAll(".selected-licit");

        elems.forEach(e => {
            e.classList.remove("selected-licit");
        })

        for (let i = 0; i <= 12; i++) {
            if (i <= data.turns)
                $("#licit" + i).removeClass("hidden-div")
            else
                $("#licit" + i).addClass("hidden-div")
        }
    } else {
        socket.emit('getNewCardData', socket.id);
    }
}

function join() {
  var name = document.getElementById("newPlayerName").value;
  if (name == "") {
    $("#joinErrorMsg").text("Név nem megfelelő")
    return;
  }

    var data = { name: name, socketId: socket.id }

  if (window.localStorage.getItem('sessionId') === null) {
    socket.emit('join', data);
  }
  else 
    $("#joinErrorMsg").text("Te már beléptél, nyughass!")
}

function joinCallback(player) {
  //$("#joinedPlayers").append($("<li>").html(player.name));
    console.log("join");
    $("#joinedPlayers").append(createLobbyPlayer(player));
 
}

function joinWithSessionCallback(player) {
  window.localStorage.setItem('sessionId', player.sessionId)
}

function start() {
    var res = window.prompt("Kilépés", "Nem úgy van az! Add meg a jelszót!");
    if (res === "bölény")
    var val = $("#game-types :selected").val();
    socket.emit('start', val);
}

function startCallback(data) {
  if (data === null) {
    console.log("már megy a játék")
    return;
  }

  showBoard();
  $("#playerList").empty();
  data.forEach(p => {
    $("#playerList").append(createPlayerDiv(p));
  });
}

function startRoundCallback(data) {
    var sessionId = window.localStorage.getItem('sessionId') 
    console.log("start round")

    //kártyák és adu mutatása
    cards = data.players.find(p => p["sessionId"] == sessionId).cards;
    $("#cardList").empty();
    cards.forEach(c => {
    $("#cardList").append(createCard(c, true, null));
    })
    $("#trump").html(createCard(data.trump, false, "adu"));

    //licitDiv mutatása
    $("#notification").html("LICITÁLÁS");
    $("#licitDiv").removeClass("hidden-div")
    var elems = document.querySelectorAll(".selected-licit");

    elems.forEach(e => {
        e.classList.remove("selected-licit");
    })

    for (let i = 0; i <= 12; i++) {
        if (i <= data.turns)
            $("#licit" + i).removeClass("hidden-div")
        else
            $("#licit" + i).addClass("hidden-div")
    }

    data.players.forEach(p => {
        $("#hits-" + p.sessionId).html("");
    })

    $("#player-name-" + data.dealerSessionId).addClass("red");
}

function endRoundCallback(players) {
    players.forEach(p => {
        $("#player-points-" + p.sessionId).html(p.points);
        $("#player-name-" + p.sessionId).removeClass("red");
    });
    console.log("endRound");
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
  $("#notification").html("LICIT VÉGE")

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
    //get legal cards 
    var legalCards;
    if (data.tableCards.length === 0) {
      legalCards = data.playerCards;
    }
    else {
      legalCards = data.playerCards.filter(c => c.color === data.tableCards[0].color);
      if (legalCards.length === 0)
        legalCards = data.playerCards;
    }
      legalCardsCopy = legalCards;

      data.playerCards.forEach(c => {
          var id = c.color + c.value;
          if (legalCardsCopy.includes(c)) {
              $("#" + id).removeClass("illegalCard");
              $("#" + id).addClass("legalCard");
              $("#" + id).click(function () { playCard(c) });
          } else {
              $("#" + id).removeClass("legalCard");
              $("#" + id).addClass("illegalCard");
          }
    })
  }

}


function playCard(card) {
  if (!legalCardsCopy.includes(card))
    return;

  legalCardsCopy.forEach(c => {
    var id = c.color + c.value;
    $("#" + id).removeClass("legalCard");
  })

  legalCardsCopy = [];
    $("#" + card.color + card.value).remove()

    var elems = document.querySelectorAll(".legalCard, .illegalCard");

    elems.forEach(e => {
        e.classList.remove("legalCard");
        e.classList.remove("illegalCard");
    })

  socket.emit('playCard', { 
    sessionId: window.localStorage.getItem('sessionId'),
    color: card.color,
    value: card.value
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



function createCard(card, isPlayerCard, text) {
  var div = document.createElement("DIV");
  div.id = card.color + card.value;
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