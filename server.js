const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve WASM files with the correct MIME type
app.use((req, res, next) => {
    if (req.path.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
    }
    next();
});

// Serve a default favicon to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
