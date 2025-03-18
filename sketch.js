// 🔥 Chargement du modèle Teachable Machine
const URL = "./neant/";
let model, webcam, labelContainer, maxPredictions;

// Initialisation Firebase (⚠️ Remplace par tes propres valeurs Firebase)
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
    await tf.ready(); // Vérifie que TensorFlow.js est prêt

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configuration de la webcam
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

    // Vérification des gestes toutes les 100ms
    setInterval(predict, 100);
}

async function loop() {
    webcam.update();
    window.requestAnimationFrame(loop);
}

// 🔥 Définition des gestes reconnus
let validatedSigns = [];
let currentSign = null;
let signStartTime = null;

const predefinedSignsFire = ["singe", "Chien", "sanglier", "tigre"]; // Combinaison valide

// 🔍 Fonction principale de prédiction
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    let highestPrediction = { className: "", probability: 0 };

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = `${prediction[i].className}: ${prediction[
            i
        ].probability.toFixed(2)}`;
        labelContainer.childNodes[i].innerHTML = classPrediction;

        if (prediction[i].probability > highestPrediction.probability) {
            highestPrediction = prediction[i];
        }
    }

    if (currentSign === highestPrediction.className) {
        if (Date.now() - signStartTime > 2000) {
            if (
                highestPrediction.className !== "Rien" &&
                (validatedSigns.length === 0 ||
                    validatedSigns[validatedSigns.length - 1] !== currentSign)
            ) {
                if (validatedSigns.length >= 4) {
                    validatedSigns = [];
                }

                validatedSigns.push(currentSign);
                console.log("Validated Signs:", validatedSigns);
                displayValidatedSigns();

                // 🚀 Vérifie si la combinaison validée correspond à `predefinedSignsFire`
                if (arraysEqual(validatedSigns, predefinedSignsFire)) {
                    console.log(
                        "🔥 Combinaison Fire validée ! Envoi à Firebase..."
                    );
                    envoyerCombinaison(validatedSigns);
                }
            }
            currentSign = null;
            signStartTime = null;
        }
    } else {
        currentSign = highestPrediction.className;
        signStartTime = Date.now();
    }

    applyZoomAnimation(highestPrediction.className);
}

// 📤 **Fonction pour envoyer la combinaison validée dans Firebase**
function envoyerCombinaison(combinaison) {
    db.ref("validatedSigns").set({ combination: combinaison });
}

// 📥 **Écoute en temps réel des combinaisons des autres joueurs**
db.ref("validatedSigns").on("value", (snapshot) => {
    if (snapshot.val() && snapshot.val().combination) {
        const remoteSigns = snapshot.val().combination;
        console.log("📡 Nouvelle combinaison reçue:", remoteSigns);
        displayValidatedSigns(remoteSigns);
    }
});

// ✅ Vérifie si deux tableaux sont identiques
function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// 🎨 **Affichage des signes validés**
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

// 📸 **Ajoute une animation au signe détecté**
function applyZoomAnimation(className) {
    const images = document.querySelectorAll("img");
    images.forEach((img) => img.classList.remove("zoom-animation"));

    const targetImage = document.querySelector(`img.${className}`);
    if (targetImage) {
        targetImage.classList.add("zoom-animation");
    }
}

// 🎨 **Définition des couleurs pour chaque signe**
function getColorForClass(className) {
    const colors = {
        singe: "red",
        Chien: "blue",
        sanglier: "green",
        tigre: "yellow",
        Cheval: "purple",
    };
    return colors[className] || "white";
}

// ⏳ Lance l'initialisation après chargement du DOM
document.addEventListener("DOMContentLoaded", init);
