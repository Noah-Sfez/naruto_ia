// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "./mudra/";

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
    labelContainer.appendChild(document.createElement("div"));
  }

  // Call predict function every 2 seconds
  setInterval(predict, 100);
}

async function loop() {
  webcam.update(); // update the webcam frame
  window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
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

  // Change the body's background color based on the highest prediction
  document.body.style.backgroundColor = getColorForClass(highestPrediction.className);
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