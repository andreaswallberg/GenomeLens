import { getCurrentViewSpec, GoslingPlotWithLocalData } from './plot.js';
import { PlotSpecManager } from './PlotSpecManager.js';

window.canvas_states = {
  0: { trackCount: 1, tracks: [],filenames:{}, view_control_settings: {x_axis: '', x_range: [0, 200000], left_y_axis: '', left_y_range: [0, 1], right_y_axis: '', right_y_range: [0, 1], checked_left : [], checked_right : [], title: ''}},
  1: { trackCount: 1, tracks: [],filenames:{}, view_control_settings: {x_axis: '', x_range: [0, 200000], left_y_axis: '', left_y_range: [0, 1], right_y_axis: '', right_y_range: [0, 1], checked_left : [], checked_right : [], title: ''}},
  2: { trackCount: 1, tracks: [],filenames:{}, view_control_settings: {x_axis: '', x_range: [0, 200000], left_y_axis: '', left_y_range: [0, 1], right_y_axis: '', right_y_range: [0, 1], checked_left : [], checked_right : [], title: ''}},
  3: { trackCount: 1, tracks: [],filenames:{}, view_control_settings: {x_axis: '', x_range: [0, 200000], left_y_axis: '', left_y_range: [0, 1], right_y_axis: '', right_y_range: [0, 1], checked_left : [], checked_right : [], title: ''}}
};

window.currentView = 1
window.canvas_num = 0;
window.object_1_created = false
window.object_2_created = false
window.object_3_created = false
window.trackCount = 5;
window.displayed_canvas = 1

window.plotSpecManager = new PlotSpecManager();

const fileHeaders = new Map();


/**
 * Handle various options for data, such as file or server URL.
 * 
 * @param {File|Blob} data - Data object, either a local file or a Blob from a server.
 * @param {number} button_data_track_number - Button data track number.
 */
