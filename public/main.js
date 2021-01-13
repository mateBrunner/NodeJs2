var socket;
var playerSessions;
var legalCardsCopy = [];
var myLineChart;

google.charts.load('current', { packages: ['corechart', 'line'] });

function myOnLoad() {
    socket = io();
  
    socket.on('join', joinCallback)
    socket.on('joinWithSession', joinWithSessionCallback)
    socket.on('joinError', joinErrorCallback)
    socket.on('checkSession', checkSessionCallback)
    socket.on('startGame', startGameCallback)
    socket.on('startRound', startRoundCallback)
    socket.on('endRound', endRoundCallback)
    socket.on('someoneLicited', someoneLicitedCallback)
    socket.on('endTurn', endTurnCallback)
    socket.on('licitEnd', licitEndCallback)    
    socket.on('showTableCards', showTableCardsCallback)
    socket.on('newCard', newCardCallback)
    socket.on('endGame', endGameCallback)
    socket.on('quit', quitCallback)
    socket.on('getLobbyInfo', getLobbyInfoCallback)
    socket.on('getBoardInfo', getBoardInfoCallback)
    socket.on('loadGame', loadGameCallback)
    socket.on('chatMessage', chatMessageCallback)

    socket.on("connect", () => {
        checkSession();
    });

    $('#chatInput').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            sendText();
        }
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
    // if (result.sessionId === null)  // ez a sessionId nincs játékban, töröljük a storage-ból
    //     window.localStorage.removeItem('sessionId');
    // else
    //     window.localStorage.setItem('sessionId', result.sessionId);

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

    playerSessions = [];
    data.players.forEach(p => playerSessions[p.sessionId] = p.name)

    showTableCardsCallback(data.tableCards);

    showTrumpAndPlayerCards(data);

    showHitsAndDealer(data.players, data.dealerSessionId);

    $("#round-counter").html(data.round + ". kör / " + data.turns + " lap");

    createChart(data);

    if (data.shouldLicit)
        showLicitDiv(data.turns);
    else {
        data.players.forEach(p => {
            $("#player_" + p.sessionId).attr("hits", "" + p.hits + " / " + p.licit)
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

function joinErrorCallback() {
    $("#joinErrorMsg").text("Van már ilyen nevű játékos!")
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

function startGameCallback(data) {
    //TODO - ez nem szép
    if (data === null) {
        console.log("már megy a játék")
        return;
    }

    playerSessions = [];
    data.players.forEach(p => playerSessions[p.sessionId] = p.name)

    showBoard();

    showPlayerList(data.players);

    createChart(data);
}

function startRoundCallback(data) {

    console.log(data);

    $("#round-counter").html(data.round + ". kör / " + data.turns + " lap");

    showTrumpAndPlayerCards(data);

    showLicitDiv(data.turns);

    showHitsAndDealer(data.players, data.dealerSessionId);
}

function endRoundCallback(data) {

    data.players.forEach(p => {
        $("#player_" + p.sessionId).attr("points", p.points);
        $("#player_" + p.sessionId).attr("dealer", "false");
    });

    for (let i = 0; i < data.players.length; i++) {
        myLineChart.data.datasets[i].data.push(data.players[i].points);
    }

    window.localStorage.setItem('savedGame', JSON.stringify(data));

    myLineChart.update();

}

function endTurnCallback(result) {
    result.players.forEach(p => {
        $("#player_" + p.sessionId).attr("hits", "" + p.hits + " / " + p.licit);
        $("#player_" + p.sessionId).attr("is-loading", "false");
        $("#player_" + p.sessionId).attr("is-card-visible", "false");
    })
    $("#player_" + result.lastHitCard.sessionId).attr("is-card-visible", "true");
    $("#player_" + result.lastHitCard.sessionId).attr("card-props", result.lastHitCard.color + "_" + result.lastHitCard.value);

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

function someoneLicitedCallback(sessionId) {
    $("#player_" + sessionId).attr("is-loading", "false");
}

function licitEndCallback(data) {
    var sessionId = window.localStorage.getItem("sessionId");

    if (data.players != null) {
        $("#cardList").empty();
        data.players.find(p => p.sessionId === sessionId).cards.forEach(c =>
            $("#cardList").append(createCard(c, true, null)));
    }


    data.licits.forEach(p => {
        $("#player_" + p.sessionId).attr("hits", "0 / " + p.licit);
    })
}

function showTableCardsCallback(tableCards) {
    $("#tableCards").empty();
    tableCards.forEach(c => {
        $("#tableCards").append(createCard(c, false, c.name));
    });
}

function newCardCallback(data) {
    $("#notification").html("<span style='color: #1a6700; font-weight: bold;'>" + data.name + "</span> lapot játszik ki");

    $("#player_" + data.sessionId).attr("is-loading", "true");
    $("#player_" + data.lastCardSessionId).attr("is-loading", "false");

    if (data.tableCards.length === 0)
        $("#tableCards").empty();

    if (data.sessionId === window.localStorage.getItem('sessionId')) {

        $("#cardList").addClass("active");

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
                $("#" + c.id).attr("status", "legal");
                $("#" + c.id).click(function () { playCard(c) });
            } else {
                $("#" + c.id).attr("status", "illegal");
            }
        })
    }

}


function playCard(card) {
    if (!legalCardsCopy.includes(card))
        return;

    $("#notification").html("");
    $("#cardList").removeClass("active");

    legalCardsCopy = [];
    $("#" + card.id ).remove()

    $("#cardList").children().each((element, c) => 
        c.setAttribute("status", "player-card")
    );

    var elems = document.querySelectorAll(".is-legal");

    elems.forEach(e => {
        e.classList.remove("is-legal");
    })

    socket.emit('playCard', { 
        sessionId: window.localStorage.getItem('sessionId'),
        color: card.color,
        value: card.value,
        id: card.id
    });
    
}

function endGameCallback(players) {

    $("#end-game-modal").removeClass("hidden-div");

    players.sort((a, b) => (a.points < b.points) ? 1 : -1)

    var list = document.getElementById("ranking-list");
    
    for (let i = 0; i < players.length; i++) {

        var li = document.createElement("li");
        li.classList.add("end-game-list-element");

        var rank = document.createElement("p");
        rank.classList.add("ranking-rank");
        rank.classList.add("ranking-text");
        rank.innerHTML = i + 1 + ".";
        li.appendChild(rank);

        var name = document.createElement("p");
        name.classList.add("ranking-name");
        name.classList.add("ranking-text");
        name.innerHTML = players[i].name;
        li.appendChild(name);

        var points = document.createElement("p");
        points.classList.add("ranking-points");
        points.classList.add("ranking-text");
        points.innerHTML = players[i].points;
        li.appendChild(points);

        list.appendChild(li)

    }

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

function loadGame() {
    if (window.localStorage.getItem('savedGame') === null)
        return;
    else
        socket.emit('loadGame', JSON.parse(window.localStorage.getItem('savedGame')));
}

function loadGameCallback() {
    location.reload();
}

function deleteMyself() {
    window.localStorage.removeItem('sessionId');
}

function sendText() {
    var message = $("#chatInput").val();
    if (message === "")
        return;

    $("#chatInput").val("");
    var data = {
        sessionId: window.localStorage.getItem('sessionId'),
        message: message
    }
    socket.emit("chatMessage", data)
}

function chatMessageCallback(result) {
    $("#chatMessage").removeClass("hidden-div");
    $("#chatMessage").text(result.sender + ": " + result.message);
    setTimeout(function() {
        $("#chatMessage").addClass("hidden-div");
    }, 5000)
}

function showPlayerList(players) {
    $("#playerList").empty();
    players.forEach(p => {
        $("#playerList").append(createPlayerDiv(p));
    });
}

function showLicitDiv(numberOfTurns) {
    $("#notification").html("LICITÁLÁS");

    playerSessions.forEach(s => $("#player_" + s).attr("is-loading", "true"));

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

    var cards = [];

    if (data.turns != 1)
        cards = data.players.find(p => p["sessionId"] == sessionId).cards;
    else
        data.players.filter(p => p["sessionId"] != sessionId).forEach(p => cards.push(p.cards[0]));

    $("#cardList").empty();
    cards.forEach(c => {
        if (data.turns == 1)
            $("#cardList").append(createCard(c, true, playerSessions[c.sessionId]));
        else
            $("#cardList").append(createCard(c, true, null ));
    })
}

function showHitsAndDealer(players, dealerSessionId) {
    players.forEach(p => {
        $("#player_" + p.sessionId).attr("hits", "");
        $("#player_" + p.sessionId).attr("is-dealer", "false");
        $("#player_" + p.sessionId).attr("is-card-visible", "false");
        $("#player_" + p.sessionId).attr("is-loading", "true");
    })

    $("#player_" + dealerSessionId).attr("is-dealer", "true");
}

function createCard(card, isPlayerCard, text) {

    var dom = document.createElement("game-card");
    dom.id = card.id;
    dom.setAttribute("color", card.color);
    dom.setAttribute("value", card.value);

    if (text != null)
        dom.setAttribute("card-info", text);

    if (isPlayerCard)
        dom.setAttribute("status", "player-card");

    return dom;
  
}

function createPlayerDiv(player) {
    var divMain = document.createElement("player-box");
    divMain.id = "player_" + player.sessionId;
    divMain.setAttribute("name", player.name);
    divMain.setAttribute("points", player.points);

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

function createChart(data) {

    var ctx = document.getElementById('pointChartCanvas');

    var labels = [...Array(data.numberOfRounds + 1).keys()]

    myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Chart.js Line Chart'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            hover: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                x: {
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Month'
                    }
                },
                y: {
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }
            }
        }
    });

    myLineChart.data.datasets = [];

    data.players.forEach(p => {
        myLineChart.data.datasets.push({
                label: p.name,
                borderColor: p.color,
                data: [0],
                lineTension: 0,
                fill: false,
            })
    });

    if (data.hasOwnProperty('pointHistory')) {
        for (let i = 0; i < data.pointHistory.length; i++) {
            for (let j = 0; j < data.players.length; j++) {
                myLineChart.data.datasets[j].data.push(data.pointHistory[i][j]);
            }
        }
    }

    myLineChart.update();

}