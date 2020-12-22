var socket;
var playerSessions;
var legalCardsCopy = [];
var chartData = [];
var chartOptions;
var chart;

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

    showChart();
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
    //var res = window.prompt("Kilépés", "Nem úgy van az! Add meg a jelszót!");
    //if (res === "eper") {
        //var val = $("#game-types :selected").val();
        //socket.emit('startGame', val);
    //}    

    chartData.addRow(
        [0, 0, 0]
    );


    var chartPanel = document.getElementById('chart-container');
    chartPanel.removeChild();

    //Add chart
    chartPanel.add(chart)
    //chart.remove();

    chart.draw(chartData, chartOptions);

}

function startGameCallback(players) {
    //TODO - ez nem szép
    if (players === null) {
        console.log("már megy a játék")
        return;
    }

    playerSessions = players.map(p => p.sessionId);

    showBoard();

    showPlayerList(players);
}

function startRoundCallback(data) {

    $("#round-counter").html(data.round + ". kör / " + data.turns + " lap");

    showTrumpAndPlayerCards(data);

    showLicitDiv(data.turns);

    showHitsAndDealer(data.players, data.dealerSessionId);
}

function endRoundCallback(players) {
    players.forEach(p => {
        $("#player_" + p.sessionId).attr("points", p.points);
        $("#player_" + p.sessionId).attr("dealer", "false");
    });
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

function licitEndCallback(licits) {
    licits.forEach(p => {
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
    $("#notification").html("<span style='color: #ffbc00; font-weight: bold;'>" + data.name + "</span> lapot játszik ki");

    $("#player_" + data.sessionId).attr("is-loading", "true");
    $("#player_" + data.lastCardSessionId).attr("is-loading", "false");

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

    //kártyák és adu mutatása
    var cards = data.players.find(p => p["sessionId"] == sessionId).cards;
    $("#cardList").empty();
    cards.forEach(c => {
        $("#cardList").append(createCard(c, true, null));
    })
}

function showHitsAndDealer(players, dealerSessionId) {
    players.forEach(p => {
        $("#player_" + p.sessionId).attr("hits", "");
        $("#player_" + p.sessionId).attr("is-dealer", "false");
        $("#player_" + p.sessionId).attr("is-card-visible", "false");
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

function showChart() {

    chartData = new google.visualization.DataTable();
    chartData.addColumn('number', 'X');
    chartData.addColumn('number', 'Dogs');
    chartData.addColumn('number', 'Cats');

    chartData.addRows([
        [0, 0, 0], [1, 10, 5], [2, 23, 15]
    ]);

    chartOptions = {
        //hAxis: {
        //    title: 'Time'
        //},
        //vAxis: {
        //    title: 'Popularity'
        //},
        colors: ['#a52714', '#097138'],
        crosshair: {
            color: '#000',
            trigger: 'selection'
        }
    };

    chartOptions.chartArea = { left: '5%', width: '80%', height: '70%' };

    chart = new google.visualization.LineChart(document.getElementById('chart_div'));

    chart.draw(chartData, chartOptions);

}