export async function handleOptions(data, button_data_track_number) {
  const plotSpec = getCurrentViewSpec();

  const columnSelectorsX = document.querySelectorAll(`.columnSelectorX`);
  const columnSelectorsY = document.querySelectorAll(`.columnSelectorY`);

  let header = [];
  let geneData = [];

  // Check if the provided data is a file or a URL
  if (window.canvas_num !== 0) {
    // For non-GFF data, set the URL for the current track
    const fileURL = URL.createObjectURL(data);
    plotSpec.tracks[button_data_track_number].data.url = fileURL;
    // Remove indexUrl for non-GFF data
    delete plotSpec.tracks[button_data_track_number].data.indexUrl;
  }
  if (window.canvas_num === 0 && data instanceof File) {
    // For GFF data, set up chromosome selector
    await handleChromosomeSelection(data);
}
  if (data instanceof File) {
    if (window.canvas_num === 0) {
      // GFF data
      const geneHeaderResult = await extractGeneHeader(data);
      header = geneHeaderResult.header;
      geneData = geneHeaderResult.data;
      
      plotSpec.tracks.forEach(track => {
        if (!track.data.url || !track.data.indexUrl) {
          console.error('URL or indexURL is not set for a track');
        }
      });
    } else {
      header = await extractHeader(data, button_data_track_number, plotSpec);
    }
  } else if (data instanceof Blob) {
    header = await extractHeaderFromServer(data, button_data_track_number, plotSpec);
  } else {
    let msg = document.getElementById(`msg-load-track-${button_data_track_number}`);
    msg.textContent = "Invalid data type. Expected File or Blob.";
    msg.className = "error-msg";
    console.error("Invalid data type. Expected File or Blob.");
    return;
  }

  if (!fileHeaders.has(button_data_track_number)) {
    fileHeaders.set(button_data_track_number, new Set());
  }

  const columns = fileHeaders.get(button_data_track_number);

  if (!arraysEqual(Array.from(columns), header)) {
    columns.clear();
    header.forEach(column => {
      columns.add(column);
    });

    columnSelectorsX.forEach(columnSelectorX => {
      clearOptions(columnSelectorX);
      header.forEach((column, index) => {
        const optionX = document.createElement('option');
        optionX.value = index;
        optionX.textContent = column;
        columnSelectorX.appendChild(optionX);
      });
    });

    columnSelectorsY.forEach(columnSelectorY => {
      clearOptions(columnSelectorY);
      header.forEach((column, index) => {
        const optionY = document.createElement('option');
        optionY.value = index;
        optionY.textContent = column;
        columnSelectorY.appendChild(optionY);
      });
    });

    // Update the tooltip for each track dynamically based on the available columns
    updateDynamicTooltips(plotSpec, header, button_data_track_number);
  
  }

  columnSelectorsX.forEach(columnSelectorX => {
    columnSelectorX.addEventListener('change', async function () {
      const trackCountValue = document.getElementById("trackCountSelector").value;            
      const selectedValue = columnSelectorX.value;
      const chosenColumnName = columnSelectorX.options[selectedValue].textContent;
  
      for (let trackValue = 0; trackValue < trackCountValue; trackValue++) {
        plotSpec.tracks[trackValue].data.column = chosenColumnName;
        // Only modify tooltips for non-GFF data
        if (window.canvas_num !== 0) { 
          plotSpec.tracks[trackValue].tooltip[1].field = chosenColumnName;
          plotSpec.tracks[trackValue].tooltip[1].alt = chosenColumnName;
          

        }
      }                
      updateURLParameters("x.field", chosenColumnName);
    });
  });

  // Add title updates to Y-axis changes as well
  let columnSelectorL = document.getElementById('columnSelectorYLeft');
  columnSelectorL.addEventListener('change', async function () {
      updateCanvasTitle(plotSpec);
      await _eventsSelectedTracksPerYAxis(columnSelectorL, 'left', plotSpec);
  });

  let columnSelectorR = document.getElementById('columnSelectorYRight');
  columnSelectorR.addEventListener('change', async function () {
      updateCanvasTitle(plotSpec);
      await _eventsSelectedTracksPerYAxis(columnSelectorR, 'right', plotSpec);
  });

  const markButtons = document.querySelectorAll('.mark');
  markButtons.forEach(button => {
      button.addEventListener('change', async function () {
          const trackValue = button.getAttribute('data-track');
          const chosenmark = button.value;
          const plotSpec = getCurrentViewSpec();
          plotSpec.tracks[trackValue].mark = chosenmark;
              await updateURLParameters(`mark${trackValue}`, chosenmark);
      });
  });
  
  const colorButtons = document.querySelectorAll('.color');
  colorButtons.forEach(button => {
      button.addEventListener('change', async function () {
          const trackValue = button.getAttribute('data-track');
          const chosencolor = button.value;
          const plotSpec = getCurrentViewSpec();
          plotSpec.tracks[trackValue].color.value = chosencolor;
              await updateURLParameters(`color.value${trackValue}`, chosencolor);
      });
  });

  const x_interval_buttons = document.querySelectorAll('.x_interval_button');
  x_interval_buttons.forEach(button => {
    button.addEventListener('click', async function () {
      const startValue = document.getElementById('x_range_start').value;
      const endValue = document.getElementById('x_range_end').value;
      const start = parseFloat(startValue);
      const end = parseFloat(endValue);    
      const intervalArray = [start, end];
      plotSpec.xDomain.interval = intervalArray;    
    
      const xDomain = "xDomain.interval";
      updateURLParameters(xDomain, intervalArray);
    });
  });    
  const y_interval_buttons = document.querySelectorAll('.y_interval_button');
  y_interval_buttons.forEach((button, i) => {
    button.addEventListener('click', async function () {
      _eventsSelectedTracksPerYAxis(columnSelectorL, 'left', plotSpec);
      _eventsSelectedTracksPerYAxis(columnSelectorR, 'right', plotSpec);
    });
  });

  const binsizeButtons = document.querySelectorAll('.binsize');
  binsizeButtons.forEach(button => {
    button.addEventListener('click', async function () {
      const trackValue = button.getAttribute('data-track');
      const inputField = document.getElementById(`binsize_${trackValue}`);
      const chosenbinsize = parseFloat(inputField.value);
      const plotSpec = getCurrentViewSpec();
      plotSpec.tracks[trackValue].data.binSize = chosenbinsize;
      const binSize = "data.binSize" + trackValue.toString();
      updateURLParameters(binSize, chosenbinsize);
    });
  });
  
  const samplelengthButtons = document.querySelectorAll('.samplelength');
  samplelengthButtons.forEach(button => {
    button.addEventListener('click', async function () {
      const trackValue = button.getAttribute('data-track');
      const inputField = document.getElementById(`samplelength_${trackValue}`);
      const chosensamplelength = parseFloat(inputField.value);
      const plotSpec = getCurrentViewSpec();
      plotSpec.tracks[trackValue].data.sampleLength = chosensamplelength;
      const sampleLength = "data.sampleLength" + trackValue.toString();
      updateURLParameters(sampleLength, chosensamplelength);
    });
  });

  const marksizeButtons = document.querySelectorAll('.marksize');
  marksizeButtons.forEach(button => {
    button.addEventListener('click', async function () {
      const trackValue = button.getAttribute('data-track');
      const inputField = document.getElementById(`marksize_${trackValue}`);
      const chosenmarksize = parseFloat(inputField.value);
      plotSpec.tracks[trackValue].size.value = chosenmarksize;
      const markSize = "size.value" + trackValue.toString();            
      updateURLParameters(markSize, chosenmarksize);
    });
  });

  let formL = document.getElementById(`checkbox-left-axis`);
  let checkboxesL = formL.querySelectorAll('input[type="checkbox"]');
  checkboxesL.forEach(function(checkbox) {
    checkbox.addEventListener('click', async function() {
      await _eventsSelectedTracksPerYAxis(columnSelectorL, 'left', plotSpec);
    });
    checkbox.addEventListener('change', async function() {
      await _eventsSelectedTracksPerYAxis(columnSelectorL, 'left', plotSpec);
    });
  });
  let formR = document.getElementById(`checkbox-right-axis`);
  let checkboxesR = formR.querySelectorAll('input[type="checkbox"]');
  checkboxesR.forEach(function(checkbox) {
    checkbox.addEventListener('click', async function() {
      await _eventsSelectedTracksPerYAxis(columnSelectorR, 'right', plotSpec);
    });
    checkbox.addEventListener('change', async function() {
      await _eventsSelectedTracksPerYAxis(columnSelectorR, 'right', plotSpec);
    });
  });

  let msg = document.getElementById(`msg-load-track-${button_data_track_number}`);
  msg.textContent = "File loaded successfully";
  msg.className = "success-msg";
}

