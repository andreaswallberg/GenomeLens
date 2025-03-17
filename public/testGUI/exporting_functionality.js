async function convertBlobToDataURL(blobUrl) {
    try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting blob to data URL:', error);
        return blobUrl; // Return original URL if conversion fails
    }
}

async function generateHTMLContent(plotSpec) {
    // Deep clone the spec to avoid modifying the original
    const processedSpec = JSON.parse(JSON.stringify(plotSpec));
    
    // Convert the data URLs now
    if (processedSpec.views) {
        for (const view of processedSpec.views) {
            if (view.tracks) {
                for (const track of view.tracks) {
                    if (track.data?.url && track.data.url.startsWith('blob:')) {
                        const dataUrl = await convertBlobToDataURL(track.data.url);
                        track.data.url = dataUrl;
                    }
                    if (track.data?.indexUrl && track.data.indexUrl.startsWith('blob:')) {
                        const indexUrl = await convertBlobToDataURL(track.data.indexUrl);
                        track.data.indexUrl = indexUrl;
                    }
                }
            }
        }
    }

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Exported Plot</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
                <script type="importmap">
                {
                    "imports": {
              "react": "https://esm.sh/react@18",
              "react-dom": "https://esm.sh/react-dom@18",
              "pixi": "https://esm.sh/pixi.js@6",
              "higlass-text": "https://esm.sh/higlass-text/es/index.js",
              "higlass": "https://esm.sh/higlass@1.13?external=react,react-dom,pixi",
              "gosling.js": "https://esm.sh/gosling.js@0.17.0?external=react,react-dom,pixi,higlass,higlass-text"
                    }
                }
                </script>
                <style>
                    #gosling-container {
                        width: 100%;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body style="margin:0; padding:0;">
                <div id="gosling-container"></div>
                <script type="module">
                    import { embed } from 'gosling.js';
                    
                    // Wait for pako to be available
                    await new Promise(resolve => {
                        if (window.pako) resolve();
                        else window.addEventListener('load', resolve);
                    });

                    const spec = ${JSON.stringify(processedSpec, null, 2)};
                    
                    async function initVisualization() {
                        try {
                            await embed(document.getElementById('gosling-container'), spec);
                        } catch (error) {
                            console.error('Error initializing visualization:', error);
                        }
                    }

                    initVisualization();
                </script>
            </body>
        </html>
    `;
}

export function exportingFigures() {
    // The loading settings
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.display = 'none';
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    loadingOverlay.style.zIndex = '1000';
    loadingOverlay.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 25px;">Downloading...</div>';
    document.body.appendChild(loadingOverlay);

    // To dispaly loading
    const showLoading = () => {
        loadingOverlay.style.display = 'block';
    };
    // To hide loading
    const hideLoading = () => {
        loadingOverlay.style.display = 'none';
    };

    const exportDropdown = document.getElementById('export-dropdown');
    // Add null check before adding event listener
    if (!exportDropdown) {
        console.error('Export dropdown element not found');
        return;
    }

    exportDropdown.addEventListener('change', async (event) => {
        const selectedValue = event.target.value;
        const container = document.getElementById('plot-container-1');
        const notification = document.getElementById('notification');
        // To show notification
        const showMessage = (message, color) => {
            notification.textContent = message;
            notification.style.backgroundColor = color;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        };

        if (!container) {
            console.error('Plot container element not found');
            showMessage('Plot container element not found', '#ff0000');
            return;
        }

        const svgElements = container.getElementsByTagName('svg');
        // If there is no SVG created
        if (svgElements.length === 0) {
            console.error('No SVG elements found in the plot container');
            showMessage('No SVG elements found in the plot container', '#ff0000');
            return;
        }

        const svgContent = container.innerHTML;
        // to fetch the JSON of the SVG.
        const jsonSpec = window.plotSpecManager.exportPlotSpecAsJSON();
        // The dependencies that are required for the SVG to be rendered
        const plotSpec = window.plotSpecManager.getPlotSpec();
        const htmlContent = await generateHTMLContent(plotSpec);

        let endpoint = '';
        switch (selectedValue) {
            case 'pdf':
                endpoint = '/save-pdf';
                break;
            case 'png':
                endpoint = '/save-png';
                break;
            case 'html':
                endpoint = '/save-html';
                break;
            default:
                console.error('Invalid export option selected');
                showMessage('Invalid export option selected', '#ff0000');
                return;
        }

        showLoading();

        if (selectedValue === 'pdf') {
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ htmlContent }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plot.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showMessage('PDF file downloaded successfully', '#02a102');
            })
            .catch((error) => {
                console.error('Error:', error);
                showMessage('Error during export: ' + error.message, '#ff0000');
            })
            .finally(hideLoading);
        } else if (selectedValue === 'png') {
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ htmlContent }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plot.png';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showMessage('PNG file downloaded successfully', '#02a102');
            })
            .catch((error) => {
                console.error('Error:', error);
                showMessage('Error during export: ' + error.message, '#ff0000');
            })
            .finally(hideLoading);
        } else if (selectedValue === 'html') {
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ htmlContent }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();  // Expecting text content for HTML
            })
            .then(htmlContent => {
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plot-container.html';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showMessage('HTML file downloaded successfully', '#02a102');
            })
            .catch((error) => {
                console.error('Error:', error);
                showMessage('Error during export: ' + error.message, '#ff0000');
            })
            .finally(hideLoading);
        } else if (selectedValue === 'json') {
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jsonContent: jsonSpec }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(jsonContent => {
                const blob = new Blob([JSON.stringify(jsonContent)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plot.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showMessage('JSON file downloaded successfully', '#02a102');
            })
            .catch((error) => {
                console.error('Error:', error);
                showMessage('Error during export: ' + error.message, '#ff0000');
            })
            .finally(hideLoading);
        }
    });

    // Remove or update the JSON export button listener since we're replacing it with PDF
    // If you want to keep it for reference, add a null check:
    const exportJsonButton = document.getElementById('export-json-button');
    if (exportJsonButton) {
        exportJsonButton.addEventListener('click', () => {
            const jsonSpec = window.plotSpecManager.exportPlotSpecAsJSON();
            showLoading();
            fetch('/save-json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jsonContent: jsonSpec }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const a = document.createElement('a');
                a.href = data.fileUrl;
                a.download = 'plotSpec.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showMessage('JSON file downloaded successfully', '#02a102');
            })
            .catch((error) => {
                console.error('Error:', error);
                showMessage('Error during export: ' + error.message, '#ff0000');
            })
            .finally(hideLoading);
        });
    }
}