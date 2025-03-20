import { embed } from 'gosling.js';
import { handleOptions } from './update_plot_specifications.js';

export function getCurrentViewSpec() {
  const currentCanvasId = `canvas${window.canvas_num}`;
  return window.plotSpecManager.getPlotSpecViewById(currentCanvasId);
}

if(window.canvas_num) {
  window.canvas_states[window.canvas_num].filenames = window.canvas_states[window.canvas_num].filenames || {};
}

// Add helper functions for URL management
function createFileURL(file) {
  if (file instanceof File) {
      return URL.createObjectURL(file);
  }
  return file;
}

function revokeFileURL(url) {
  if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
  }
}

/**
 * Handle data from a local file input.
 * 
 * @param {FileList} fileInputs - List of file inputs.
 * @param {number} button_data_track_number - Button data track number.
 */
export async function URLfromFile(fileInputs, button_data_track_number) {
  try {
      const files = Array.from(fileInputs[button_data_track_number].files);
      const isCanvas0 = window.canvas_num === 0;

      if (isCanvas0) {
          if (files.length !== 2) {
              throw new Error('Canvas 0 requires exactly 2 files: one .gz and one .tbi.');
          }

          const gzFile = files.find(file => file.name.toLowerCase().endsWith('.gz'));
          const tbiFile = files.find(file => file.name.toLowerCase().endsWith('.tbi'));

          if (!gzFile || !tbiFile) {
              throw new Error('Canvas 0 requires both .gz and .tbi files.');
          }

          // Create and store URLs
          const gzURL = createFileURL(gzFile);
          const tbiURL = createFileURL(tbiFile);

          // Store URLs globally
          window.fileURLs = {
              gff: gzURL,
              index: tbiURL
          };

          // Update plot specification
          const plotSpec = getCurrentViewSpec();
          plotSpec.tracks.forEach(track => {
              track.data = {
                  ...track.data,
                  type: 'gff',
                  url: gzURL,
                  indexUrl: tbiURL,
                  attributesToFields: [
                      { attribute: "gene_biotype", defaultValue: "unknown" },
                      { attribute: "Name", defaultValue: "unknown" },
                      { attribute: "ID", defaultValue: "unknown" }
                  ]
              };
          });

          // Store filenames
          window.canvas_states[window.canvas_num].filenames[button_data_track_number] = {
              data: gzFile.name,
              index: tbiFile.name,
          };

          // Update filename display
          const filenameElement = document.getElementById(`filename-display-${button_data_track_number}`);
          if (filenameElement) {
              filenameElement.textContent = `${gzFile.name}, ${tbiFile.name}`;
          }

          await handleOptions(gzFile, button_data_track_number);
          await GoslingPlotWithLocalData();

      } else {
      if (files.length !== 1) {
        throw new Error('Only one file (.csv or .tsv) can be uploaded for this canvas.');
      }

      const file = files[0];
      const extension = file.name.split('.').pop().toLowerCase();

      if (!['csv', 'tsv'].includes(extension)) {
        throw new Error('Only .csv and .tsv files are allowed for Canvas 1, 2, 3, etc.');
      }

      // Store filename as a string for other canvases
      window.canvas_states[window.canvas_num].filenames[button_data_track_number] = file.name;

      // Update the filename display
      const filenameElement = document.getElementById(`filename-display-${button_data_track_number}`);
      if (filenameElement) {
        filenameElement.textContent = file.name;
      }

      const fileURL = URL.createObjectURL(file);
      const plotSpec = getCurrentViewSpec();
      const current_track = plotSpec.tracks[button_data_track_number]; // Adjust based on your plotSpec structure

      if (!current_track) {
        console.error(`Track number ${button_data_track_number} does not exist in plotSpec.`);
        return;
      }
      if (fileURL) {
        current_track.data = {
          url: fileURL,
        };
        await configureDataType(extension, current_track);
        await handleOptions(file, button_data_track_number);
        await checkURLParameters(current_track, button_data_track_number);
        console.log('File loaded successfully for Canvas ' + window.canvas_num);
      }
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

/**
 * Processes and validates URL inputs for different canvas types, fetches files, and configures tracks accordingly.
 * For Canvas 0, expects two URLs (one .gz and one .tbi file), while other canvases accept single .csv or .tsv files.
 * Updates the canvas state, track data, and filename displays based on the provided URLs.
 *
 * @param {string} URL_input - The URL or comma-separated URLs of the file(s) to be processed
 * @param {number} button_data_track_number - The track number associated with the button/data
 * @throws {Error} If URL validation fails, file extensions are incorrect, or network requests fail
 * @returns {Promise<void>}
 *
 * @example
 * // For Canvas 0 (requires both .gz and .tbi files)
 * await URLfromServer('data.gz,index.tbi', 0);
 *
 * // For other canvases (accepts .csv or .tsv)
 * await URLfromServer('data.csv', 1);
 */
export async function URLfromServer(URL_input, button_data_track_number) {
  try {
    const isCanvas0 = window.canvas_num === 0;
    const viewSpec = getCurrentViewSpec();
    const current_track = viewSpec.tracks[button_data_track_number];

    if (URL_input) {
      let urls = [];
      if (isCanvas0) {
        // Expecting two URLs separated by a comma
        urls = URL_input.split(',').map(url => url.trim());
        if (urls.length !== 2) {
          throw new Error('Canvas 0 requires exactly 2 URLs: one .gz and one .tbi.');
        }
      } else {
        urls = [URL_input.trim()];
      }

      if (isCanvas0) {
        const gzURL = urls.find(url => url.toLowerCase().endsWith('.gz'));
        const tbiURL = urls.find(url => url.toLowerCase().endsWith('.tbi'));

        if (!gzURL || !tbiURL) {
          throw new Error('Canvas 0 requires both .gz and .tbi URLs.');
        }

        window.canvas_states[window.canvas_num].filenames[button_data_track_number] = {
          data: gzURL.split('/').pop(),
          index: tbiURL.split('/').pop()
        };

        current_track.data = {
          url: gzURL,
          indexUrl: tbiURL
        };

        // Update the filename display
        const filenameElement = document.getElementById(`filename-display-${button_data_track_number}`);
        if (filenameElement) {
          filenameElement.textContent = `${window.canvas_states[window.canvas_num].filenames[button_data_track_number].data}, ${window.canvas_states[window.canvas_num].filenames[button_data_track_number].index}`;
        }

        // Validate extensions
        const gzExtension = gzURL.split('.').pop().toLowerCase();
        const tbiExtension = tbiURL.split('.').pop().toLowerCase();

        if (gzExtension !== 'gz' || tbiExtension !== 'tbi') {
          throw new Error('Canvas 0 requires one .gz and one .tbi URL.');
        }
      } else {
        const fileURL = urls[0];
        const filename = fileURL.split('/').pop();
        const extension = filename.split('.').pop().toLowerCase();

        if (!['csv', 'tsv'].includes(extension)) {
          throw new Error('Only .csv and .tsv files are allowed for Canvas 1, 2, 3, etc.');
        }

        window.canvas_states[window.canvas_num].filenames[button_data_track_number] = filename;

        current_track.data = {
          url: fileURL
        };

        // Update the filename display
        const filenameElement = document.getElementById(`filename-display-${button_data_track_number}`);
        if (filenameElement) {
          filenameElement.textContent = filename;
        }
      }

      // Fetch and process files
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const filename = url.split('/').pop();
        const extension = filename.split('.').pop().toLowerCase();

        if (isCanvas0) {
          if (i === 0 && extension !== 'gz') {
            throw new Error('First URL must be a .gz file.');
          }
          if (i === 1 && extension !== 'tbi') {
            throw new Error('Second URL must be a .tbi file.');
          }
        } else {
          if (!['csv', 'tsv'].includes(extension)) {
            throw new Error('Only .csv and .tsv files are allowed for this canvas.');
          }
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Network response was not ok for URL: ${url}`);
        }
        const fileBlob = await response.blob();

        if (isCanvas0) {
          // For canvas0, handle .gz and .tbi separately
          if (extension === 'gz') {
            await configureDataType('gz', current_track);
            await handleOptions(fileBlob, button_data_track_number);
          }
        } else {
          await configureDataType(extension, current_track);
          await handleOptions(fileBlob, button_data_track_number);
        }
      }

      await checkURLParameters(current_track, button_data_track_number);
      console.log('URL-based files loaded successfully');
    }
  } catch (error) {
    alert(error.message);
  }
}

/**
 * Configure data type based on file extension.
 * 
 * @param {string} extension - File extension.
 * @param {object} track - Track object.
 */
async function configureDataType(extension, track) {
  const isCanvas0 = window.canvas_num === 0;
  
  if (!track.data || typeof track.data !== 'object') {
    track.data = {};
  }

  if (isCanvas0) {
    track.data.type = 'gff'; // Correct data type for GFF
    track.data.indexUrl = track.data.indexUrl || '';
  } else {
    const validExtensions = ['tsv', 'csv'];
    if (!validExtensions.includes(extension)) {
      throw new Error('Invalid file extension. Only .tsv and .csv files are allowed.');
    }
    track.data.type = 'csv';
    track.data.separator = extension === 'tsv' ? '\t' : ',';
  }
}

/**
 * Embed the Gosling plot with local data.
 */
/**
 * Creates a Gosling visualization plot using local data.
 * This function embeds a plot into a container based on the plot specification
 * managed by the global plotSpecManager.
 * 
 * The function performs the following:
 * 1. Retrieves the plot specification from plotSpecManager
 * 2. Validates track URLs and index URLs for GFF data when canvas_num is 0
 * 3. Embeds the plot into a container with ID 'plot-container-1'
 * 
 * @async
 * @function GoslingPlotWithLocalData
 * @throws {Error} Throws an error if the embedding process fails
 * @returns {Promise<void>}
 */
export async function GoslingPlotWithLocalData() {
    try {
        const plotSpec = window.plotSpecManager.getPlotSpec();
        
        if (!plotSpec) {
            throw new Error('Plot specification not found');
        }

        // Only update assembly info if we're on canvas0
        if (window.canvas_num === 0 && window.currentAssemblyInfo?.seqid) {
            const { seqid, length } = window.currentAssemblyInfo;
            
            // Only update the first view (canvas0) with chromosome info
            if (plotSpec.views[0]) {
                plotSpec.views[0].assembly = [[seqid, length]];
                plotSpec.views[0].xDomain = {
                    chromosome: seqid,
                    interval: [0, length]
                };

                // Update GFF tracks with proper schema
                plotSpec.views[0].tracks?.forEach(track => {
                    if (!track.data) track.data = {};
                    track.data = {
                        type: 'gff',
                        url: window.fileURLs?.gff || track.data.url,
                        indexUrl: window.fileURLs?.index || track.data.indexUrl
                    };
                    
                    // Ensure attributesToFields is properly set for GFF files
                    if (!track.data.attributesToFields) {
                        track.data.attributesToFields = [
                            { attribute: "gene_biotype", defaultValue: "unknown" },
                            { attribute: "Name", defaultValue: "unknown" },
                            { attribute: "ID", defaultValue: "unknown" }
                        ];
                    }
                });
            }
        }

        const container = document.getElementById('plot-container-1');
        if (!container) {
            throw new Error('Plot container not found');
        }

        // Clear previous plot to avoid stacking issues
        container.innerHTML = '';
        
        // Create clean copy of plot spec to avoid schema validation issues
        const cleanPlotSpec = JSON.parse(JSON.stringify(plotSpec));
        
        await embed(container, cleanPlotSpec);
        console.log('Plot embedded successfully');

    } catch (error) {
        console.error('Error in GoslingPlotWithLocalData:', error);
    }
}

// Add cleanup listener
window.addEventListener('beforeunload', () => {
  if (window.fileURLs) {
      revokeFileURL(window.fileURLs.gff);
      revokeFileURL(window.fileURLs.index);
  }
});
/**
 * Check and update plot specifications based on URL query parameters.
 * 
 * @param {object} track - Track object.
 * @param {number} track_nr - Track number.
 */
export async function checkURLParameters(track, track_nr) {
  const url = new window.URL(document.location);
  try {
    const urlSearch = url.searchParams;
    if (urlSearch.size > 0) {
      const generateParamName = (param) => `${param}${track_nr}`;
      const plotSpec = getCurrentViewSpec();

    // Initialize style object if it doesn't exist
    if (!plotSpec.style) {
        plotSpec.style = {};
      }

      // Safeguard for tooltip array
      if (!Array.isArray(track.tooltip)) {
        track.tooltip = [];
      }

      // Ensure tooltip has at least two elements
      while (track.tooltip.length < 2) {
        track.tooltip.push({});
      }

      // Safely set properties only if they exist
      if (track.x) {
        const xField = urlSearch.get(generateParamName("x.field")) || track.data.column;
        track.x.field = xField;
        track.tooltip[1].field = xField;
        track.tooltip[1].alt = xField;
        track.data.column = xField;
      }

      if (track.y) {
        const yField = urlSearch.get(generateParamName("y.field")) || track.data.value;
        track.y.field = yField;
        track.tooltip[0].field = yField;
        track.tooltip[0].alt = yField;
        track.data.value = yField;
      }

      if (track.mark !== undefined) {
        track.mark = urlSearch.get(generateParamName("mark")) || track.mark;
      }

      if (track.size) {
        const sizeValue = parseInt(urlSearch.get(generateParamName("size.value"))) || track.size.value;
        track.size.value = sizeValue;
      }

      if (track.color) {
        track.color.value = urlSearch.get(generateParamName("color.value")) || track.color.value;
      }

      track.data.binSize = urlSearch.get(generateParamName("data.binSize")) || track.data.binSize;
      track.data.sampleLength = urlSearch.get(generateParamName("sampleLength")) || track.data.sampleLength;

      // Iterate over all tracks in plotSpec and update y.domain if applicable
      for (let i = 0; i < plotSpec.tracks.length; i++) {
        const currentTrack = plotSpec.tracks[i];
        if (currentTrack.y) { // Only update if y exists
          currentTrack.y.domain = urlSearch.has("y.domain")
            ? urlSearch.get("y.domain").split(",").map(Number)
            : currentTrack.y.domain;
        }
      }

      // Update xDomain.interval
      plotSpec.xDomain.interval = urlSearch.has("xDomain.interval")
        ? urlSearch.get("xDomain.interval").split(",").map(Number)
        : plotSpec.xDomain.interval;

      // Update background style
      if (urlSearch.has("background")) {
        plotSpec.style.background = urlSearch.get("background");
      }    }
  } catch (error) {
    console.error("Error in checkURLParameters:", error);
  }
}