async function _eventsSelectedTracksPerYAxis(columnSelector, side, plotSpec) {    
  const form = document.getElementById(`checkbox-${side}-axis`);
  const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
  const selectedOptions = [];
  checkboxes.forEach(function(checkbox) {
    selectedOptions.push(parseInt(checkbox.value.slice(-1)));
  });
  const startValue = document.getElementById(`y_start_${side}`).value;
  const endValue = document.getElementById(`y_end_${side}`).value;
  const start = parseFloat(startValue);
  const end = parseFloat(endValue);
  const intervalArray = [start, end];
  const selectedValue = columnSelector.value;
  const chosenColumnName = columnSelector.options[selectedValue].textContent;
  
  selectedOptions.forEach(function(trackValue) {
    const trackIndex = trackValue - 1;
    if (plotSpec.tracks[trackIndex]) {
      if (window.canvas_num !== 0) {
        // For non-GFF data
        plotSpec.tracks[trackIndex].data.value = chosenColumnName;            
        if (!(Number.isNaN(intervalArray[0]) || Number.isNaN(intervalArray[1]))) {
          plotSpec.tracks[trackIndex].y.domain = intervalArray;
        }            
        // plotSpec.tracks[trackIndex].y.axis = side;
        // plotSpec.tracks[trackIndex].y.field = chosenColumnName;
        
        // Ensure tooltip is an array before modifying it
        if (!Array.isArray(plotSpec.tracks[trackIndex].tooltip)) {
          plotSpec.tracks[trackIndex].tooltip = [];
        }
        if (plotSpec.tracks[trackIndex].tooltip[0]) {
          
          plotSpec.tracks[trackIndex].tooltip[0].field = chosenColumnName;
          plotSpec.tracks[trackIndex].tooltip[0].alt = chosenColumnName;
        } else {
          plotSpec.tracks[trackIndex].tooltip[0] = { field: chosenColumnName, alt: chosenColumnName };
        }
      } else {
        // For GFF data, we don't need to modify these properties
        console.log("GFF data: Not modifying y-axis properties");
      }
    } else {
      console.warn(`Track ${trackIndex} does not exist in the plot specification.`);
    }
  });            
  if (side === 'right') {
    updateURLParameters("y.field1", chosenColumnName);
  } else {
    updateURLParameters("y.field0", chosenColumnName);
  }        
}
/**
 * Clear options from a select element.
 * 
 * @param {HTMLSelectElement} selectElement - Select element to clear options from.
 */
