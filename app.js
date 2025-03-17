/**
 * @fileoverview Express server application for InfraVIS
 * Provides API endpoints for visualization data and export functionality
 * @module app
 * @requires express
 * @requires puppeteer
 * @requires cors
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
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
  res.sendFile(path.join(__dirname, 'public', '/testGUI/index.html'));
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

/**
 * Save visualization as PNG
 * @route POST /save-png
 */
app.post('/save-png', async (req, res) => {
    try {
        const htmlContent = req.body.htmlContent;
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--disable-features=site-per-process'
            ]
        });
        
        const page = await browser.newPage();
        
        // Enable console log from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
        // Set viewport
        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 2
        });

        // Set content with proper waiting
        await page.setContent(htmlContent, { 
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 60000 
        });

        // Wait for the container and its content
        await page.waitForSelector('#gosling-container');
        
        // Use evaluate to wait for content to be rendered
        await page.evaluate(() => {
            return new Promise((resolve) => {
                const checkContent = () => {
                    const container = document.querySelector('#gosling-container');
                    if (container && 
                        container.children.length > 0 && 
                        container.getBoundingClientRect().height > 0) {
                        resolve();
                    } else {
                        setTimeout(checkContent, 100);
                    }
                };
                checkContent();
            });
        });

        // Small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take the screenshot
        const element = await page.$('#gosling-container');
        if (!element) {
            throw new Error('Container not found after waiting');
        }

        // Get the element's dimensions
        const boundingBox = await element.boundingBox();
        
        const pngBuffer = await page.screenshot({
            type: 'png',
            clip: boundingBox,
            omitBackground: true,
            fullPage: false
        });

        await browser.close();

        // Send the response
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': pngBuffer.length,
            'Content-Disposition': 'attachment; filename="plot.png"'
        });
        res.end(pngBuffer);
        
    } catch (error) {
        console.error('Detailed error in /save-png:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            stack: error.stack 
        });
    }
});

/**
 * Save visualization as PDF
 * @route POST /save-pdf
 */
app.post('/save-pdf', async (req, res) => {
    try {
        const htmlContent = req.body.htmlContent;
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--disable-features=site-per-process'
            ]
        });
        
        const page = await browser.newPage();
        
        // Enable console log from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
        // Set viewport
        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 2
        });

        // Set content with proper waiting
        await page.setContent(htmlContent, { 
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 60000 
        });

        // Wait for the container and its content
        await page.waitForSelector('#gosling-container');
        
        // Wait for content to be rendered
        await page.evaluate(() => {
            return new Promise((resolve) => {
                const checkContent = () => {
                    const container = document.querySelector('#gosling-container');
                    if (container && 
                        container.children.length > 0 && 
                        container.getBoundingClientRect().height > 0) {
                        resolve();
                    } else {
                        setTimeout(checkContent, 100);
                    }
                };
                checkContent();
            });
        });

        // Small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        // Send the response
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'attachment; filename="plot.pdf"'
        });
        res.end(pdfBuffer);
        
    } catch (error) {
        console.error('Detailed error in /save-pdf:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            stack: error.stack 
        });
    }
});

/**
 * Save visualization specification as JSON
 * @route POST /save-json
 */
app.post('/save-json', (req, res) => {
    try {
        const jsonContent = req.body.jsonContent;
        
        // Validate JSON
        let parsedJSON;
        try {
            parsedJSON = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        } catch (error) {
            return res.status(400).json({ message: 'Invalid JSON format' });
        }

        // Convert to Gosling format
        const goslingFormattedJSON = {
            arrangement: "vertical",
            views: parsedJSON.views.map(view => ({
                layout: "linear",
                alignment: view.alignment || "stack",
                static: view.static || false,
                width: view.width,
                height: view.height,
                tracks: view.tracks
                    .filter(track => track.data && track.data.url && track.data.type)
                    .map(track => ({
                        data: track.data,
                        mark: track.mark,
                        x: track.x,
                        xe: track.xe,
                        y: track.y,
                        stroke: track.stroke || { value: "black" },
                        strokeWidth: track.strokeWidth || { value: 0.3 },
                        style: track.style || { outlineWidth: 0 }
                    }))
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=plot.json');
        res.send(JSON.stringify(goslingFormattedJSON, null, 2));
    } catch (error) {
        console.error('Error in /save-json:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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