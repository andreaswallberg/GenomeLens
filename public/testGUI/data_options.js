/**
 * Populates the given container with HTML content for configuring track settings.
 * @param {HTMLElement} container - The container element to populate.
 * @returns {Promise<void>} - A Promise that resolves after the container is populated.
 */

import { GoslingPlotWithLocalData, getCurrentViewSpec } from './plot.js';
import { updateURLParameters } from './update_plot_specifications.js';
import {exportingFigures} from './exporting_functionality.js';
import {generateTracks} from './track.js'

/**
 * Sets up all button functionality and event listeners for the application's GUI.
 * 
 * @async
 * @function all_buttons
 * @param {HTMLElement} container - The DOM element container where the GUI elements will be rendered
 * 
 * @description
 * This function:
 * - Initializes the main GUI layout with canvas and view controls
 * - Sets up canvas switching functionality (Canvas 0-3)
 * - Implements view management (View A-C)
 * - Handles canvas addition through the '+' button
 * - Manages view switching and their respective controls
 * - Sets up export functionality
 * - Initializes track controls and selectors
 * 
 * The function manages several states:
 * - Current active canvas
 * - Current view (1-3)
 * - Canvas object creation states
 * - Display states for various UI elements
 * 
 * @example
 * const container = document.getElementById('main-container');
 * await all_buttons(container);
 */
