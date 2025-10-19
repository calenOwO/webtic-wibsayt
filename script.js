const searchIcon = document.getElementById('searchIcon');
const searchInput = document.getElementById('searchInput');
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const header = document.querySelector('header');
const userIcon = document.getElementById('userIcon');
const loginDropdown = document.getElementById('loginDropdown');

// Search functionality
searchIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    searchInput.classList.toggle('active');
    if (searchInput.classList.contains('active')) {
        searchInput.focus();
    }
    loginDropdown.classList.remove('active');
});

// Close search when clicking outside
document.addEventListener('click', function (event) {
    if (!event.target.closest('.search-container')) {
        searchInput.classList.remove('active');
    }
    if (!event.target.closest('.user-container')) {
        loginDropdown.classList.remove('active');
    }
});

// User icon / Login dropdown
userIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    loginDropdown.classList.toggle('active');
    searchInput.classList.remove('active');
});

// Hamburger menu toggle
hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('active');
    nav.classList.toggle('active');
});

// Close menu when clicking on a link
const navLinks = document.querySelectorAll('nav ul li a');
navLinks.forEach(link => {
    link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
    });
});

// Shrink header on scroll
window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('active');
    }
});

// Login form - just close dropdown on submit
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginDropdown.classList.remove('active');
});

document.querySelectorAll('.categories-container').forEach(container => {
  const wrapper = container.querySelector('.categories-wrapper');
  const leftBtn = container.querySelector('.scroll-btn.left');
  const rightBtn = container.querySelector('.scroll-btn.right');
  const cards = container.querySelectorAll('.category-card');

  const cardWidth = cards[0].offsetWidth + 200;

  leftBtn.addEventListener('click', () => {
    wrapper.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  rightBtn.addEventListener('click', () => {
    wrapper.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });
});


const myCarouselElement = document.querySelector('#myCarousel')
const carousel = new bootstrap.Carousel(myCarouselElement, {
  interval: 2000,
  touch: false
})
