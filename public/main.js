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
  socket.on('startTurn', startTurnCallback)
  socket.on('licitEnd', licitEnd)
  socket.on('showTableCards', showTableCardsCallback)
  socket.on('newCard', newCardCallback)
  socket.on('getLobbyInfo', getLobbyInfoCallback)
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
  } else if (result.gameStatus == "game") {
    showBoard();
  }

}

function showLobby() {
  $("#boardDiv").hide();
  $("#lobbyDiv").show();

  socket.emit('getLobbyInfo', socket.id);
}

function getLobbyInfoCallback(data) {
  data.forEach(p => {
    $("#joinedPlayers").append($("<li>").html(p));    
  });
}

function showBoard() {
  $("#lobbyDiv").hide();
  $("#boardDiv").show();
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
  $("#joinedPlayers").append($("<li>").html(player.name));
}

function joinWithSessionCallback(player) {
  window.localStorage.setItem('sessionId', player.sessionId)
}

function start() {
  socket.emit('start');
}

function startCallback(data) {
  if (data === null) {
    console.log("már megy a játék")
    return;
  }
  console.log(data);

  showBoard();
  $("#playerList").empty();
  data.forEach(p => {
    $("#playerList").append(createPlayerDiv(p));
  });
}

function startRoundCallback(data) {
  var sessionId = window.localStorage.getItem('sessionId') 

  //kártyák és adu mutatása
  cards = data.players.find(p => p["sessionId"] == sessionId).cards;
  $("#cardList").empty();
  cards.forEach(c => {
    $("#cardList").append(createCard(c, true, null));
  })
  //$("#trump").html(data.trump.color + data.trump.value);
  $("#trump").html(createCard(data.trump, false, "adu"));

  //licitDiv mutatása
  $("#notification").html("LICITÁLÁS");
  $("#licitDiv").show();
}

function startTurnCallback(players) {
  players.forEach(p => {
    $("#hits-" + p.sessionId).html("" + p.hits + " / " + p.licit);
  })
}

function licit() {
  var data = {
    licit: 2,
    sessionId: window.localStorage.getItem('sessionId')
  }
  socket.emit('licit', data);
}

function licitEnd(licits) {
  console.log(licits);
  $("#notification").html("LICIT VÉGE")
  $("#licitDiv").hide();

  licits.forEach(p => {
    $("#hits-" + p.sessionId).html("0 / " + p.licit);
  })
}

function showTableCardsCallback(tableCards) {
  $("#tableCards").empty();
  tableCards.forEach(c => {
    $("#tableCards").append(createCard(c, false, "poszidoszi"));
  });
}

function newCardCallback(data) {
  console.log("valaki jön");
  console.log(data);
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
    legalCards.forEach(c => {
      var id = c.color + c.value;
      $("#" + id).addClass("legalCard");
      $("#" + id).click(function(){ playCard(c) });
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
  socket.emit('playCard', { 
    sessionId: window.localStorage.getItem('sessionId'),
    color: card.color,
    value: card.value
  });
    
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
  divRight.appendChild(pName);
  var pPoint = document.createElement("p");
  var nodePoint = document.createTextNode(player.points);
  pPoint.appendChild(nodePoint);
  pPoint.classList.add("point-p");
  pPoint.classList.add("player-line");
  divRight.appendChild(pPoint);

  divMain.appendChild(divLeft);
  divMain.appendChild(divRight);

  return divMain;  
}