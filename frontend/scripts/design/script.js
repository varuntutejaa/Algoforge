initAppNav();

const authLinks = document.querySelectorAll('[data-auth-link]');

function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

authLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    if (isAuthenticated()) return;

    event.preventDefault();
    window.location.href = 'login.html';
  });
});