export async function all_buttons(container) {
    container.innerHTML = `
    <div class="body-container">
        <div class="left-section">
            <div class="canvas"> 
                <button annotation-tooltip="This is mainly for GFF files to display the Chromosomes" id="canvas0" class="canvas-button">Annotations</button>
                <button id="canvas1" class="canvas-button">Canvas 1</button>
                <button id="canvas2" class="canvas-button">Canvas 2</button>
                <button id="canvas3" class="canvas-button">Canvas 3</button>
                <button  add-canvas-tooltip="This button is to add a new canvas up to 3" id="add_canvas" aria-label="Close"> <i class="fa fa-plus"></i></button>
            </div>  
            <div id="notification" style="display: none; color:white;border-radius: 5px ; padding: 10px; opacity:0.7; margin-top: 10px; position: absolute; top: 60px; left: 23%; transform: translateX(-50%); z-index: 1000;"></div>   
            <div id="header" class="buttons-container">   
                <select id="export-dropdown" class="dropdown-content">
                    <option value="" disabled selected>Export as</option>
                    <option id="export-pdf-button" value="pdf">PDF</option>
                    <option id="export-png-button" value="png">PNG</option>
                    <option id="export-html-button" value="html">HTML</option>
                </select> 
                <div class="btn-row">
                    <h2 class='canvas_number'>Annotation canvas</h2>
                    <h2>Track Controls</h2>
                    <span id="clear_url_button" class="clear_all_settings"><u>  Clear All </u></span>                   
                    <button id='add_track_button' class="add_track_button"><i class="fa fa-plus-circle" style="font-size:24px;"></i>Add Track</button>
                    <label for="trackCountSelector"></label>
                    <select id="trackCountSelector" class='trackCountSelector' onchange="generateTracks()">
                        <option value="1" selected>1 Track</option>
                        <option value="2">2 Tracks</option>
                        <option value="3">3 Tracks</option>
                        <option value="4">4 Tracks</option>
                        <option value="5">5 Tracks</option>
                    </select>       
                </div>
                <div class="both_tracks btn-row">
                    <div>
                        <label for="trackSelector"></label>
                        <select id="trackSelector" onchange="showHideTracks()"></select>
                    </div>
                </div>     
                <div id="data-load" class="btn-row">
                    <div id="container"></div> 
                </div>
            </div>
        </div>
        <div class="right-section">
            <div class='bars'> 
                <button view-tooltip="This could be used to compare different canvases with different settings by adding a second view where each view is loaded with its own files or settings" id='view1-btn' class='view-btn'> View A </button>
                <button id='view2-btn' class='view-btn' style='display:none;'> View B </button>
                <button id='view3-btn' class='view-btn' style='display:none;'> View C </button>
                <button id="add_view" aria-label="Close"> <i class="fa fa-plus"></i></button>
            </div>
            ${generateViewControl(window.currentView)}
            <div id="plot-container-1" class="plot-container"></div>

        </div>
    </div>
    `;
    const canvas0 = document.getElementById('canvas0');
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const canvas3 = document.getElementById('canvas3');
    const view_control = document.querySelector('.view-control');
    const canvas_number = document.querySelector('.canvas_number');
    const add_canvas = document.getElementById('add_canvas');
    const add_view = document.getElementById('add_view');
    const view1_btn = document.getElementById('view1-btn');
    const view2_btn = document.getElementById('view2-btn');
    const view3_btn = document.getElementById('view3-btn');
    const current_canvas = document.querySelector('.current-canvas')
    //Adding views functionality
    document.querySelector('.canvas-container').style.display = 'none';
    
    add_view.addEventListener('click', function(){
        if(currentView === 1) {                       
            view2_btn.style.display = 'block';
            window.currentView = 2
            view_control.innerHTML = 'View Controls B'
            updateViewSettings(2);
            setActiveViews(view2_btn);
        } else if(currentView === 2) {
            view_control.innerHTML = 'View Controls C'
            view3_btn.style.display = 'block';
            window.currentView = 3
            updateViewSettings(3);
            setActiveViews(view3_btn);
            this.style.cursor = 'not-allowed';
            this.disabled = true;
        }    
    })
    // Set Canvas 0 as active by default
    canvas0.classList.add('active');
    view1_btn.classList.add('active');
    // Adding canvases
    add_canvas.addEventListener('click', function () {
        if (displayed_canvas === 0) {
            canvas2.style.display = 'block';
            displayed_canvas = 1;
            window.canvas_num = 1;
            canvas_number.innerHTML = 'Canvas 1';
            current_canvas.innerHTML = 'Current Canvas 1'
            if (!window.object_1_created) {
                addOrUpdateCanvasObject('canvas1');
                window.object_1_created = true;
                view2_btn.style.display = 'block';
                window.currentView = 1
                view_control.innerHTML = 'View Controls A'
                updateViewSettings(1);
                setActiveViews(view1_btn);
            }
            setActiveCanvas(canvas1);
            updateCanvasUI();
        }
        if (displayed_canvas === 1) {
            canvas2.style.display = 'block';
            displayed_canvas = 2;
            window.canvas_num = 2;
            canvas_number.innerHTML = 'Canvas 2';
            current_canvas.innerHTML = 'Current Canvas 2'
            if (!window.object_2_created) {
                addOrUpdateCanvasObject('canvas2');
                window.object_2_created = true;
            }
            setActiveCanvas(canvas2);
            updateCanvasUI();
        }
        // if there is already canvas 2
        else if (displayed_canvas === 2) {
            canvas3.style.display = 'block';
            window.canvas_num = 3;
            displayed_canvas = 3;
            canvas_number.innerHTML = 'Canvas 3';
            current_canvas.innerHTML = 'Current Canvas 3'
            if (!window.object_3_created) {
                addOrUpdateCanvasObject('canvas3');
                window.object_3_created = true
            }
            updateCanvasUI();
            setActiveCanvas(canvas3);
            this.style.cursor = 'not-allowed';
            this.disabled = true;
        }
    })

    canvas0.addEventListener('click', function () {
        setActiveCanvas(canvas0);
        window.canvas_num = 0;
        canvas_number.innerHTML = 'Gene Canvas';
        current_canvas.innerHTML = 'Current Canvas Gene';
        
        // Hide add track button and track selector for annotation canvas
        document.getElementById('add_track_button').style.display = 'none';
        document.getElementById('trackCountSelector').style.display = 'none';
    
        // Restore chromosome selector and trigger rerender
        const chromosomeData = window.canvas_states[0].chromosomeData;
        if (chromosomeData) {
            const chromosomeSelect = document.getElementById('chromosomeSelect');
            if (chromosomeSelect) {
                // Restore dropdown options
                updateChromosomeSelect(chromosomeData.options, chromosomeSelect);
                
                // Get last selected chromosome
                const lastSelection = localStorage.getItem('lastChromosomeSelection');
                if (lastSelection && chromosomeData.options[lastSelection]) {
                    chromosomeSelect.value = lastSelection;
                    // Force rerender with stored chromosome
                    const maxPosition = chromosomeData.options[lastSelection];
                    updateChromosomeView(lastSelection, maxPosition)
                        .then(() => {
                            console.log('Successfully restored chromosome view');
                        })
                        .catch(error => {
                            console.error('Error restoring chromosome view:', error);
                        });
                }
            }
        }
    
        document.querySelector('.canvas-container').style.display = 'none';
        updateCanvasUI();
    });
    // Making canvas1 active
    canvas1.addEventListener('click', function () {
        setActiveCanvas(canvas1);
        window.canvas_num = 1;
        canvas_number.innerHTML = 'Canvas 1';
        current_canvas.innerHTML = 'Current Canvas 1';
        
        // Show add track button and track selector for regular canvas
        document.getElementById('add_track_button').style.display = 'block';
        document.getElementById('trackCountSelector').style.display = 'block';
        
        if (!window.object_1_created) {
            addOrUpdateCanvasObject('canvas1');
            window.object_1_created = true;
        }
        document.querySelector('.canvas-container').style.display = 'block';

        updateCanvasUI();
    });
    // Making canvas2 active
    canvas2.addEventListener('click', function () {
        setActiveCanvas(canvas2);
        window.canvas_num = 2;
        canvas_number.innerHTML = 'Canvas 2';
        current_canvas.innerHTML = 'Current Canvas 2';
        
        // Show add track button and track selector for regular canvas
        document.getElementById('add_track_button').style.display = 'block';
        document.getElementById('trackCountSelector').style.display = 'block';
        
        if (!window.object_2_created) {
            addOrUpdateCanvasObject('canvas2');
            window.object_2_created = true;
        }
        document.querySelector('.canvas-container').style.display = 'block';

        updateCanvasUI();
    });
    // Making canvas3 active
    canvas3.addEventListener('click', function () {
        setActiveCanvas(canvas3);
        window.canvas_num = 3;
        canvas_number.innerHTML = 'Canvas 3';
        current_canvas.innerHTML = 'Current Canvas 3';
        
        // Show add track button and track selector for regular canvas
        document.getElementById('add_track_button').style.display = 'block';
        document.getElementById('trackCountSelector').style.display = 'block';
        
        if (!window.object_3_created) {
            addOrUpdateCanvasObject('canvas3');
            window.object_3_created = true;
        }
        document.querySelector('.canvas-container').style.display = 'block';

        updateCanvasUI();
    });

    // Switching between views functionality
    view1_btn.addEventListener('click', async function () {
        window.currentView = 1;
        view_control.innerHTML = 'View Controls A';
        setActiveViews(view1_btn);
        await loadAndApplyViewSettings(1);
    });
    
    view2_btn.addEventListener('click', async function () {
        window.currentView = 2;
        view_control.innerHTML = 'View Controls B';
        setActiveViews(view2_btn);
        await loadAndApplyViewSettings(2);
    });
    
    view3_btn.addEventListener('click', async function () {
        window.currentView = 3;
        view_control.innerHTML = 'View Controls C';
        setActiveViews(view3_btn);
        await loadAndApplyViewSettings(3);
    });
    // Add the toggle effect for the initial canvas container
    addCanvasBarToggle('canvas-bar-1', 'canvas-container-1');
    exportingFigures();
    view_control_apply_changes()
}

