/**
 * @fileoverview Track specification template
 * Defines the default configuration for visualization tracks
 * @module track_spec
 */

// Track specification used in GUI
const y_col_preset = ""
const x_col_preset = ""

const trackTemplate = {
    "data": {
        "url": "",
        "type": "",
        "separator": "",
        "column": x_col_preset,
        "value": y_col_preset,
        "binSize": 10,
        "sampleLength": 1000,
    },
    "metadata": {"categories": ["Track"]},
    "mark": "point",
    "x": { "field": x_col_preset, "type": "genomic", "axis": "bottom", "legend": true, "linkingId": "detail",},
    "y": { "field": y_col_preset, "type": "quantitative", "axis": "left", "domain": [0, 1], "baseline": "2", "legend": true},
    "color": { "value": "orange", "title": "Tracks", "legend": true},
    "opacity": { "value": 1 },
    "size": { "value": 2 },
    "tooltip": [
        { "field": y_col_preset, "type": "quantitative", "format": "0.4f", "alt": y_col_preset },
        { "field": x_col_preset, "type": "genomic", "format": "0.4f", "alt": x_col_preset }
    ],
};

export { trackTemplate };