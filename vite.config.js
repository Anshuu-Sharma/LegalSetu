// vite.config.js
export default {
  // ...other config
  server: {
    proxy: {
      '/api': 'https://legalsetu.onrender.com',
    }
  }
};
