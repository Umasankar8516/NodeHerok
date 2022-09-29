
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
  
  

//Preloaded Images
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
  
//Fetch the userlist from the databace
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
  
  //Added Event Listener for grab the image frame
player.addEventListener('aiscan', () => {
    imageCapture.grabFrame()
      .then((imageBitmap) => {
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        predictImage(canvas);
      })
  });
  
  //Function to load the camera from the media devices
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
  
  //Function to take snap shot of camera 
  function stopLooking() {
    const box = document.getElementsByClassName('flex-container')[0];
    box.style.visibility = 'visible';
  }
  
  // Display the Employee Discription with image
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
  
  
  
  