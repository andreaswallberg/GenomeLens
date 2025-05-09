/**
 * @fileoverview Track management module for InfraVIS visualization
 * Handles track creation, deletion, settings management and UI interactions
 * @module track
 */

import { URLfromFile, URLfromServer, GoslingPlotWithLocalData, getCurrentViewSpec } from './plot.js';
import { updateURLParameters, updateChromosomeView } from './update_plot_specifications.js';

/**
 * Resets track settings to their default values
 * @param {number} trackNumber - Index of the track to reset
 */
export function resetTrackSettings (trackNumber) {
  document.getElementById(`binsize_${trackNumber}`).value = '';
  document.getElementById(`samplelength_${trackNumber}`).value = '';
  document.getElementById(`marksize_${trackNumber}`).value = '';
  document.getElementById(`mark_${trackNumber}`).selectedIndex = 0;
  document.getElementById(`color_${trackNumber}`).selectedIndex = 0;
  const plotSpec = getCurrentViewSpec();
  if(plotSpec.tracks[trackNumber].data.url !== '') {
    document.getElementById(`filename-display-${trackNumber}`).textContent = 'No file selected';
    window.canvas_states[window.canvas_num].filenames[trackNumber] = 'No file selected';
  }
  plotSpec.tracks[trackNumber].data.url = ''
  plotSpec.tracks[trackNumber].data.binSize = 10;
  plotSpec.tracks[trackNumber].data.sampleLength = 1000;
  plotSpec.tracks[trackNumber].size.value = 3;
  plotSpec.tracks[trackNumber].mark = 'point';
  plotSpec.tracks[trackNumber].color.value = '#e41a1c';
  // Apply changes and update the UI
  updateURLParameters(`data.binSize${trackNumber}`, 0);
  updateURLParameters(`data.sampleLength${trackNumber}`, 0);
  updateURLParameters(`size.value${trackNumber}`, 0);
  updateURLParameters(`mark${trackNumber}`, 'point');
  updateURLParameters(`color.value${trackNumber}`, '#e41a1c');
  GoslingPlotWithLocalData(window.canvas_num);
}

/**
 * Updates the track count and refreshes the track display
 * @returns {Promise<void>}
 */
export async function updateTrackNumber () {
  const currentCanvasState = window.canvas_states[window.canvas_num];
  if (window.canvas_num !== 0) {
    currentCanvasState.trackCount++;
    if (currentCanvasState.trackCount > 5) currentCanvasState.trackCount = 5;
    else {
        document.getElementById("trackCountSelector").value = currentCanvasState.trackCount;
        generateTracks();
    }
  }

}

/**
 * Generates and renders track elements based on the current track count
 * @returns {Promise<void>}
 */
