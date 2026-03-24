const CONFIG = {
    // Backend URL (used by game.js)
    // Local: http://localhost:8000
    // Production: Your Render service URL (e.g., https://squarecraft-ai.onrender.com)
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://squarecraft-ai.onrender.com' // Replace with your Render URL after deployment
};
