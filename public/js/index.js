import '@babel/polyfill'; //package to run js in old browsers
import { displayMap } from './mapbox.js';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateUserForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookbtn = document.getElementById('book-tour');
// values

//delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.location);
  displayMap(locations);
}

if (loginForm) {
  document.querySelector('.form--login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (updateUserForm) {
  document.querySelector('.form-user-data').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);
    updateSettings(form, 'data');
  });
}

if (updatePasswordForm) {
  document
    .querySelector('.form-user-password')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      document.querySelector('.btn-save-password').textContent = 'Updating...';
      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      await updateSettings(
        { passwordCurrent, password, passwordConfirm },
        'password'
      );

      document.querySelector('.btn-save-password').textContent =
        'Save password';
      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
    });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (bookbtn) {
  bookbtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing ...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
