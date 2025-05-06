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
          { "attribute": "ID", "defaultValue": "unknown" },
        ]
      },
      "tracks": [
          // Draw a line for the gene
          {
            "dataTransform": [
              {"type": "filter", "field": "type", "oneOf": ["gene"]},
              {"type": "filter", "field": "source", "oneOf": [
                "GL_Feature=CDS",
                "GL_Feature=cds",
                "GL_Feature=five_prime_UTR",
                "GL_Feature=five_prime_utr",
                "GL_Feature=three_prime_UTR",
                "GL_Feature=three_prime_utr",
                "GL_Feature=Exon",
                "GL_Feature=exon",
                "GL_Feature=mRNA",
                "GL_Feature=mrna"
              ],
              "not": true}
            ],
            "mark": "rule",
            "x": {
              "field": "start",
              "type": "genomic",
              "axis": "top",
			      },
            "strokeWidth": {"value": 3},
            "xe": {"field": "end", "type": "genomic"},
            "color": { "value" : "#6acfec" },
          },
          {
            "dataTransform": [
              {"type": "filter", "field": "type", "oneOf": ["gene"]},
              {"type": "filter", "field": "source", "oneOf": [
                "GL_Feature=CDS",
                "GL_Feature=cds",
                "GL_Feature=five_prime_UTR",
                "GL_Feature=five_prime_utr",
                "GL_Feature=three_prime_UTR",
                "GL_Feature=three_prime_utr",
                "GL_Feature=Exon",
                "GL_Feature=exon",
                "GL_Feature=mRNA",
                "GL_Feature=mrna"
              ],
              "not": true}
            ],
            "mark": "text",
            "text": { "field": "ID", "type": "nominal" },
            "x": { "field": "start", "type": "genomic" },
            "xe": { "field": "end", "type": "genomic" },
            "color": { "value": "#000000" },
            "style": { "dy": 18 },
          },
          // Draw a CDS region
          {
            "dataTransform": [
              {"type": "filter", "field": "source", "oneOf": ["GL_Feature=CDS", "GL_Feature=cds"]},
            ],
            "mark": "rule",
            "x": {"field": "start", "type": "genomic"},
            "strokeWidth": {"value": 15},
            "xe": {"field": "end", "type": "genomic"},
            "color": { "value" : "#52a302" },
          },
          // Draw a UTR or exon region
          {
            "dataTransform": [
              {"type": "filter", "field": "source", "oneOf": ["GL_Feature=five_prime_UTR", "GL_Feature=five_prime_utr", "GL_Feature=three_prime_UTR", "GL_Feature=three_prime_utr", "GL_Feature=Exon", "GL_Feature=exon"]},
            ],
            "mark": "rule",
            "x": {"field": "start", "type": "genomic"},
            "strokeWidth": {"value": 10},
            "xe": {"field": "end", "type": "genomic"},
            "color": { "value" : "#a7b0b7" },
          },
       ],
      "width": 800,
      "height": 80
    }
  ]
};

export { gene_template };
