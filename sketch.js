const URL = "./neant/";
let model, webcam, labelContainer, maxPredictions;

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

async function init() {
    await tf.ready();

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(400, 400, true);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");

    for (let i = 0; i < maxPredictions; i++) {
        const div = document.createElement("div");
        div.className =
            "flex justify-center p-2 w-28 bg-black text-white rounded-md";
        labelContainer.appendChild(div);
    }

    setInterval(predict, 100);
}

async function loop() {
    webcam.update();
    window.requestAnimationFrame(loop);
}

let validatedSigns = [];
let currentSign = null;
let signStartTime = null;

const predefinedSigns = {
    fire: ["singe", "chien", "sanglier", "tigre"],
    water: ["cheval", "tigre", "chien", "cheval"],
    lightning: ["tigre", "sanglier", "chien", "cheval"],
};

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    let highestPrediction = { className: "", probability: 0 };

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
        labelContainer.childNodes[i].innerHTML = classPrediction;

        if (prediction[i].probability > highestPrediction.probability) {
            highestPrediction = prediction[i];
        }
    }

    if (!window.predictionHistory) {
        window.predictionHistory = [];
    }

    window.predictionHistory.push(highestPrediction.className);

    if (window.predictionHistory.length > 20) {
        window.predictionHistory.shift();
    }

    const frequency = {};
    window.predictionHistory.forEach((prediction) => {
        frequency[prediction] = (frequency[prediction] || 0) + 1;
    });

    let mostFrequentPrediction = "";
    let maxCount = 0;
    for (const prediction in frequency) {
        if (frequency[prediction] > maxCount) {
            mostFrequentPrediction = prediction;
            maxCount = frequency[prediction];
        }
    }

    console.log("Most Frequent Prediction:", mostFrequentPrediction);

    if (currentSign === mostFrequentPrediction) {
        if (Date.now() - signStartTime > 2000) {
            if (
                mostFrequentPrediction !== "Rien" &&
                (validatedSigns.length === 0 ||
                    validatedSigns[validatedSigns.length - 1] !== currentSign)
            ) {
                if (validatedSigns.length >= 4) {
                    validatedSigns = [];
                }

                validatedSigns.push(currentSign);
                console.log("✅ Combinaison en cours :", validatedSigns);
                displayValidatedSigns();

                let element = detectElement(validatedSigns);
                if (element) {
                    console.log("🔥 Combinaison complète détectée :", element);
                    envoyerCombinaison(validatedSigns, element);

                    const webcamContainer = document.getElementById("webcam-container");
                    if (webcamContainer) {
                        webcamContainer.classList.remove("fire", "water", "lightning");
                        webcamContainer.classList.add(element);
                    }
                }
            }
            currentSign = null;
            signStartTime = null;
        }
    } else {
        currentSign = mostFrequentPrediction;
        signStartTime = Date.now();
    }

    applyZoomAnimation(highestPrediction.className);
}

function getMostFrequentPrediction(currentPrediction) {
    if (!window.predictionHistory) window.predictionHistory = [];
    window.predictionHistory.push(currentPrediction);
    if (window.predictionHistory.length > 20) window.predictionHistory.shift();

    let frequency = {};
    window.predictionHistory.forEach((prediction) => {
        frequency[prediction] = (frequency[prediction] || 0) + 1;
    });

    return Object.keys(frequency).reduce((a, b) =>
        frequency[a] > frequency[b] ? a : b
    );
}

function detectElement(validatedSigns) {
    console.log("🔍 Vérification de la combinaison :", validatedSigns);
    for (let element in predefinedSigns) {
        if (arraysEqual(validatedSigns, predefinedSigns[element])) {
            console.log("✅ Élément détecté :", element);
            return element;
        }
    }
    console.warn("⚠️ Aucune correspondance trouvée pour :", validatedSigns);
    return null;
}

function envoyerCombinaison(combinaison, element) {
    const playerId = Math.random().toString(36).substring(7);
    const matchRef = db.ref("duels/match_1");

    matchRef.once("value", (snapshot) => {
        const matchData = snapshot.val();

        if (!matchData || !matchData.player1) {
            matchRef
                .child("player1")
                .set({ combination: combinaison, element, playerId });
            console.log("👤 Joueur 1 a joué :", combinaison);
        } else if (!matchData.player2) {
            matchRef
                .child("player2")
                .set({ combination: combinaison, element, playerId });
            console.log("👤 Joueur 2 a joué :", combinaison);
            determinerGagnant(matchRef);
        }
    });
}

function determinerGagnant(matchRef) {
    matchRef.once("value", (snapshot) => {
        const matchData = snapshot.val();
        if (!matchData || !matchData.player1 || !matchData.player2) return;

        const { player1, player2 } = matchData;

        const rules = {
            fire: { beats: "lightning", losesTo: "water" },
            water: { beats: "fire", losesTo: "lightning" },
            lightning: { beats: "water", losesTo: "fire" },
        };

        let winner = "draw";
        if (rules[player1.element].beats === player2.element) {
            winner = "player1";
        } else if (rules[player1.element].losesTo === player2.element) {
            winner = "player2";
        }

        matchRef.child("winner").set({ winner, timestamp: Date.now() });
        console.log(`🏆 Le gagnant est : ${winner}`);

        setTimeout(() => {
            db.ref("duels/match_1").remove();
            console.log("🔄 Match réinitialisé, prêt pour un nouveau duel !");
        }, 5000);
    });
}
db.ref("duels/match_1").on("value", (snapshot) => {
    const matchData = snapshot.val();

    if (matchData && matchData.winner) {
        console.log(`🏆 Match terminé ! Gagnant : ${matchData.winner}`);
        setTimeout(() => {
            db.ref("duels/match_1")
                .remove()
                .then(() =>
                    console.log(
                        "🔄 Match réinitialisé ! Prêt pour un nouveau duel."
                    )
                )
                .catch((error) =>
                    console.error("❌ Erreur de réinitialisation :", error)
                );
        }, 5000);
    }
});

db.ref("duels/match_1/winner").on("value", (snapshot) => {
    if (snapshot.val()) {
        const winner = snapshot.val().winner;
        if (winner === "draw") {
            alert("⚖️ Match nul !");
        } else {
            alert(`🏆 ${winner} a gagné !`);
        }
    }
});

function applyZoomAnimation(className) {
    document
        .querySelectorAll("img")
        .forEach((img) => img.classList.remove("zoom-animation"));
    const targetImage = document.querySelector(`img.${className}`);
    if (targetImage) targetImage.classList.add("zoom-animation");
}

function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function displayValidatedSigns(signs = validatedSigns) {
    const container = document.getElementById("validated-signs-container");
    container.innerHTML = "";

    signs.forEach((sign) => {
        const img = document.createElement("img");
        img.src = `./images/animal-${sign}.png`;
        img.alt = sign;
        img.classList.add("validated-sign");
        container.appendChild(img);
    });
}

document.addEventListener("DOMContentLoaded", init);
