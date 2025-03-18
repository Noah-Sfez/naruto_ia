const socket = new WebSocket("ws://192.168.X.X:8080"); // Remplace par l'IP du serveur

socket.onopen = () => {
    console.log("Connecté au serveur WebSocket !");
};

// Envoyer un message lorsqu'un joueur fait un geste
function envoyerGeste(geste) {
    socket.send(JSON.stringify({ type: "geste", data: geste }));
}

// Recevoir les gestes de l'autre joueur
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "geste") {
        console.log("L'autre joueur a fait :", message.data);
        // ➤ Déclenche ici l'animation correspondant au geste reçu
    }
};

socket.onclose = () => {
    console.log("Déconnecté du serveur WebSocket.");
};