/**
 * To change the active canvas, the canvas that is passed in as param will be active. 
 * @param {activeCanvas} activeCanvas 
 */
export function setActiveCanvas(activeCanvas) {
    const canvasButtons = document.querySelectorAll('.canvas-button');
    canvasButtons.forEach(button => button.classList.remove('active'));
    activeCanvas.classList.add('active');
}

/**
 * To change the active view, the views that is passed in as param will be active. 
 * @param {activeViews} activeViews 
 */
export function setActiveViews(activeViews) {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => button.classList.remove('active'));
    activeViews.classList.add('active');
}
/**
 * To update the UI after each change.
 */
export function updateCanvasUI() {
    const currentCanvasState = window.canvas_states[window.canvas_num];
    document.getElementById('trackCountSelector').value = currentCanvasState.trackCount;
    generateTracks();
}
// Add or update a canvas object with the given ID
export function addOrUpdateCanvasObject(canvasId) {
    const canvas_container = document.createElement('div');
    canvas_container.id = `canvas-container-${canvasId}-${currentView}`;
    const newCanvasObject = {
        id: canvasId,
        title: `Canvas ${canvasId.slice(-1)}`,
        static: false,
        xDomain: { interval: [0, 200000] },
        alignment: "overlay",
        width: 1000,
        height: 200,
        assembly: "unknown",
        linkingId: "detail",
        style: {
            background: "#D3D3D3",
            backgroundOpacity: 0.1,
        },
        tracks: [
            window.plotSpecManager.createTrack(),
            window.plotSpecManager.createTrack(),
            window.plotSpecManager.createTrack(),
            window.plotSpecManager.createTrack(),
            window.plotSpecManager.createTrack(),
        ],
    };
    
    // Generate new canvas with the new ID.
    window.plotSpecManager.generateCanvas(canvasId, newCanvasObject);
}
// the toggle effect for the canvas bar
export function addCanvasBarToggle(barId, containerId) {
    const canvasBar = document.getElementById(barId);
    const canvasContainer = document.getElementById(containerId);
    if (canvasBar && canvasContainer) {
        canvasBar.addEventListener('click', () => {
            const canvasContent = canvasContainer.querySelector('.canvas_content');
         
            if (canvasContent) {
                canvasContent.classList.toggle('hidden');
            }
        });
    }
    // Add event listener to the clear all settings button
    const clearAllSettingsButton = document.querySelector('#clear_url_button');
    if (clearAllSettingsButton) {
        clearAllSettingsButton.addEventListener('click', () => {
            // Clear FILENAMES object
            window.canvas_states[1].filenames = {};
            window.canvas_states[2].filenames = {};
            window.canvas_states[3].filenames = {};
            
            // Clear other settings
            updateURLParameters("xDomain.interval", [0, 200000]);  
            // Reset canvas states
            for (let i = 1; i <= 3; i++) {
                window.canvas_states[i] = {
                    trackCount: 1,
                    tracks: [],
                    view_control_settings: {
                        x_axis: '',
                        x_range: [0, 200000],
                        left_y_axis: '',
                        left_y_range: [0, 1],
                        right_y_axis: '',
                        right_y_range: [0, 1]
                    }
                };
            }     
            // Reload the page
            location.reload();
        });
    }
}
/**
 * It will generate the default settings for the view control, when a new view is generated
 * @param {view} view 
 */