export async function generateTracks () {
    let currentCanvasState = window.canvas_states[window.canvas_num];
    const trackCount = currentCanvasState.trackCount;
    const container = document.getElementById("container");
    let htmlContent = '';
    for (let i = 0; i < trackCount; i++) { 
        htmlContent += `
            <div id="track${i}" class="track-container">
                ${await generateTrackBinAndSampleInputs(i)}
            </div>
        `; 
    }
    container.innerHTML = '';    
    container.innerHTML += htmlContent;        
    htmlContent = '';
    for (let i = 0; i < trackCount; i++) {
        
        htmlContent += `<option value="${i}">Track ${i + 1}</option>`;
        
    } 
    const trackSelector = document.getElementById("trackSelector");
    trackSelector.innerHTML = '';
    trackSelector.innerHTML += htmlContent;          
    // Updating colors
    for (let i = 0; i < trackCount; i++) {
        const defaultColor = document.getElementById(`color_${i}`);
        if(defaultColor){
            await updateURLParameters(`color.value${i}`, defaultColor.value);  
        }
    }
    // Updating axis-controllers
    let axisFormLeft = document.getElementById('checkbox-left-axis');
    let axisFormRight = document.getElementById('checkbox-right-axis');
    let dataLoad = document.getElementById('data-load');
    axisFormLeft.innerHTML = '';
    axisFormRight.innerHTML = '';
    dataLoad.innerHTML = ''; 
    for (let i = 0; i < trackCount; i++) {  
        axisFormLeft.innerHTML += `
        <div class="y-checkbox-option">    
            <input class="y-checkbox-option" type="checkbox" id="track${i}-left" name="option" value="Track ${i + 1}" checked>
            <label for="track${i}-left">Track ${i + 1}</label><br>
        </div>`;
        axisFormRight.innerHTML += `<div class="y-checkbox-option">    
        <input class="y-checkbox-option" type="checkbox" id="track${i}-right" name="option" value="Track ${i + 1}">
        <label for="track${i}-right">Track ${i + 1}</label><br>
        </div>`;
        dataLoad.innerHTML += `
        <div id="track${i}" class="track-container">
            <div class="btn-row">
                <h2>Track ${i + 1}</h2>        
                <span id="clear_settings_button${i}" class="clear_settings_button">Clear settings <i class="fa fa-times-circle" style="font-size:18px;"></i></span>
            </div>
        <div id="data-load" class="btn-row">
        <div class=file-container>
            <button class="plot-button" data-track="${i}"><i class="fa fa-upload" style="font-size:18px;"></i> Select file </button> 
            <input type="file" class="file-input"   multiple accept=".csv, .tsv, .gz, .tbi, .gff" style="display: none;">
            <label for="urlinput_${i}" class='or-inbetween'>OR</label>
            <input data-description-id="enterURL" type="url" id="urlinput_${i}" class="url-input" placeholder="Enter URL">
            <button class="url-button" data-track="${i}">Load</button>
            <label class="success-msg" id="msg-load-track-${i}"></label>
        </div>
        </div>
        ${await generateTrackBinAndSampleInputs(i)}                                
    </div>`;
    }
    dataLoad.innerHTML += `<div id="container"></div>`;
    // Get all checkboxes
    const leftCheckboxes = document.querySelectorAll('#checkbox-left-axis input[type="checkbox"]');
    const rightCheckboxes = document.querySelectorAll('#checkbox-right-axis input[type="checkbox"]');
    // Add event listeners to left checkboxes
    leftCheckboxes.forEach(leftCheckbox => {
        leftCheckbox.addEventListener('change', function () {
            const correspondingCheckbox = document.getElementById(this.id.replace('-left', '-right'));
            correspondingCheckbox.checked = !this.checked;            
        });
    });
    // Add event listeners to right checkboxes
    rightCheckboxes.forEach(rightCheckbox => {
        rightCheckbox.addEventListener('change', function () {
            const correspondingCheckbox = document.getElementById(this.id.replace('-right', '-left'));
            correspondingCheckbox.checked = !this.checked;            
        });
    });

    document.querySelectorAll('[data-description-id]').forEach(element => {
      const descriptionId = element.getAttribute('data-description-id');
      const description = tooltips[descriptionId];
  
      element.addEventListener('mouseenter', function() {
        showTooltip(element, description);
      });
  
      element.addEventListener('mouseleave', function() {
        hideTooltip(element);
      });
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await track_settings_btns(trackCount);  
    await showHideTracks();
}

/**
 * Creates a tooltip element with the given description
 * @param {HTMLElement} element - Element to attach tooltip to
 * @param {string} description - Text content for tooltip
 */
function showTooltip(element, description) {
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'custom-tooltip';
  tooltip.innerText = description;

  document.body.appendChild(tooltip);

  // Position the tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.left = rect.left + window.pageXOffset + 'px';
  tooltip.style.top = rect.top + window.pageYOffset - tooltip.offsetHeight + 'px';

  element._tooltip = tooltip;
}

/**
 * Removes the tooltip from the given element
 * @param {HTMLElement} element - Element containing tooltip
 */
function hideTooltip(element) {
  if (element._tooltip) {
    document.body.removeChild(element._tooltip);
    delete element._tooltip;
  }
}

// Ensure the Add Track button triggers the track count update
window.onload = function () {
  document.getElementById('add_track_button').addEventListener('click', updateTrackNumber);
}
// Show or hide tracks based on the selected track
export async function showHideTracks () {
  const currentCanvasState = window.canvas_states[window.canvas_num];
  const trackCount = currentCanvasState.trackCount;
  const selected = document.getElementById('trackSelector').value;
  for (let i = 0; i < trackCount; i++) {
      let trackContainer = document.getElementById(`track${i}`);
      if (trackContainer) {
          if (i == selected) {
              trackContainer.style.display = 'block';
          } 
      }
  }
}

const tooltips = {
  binsize: 'Bin size controls the width of genomic intervals (bp) used to aggregate and display data. Small bin sizes show more detail but can be slower to render. (default=10)',
  samplelength: 'Sample size sets how many data points are sampled and rendered at once. (default=1000)',
  mark: 'Choose the marker type for the visualization. (default=point)',
  color: 'Select the color for the plots. (default=blue)',
  marksize: 'Specify the size of the markers. (default=3)',
  file:"File name",
  enterURL: "To fetch data remotely from a URL"
};

/**
 * Generates HTML for input fields related to bin size and sample length for a track.
 * @param {number} trackNumber - The number of the track.
 * @returns {string} - The HTML content for bin and sample inputs.
 */
export async function generateTrackBinAndSampleInputs(trackNumber) {
        const isCanvas0 = window.canvas_num === 0;
    
    if (isCanvas0) {
        const chromosomeData = window.canvas_states[0].chromosomeData;
        return `
            <div class="btn-row" id="chromosome-selector">
                <h2>Sequence selection (e.g. chromosome, scaffold or contig)</h2>
                <div class="column-container">
                    <select id="chromosomeSelect" class="chromosome-select">
                        <option  value="" disabled selected>Select sequence</option>
                        ${chromosomeData ? Object.keys(chromosomeData.options).map(chromosome => `
                            <option value="${chromosome}">${/^(chr)?([0-9]+|[XY]|MT)$/i.test(chromosome) 
                                ? `Chromosome ${chromosome}`
                                : `ID: ${chromosome}`}</option>
                        `).join('') : ''}
                    </select>
                    <button id="apply-chromosome" class="apply-button">Apply</button>
                </div>
            </div>`;
    }
    const fileNames = window.canvas_states[window.canvas_num].filenames[trackNumber];
  
    let displayName = "No file selected";
  
    if (isCanvas0 && fileNames && typeof fileNames === 'object') {
      const dataName = fileNames.data || "Missing .gz";
      const indexName = fileNames.index || "Missing .tbi";
      displayName = `${dataName}, ${indexName}`;
    } else if (!isCanvas0 && typeof fileNames === 'string') {
      displayName = fileNames;
    }
    if (!isCanvas0){
      return `
      <div class='bin-sample-container track-${trackNumber}'> 
              <div class="file-info" data-description-id="file">
                File: <span class='filename-display'  id="filename-display-${trackNumber}">${displayName}</span>
              </div>
          <div class="btn-row" id ='inner-container'>
            <div class="left-side">
  
              <div class="input-group">
              <label for="binsize_${trackNumber}" data-description-id="binsize">Bin size</label>
                  <input type="number" class="interval-input" name="binsize" id="binsize_${trackNumber}" value="10">
              </div>
              <div class="input-group">
              <label for="samplelength_${trackNumber}" data-description-id="samplelength">Sample size</label>
                <input type="number" class="interval-input" name="samplelength" id="samplelength_${trackNumber}" value="1000">
              </div>
              <div class="input-group"> 
                <label for="mark_${trackNumber}" data-description-id="mark">Marker type</label>
                <select name="mark" id="mark_${trackNumber}" class="mark" data-track="${trackNumber}" >
                    <option  value="point">point</option>
                    <option value="line">line</option>
                    <option value="area">area</option>
                    <option value="rect">rect</option>
                    <option value="triangleRight">triangle R</option>
                    <option value="triangleLeft">triangle L</option>
                </select>
              </div>
            </div>
            <div class="right-side">
                  <div class="input-group"> 
                      <label for="color_${trackNumber}" data-description-id="color">Color</label>
                      <select name="color" id="color_${trackNumber}" class="color" data-track="${trackNumber}">
                          <option value="#00aade"${trackNumber === 0 ? " selected" : ""}>blue</option>
                          <option value="#6acfec"${trackNumber === 1 ? " selected" : ""}>light-blue</option>
                          <option value="#006888"${trackNumber === 2 ? " selected" : ""}>dark-blue</option>
                          <option value="#e6461d"${trackNumber === 3 ? " selected" : ""}>red</option>
                          <option value="#ec866a"${trackNumber === 4 ? " selected" : ""}>light-red</option>
                          <option value="#c02700"${trackNumber === 5 ? " selected" : ""}>dark-red</option>
                          <option value="#6acc0a"${trackNumber === 6 ? " selected" : ""}>green</option>
                          <option value="#aef766"${trackNumber === 7 ? " selected" : ""}>light-green</option>
                          <option value="#52a302"${trackNumber === 8 ? " selected" : ""}>dark-green</option>
                          <option value="#f9da02"${trackNumber === 9 ? " selected" : ""}>yellow</option>
                          <option value="#9c41bf"${trackNumber === 10 ? " selected" : ""}>purple</option>
                          <option value="#ff7f00"${trackNumber === 11 ? " selected" : ""}>orange</option>
                          <option value="#000000"${trackNumber === 12 ? " selected" : ""}>black</option>
                          <option value="#a7b0b7"${trackNumber === 13 ? " selected" : ""}>grey</option>
                          <option value="#d2d8dc"${trackNumber === 14 ? " selected" : ""}>light-grey</option>
                          <option value="#758087"${trackNumber === 15 ? " selected" : ""}>dark-grey</option>
                          <option value="#ffffff"${trackNumber === 16 ? " selected" : ""}>white</option>
                      </select>
                  </div>
                  <div class="input-group">
                      <label for="marksize_${trackNumber}" data-description-id="marksize">Mark size</label>
                      <input name="size" type="number" class="interval-input" id="marksize_${trackNumber}" data-track="${trackNumber}" value = "3">
                  </div>
                  <div class="input-group"> 
                      <button class="apply-button" data-track="${trackNumber}">Apply</button>
                      <button class="delete-track-button" data-track="${trackNumber}" aria-label="Close"><i class="fa fa-trash"></i></button>
                  </div>
              </div>
          </div>
      </div>`
    } else{
      return ``
    }

  }
/**
 * Deletes a track and updates the visualization
 * @param {number} trackToDelete - Index of track to remove
 * @returns {Promise<void>}
 */
export async function deleteTrack (trackToDelete) {
  const currentCanvasState = window.canvas_states[window.canvas_num];
  // Remove the track from the plotSpec
  const plotSpec = getCurrentViewSpec();
  plotSpec.tracks.splice(trackToDelete, 1);

  // Remove the file name from FILENAMES object
  delete window.canvas_states[window.canvas_num].filenames[trackToDelete];

  for (let i = trackToDelete + 1; i < currentCanvasState.trackCount; i++) {
      if (window.canvas_states[window.canvas_num].filenames[i]) {
          window.canvas_states[window.canvas_num].filenames[i - 1] = window.canvas_states[window.canvas_num].filenames[i];
          delete window.canvas_states[window.canvas_num].filenames[i];
      }
  }
  currentCanvasState.trackCount--;
  // Update the UI
  document.getElementById('trackCountSelector').value = currentCanvasState.trackCount;
  await generateTracks();
  await GoslingPlotWithLocalData(window.canvas_num);
  updateURLParameters(`track${trackToDelete}`, null);
}

/**
 * Initialize track settings buttons and event listeners
 * @param {number} trackNumber - Number of tracks to initialize
 * @returns {Promise<void>}
 */
export async function track_settings_btns(trackNumber) {
    const fileInputs = document.querySelectorAll('.file-input');
    
    document.querySelectorAll('.plot-button').forEach(function (button, button_data_track_num) {
      button.addEventListener('click', function () {
        fileInputs[button_data_track_num].click();
      });
    });
  
    // Handle file selection
    fileInputs.forEach(function (fileInput, button_data_track_num) {
      fileInput.addEventListener('change', function () {
        const isCanvas0 = window.canvas_num === 0;
        if (isCanvas0) {
          fileInput.setAttribute('multiple', '');
          fileInput.setAttribute('accept', '.gz, .tbi');
        } else {
          fileInput.removeAttribute('multiple');
          fileInput.setAttribute('accept', '.csv, .tsv');
        }
        URLfromFile(fileInputs, button_data_track_num);
      });
    });
  
    // Load files based on URL input
    document.querySelectorAll('.url-button').forEach(function (urlButton, trackNumber) {
      const urlInput = document.getElementById(`urlinput_${trackNumber}`);  
      urlButton.addEventListener('click', function () {
        URLfromServer(urlInput.value, trackNumber);
      });
    });
  
    // Delete button functionality
    document.querySelectorAll('.delete-track-button').forEach(function (deleteButton) {
      deleteButton.addEventListener('click', async function () {
        const trackToDelete = parseInt(this.getAttribute('data-track'));
        await deleteTrack(trackToDelete);
      });
    });
  
    // Update the mark
    document.querySelectorAll('.mark').forEach(function (markSelector) {
      markSelector.addEventListener('change', async function () {
        const trackValue = this.getAttribute('data-track');
        const chosenMark = this.value;
        const plotSpec = getCurrentViewSpec();
        plotSpec.tracks[trackValue].mark = chosenMark;
        await updateURLParameters(`mark${trackValue}`, chosenMark);
      });
    });
  
    // Update the color
    document.querySelectorAll('.color').forEach(function (colorSelector) {
      colorSelector.addEventListener('change', async function () {
        const trackValue = this.getAttribute('data-track');
        const chosenColor = this.value;
        const plotSpec = getCurrentViewSpec();
        plotSpec.tracks[trackValue].color.value = chosenColor;
        await updateURLParameters(`color.value${trackValue}`, chosenColor);
      });
    });
  
    // Update the mark size
    document.querySelectorAll('.marksize').forEach(function (sizeInput) {
      sizeInput.addEventListener('input', async function () {
        const trackValue = this.getAttribute('data-track');
        const chosenSize = parseFloat(this.value);
        const plotSpec = getCurrentViewSpec();
        plotSpec.tracks[trackValue].size.value = chosenSize;
        await updateURLParameters(`size.value${trackValue}`, chosenSize);
      });
    });
  
    // Apply button functionality
    document.querySelectorAll('.apply-button').forEach(function (applyButton) {
      applyButton.addEventListener('click', async function () {
        const trackNumber = this.getAttribute('data-track');
        const binSizeInput = document.getElementById(`binsize_${trackNumber}`);
        const sampleLengthInput = document.getElementById(`samplelength_${trackNumber}`);
        const markSizeInput = document.getElementById(`marksize_${trackNumber}`);
        const binSize = parseFloat(binSizeInput.value);
        const sampleLength = parseFloat(sampleLengthInput.value);
        const markSize = parseFloat(markSizeInput.value);
        const plotSpec = getCurrentViewSpec();   
        if (!isNaN(binSize)) {
          plotSpec.tracks[trackNumber].data.binSize = binSize;
          await updateURLParameters(`data.binSize${trackNumber}`, binSize);
        }   
        if (!isNaN(sampleLength)) {
          plotSpec.tracks[trackNumber].data.sampleLength = sampleLength;
          await updateURLParameters(`data.sampleLength${trackNumber}`, sampleLength);
        }   
        if (!isNaN(markSize)) {
          plotSpec.tracks[trackNumber].size.value = markSize;
          await updateURLParameters(`size.value${trackNumber}`, markSize);
        }
        await GoslingPlotWithLocalData(window.canvas_num);
      });
    });
  
    // Clear settings functionality
    for (let i = 0; i < trackNumber; i++) {
      let clear_settings_button = document.getElementById(`clear_settings_button${i}`);
      if (clear_settings_button) {
        clear_settings_button.addEventListener('click', function () {
          resetTrackSettings(i);
        });
      }
    }

    // Add chromosome apply button handler
    const applyChromosomeBtn = document.getElementById('apply-chromosome');
    if (applyChromosomeBtn) {
        applyChromosomeBtn.addEventListener('click', async function() {
            const chromosomeSelect = document.getElementById('chromosomeSelect');
            if (!chromosomeSelect) {
                console.error('Chromosome select element not found');
                return;
            }

            const selectedChromosome = chromosomeSelect.value;
            const chromosomeData = window.canvas_states[0].chromosomeData;
            
            if (selectedChromosome && chromosomeData && chromosomeData.options) {
                const maxPosition = chromosomeData.options[selectedChromosome];
                if (maxPosition) {
                    try {
                        localStorage.setItem('lastChromosomeSelection', selectedChromosome);
                        await updateChromosomeView(selectedChromosome, maxPosition);
                        await GoslingPlotWithLocalData();
                        console.log('Successfully updated chromosome view');
                    } catch (error) {
                        console.error('Error applying chromosome selection:', error);
                    }
                }
            } else {
                console.error('Missing required data for chromosome update');
            }
        });
    }
  }
