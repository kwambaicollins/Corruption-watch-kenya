// Configuration
const CONFIG = {
  firebase: {
    apiKey: "AIzaSyD7NFb1hFX3VFzfbJ0UmY-mDby-6w3MYuk",
    authDomain: "corruption-watch-kenya.firebaseapp.com",
    databaseURL: "https://corruption-watch-kenya-default-rtdb.firebaseio.com",
    projectId: "corruption-watch-kenya",
    storageBucket: "corruption-watch-kenya.appspot.com",
    messagingSenderId: "1032330075769",
    appId: "1:1032330075769:web:6e5f0d984d95cec8c5bea8",
    measurementId: "G-TZJZCMY0ME"
  },
  map: {
    defaultLat: 0.0236,
    defaultLng: 37.9062,
    defaultZoom: 6
  }
};

// Global state
const state = {
  firebase: null,
  db: null,
  map: null,
  marker: null
};

// DOM elements
const elements = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingMessage: document.getElementById('loadingMessage'),
  loadingProgress: document.getElementById('loadingProgress'),
  retryButton: document.getElementById('retryButton'),
  mainContent: document.getElementById('mainContent'),
  formError: document.getElementById('formError'),
  reportForm: document.getElementById('reportForm'),
  submitBtn: document.getElementById('submitBtn')
};

// Utility functions
function updateLoadingStatus(message) {
  elements.loadingMessage.textContent = message;
}

function showError(message, showRetry = true) {
  elements.formError.textContent = message;
  elements.formError.style.display = 'block';
  elements.retryButton.classList.toggle('hidden', !showRetry);
}

function clearError() {
  elements.formError.textContent = '';
  elements.formError.style.display = 'none';
}

function showMainContent() {
  elements.loadingOverlay.classList.add('hidden');
  elements.mainContent.classList.remove('hidden');
}

// Initialize Firebase
function initializeFirebase() {
  try {
    updateLoadingStatus('Initializing database...');
    state.firebase = firebase.initializeApp(CONFIG.firebase);
    state.db = firebase.database();
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showError('Failed to initialize database. Please try again later.');
    return false;
  }
}

// Initialize Map
function initializeMap() {
  try {
    updateLoadingStatus('Initializing map...');
    state.map = L.map('map').setView(
      [CONFIG.map.defaultLat, CONFIG.map.defaultLng], 
      CONFIG.map.defaultZoom
    );
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);
    
    state.marker = L.marker(
      [CONFIG.map.defaultLat, CONFIG.map.defaultLng], 
      { draggable: true }
    ).addTo(state.map);
    
    // Initialize map marker
    state.marker.bindPopup(`Lat: ${CONFIG.map.defaultLat}, Lng: ${CONFIG.map.defaultLng}`).openPopup();
    setLocationFields(CONFIG.map.defaultLat, CONFIG.map.defaultLng);

    // Map event handlers
    state.marker.on('dragend', () => {
      const { lat, lng } = state.marker.getLatLng();
      state.marker.setPopupContent(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
      setLocationFields(lat, lng);
      validateForm();
    });

    state.map.on('click', (e) => {
      state.marker.setLatLng(e.latlng);
      const { lat, lng } = e.latlng;
      state.marker.setPopupContent(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
      setLocationFields(lat, lng);
      validateForm();
    });

    return true;
  } catch (error) {
    console.error('Map initialization error:', error);
    showError('Failed to initialize map. Please try again later.');
    return false;
  }
}

function setLocationFields(lat, lng) {
  document.getElementById('latitude').value = lat;
  document.getElementById('longitude').value = lng;
  document.getElementById('location').value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

// Form validation
function validateForm() {
  const requiredFields = [
    'corruptionType', 'description', 'latitude', 'longitude', 'dateOccurred'
  ];

  let valid = true;
  for (const id of requiredFields) {
    const el = document.getElementById(id);
    if (!el.value || (el.type === 'select-one' && el.selectedIndex === 0)) {
      valid = false;
      break;
    }
  }
  elements.submitBtn.disabled = !valid;
}

// Form submission handler
async function submitReport(reportData) {
  try {
    const newReportRef = state.db.ref('reports').push();
    await newReportRef.set(reportData);
    return newReportRef.key;
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}

// Initialize form
function initializeForm() {
  // Set default date
  document.getElementById('dateOccurred').value = new Date().toISOString().split('T')[0];

  // Add validation listeners
  const requiredFields = [
    'corruptionType', 'description', 'latitude', 'longitude', 'dateOccurred'
  ];

  requiredFields.forEach(id => {
    document.getElementById(id).addEventListener('input', validateForm);
  });
  validateForm();

  // Form submission handler
  elements.reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = elements.submitBtn;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const reportData = {
        corruption_type: document.getElementById('corruptionType').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        date_occurred: document.getElementById('dateOccurred').value,
        created_at: new Date().toISOString(),
        status: 'pending'
      };

      const reportId = await submitReport(reportData);
      
      alert(`Report submitted successfully! Reference ID: ${reportId}`);
      
      // Reset form
      elements.reportForm.reset();
      state.marker.setLatLng([CONFIG.map.defaultLat, CONFIG.map.defaultLng]);
      state.map.setView([CONFIG.map.defaultLat, CONFIG.map.defaultLng], CONFIG.map.defaultZoom);
      setLocationFields(CONFIG.map.defaultLat, CONFIG.map.defaultLng);
      document.getElementById('dateOccurred').value = new Date().toISOString().split('T')[0];
      validateForm();

    } catch (err) {
      console.error('Submission error:', err);
      showError('Error submitting report: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// Retry button handler
elements.retryButton.addEventListener('click', () => {
  window.location.reload();
});

// Main initialization
function initializeApp() {
  try {
    // Check if required libraries are loaded
    if (typeof L === 'undefined') {
      throw new Error('Map library failed to load. Please check your internet connection.');
    }
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase failed to load. Please check your internet connection.');
    }

    // Initialize services
    if (!initializeFirebase()) return;
    if (!initializeMap()) return;

    // Initialize form
    initializeForm();

    // Show main content
    showMainContent();
  } catch (error) {
    console.error('Initialization error:', error);
    showError(error.message);
    updateLoadingStatus('Initialization failed: ' + error.message);
  }
}

// Start the application when all libraries are loaded
document.addEventListener('DOMContentLoaded', initializeApp);