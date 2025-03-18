// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "./neant/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
  await tf.ready(); // Ensure TensorFlow.js is ready

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(400, 400, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);

  // append elements to the DOM
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < maxPredictions; i++) {
    // and class labels
    const div = document.createElement("div");
    div.className =
      "flex justify-center p-2 w-28 bg-black text-white rounded-md";
    labelContainer.appendChild(div);
  }

  // Call predict function every 2 seconds
  setInterval(predict, 100);
}

async function loop() {
  webcam.update(); // update the webcam frame
  window.requestAnimationFrame(loop);
}
let validatedSigns = [];
let currentSign = null;
let signStartTime = null;

const predefinedSignsFire = ["singe", "Chien", "sanglier", "tigre"]; // Liste prédéfinie pour le feu
const predefinedSignsWater = ["Cheval", "tigre", "Chien", "Cheval"]; // Liste prédéfinie pour l'eau
const predefinedSignsLightning = ["tigre", "sanglier", "Cheval", "Chien"]; // Liste prédéfinie pour la foudre

async function predict() {
  // predict can take in an image, video or canvas html element
  const prediction = await model.predict(webcam.canvas);
  let highestPrediction = { className: "", probability: 0 };

  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;

    if (prediction[i].probability > highestPrediction.probability) {
      highestPrediction = prediction[i];
    }
  }

      
  // Store the last 100 predictions
  if (!window.predictionHistory) {
    window.predictionHistory = [];
  }

  window.predictionHistory.push(highestPrediction.className);

  if (window.predictionHistory.length > 20) {
    window.predictionHistory.shift();
  }

  // Calculate the most frequent prediction
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

  console.log(mostFrequentPrediction);

  if (currentSign === mostFrequentPrediction) {
    if (Date.now() - signStartTime > 2000) {
      // Check if the last validated sign is different from the current sign and not "Rien"
      if (
        mostFrequentPrediction !== "Rien" &&
        (validatedSigns.length === 0 ||
          validatedSigns[validatedSigns.length - 1] !== currentSign)
      ) {
        // Limit the number of validated signs to 4
        if (validatedSigns.length >= 4) {
          validatedSigns.shift(); // Remove the oldest sign
        }
        validatedSigns.push(currentSign);
        console.log("Validated Signs: ", validatedSigns);
        displayValidatedSigns();

        // Check if validatedSigns matches any predefinedSigns
        const webcamContainer = document.querySelector("#webcam-container");
        if (webcamContainer) {
          if (arraysEqual(validatedSigns, predefinedSignsFire)) {
            webcamContainer.classList.add("fire");
            webcamContainer.classList.remove("water", "lightning");
          } else if (arraysEqual(validatedSigns, predefinedSignsWater)) {
            webcamContainer.classList.add("water");
            webcamContainer.classList.remove("fire", "lightning");
          } else if (arraysEqual(validatedSigns, predefinedSignsLightning)) {
            webcamContainer.classList.add("lightning");
            webcamContainer.classList.remove("fire", "water");
          } else {
            webcamContainer.classList.remove("fire", "water", "lightning");
          }
        } else {
          console.error("Element with class 'webcam-container' not found.");
        }
      }
      currentSign = null;
      signStartTime = null;
    }
  } else {
    currentSign = mostFrequentPrediction;
    signStartTime = Date.now();
  }
  // Apply zoom animation to the highest prediction image
  applyZoomAnimation(highestPrediction.className);
}


// Function to check if two arrays are equal
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
// Function to display validated signs
function displayValidatedSigns() {
  const container = document.getElementById("validated-signs-container");
  container.innerHTML = ""; // Clear the container
  validatedSigns.forEach((sign) => {
    const img = document.createElement("img");
    img.src = `./images/animal-${sign}.png`; // Assumes you have images named after the class names
    img.alt = sign;
    img.classList.add("validated-sign");
    container.appendChild(img);
  });
}
// Function to apply zoom animation to the highest prediction image
function applyZoomAnimation(className) {
  // Remove the zoom-animation class from all images
  const images = document.querySelectorAll("img");
  images.forEach((img) => img.classList.remove("zoom-animation"));

  // Add the zoom-animation class to the image with the highest prediction class name
  const targetImage = document.querySelector(`img.${className}`);
  if (targetImage) {
    targetImage.classList.add("zoom-animation");
  }
}

// Function to map class names to colors
function getColorForClass(className) {
  switch (className) {
    case "singe":
      return "red";
    case "Chien":
      return "blue";
    case "sanglier":
      return "green";
    case "tigre":
      return "yellow";
    case "Cheval":
      return "purple";
    default:
      return "white";
  }
}

document.addEventListener("DOMContentLoaded", init);
