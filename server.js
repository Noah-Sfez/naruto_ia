const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

const clients = new Set();

server.on("connection", (socket) => {
    clients.add(socket);
    console.log("Un joueur s'est connecté !");

    socket.on("message", (message) => {
        console.log("Message reçu : ", message);

        // Envoyer le message à tous les autres clients
        clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    socket.on("close", () => {
        clients.delete(socket);
        console.log("Un joueur s'est déconnecté.");
    });
});

console.log("Serveur WebSocket lancé sur ws://localhost:8080");
