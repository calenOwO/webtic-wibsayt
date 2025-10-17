searchIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    searchInput.classList.toggle('active');
    if (searchInput.classList.contains('active')) {
        searchInput.focus();
    }
});

// Close search when clicking outside
document.addEventListener('click', function (event) {
    if (!event.target.closest('.search-container')) {
        searchInput.classList.remove('active');
    }
});

// Hamburger menu toggle
hamburger.addEventListener('click', function () {
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