import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-database.js";

const { jsPDF } = window.jspdf;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAvkgRVng7pyUF3WvVtxXxHrAql2QTxL8",
  authDomain: "fir-prjct-6431b.firebaseapp.com",
  projectId: "fir-prjct-6431b",
  storageBucket: "fir-prjct-6431b.appspot.com",
  messagingSenderId: "569727461690",
  appId: "1:569727461690:web:0ebd710c21c045d6418803"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

const player = document.getElementById('player');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const aiscan = new Event("aiscan");
const description = document.getElementById("prediction-overlay");
var hVcardDownload = document.getElementById("vcardDownload");
var userList = [];
var labeledFaceDescriptors = undefined
var lastPredictedUser;
var userData;
var imageCapture;

async function preloadLabeledImages() {
  labeledFaceDescriptors = await loadLabeledImages()
  labeledFaceDescriptors = labeledFaceDescriptors.filter(x => x != null)
  const box = document.getElementsByClassName('loader')[0];
  box.style.visibility = 'hidden';
  loadCamera()
}

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(fetchUsers);

function fetchUsers() {
  console.log("Done Loading models");
  const promise1 = new Promise((resolve, reject) => {
    onValue(ref(database, 'employees/'), (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        userList.push(childSnapshot.key);
      });
      resolve();
    }, {
        onlyOnce: true
      })
  });
  Promise.all([promise1]).then(preloadLabeledImages);
}

const constraints = {
  audio: false,
  video: {
    facingMode: 'user'
  }
};

player.addEventListener('aiscan', () => {
  imageCapture.grabFrame()
    .then((imageBitmap) => {
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
      predictImage(canvas);
    })
});

function loadCamera() {
  console.log("Loading camera");
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    player.srcObject = stream;
    const track = stream.getVideoTracks()[0];
    imageCapture = new ImageCapture(track);
    setTimeout(() => {
      player.dispatchEvent(aiscan);
    }, 1500);
  });
  hVcardDownload.addEventListener('click', () => {
    pdfUserSave(userData, lastPredictedUser)
  });
}

function stopLooking() {
  const box = document.getElementsByClassName('flex-container')[0];
  box.style.visibility = 'visible';
}

function displayDescription(result) {
  stopLooking();
  if (!result.label.includes("oops") && !result.label.includes("Looking")) {
    hVcardDownload.style.visibility = 'visible';
    onValue(ref(database, '/employees/' + result.label), (snapshot) => {
      userData = JSON.parse(JSON.stringify(snapshot));
      let businessCard = "Name: " + userData['name'] +
        "\n" + "Role: " + userData['role'] +
        "\n" + "Phone: " + userData['phone'] +
        "\n" + "Email: " + userData['email']
      description.innerText = businessCard;
      lastPredictedUser = result.label
    }, {
        onlyOnce: true
      });
  } else {
    hVcardDownload.style.visibility = 'hidden';
    description.innerText = result.label;
  }
}

async function pdfUserSave(userData, user) {
  const parser = new DOMParser();
  var htmlString = await loadBusinessCard();
  const bcarddom = parser.parseFromString(htmlString, "text/html");
  bcarddom.getElementById("mypic").src = `https://raw.githubusercontent.com/sunumuk/virtualbusinesscard/master/images/${user}/1.jpg`
  bcarddom.getElementById("myname").innerHTML = userData['name']
  bcarddom.getElementById("myrole").innerHTML = userData['role']
  bcarddom.getElementById("myno").innerHTML = userData['phone']
  bcarddom.getElementById("myemail").innerHTML = userData['email']
  bcarddom.getElementById("myli").innerHTML = userData['linkedInId']
  bcarddom.getElementById("myloc").innerHTML = userData['location']
  bcarddom.getElementById("mysite").innerHTML = userData['email'].split('@')[1]
  const pdf = new jsPDF('p', 'pt', 'a4');
  pdf.html(bcarddom.body, {
    callback: function (doc) {
      pdf.save("BusinessCard_" + userData['name'].split(" ").join("_") + ".pdf");
    },
    x: 100,
    y: 10
  });
}

async function loadBusinessCard() {
  let response = await fetch("/businesscard.html");
  let text_data = await response.text();
  return text_data;
}

async function predictImage(canvas) {
  console.log("Starting to predict image");
  let found = false;
  const blbImage = dataURLtoBlob(canvas.toDataURL('image/png'));
  let image = await faceapi.bufferToImage(blbImage)
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  const displaySize = { width: canvas.width, height: canvas.height }
  faceapi.matchDimensions(canvas, displaySize)
  const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
  const resizedDetections = faceapi.resizeResults(detections, displaySize)
  const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
  results.forEach((result, i) => {
    if (!result.label.includes("unknown")) {
      console.log("Displaying results");
      displayDescription(result)
      found = true;
    }
    console.log("found match name = " + result.label + " match %=" + Math.round(result.distance * 100))
  })
  if (results.length == 0) {
    displayDescription({ label: "oops, no match found!" })
  }
  setTimeout(() => {
    player.dispatchEvent(aiscan);
  }, 1500);
}

async function loadLabeledImages() {
  console.log("Start loading labeled images");
  return Promise.all(
    userList.map(async label => {
      console.log("Fetching images for label " + label);
      const descriptions = []
      try {
        for (let i = 1; i < 3; i++) {
          console.log("Start fetching images");
          const link = `https://raw.githubusercontent.com/sunumuk/virtualbusinesscard/master/images/${label}/${i}.jpg`
          const img = await faceapi.fetchImage(link)
          console.log("Fetched img");
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          console.log("Fetched detections");
          descriptions.push(detections.descriptor)
        }
        console.log("Done fetching image for " + label);
      }
      catch {
        if (descriptions.length == 0) {
          return null
        }
      }
      console.log("Done loading the images");
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}

function dataURLtoBlob(dataURL) {
  let array, binary, i, len;
  binary = atob(dataURL.split(',')[1]);
  array = [];
  i = 0;
  len = binary.length;
  while (i < len) {
    array.push(binary.charCodeAt(i));
    i++;
  }
  return new Blob([new Uint8Array(array)], {
    type: 'image/png'
  });
};
