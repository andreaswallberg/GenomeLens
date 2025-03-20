const gene_template = {
  "spacing": 0,
  "layout": "linear",
  "assembly": [["", 4641652]],
  "style": { "enableSmoothPath": true },
  "views": [
    {
      "id": "canvas0",
      "xDomain": { "chromosome": "", "interval": [0, 1000000] },
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
          "dataTransform": [
              {"type": "filter", "field": "type", "oneOf": ["gene"]},
              {"type": "filter", "field": "strand", "oneOf": ["+"]}
          ],
          "mark": "triangleRight",
          "x": { "field": "end", "type": "genomic", "axis": "top" },
          "size": { "value": 15 },
          },
          {
          "mark": "text",
          "text": { "field": "ID", "type": "nominal" },
          "x": { "field": "start", "type": "genomic" },
          "xe": { "field": "end", "type": "genomic" },
          "color": { "value": "#000000" },
          "style": { "dy": -15 }
          },
          {
          "dataTransform": [
              {"type": "filter", "field": "type", "oneOf": ["gene"]},
              {"type": "filter", "field": "strand", "oneOf": ["-"]}
          ],
          "mark": "triangleLeft",
          "x": { "field": "start", "type": "genomic" },
          "size": { "value": 15 },
          "style": { "align": "right" },
          },
          {
              "dataTransform": [
                  {"type": "filter", "field": "type", "oneOf": ["gene"]}
              ],
              "mark": "rule",
              "x": {"field": "start", "type": "genomic", "axis": "top"},
              "strokeWidth": {"value": 3},
              "xe": {"field": "end", "type": "genomic"}
          },
          // Exons are currently not visualized
          {
          "dataTransform": [
              {"type": "filter", "field": "type", "oneOf": ["exon"]},
          ],
              "mark": "rect",
              "x": {"field": "start", "type": "genomic", "axis": "top"},
              "size": {"value": 10},
              "xe": {"field": "end", "type": "genomic"}
          },
      ],
      "width": 800,
      "height": 80
    }
  ]
};

export { gene_template };
