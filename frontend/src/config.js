// src/config.js
const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://shorethingsapp.onrender.com'
    : 'http://localhost:5000'; // local dev fallback

export default API_BASE_URL;
