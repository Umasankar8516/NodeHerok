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

const bcarddom = parser.parseFromString(htmlString, "text/html");
bcarddom.getElementById("mypic").src = `https://raw.githubusercontent.com/sunumuk/virtualbusinesscard/master/images/${user}/1.jpg`

const link = `https://raw.githubusercontent.com/sunumuk/virtualbusinesscard/master/images/${label}/${i}.jpg`
const img = await faceapi.fetchImage(link)
            
  
//Fetching the Existing Images
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

  // Load the Business Card Details
async function loadBusinessCard() {
    let response = await fetch("/businesscard.html");
    let text_data = await response.text();
    return text_data;
  }

//Taking The Predicted Image
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

//Load the Existing Preloaded Predicted Images
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