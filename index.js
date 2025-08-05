/**
 * Corruption Watch Kenya - Main JavaScript File
 * Handles navigation, UI interactions, and core functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dom = {
    navToggle: document.querySelector('.nav-toggle'),
    navPopup: document.getElementById('navPopup'),
    navLinks: document.querySelectorAll('.nav-popup a'),
    body: document.body,
    heroBtn: document.querySelector('.hero .btn'),
    learnMoreBtn: document.querySelector('.btn-outline')
  };

  // State management
  const state = {
    isMenuOpen: false
  };

  // Initialize the application
  function init() {
    setupEventListeners();
    checkForHeroImage();
  }

  // Set up all event listeners
  function setupEventListeners() {
    // Navigation toggle
    if (dom.navToggle) {
      dom.navToggle.addEventListener('click', toggleNavigation);
    }

    // Close menu when clicking on nav links
    if (dom.navLinks.length > 0) {
      dom.navLinks.forEach(link => {
        link.addEventListener('click', closeNavigation);
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (state.isMenuOpen && !dom.navPopup.contains(e.target)) {
        closeNavigation();
      }
    });

    // Hero button analytics (example)
    if (dom.heroBtn) {
      dom.heroBtn.addEventListener('click', () => {
        console.log('Report button clicked');
        // Add analytics tracking here
      });
    }

    // Learn more button smooth scroll
    if (dom.learnMoreBtn) {
      dom.learnMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#learn').scrollIntoView({
          behavior: 'smooth'
        });
      });
    }
  }

  // Toggle navigation menu
  function toggleNavigation(e) {
    e.stopPropagation();
    state.isMenuOpen = !state.isMenuOpen;
    
    if (state.isMenuOpen) {
      dom.navPopup.classList.add('show');
      dom.body.classList.add('nav-open');
    } else {
      closeNavigation();
    }
  }

  // Close navigation menu
  function closeNavigation() {
    dom.navPopup.classList.remove('show');
    dom.body.classList.remove('nav-open');
    state.isMenuOpen = false;
  }

  // Check if hero image loaded successfully
  function checkForHeroImage() {
    const hero = document.querySelector('.hero');
    if (hero) {
      const img = new Image();
      img.src = 'img/kenya-bg.jpg';
      
      img.onerror = () => {
        hero.style.background = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), var(--primary-color)`;
        console.warn('Hero image failed to load, using fallback background');
      };
    }
  }

  // Initialize the app
  init();
});
