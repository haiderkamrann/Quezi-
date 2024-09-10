const hamBurger = document.querySelector('.hamBurger');
const mobileNav = document.querySelector('.mobile-nav');
const overlay = document.querySelector('.overlay');
const closeBtn = document.querySelector('.close-btn');

hamBurger.addEventListener('click', () => {
    mobileNav.classList.add('navActive');
    overlay.classList.add('navActive');
    // document.body.classList.add('no-scroll');
});

closeBtn.addEventListener('click', () => {
    mobileNav.classList.remove('navActive');
    overlay.classList.remove('navActive');
});

overlay.addEventListener('click', () => {
    mobileNav.classList.remove('navActive');
    overlay.classList.remove('navActive');
});
