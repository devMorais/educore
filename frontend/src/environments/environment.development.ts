const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const environment = {
  production: false,
  apiUrl: isLocalhost ? 'http://localhost:8000/api' : 'https://educore.test/api',
  aiServiceUrl: 'http://127.0.0.1:8001'
};