export function updateViewSettings(view) {
    resetViewSettings();  // Reset fields before loading new settings
    const settings = window.canvas_states[view].view_control_settings;
    // Update X-axis
    document.getElementById('x_range_start').value = settings.x_range[0] || '';
    document.getElementById('x_range_end').value = settings.x_range[1] || '';
    document.getElementById('columnSelectorX_0').value = settings.x_axis || '';

    // Update Left Y-axis
    document.getElementById('y_start_left').value = settings.left_y_range[0] || '';
    document.getElementById('y_end_left').value = settings.left_y_range[1] || '';
    document.getElementById('columnSelectorYLeft').value = settings.left_y_axis || '';

    // Update Right Y-axis
    document.getElementById('y_start_right').value = settings.right_y_range[0] || '';
    document.getElementById('y_end_right').value = settings.right_y_range[1] || '';
    document.getElementById('columnSelectorYRight').value = settings.right_y_axis || '';

    // Restore checked boxes for left axis
    const leftCheckboxes = document.querySelectorAll('#checkbox-left-axis input[type="checkbox"]');
    leftCheckboxes.forEach(checkbox => {
        checkbox.checked = settings.checked_left.includes(checkbox.id);
    });

    // Restore checked boxes for right axis
    const rightCheckboxes = document.querySelectorAll('#checkbox-right-axis input[type="checkbox"]');
    rightCheckboxes.forEach(checkbox => {
        checkbox.checked = settings.checked_right.includes(checkbox.id);
    });

}

// Reset all input fields to default or blank
export function resetViewSettings() {
    document.getElementById('x_range_start').value = '';
    document.getElementById('x_range_end').value = '';
    document.getElementById('columnSelectorX_0').value = '';

    document.getElementById('y_start_left').value = '';
    document.getElementById('y_end_left').value = '';
    document.getElementById('columnSelectorYLeft').value = '';

    document.getElementById('y_start_right').value = '';
    document.getElementById('y_end_right').value = '';
    document.getElementById('columnSelectorYRight').value = '';

    const leftCheckboxes = document.querySelectorAll('#checkbox-left-axis input[type="checkbox"]');
    leftCheckboxes.forEach(checkbox => checkbox.checked = false);

    const rightCheckboxes = document.querySelectorAll('#checkbox-right-axis input[type="checkbox"]');
    rightCheckboxes.forEach(checkbox => checkbox.checked = false);
}

