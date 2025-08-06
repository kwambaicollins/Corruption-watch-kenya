// Configuration
const CONFIG = {
  firebase: {
    apiKey: "AIzaSyD7NFb1hFX3VFzfbJ0UmY-mDby-6w3MYuk",
    authDomain: "corruption-watch-kenya.firebaseapp.com",
    databaseURL: "https://corruption-watch-kenya-default-rtdb.firebaseio.com",
    projectId: "corruption-watch-kenya",
    storageBucket: "corruption-watch-kenya.appspot.com",
    messagingSenderId: "1032330075769",
    appId: "1:1032330075769:web:6e5f0d984d95cec8c5bea8"
  },
  map: {
    defaultLat: 0.0236,
    defaultLng: 37.9062,
    defaultZoom: 6
  }
};

// Initialize Firebase
function initializeFirebase() {
  try {
    firebase.initializeApp(CONFIG.firebase);
    return firebase.database();
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw new Error("Failed to initialize database");
  }
}

// Initialize Map
function initializeMap() {
  const map = L.map('map').setView(
    [CONFIG.map.defaultLat, CONFIG.map.defaultLng], 
    CONFIG.map.defaultZoom
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  const marker = L.marker(
    [CONFIG.map.defaultLat, CONFIG.map.defaultLng], 
    { draggable: true }
  ).addTo(map);

  return { map, marker };
}

// Form Handling
function setupForm(db, marker) {
  const form = document.getElementById('reportForm');
  const submitBtn = document.getElementById('submitBtn');

  // Set default date
  document.getElementById('dateOccurred').valueAsDate = new Date();

  // Form validation
  function validateForm() {
    const isValid = [
      document.getElementById('corruptionType').value,
      document.getElementById('description').value,
      document.getElementById('latitude').value,
      document.getElementById('longitude').value,
      document.getElementById('dateOccurred').value
    ].every(Boolean);
    
    submitBtn.disabled = !isValid;
  }

  // Location handling
  function updateLocation(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    document.getElementById('location').value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    validateForm();
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const reportData = {
        type: document.getElementById('corruptionType').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        date: document.getElementById('dateOccurred').value,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: "pending"
      };

      const ref = await db.ref('reports').push(reportData);
      alert(`Report submitted! ID: ${ref.key}`);
      form.reset();
      marker.setLatLng([CONFIG.map.defaultLat, CONFIG.map.defaultLng]);
      
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting report");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Add event listeners
  [...form.elements].forEach(element => {
    element.addEventListener('input', validateForm);
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const db = initializeFirebase();
    const { map, marker } = initializeMap();
    
    // Map events
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      updateLocation(lat, lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateLocation(e.latlng.lat, e.latlng.lng);
    });

    setupForm(db, marker);
    
    // Hide loading screen
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('mainContent').classList.remove('hidden');

  } catch (error) {
    console.error("Initialization error:", error);
    document.getElementById('loadingMessage').textContent = error.message;
    document.getElementById('retryButton').classList.remove('hidden');
  }
});