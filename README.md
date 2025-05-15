# GenomeLens

![GenomeLens in action](/public/GenomeLens/assets/images/multiple_canvases_and_tracks.png)

### Table of Contents

* [Introduction](#Introduction)
* [Implementation](#Implementation)
* [Design Philosophy](#Design-Philosophy)
* [Workflow](#Workflow)
* [Exporting visualizations](#Exporting-visualizations)
* [About TSV data](#About-TSV-data)
* [About GFF data](#About-GFF-data)
* [Running a local instance of GenomeLens](#Running-a-local-instance-of-GenomeLens)
* [Acknowledgments](#Acknowledgments)

## Introduction

**GenomeLens** is an open source tool for interactive visualization of genetic data along chromosomes. It supports both point-based data (e.g., SNPs) and window-based data (e.g., averages). A typical use case is to explore patterns of genetic variation—such as diversity or divergence—along a sequence, helping users inspect and highlight regions of interest. In principle, any quantitative data can be visualized, e.g. depth of coverage, population sample sizes in windows or gene-wide estimates such as rates of molecular evolution.

The main motivation behind this tool is to lower the time and expertise thresholds needed to visualize biodiversity data. It aims to promote discovery through interactive exploration and to facilitate collaboration and dissemination by enabling easy sharing of interactive plots.

The **main features** of GenomeLens are:

* Fast and easy loading of data from TSV files and genome feature annotations from (compressed) GFF files
* Support for both local and remote data sources via URLs
* Interactive visualization at any zoom level and sequence location
* Linked views that enable concurrent exploration across up to three canvases, each supporting up to five data tracks on two y-axes
* Flexible plotting options using a variety of marker types (e.g., dots, lines, areas) and customizable colors
* Rich tooltips displaying complete TSV row data for individual points and gene feature details from GFF annotations
* Control over data binning and sample sizes to optimize data loading and visualization performance and clarity
* Export of visualizations as standalone interactive HTML files for easy sharing without requiring GenomeLens

## Implementation

**GenomeLens** is implemented in JavaScript as a web application that interactively renders genomic data directly in the browser. It leverages the [Gosling.js](https://gosling-lang.org/) visualization library for flexible and scalable genome-based plotting.

GenomeLens can be run locally (e.g., via Node.js) or hosted on a remote web server. The server's role is limited to delivering the application; once loaded, all data processing occurs client-side in the browser, ensuring responsive interaction and data privacy.

The **official and up-to-date version of GenomeLens** is hosted on GitHub Pages and is accessible without installation here: [GenomeLens](https://andreaswallberg.github.io/GenomeLens/public)

The source code is open and distributed under the AGPL-3.0 license.

## Design Philosophy

GenomeLens is **designed with simplicity in mind**, aiming to provide a fast and intuitive workflow for visualizing genomic data with minimal preprocessing. Unlike genome browsers that often require full genome sequences and complex configuration, GenomeLens works with as little as a single TSV file containing headers and positional data along a sequence.

The tool makes **minimal assumptions about data structure and does not require explicit sequence names or partitioning**. As a result, **GenomeLens is intended for visualizing one contiguous sequence at a time**—such as a single chromosome, scaffold, or contig—**not for genome-wide plots like Manhattan plots**. If data from multiple sequences is provided, positions will overlap, leading to unintelligible displays. Therefore, GenomeLens should be used to interrogate a single single sequence or a locus of interest, such as the patterns of genetic variation across a selective sweep or chromosomal inversion.

For feature annotations, multi-sequence GFF files are supported, and users can select the target sequence to visualize via a dropdown menu.

**Note**: due to how data is loaded in chunks and binned in Gosling.js, not all data points may be shown at any one time. Rather, representative dots are selected. In such cases, new data points usually appear when the user zoom in. To show all points, the user may need to set the "sample size" to a value higher than the number of data points in the dataset. Depending on the size of the dataset, this might hurt performance. This is another reason why GenomeLens is not appropriate to show genome-wide Manhattan plots.

## Workflow

A typical GenomeLens session begins with the optional loading of a compressed GFF file and its index through the Annotations tab, in order to show genes or other features. Users then load one or more TSV data files using the Canvas tabs.

Within each canvas, users can create one or more tracks by selecting input files and configuring how the data is displayed—including the number of data points shown, marker types (e.g., dots, lines), and color schemes.

After setting up a track, users switch to the View controls to assign TSV columns to the X and Y axes. Additional options include customizing axis ranges. While multiple Views (A, B, C, etc.) can be configured for fast switching between different visualizations, most users typically use only View A.

Tracks can be removed at any time, and visualizations can be reset to start fresh as needed.

By hovering the pointer over a data point, all information about that data point is shown in the tooltip:

![Tooltips](/public/GenomeLens/assets/images/tooltips.png)

## Exporting visualizations

Using a button in the Annotations/Canvas tabs, the visualization can be exported as a stand-alone, interactive HTML file (sans any dialogs or widgets to reconfigure it). There is otherwise no way to explicitly save a session in GenomeLens.

Here is an [example of an interactive visualization](https://andreaswallberg.github.io/GenomeLens/public/GenomeLens/assets/examples/Krill_sweep_Star.html) of a selective sweep region in the Northern krill (*Meganyctiphanes norvegica*).

It shows a visualization of a ~400,000 bp region of a chromosome. The top canvas shows the location of three genes (Alg2, Star, and an unnamed gene). The next canvases show a comparison of genetic variation between an Atlantic and a Mediterranean population of the krill. The second canvas highlights high FST values at the gene Star, indicating genetic differentiation between Atlantic and Mediterranean populations (window-based area plot in light-blue; SNP data as blue dots and missense variants as large red dots). The next panel shows reduced genetic variation in the Atlantic population (negative XP-nSL), consistent with a selective sweep. The last panel shows the nucleotide diversity per base (pi/bp) of each population. Star, involved in eye development and sleep regulation, may have evolved under natural selection to adapt Atlantic krill to local light conditions. This is an example of genetic adaptation to the environment through natural selection.

## About TSV data

All quantitative data is provided as TSV files (which need to have the `.tsv` file ending to be parsed correctly). GenomeLens does not filter or transform any data, so log-transformation or filtering below/above thresholds and similar need to be performed by the user before loading the data.

An important design choice in GenomeLens is that each track is associated with a file. If the user wants to plot two different data columns from the same file as separate tracks or visualize the same data using both lines and points as separate tracks, then they need to **load the same TSV file several times**. There is no built-in "reuse" of data across multiple tracks.

Another important design choice is that the columns used to define X and Y axes are determined in the View controls for a Canvas and not the track controls. This means that two or more tracks can be loaded into a Canvas and controlled at the same time. For example, the ranges for the X-axis and Y1-axis applies to both tracks. To show **two tracks using the same X and Y1 axis** (for example a point-based estimate of FST from one TSV file and a window-based estimate of FST from another) in the same Canvas, they **must have the exact same header** (e.g. "FST") in each file, since there is only a single dropdown menu to select column headers from. Such multi-track plots may therefore require the user to adapt their TSV headers in advance. A simple albeit limited solution if two headers are named differently but are conceptually the same, is to plot one track using the Y1 axis and the other using the Y2 axis.

**Note**: a **limitation when plotting multi-track and multi-file data** is that the column headers available to select from are based on the last loaded file. Users should therefore expect to configure and finish one track at a time when building a complex visualization, rather than switch extensively between tracks. *Accessing previously used headers may require loading the same file in again for a new track in the same or a different canvas*.

**Note**: each track has some default settings. After the user has updated the settings, the default settings (rather than the current) are again shown in the dialogs rather then those actually used in the visualization.

#### Splitting TSV data 

Users may have multi-sequence datasets, which need to be partitioned sequence-by-sequence to possible to visualize in GenomeLens. Or they may have data that belong to different classes, such as different types of SNPs that they want to configure and visualize as separate tracks. We provide the simple companion Perl script `split_tsv.pl` in the scripts directory to split TSV data based on the unique labels of any column in a TSV file.

The user provides the column header for the desired column to split data by. The input TSV can be compressed with gzip/bgzip or uncompressed (GenomeLens only reads uncompressed TSVs).

```
perl split_tsv.pl --split CHROM --in myfile.tsv
```

This will create new TSV files, one for each unique label in the "CHROM" column (i.e. one for each chromosome). Other labels can for example be types of SNPs (e.g missense, synonymous etc.) given under a "TYPE" column or similar.

By partitioning the data, it is possible for example to plot missense (amino-acid changing) variants as a separate track on top of all other SNPs.

![Missense variants as a separate track](/public/GenomeLens/assets/images/missense.png)

#### Tips and tricks:

GenomeLens supports the following markers: point, line, area, rectangle, triangle (right), triangle (left). By loading the same TSV file several times and stacking tracks that plot the same column but with different markers, it is possible to generate appealing plots. In this example, stacked tracks using area, line and point markers have been used to create a shaded plot with an upper margin:

![Stacked tracks](/public/GenomeLens/assets/images/stacked_tracks.png)

## About GFF data

GenomeLens can read compressed multi-sequence GFF files, after which the user selects the relevant sequence to plot features for using a dropdown menu. Features are separated by strand (upper=plus; lower=minus).

GFF files need to be compressed with `bgzip` and indexed with `tabix` before being loaded in GenomeLens. These tools are distributed with [HTSlib](https://www.htslib.org/). Most Linux distributions have packages for HTSlib and most bioinformatics HPC environments usually provide them on the command-line or as modules. Refer to HTSlib documentation for how to compile them for Windows or Mac.

Assuming they are available in the `$PATH` on the command-line, compressing and indexing a GFF file is as simple as:

```
# Compress GFF file
bgzip myfile.gff

# Index GFF file
tabix myfile.gff.gz
```

#### Splitting GFF files

If the genome assembly that the GFF maps to is highly fragmented, this may be a very long list. We therefore provide a companion script to split a GFF file by sequence, before loading the data into GenomeLens. This creates one new GFF file per sequence in the original GFF file. The input GFF can be compressed with gzip/bgzip or uncompressed. It automatically names the output. It is executed as follows:

```
perl split_gff.pl --in myfile.gff
```

#### Rewriting GFF files

Due to a limitation in the upstream Gosling.js library, only "gene" lines and features are fully processed and visualized using a regular GFF file. Therefore, the visualization will show the start and stop of each gene in the region, but not the functional parts of the genes, such as CDS or UTRs:

![Genes plotted using a regular GFF](/public/GenomeLens/assets/images/genes.png)

To work around this issue, we provide another companion script that rewrites the GFF file so that parts of genes (e.g. CDSs and UTRs) can be displayed in GenomeLens. The user specifies one or more features to rewrite and plot using case insensitive patterns. The input GFF can be compressed with gzip/bgzip or uncompressed.

```
perl rewrite_gff.pl --rewrite CDS UTR --in myfile.gff
```

In this example, the user specifies that lines matching /CDS/i and /UTR/i in the third column of the GFF file should be rewritten as "fake" gene lines, which matches both "CDS", "cds", "five_prime_UTR" and "three_prime_UTR" lines. A new file called `myfile.gff.rewritten.gff` is created.

Under the hood, the third column is set to "gene" for all matching lines and the second column, [normally used to specify the program used to generate the file](https://www.ensembl.org/info/website/upload/gff.html), is overwritten with a "GL_Feature" tag that is parsed by GenomeLens. This is the result using the above three genes as an example:

![Genes plotted using a regular GFF](/public/GenomeLens/assets/images/genes_rewritten.png)

While this is compatible with the GFF specification (it is simply a text string), it uses the second column to extract information in a non-standard way, and we caution against using these rewritten GFFs outside of GenomeLens.

## Running a local instance of GenomeLens

For local installations, we recommend first installing [Node.js](https://nodejs.org/en), which is available on Linux, Mac and Windows. The tool was built using node v20.12.2 but may work with other versions.

Then follow these instructions:

```bash
# Clone this repository (or download and unzip and archive of it)
git clone https://github.com/andreaswallberg/GenomeLens.git

# Install Node.js project dependencies
npm install

# Serve the files
node app

# Go to your browser and access it going to the link
http://localhost:3000/
```
### Using Node.js in production (i.e. deployed on a web server)

Create a `.env` file in the project’s root directory.


Include the PORT and ALLOWED_ORIGINS variables.
Update ALLOWED_ORIGINS to include the URL where the application will be hosted.
Dependencies Installation:

Run `npm install` to install all required dependencies.
Starting the Application:

Run npm start to start the server.
Ensure the port specified in .env is open and accessible.
Update the Host URL (if needed):

You should update the ALLOWED_ORIGINS in the .env file to include the new domain or subdomain.
Example Scenario:
If the application is hosted at https://myapp.example.com, then you should:

1. Modify the .env file like this:

`PORT=3000
ALLOWED_ORIGINS=https://myapp.example.com`

2. Install dependencies with `npm install`.

3. Start the server with `npm start`.

## Acknowledgments

GenomeLens would not have been possible to implement without [Gosling.js](https://gosling-lang.org/).

A prototype was first developed in a [bioinformatics student project](https://github.com/matildasofia/visualizing-adaptive-variation) at Uppsala University in 2023.

GenomeLens has since been developed as a collaboration between [InfraVis](https://infravis.se/genomelens/) and researchers at Uppsala University, Umeå University, Stockholm University, Linnaeus University and SciLifeLab.

The GUI and data color palette were inspired by the [Xfce Design Standards](https://wiki.xfce.org/design/start).