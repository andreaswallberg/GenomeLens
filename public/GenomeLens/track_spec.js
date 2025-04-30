/**
 * @fileoverview Track specification template
 * Defines the default configuration for visualization tracks
 * @module track_spec
 */

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
    "color": { "value": "orange", "title": "Trackss", "legend": true},
    "opacity": { "value": 0.8 },
    "size": { "value": 3 },
    "tooltip": [
        { "field": y_col_preset, "type": "quantitative", "format": "0.2f", "alt": y_col_preset },
        { "field": x_col_preset, "type": "genomic", "format": "0.2f", "alt": x_col_preset }
    ],
};

export { trackTemplate };