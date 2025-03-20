/**
 * @fileoverview Express server application for InfraVIS
 * Provides API endpoints for visualization data and export functionality
 * @module app
 * @requires express
 * @requires cors
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(morgan('combined'));

// Custom CSP middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdnjs.cloudflare.com data:; " +
    "style-src 'self' 'unsafe-inline' https://esm.sh https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self' https: data: blob:; " +
    "worker-src 'self' blob:;"
  );
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '/GenomeLens/index.html'));
});

/**
 * Save visualization as HTML
 * @route POST /save-html
 */
app.post('/save-html', async (req, res) => {
    const htmlContent = req.body.htmlContent;
    
    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=plot-container.html');
    
    res.send(htmlContent);
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});