function clearOptions(selectElement) {
  while (selectElement.options.length > 0) {
    selectElement.remove(0);
  }
}

/**
 * Check if two arrays are equal.
 * 
 * @param {Array} arr1 - First array.
 * @param {Array} arr2 - Second array.
 * @returns {boolean} - True if arrays are equal, false otherwise.
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

/**
 * Parse a GFF file and extract its header, including specific attributes.
 * 
 * @param {File} file - Local GFF file (gzipped).
 * @returns {Promise<Object>} - Promise resolving to an object containing header and data.
 */
async function extractGeneHeader(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        // Check if file is gzipped by looking at magic numbers
        const buffer = reader.result;
        const bytes = new Uint8Array(buffer);
        let fileContent;

        if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
          // File is gzipped
          fileContent = pako.ungzip(bytes, { to: 'string' });
        } else {
          // File is plain text
          fileContent = new TextDecoder().decode(buffer);
        }

        const lines = fileContent.split('\n');

        const standardHeader = [
          'seqid',
          'source',
          'type',
          'start',
          'end',
          'score',
          'strand',
          'phase',
          'attributes'
        ];

        const additionalHeaders = ['gene_biotype', 'Name', 'ID'];
        const header = [...standardHeader, ...additionalHeaders];

        const data = [];
        let skippedLines = 0;
        let maxEnd = 0;
        let seqId = null;

        for (let line of lines) {
          if (line.trim() === '' || line.startsWith('#')) {
            continue;
          }

          const row = line.split('\t');

          if (row.length === 9) {
            const entry = {};
            standardHeader.forEach((col, index) => {
              entry[col] = row[index];
            });

            // Track maximum end position and sequence ID
            const end = parseInt(entry.end);
            if (end > maxEnd) {
              maxEnd = end;
              seqId = entry.seqid;
            }

            const attributes = row[8].split(';').reduce((acc, attribute) => {
              const [key, ...rest] = attribute.split('=');
              const value = rest.join('=').trim();
              if (key && value) {
                acc[key.trim()] = value;
              }
              return acc;
            }, {});

            additionalHeaders.forEach(attr => {
              entry[attr] = attributes[attr] || 'unknown';
            });

            if (entry['Name'] && entry['Name'].startsWith('ID=')) {
              entry['Name'] = entry['Name'].split('=')[1];
            }

            if (entry['ID'] && entry['ID'].startsWith('ID=')) {
              entry['ID'] = entry['ID'].split('=')[1];
            }

            data.push(entry);
          } else {
            console.warn('Skipping malformed line:', line);
            skippedLines++;
          }
        }

        if (skippedLines > 0) {
          console.warn(`Skipped ${skippedLines} malformed lines.`);
        }
        if (seqId && maxEnd) {
          const paddedMaxEnd = Math.ceil(maxEnd * 1.1);
          if (window.plotSpecManager && typeof window.plotSpecManager.updateAssemblyInfo === 'function') {
            window.plotSpecManager.updateAssemblyInfo(seqId, paddedMaxEnd);
          }
        }

        resolve({ header, data });
      } catch (error) {
        console.error('Error processing file:', error);
        reject(new Error('Error processing GFF file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading GFF file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
/**
 * Extract the header from a local file using FileReader.
 * 
 * @param {File} file - Local file.
 * @param {number} button_data_track_number - Button data track number.
 * @param {object} plotSpec - The plot specification object.
 * @returns {Promise<Array>} - Promise resolving to the extracted header.
 */
async function extractHeader(file, button_data_track_number, plotSpec) {
  let temp = null
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const data = text.split('\n').map(row => row.split(plotSpec.tracks[button_data_track_number].data.separator));
      const header = data[0];
      const posIndex = header.findIndex(column => 
        column.trim().toLowerCase() === 'pos'
      );
      temp = header[0]
      header[0] = header[posIndex]
      header[posIndex] = temp

      resolve(header);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Extract the header from server data using a Blob. 
 * @param {Blob} fileBlob - Blob data from the server.
 * @param {number} button_data_track_number - Button data track number.
 * @param {object} plotSpec - The plot specification object.
 * @returns {Promise<Array>} - Promise resolving to the extracted header.
 */
async function extractHeaderFromServer(fileBlob, button_data_track_number, plotSpec) {
  try {
    const text = await new Response(fileBlob).text();
    const data = text.split('\n').map(row => row.split(plotSpec.tracks[button_data_track_number].data.separator));
    const header = data[0];
    return header;
  } catch (error) {
    console.error('Error fetching or processing data:', error);
    return null;
  }
}

/**
 * Update URL parameters with a new parameter and its value.
 * 
 * @param {string} parameter - Parameter name.
 * @param {string|number} value - Parameter value.
 */
export async function updateURLParameters(parameter, value) {
  var url = new window.URL(document.location);
  url.searchParams.set(parameter, value);
  history.pushState({}, '', url);
}

/**
 * Function to update tooltips dynamically based on available columns in the data file.
 * @param {Object} plotSpec - The current plot specification object.
 * @param {Array} header - List of column headers extracted from the data file.
 * @param {number} button_data_track_number - Button data track number.
 */
function updateDynamicTooltips(plotSpec, header, button_data_track_number) {
    // Store headers per canvas and track
    if (!window.tooltipHeaders) {
        window.tooltipHeaders = {
            0: {},
            1: {},
            2: {},
            3: {} 
        };
    }

    // Store headers for this specific canvas and track
    window.tooltipHeaders[window.canvas_num][button_data_track_number] = header.map(item => 
        item.trim().replace(/\r$/, '')
    );

    // Only update the specific track's tooltip
    if (plotSpec.tracks[button_data_track_number]) {
        if (window.canvas_num === 0) {
            // For GFF data
            plotSpec.tracks[button_data_track_number].tooltip = [
                { field: "start", type: "quantitative", alt: "Start" },
                { field: "end", type: "quantitative", alt: "End" },
                { field: "strand", type: "nominal", alt: "Strand" },
                { field: "type", type: "nominal", alt: "Feature Type" },
                { field: "gene_biotype", type: "nominal", alt: "Gene Biotype" },
                { field: "ID", type: "nominal", alt: "Gene ID" }
            ];
        } else {
            // For CSV/TSV data, use stored headers for this specific track
            const trackHeaders = window.tooltipHeaders[window.canvas_num][button_data_track_number];
            plotSpec.tracks[button_data_track_number].tooltip = trackHeaders.map(column => ({
                field: column,
                type: 'nominal',
                alt: column
            }));
        }
    }
}

async function handleChromosomeSelection(file) {
  try {
      // Load gene data if not already loaded or if new file
      if (!window.geneData || window.canvas_states[0].chromosomeData?.currentFile !== file.name) {
          const { data } = await extractGeneHeader(file);
          window.geneData = data;
          
          // Store chromosome data in canvas state
          const chromosomeInfo = window.geneData.reduce((acc, entry) => {
              const seqid = entry.seqid;
              const end = parseInt(entry.end);
              if (!acc[seqid] || end > acc[seqid]) {
                  acc[seqid] = end;
              }
              return acc;
          }, {});

          window.canvas_states[0].chromosomeData = {
              data: window.geneData,
              currentFile: file.name,
              options: chromosomeInfo
          };

          const chromosomeSelect = document.getElementById('chromosomeSelect');
          if (!chromosomeSelect) {
              throw new Error('Chromosome select element not found');
          }

          // Update dropdown
          updateChromosomeSelect(chromosomeInfo, chromosomeSelect);

          // Remove old event listeners
          const newSelect = chromosomeSelect.cloneNode(true);
          chromosomeSelect.parentNode.replaceChild(newSelect, chromosomeSelect);

          // Add new event listener
          newSelect.addEventListener('change', async function() {
              try {
                  const selectedChromosome = this.value;
                  const maxPosition = chromosomeInfo[selectedChromosome];

                  if (!maxPosition) {
                      throw new Error(`No position data found for chromosome ${selectedChromosome}`);
                  }

                  // Store current selection
                  localStorage.setItem('lastChromosomeSelection', selectedChromosome);
                  
                  await updateChromosomeView(selectedChromosome, maxPosition);
                  
              } catch (error) {
                  console.error('Error in chromosome selection change handler:', error);
              }
          });

          // Select first chromosome or restore previous selection
          const lastSelection = localStorage.getItem('lastChromosomeSelection');
          if (lastSelection && chromosomeInfo[lastSelection]) {
              newSelect.value = lastSelection;
          } else {
              newSelect.value = Object.keys(chromosomeInfo)[0];
          }
          newSelect.dispatchEvent(new Event('change'));
      }

  } catch (error) {
      console.error('Error in handleChromosomeSelection:', error);
      throw error;
  }
}

export function updateChromosomeSelect(chromosomeInfo, selectElement) {
  selectElement.innerHTML = '<option value="" disabled selected>Select chromosome</option>';
  Object.keys(chromosomeInfo).forEach(chromosome => {
      if (chromosome?.trim()) {
          const option = document.createElement('option');
          option.value = chromosome;
          option.textContent = /^(chr)?([0-9]+|[XY]|MT)$/i.test(chromosome) 
              ? `Chromosome ${chromosome}`
              : `ID: ${chromosome}`;
          selectElement.appendChild(option);
      }
  });
}

export async function updateChromosomeView(selectedChromosome, maxPosition) {
  try {
      const plotSpec = window.plotSpecManager.getPlotSpec();
      
      // Store current selection
      window.currentAssemblyInfo = {
          seqid: selectedChromosome,
          length: maxPosition
      };

      // Only update canvas0 view
      if (plotSpec.views[0]) {
          // Update assembly info for canvas0 only
          plotSpec.views[0].assembly = [[selectedChromosome, maxPosition]];
          plotSpec.views[0].xDomain = {
              chromosome: selectedChromosome,
              interval: [0, maxPosition]
          };

          // Update tracks for canvas0 only
          plotSpec.views[0].tracks?.forEach(track => {
              if (!track.data) track.data = {};
              track.data = {
                  ...track.data,
                  type: 'gff',
                  url: window.fileURLs.gff,
                  indexUrl: window.fileURLs.index,
                  chromosomeId: selectedChromosome
              };
          });
      }

      // Update state
      window.plotSpecManager.updateAssemblyInfo(selectedChromosome, maxPosition);
      
      // Save current chromosome info
      localStorage.setItem('lastChromosomeSelection', selectedChromosome);
            
  } catch (error) {
      console.error('Error in updateChromosomeView:', error);
      throw error;
  }
}