/**
 * To fetch and preserve the settings for each view. 
 */
export function view_control_apply_changes () {
     // Add event listener to the apply all button for the canvas
     document.querySelector('.apply-all-button').addEventListener('click', async function () {     
        const currentView = window.currentView;
        const currentCanvasState = window.canvas_states[currentView];    
        // X-axis range
        const x_start = parseFloat(document.getElementById('x_range_start').value);
        const x_end = parseFloat(document.getElementById('x_range_end').value);
        let x_interval = [x_start, x_end];  
        if(isNaN(x_start) && isNaN(x_end)) {
            x_interval = [0, 200000];
        }
        // Left Y-axis range
        const y_start_left = parseFloat(document.getElementById('y_start_left').value);
        const y_end_left = parseFloat(document.getElementById('y_end_left').value);
        let y_interval_left = [y_start_left, y_end_left];
        if(isNaN(y_start_left) && isNaN(y_end_left)) {
            y_interval_left = [0, 1];
        }
        // Right Y-axis range
        const y_start_right = parseFloat(document.getElementById('y_start_right').value);
        const y_end_right = parseFloat(document.getElementById('y_end_right').value);
        let y_interval_right = [y_start_right, y_end_right];
        if(isNaN(y_start_right) && isNaN(y_end_right)) {
            y_interval_right = [0, 1];
        }
        // Update the current view's settings
        currentCanvasState.view_control_settings.x_range = x_interval;
        currentCanvasState.view_control_settings.left_y_range = y_interval_left;
        currentCanvasState.view_control_settings.right_y_range = y_interval_right;
        currentCanvasState.view_control_settings.x_axis = document.getElementById('columnSelectorX_0').value;
        currentCanvasState.view_control_settings.left_y_axis = document.getElementById('columnSelectorYLeft').value;
        currentCanvasState.view_control_settings.right_y_axis = document.getElementById('columnSelectorYRight').value;
        // Update plot spec and redraw
        const plotSpec = getCurrentViewSpec();
        plotSpec.xDomain.interval = currentCanvasState.view_control_settings.x_range;
        // To update the checkboxes for left and right.
        const leftChecked = document.querySelectorAll('#checkbox-left-axis input[type="checkbox"]:checked');
        leftChecked.forEach(function (checkbox) {
            const trackIndex = parseInt(checkbox.value.split(' ')[1]) - 1;
            plotSpec.tracks[trackIndex].y.domain = currentCanvasState.view_control_settings.left_y_range;
            plotSpec.tracks[trackIndex].y.field = document.getElementById('columnSelectorYLeft').options[currentCanvasState.view_control_settings.left_y_axis].textContent
            plotSpec.tracks[trackIndex].y.axis = 'left'
            plotSpec.tracks[trackIndex].x.field = document.getElementById('columnSelectorX_0').options[currentCanvasState.view_control_settings.x_axis].textContent
            currentCanvasState.view_control_settings.checked_left = Array.from(leftChecked).map(checkbox => checkbox.id);
        });
        const rightChecked = document.querySelectorAll('#checkbox-right-axis input[type="checkbox"]:checked');
        rightChecked.forEach(function (checkbox) {
            const trackIndex = parseInt(checkbox.value.split(' ')[1]) - 1;
            plotSpec.tracks[trackIndex].y.domain = currentCanvasState.view_control_settings.right_y_range;
            plotSpec.tracks[trackIndex].y.field = document.getElementById('columnSelectorYRight').options[currentCanvasState.view_control_settings.right_y_axis].textContent
            plotSpec.tracks[trackIndex].y.axis = 'right'
            plotSpec.tracks[trackIndex].x.field = document.getElementById('columnSelectorX_0').options[currentCanvasState.view_control_settings.x_axis].textContent
            currentCanvasState.view_control_settings.checked_right = Array.from(rightChecked).map(checkbox => checkbox.id);
        }); 
        const xRangeSelect = document.getElementById('x_range_select');
        const xRangeStart = document.getElementById('x_range_start');
        const xRangeEnd = document.getElementById('x_range_end');
        xRangeSelect.addEventListener('change', () => {
            const selectedOption = xRangeSelect.value;
            let valueToCopy = '';
    
            if (selectedOption === 'start') {
                valueToCopy = xRangeStart.value;
            } else if (selectedOption === 'end') {
                valueToCopy = xRangeEnd.value;
            }
    
            if (valueToCopy) {
                navigator.clipboard.writeText(valueToCopy)
                    .then(() => {
                        const msg = document.querySelector('.copy_range_msg')
                        msg.style.display = 'block'
                        setTimeout(()=>{
                            msg.style.display = 'none'
                        },2000)
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
            }
        });
        updateURLParameters("columnSelectorX_0", currentCanvasState.view_control_settings.x_axis);
        updateURLParameters("columnSelectorYLeft", currentCanvasState.view_control_settings.left_y_axis);
        updateURLParameters("columnSelectorYRight", currentCanvasState.view_control_settings.right_y_axis);
        updateURLParameters("xDomain.interval", currentCanvasState.view_control_settings.x_range);
        updateURLParameters("yDomain.left", currentCanvasState.view_control_settings.left_y_range);
        updateURLParameters("yDomain.right", currentCanvasState.view_control_settings.right_y_range);
        await GoslingPlotWithLocalData();
    });
}
/**
 * To generate a new view with a paraemter currentview that works as an ID. 
 * @param {int} currentView 
 * @returns 
 */
/**
 * Generates HTML markup for a view control panel that allows users to customize visualization settings
 * @param {string|number} currentView - Identifier for the current view being generated
 * @returns {string} HTML markup string containing:
 * - Canvas container with unique ID based on currentView
 * - X-axis controls (column selector, range inputs, background color)
 * - Left Y-axis controls (track checkboxes, column selector, range inputs)
 * - Right Y-axis controls (track checkbox, column selector, range inputs)
 * - Apply button to confirm settings
 */
export function generateViewControl(currentView){   

        return`            
        <div id='canvas-container-${currentView}' class='canvas-container'>
                    <div id='canvas-bar-${currentView}' class='canvas_bar'>
                        <span class = 'view-control'>View Controls A </span>
                        <span class = 'current-canvas'> </span>
                    </div>
                    <div class="canvas_content hidden">
                    
                        <div class="btn-row" id="global-variables">
                            <h2 class='x_axis_h2'>X axis</h2>
                                <div class="column-container">
                                     <span class='copy_range_msg'>Range Copied</span>
                                    <div class='x-axis-select'>
                                        <label for="columnSelectorX_0">X-axis: </label>
                                        <select name="xcolumn" id="columnSelectorX_0" class="columnSelectorX"  data-track="0">
                                            <option value="" disabled selected></option>
                                        </select>
                                        <select id="x_range_select">
                                            <option value = "" disabled selected>Copy</option>
                                            <option value="start"> X Start</option>
                                            <option value="end"> X End</option>
                                        </select>
                                    </div>
                                    <div class = 'column1'> 
                                        <label for="x_range_start">X-range:</label>
                                        <input type="text" class="interval-input" id="x_range_start">                    
                                        <span class='dashed-range'>-</span>
                                        <input type="text" class="interval-input" id="x_range_end">
                                    </div>
                                </div>
                        </div>
                        <div class="btn-row" id="global-y-variables-left"> 
                            <h2>Y-axis</h2>
                            <div class = 'column2'>                
                                <h2 class='y-axis-left'><i class="fa fa-solid fa-caret-left"></i>  Left Y-axis </h2>
                                <form id="checkbox-left-axis">
                                    <div class="y-checkbox-option">    
                                        <input class="y-checkbox-option" type="checkbox" id="track1-left" name="option" value="Track 1" checked>
                                        <label for="track1-left">Track 1</label><br>
                                    </div>
                                    <div class="y-checkbox-option">        
                                        <input class="y-checkbox-option" type="checkbox" id="track2-left" name="option" value="Track 2" checked>
                                        <label for="track2-left">Track 2</label><br>                    
                                    </div>
                                </form>
                                <div class="column-container">
                                    <label for="columnSelectorYLeft">Left-Y-axis: </label>
                                    <select name="ycolumn" id="columnSelectorYLeft" class="columnSelectorY" data-track="0">
                                        <option value="" disabled selected=""></option>
                                    </select>
                                    <div class = 'y-range-left'>                
                                        <label for="y_start_left">Y-range:</label>
                                        <input type="text" class="interval-input" id="y_start_left">
                                        <span class='dashed-range'>-</span>
                                        <input type="text" class="interval-input" id="y_end_left">
                                    </div> 
                                </div>
                            </div>
                        </div>
                        <div class="btn-row" id="global-y-variables-right">
                            <div class = 'column3'>                 
                                <h2 class='y-axis-right'>Right Y-axis  <i class="fa fa-solid fa-caret-right"></i></h2>
                                <form id="checkbox-right-axis">
                                    <div class="y-checkbox-option">    
                                        <input class="y-checkbox-option" type="checkbox" id="track1-right" name="option" value="Track 1">
                                        <label for="track1-right">Track 1</label><br>
                                    </div>
                                </form>
                                <div class="column-container">
                                    <label for="columnSelectorYRight">Right-Y-axis: </label>
                                    <select name="ycolumn" id="columnSelectorYRight" class="columnSelectorY" data-track="0">
                                        <option value="" disabled selected=""></option>
                                    </select>
                                    <div class = 'y-range-right'>   
                                        <label for="y_start_right">Y-range:</label>
                                        <input type="text" class="interval-input" id="y_start_right">
                                        <span class='dashed-range'>-</span>
                                        <input type="text" class="interval-input" id="y_end_right">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="btn-row">
                            <button class="apply-all-button">Apply</button>
                        </div>
                    </div>
                </div>`

    
}

async function loadAndApplyViewSettings(view) {
    // First update the UI controls
    updateViewSettings(view);
    
    const currentCanvasState = window.canvas_states[view];
    const plotSpec = getCurrentViewSpec();

    // Apply X-axis settings
    plotSpec.xDomain.interval = currentCanvasState.view_control_settings.x_range;

    // Process left axis checkboxes
    const leftChecked = document.querySelectorAll('#checkbox-left-axis input[type="checkbox"]:checked');
    leftChecked.forEach(function (checkbox) {
        const trackIndex = parseInt(checkbox.value.split(' ')[1]) - 1;
        if (plotSpec.tracks[trackIndex]) {
            const leftSelector = document.getElementById('columnSelectorYLeft');
            if (leftSelector && leftSelector.options[currentCanvasState.view_control_settings.left_y_axis]) {
                const fieldName = leftSelector.options[currentCanvasState.view_control_settings.left_y_axis].textContent;
                
                // Update both data value and y field
                plotSpec.tracks[trackIndex].data.value = fieldName;
                plotSpec.tracks[trackIndex].y = {
                    field: fieldName,
                    type: 'quantitative',
                    axis: 'left',
                    domain: currentCanvasState.view_control_settings.left_y_range
                };
            }
            
            const xSelector = document.getElementById('columnSelectorX_0');
            if (xSelector && xSelector.options[currentCanvasState.view_control_settings.x_axis]) {
                const fieldName = xSelector.options[currentCanvasState.view_control_settings.x_axis].textContent;
                plotSpec.tracks[trackIndex].x.field = fieldName;
            }
        }
    });

    // Process right axis checkboxes
    const rightChecked = document.querySelectorAll('#checkbox-right-axis input[type="checkbox"]:checked');
    rightChecked.forEach(function (checkbox) {
        const trackIndex = parseInt(checkbox.value.split(' ')[1]) - 1;
        if (plotSpec.tracks[trackIndex]) {
            plotSpec.tracks[trackIndex].y.domain = currentCanvasState.view_control_settings.right_y_range;
            const rightSelector = document.getElementById('columnSelectorYRight');
            if (rightSelector && rightSelector.options[currentCanvasState.view_control_settings.right_y_axis]) {
                const fieldName = rightSelector.options[currentCanvasState.view_control_settings.right_y_axis].textContent;
                plotSpec.tracks[trackIndex].y.field = fieldName;
            }
            plotSpec.tracks[trackIndex].y.axis = 'right';
            
            const xSelector = document.getElementById('columnSelectorX_0');
            if (xSelector && xSelector.options[currentCanvasState.view_control_settings.x_axis]) {
                const fieldName = xSelector.options[currentCanvasState.view_control_settings.x_axis].textContent;
                plotSpec.tracks[trackIndex].x.field = fieldName;
            }
        }
    });

    // Update plot
    await GoslingPlotWithLocalData();
}