/**
 * @fileoverview Plot specification manager for InfraVIS visualization
 * Manages plot specifications, canvas states, and assembly information
 * @module PlotSpecManager
 */

import { trackTemplate } from './track_spec.js';
import { gene_template } from './gene_spec.js';

/**
 * Deep copies an object without reference links
 * @param {Object} obj - Object to copy
 * @returns {Object} Deep copy of input object
 */
function deepCopy(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCopy);
  }

  const copied = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copied[key] = deepCopy(obj[key]);
    }
  }

  return copied;
}

/**
 * Manages plot specifications and canvas states
 * @class PlotSpecManager
 */
class PlotSpecManager {
  /**
   * Creates a new PlotSpecManager instance
   * @constructor
   */
  constructor() {
    this.assemblyInfo = [["", 0]];
    this.currentChromosome = null;
    this.plotSpecs = {
      1: this.createNewPlotSpec(),
    };
  }

  /**
   * Updates assembly information with new sequence data
   * @param {string} seqid - Sequence identifier
   * @param {number} length - Sequence length
   */
  updateAssemblyInfo(seqid, length) {
    if (window.canvas_num === 0) {

    
    if (seqid && length) {
        this.assemblyInfo = [[seqid, length]];
        this.currentChromosome = seqid;
        
        // Store assembly info globally
        window.currentAssemblyInfo = {
            seqid: seqid,
            length: length
        };
        
        // Update views with new assembly info
        if (this.plotSpecs[1].views && this.plotSpecs[1].views.length > 0) {
            this.plotSpecs[1].views[0].assembly = this.assemblyInfo;
            this.plotSpecs[1].views[0].title = this.getChromosomeTitle(seqid);
            
            // Update xDomain
            this.plotSpecs[1].views[0].xDomain = {
                chromosome: seqid,
                interval: [0, length]
            };
        }

        try {
            localStorage.setItem('gosling-assembly-info', JSON.stringify(this.assemblyInfo));
            localStorage.setItem('current-chromosome', seqid);
            localStorage.setItem('chromosome-length', length.toString());
        } catch (e) {
            console.warn('Failed to save assembly info to localStorage:', e);
        }
      }
    }
}

  getChromosomeTitle(seqid) {
    if (window.canvas_num === 0) {
      
    
    const isChromosomeName = /^(chr)?([0-9]+|[XY]|MT)$/i.test(seqid);
    if (isChromosomeName) {
      return `Gene Annotations - Chromosome ${seqid}`;
    } else {
      return `Gene Annotations - ID: ${seqid}`;
    }
  }
  }

  getPlotSpec() {
    return this.plotSpecs[1];
  }

  getPlotSpecViewById(viewId) {
    const plotSpec = this.getPlotSpec();
    return plotSpec.views.find(view => view.id === viewId);
  }

  updateAssemblyInfo(seqid, length) {
    if (seqid && length) {
      this.assemblyInfo = [[seqid, length]];
      
      // Update existing plot specs with new assembly info
      if (this.plotSpecs[1].views && this.plotSpecs[1].views.length > 0) {
        this.plotSpecs[1].views[0].assembly = this.assemblyInfo;
      }

      // Store in local storage for persistence
      try {
        localStorage.setItem('gosling-assembly-info', JSON.stringify(this.assemblyInfo));
      } catch (e) {
        console.warn('Failed to store assembly info in localStorage:', e);
      }
    }
  }

  createNewPlotSpec() {
    // Try to load saved assembly info from localStorage
    try {
      const savedAssembly = localStorage.getItem('gosling-assembly-info');
      if (savedAssembly) {
        this.assemblyInfo = JSON.parse(savedAssembly);
      }
    } catch (e) {
      console.warn('Failed to load assembly info from localStorage:', e);
    }

    if (window.canvas_num == 0) {
      return {
        views: [
          {
            id: "canvas0",
            title: "Gene",
            static: false,
            xDomain: { interval: [0, 200000] },
            alignment: "overlay",
            width: 1000,
            height: 150,
            assembly: this.assemblyInfo,
            linkingId: "detail",
            style: {
              background: "#D3D3D3",
              backgroundOpacity: 0.1,
            },
            tracks: [
              this.createGeneTrack(0),
              this.createGeneTrack(1),
              this.createGeneTrack(2),
              this.createGeneTrack(3),
              this.createGeneTrack(4),
            ]
          }
        ]
      };
    } else {
      return {
        views: [
          {
            id: "canvas1",
            title: "Canvas 1",
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
              this.createTrack(),
              this.createTrack(),
              this.createTrack(),
              this.createTrack(),
              this.createTrack(),
            ]
          }
        ]
      };
    }
  }

  createTrack() {
    return deepCopy(trackTemplate);
  }

  /**
   * Creates a gene track by copying a specific track from gene_template
   * @param {number} index - Index of the track to copy
   * @returns {Object} - A single track object
   */
  createGeneTrack(index) {
    if (gene_template.views?.[0]?.tracks?.[index]) {
        const track = deepCopy(gene_template.views[0].tracks[index]);

        // Set up basic track data configuration
        track.data = {
            type: "gff",
            url: "",
            indexUrl: "",
            attributesToFields: [
                { attribute: "gene_biotype", defaultValue: "unknown" },
                { attribute: "Name", defaultValue: "unknown" },
                { attribute: "ID", defaultValue: "unknown" }
            ]
        };

        // Add color configuration for strands
        track.color = {
            field: "strand",
            type: "nominal",
            domain: ["+", "-"],
            range: ["#FF0000", "#0000FF"]
        };

        track.tooltip = [
            { field: "start", type: "quantitative", alt: "Start Position" },
            { field: "end", type: "quantitative", alt: "End Position" },
            { field: "strand", type: "nominal", alt: "Strand" },
            { field: "type", type: "nominal", alt: "Feature Type" },
            { field: "gene_biotype", type: "nominal", alt: "Gene Biotype" },
            { field: "ID", type: "nominal", alt: "Gene ID" }
        ];

        return track;
    }
    return {};
}

  generateCanvas(canvasId, newCanvasObject) {
    const plotSpec = this.getPlotSpec();
    const existingViewIndex = plotSpec.views.findIndex(view => view.id === canvasId);

    if (existingViewIndex !== -1) {
      plotSpec.views[existingViewIndex] = newCanvasObject;
    } else {
      plotSpec.views.push(newCanvasObject);
    }
  }

  resetInstance() {
    this.plotSpecs[1] = this.createNewPlotSpec();
  }
}

PlotSpecManager.prototype.exportPlotSpecAsJSON = function() {
  const plotSpec = this.getPlotSpec();
  const jsonString = JSON.stringify(plotSpec, null, 2);
  return jsonString;
}
export { PlotSpecManager };