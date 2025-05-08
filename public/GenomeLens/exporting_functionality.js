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
        return blobUrl
    }
}

async function generateHTMLContent(plotSpec) {
    const processedSpec = JSON.parse(JSON.stringify(plotSpec));
    
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
    // Create filename modal
    const filenameModal = document.createElement('div');
    filenameModal.innerHTML = `
        <div id="filename-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1001;">
            <h3 style="margin-top: 0;">Enter filename</h3>
            <input type="text" id="filename-input" style="width: 100%; padding: 5px; margin: 10px 0;" 
                placeholder="Enter filename (without extension)">
            <div style="text-align: right;">
                <button id="cancel-filename" style="margin-right: 10px; padding: 5px 10px;">Cancel</button>
                <button id="confirm-filename" style="padding: 5px 10px; background: #4CAF50; color: white; border: none;">
                    Confirm</button>
            </div>
        </div>`;
    document.body.appendChild(filenameModal);

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

    // To display loading
    const showLoading = () => {
        loadingOverlay.style.display = 'block';
    };
    // To hide loading
    const hideLoading = () => {
        loadingOverlay.style.display = 'none';
    };

    const exportDropdown = document.getElementById('export-dropdown');
    if (!exportDropdown) {
        console.error('Export dropdown element not found');
        return;
    }

    exportDropdown.addEventListener('change', async (event) => {
        const selectedValue = event.target.value;
        const container = document.getElementById('plot-container-1');
        
        if (!container) {
            console.error('Plot container element not found');
            showMessage('Plot container element not found', '#ff0000');
            return;
        }

        // Show filename modal and handle export
        const handleExport = (defaultName) => {
            const modal = document.getElementById('filename-modal');
            modal.style.display = 'block';
            // Add delay to trigger transition
            setTimeout(() => modal.classList.add('visible'), 10);
            const input = document.getElementById('filename-input');
            input.value = defaultName;

            document.getElementById('cancel-filename').onclick = () => {
                modal.classList.remove('visible');
                setTimeout(() => modal.style.display = 'none', 300);
                exportDropdown.value = '';
            };

            document.getElementById('confirm-filename').onclick = async () => {
                modal.classList.remove('visible');
                setTimeout(() => modal.style.display = 'none', 300);
                const filename = input.value.trim() || defaultName;
                modal.style.display = 'none';
                
                showLoading();
                if (selectedValue === 'html') {
                    const htmlContent = await generateHTMLContent(window.plotSpecManager.getPlotSpec());
                    fetch('/save-html', {
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
                        return response.text();
                    })
                    .then(htmlContent => {
                        const blob = new Blob([htmlContent], { type: 'text/html' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${filename}.html`;
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
                    .finally(() => {
                        hideLoading();
                        exportDropdown.value = '';
                    });
                }
            };
        };

        switch (selectedValue) {
            case 'html':
                handleExport('plot-container');
                break;
            default:
                console.error('Invalid export option selected');
                showMessage('Invalid export option selected', '#ff0000');
                return;
        }
    });
}