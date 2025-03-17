const gene_template = {
  "spacing": 0,
  "layout": "linear",
  "assembly": [["", 4641652]],
  "style": { "enableSmoothPath": true },
  "views": [
    {
      "id": "canvas0",
      "xDomain": { "chromosome": "", "interval": [0, 200000] },
      "alignment": "overlay",
      "data": {
        "url": "",
        "indexUrl": "",
        "type": "gff",
        "attributesToFields": [
          { "attribute": "gene_biotype", "defaultValue": "unknown" },
          { "attribute": "Name", "defaultValue": "unknown" },
          { "attribute": "ID", "defaultValue": "unknown" }
        ]
      },
      "tracks": [
        {
          "mark": "triangleRight",
          "x": { "field": "end", "type": "genomic", "axis": "top" },
          "size": { "value": 10 },
          "color": { "value": "#FF0000" },
          "filter": [
            {"field": "strand", "oneOf": ["+"]}
          ]
        },
        {
          "mark": "text",
          "text": { "field": "Name", "type": "nominal" },
          "x": { "field": "start", "type": "genomic" },
          "xe": { "field": "end", "type": "genomic" },
          "color": { "value": "#000000" },
          "style": { "dy": -10 }
        },
        {
          "mark": "triangleLeft",
          "x": { "field": "start", "type": "genomic" },
          "size": { "value": 10 },
          "color": { "value": "#0000FF" },
          "style": { "align": "right" },
          "filter": [
            {"field": "strand", "oneOf": ["-"]}
          ]
        },
        {
          "mark": "rule",
          "x": { "field": "start", "type": "genomic" },
          "strokeWidth": { "value": 3 },
          "xe": { "field": "end", "type": "genomic" },
          "color": { "value": "#FF0000" },
          "style": { "linePattern": { "type": "triangleRight", "size": 5 } },
          "filter": [
            {"field": "strand", "oneOf": ["+"]}
          ]
        },
        {
          "mark": "rule",
          "x": { "field": "start", "type": "genomic" },
          "strokeWidth": { "value": 3 },
          "xe": { "field": "end", "type": "genomic" },
          "color": { "value": "#0000FF" },
          "style": { "linePattern": { "type": "triangleLeft", "size": 5 } },
          "filter": [
            {"field": "strand", "oneOf": ["-"]}
          ]
        }
      ],
      "opacity": { "value": 0.8 },
      "width": 800,
      "height": 80
    }
  ]
};

export { gene_template };