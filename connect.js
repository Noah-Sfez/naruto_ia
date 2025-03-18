// Configuration Firebase (remplace par tes valeurs)
const firebaseConfig = {
    apiKey: "AIzaSyD7fPS34yKGiwz7l6s8tNW6-Rq6XbbuWZw",
    authDomain: "naruto-3cfab.firebaseapp.com",
    databaseURL:
        "https://naruto-3cfab-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "naruto-3cfab",
    storageBucket: "naruto-3cfab.firebasestorage.app",
    messagingSenderId: "123088598116",
    appId: "1:123088598116:web:d5959376cbe9d17e1c5b71",
    measurementId: "G-8S858350W1",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Fonction pour envoyer un geste
function envoyerGeste(geste) {
    db.ref("geste").set({ action: geste });
    console.log("Geste envoyé :", geste);
}

// Fonction pour écouter les gestes en temps réel
db.ref("geste").on("value", (snapshot) => {
    if (snapshot.val()) {
        console.log("Geste reçu :", snapshot.val().action);
        // ➤ Ajoute ici l’animation en fonction du geste reçu
    }
});

console.log(firebase.database());

