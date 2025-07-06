const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-popup a'); // Targets all <a> in popup

navToggle.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
    });
});
