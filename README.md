# Running the project

```bash
# Install project dependencies
npm install

# Serve the files
node app

# Go to your browser and access it going to the link
http://localhost:3000/
```
# Node version
The tool was built using node v20.12.2

# Visualizing-adaptive-variation
A project within the course of Applied Bioinformatics, using the Gosling grammar to visualize adaptive variation. The project consists of two main parts: the development of a Graphical User Interface for the use of Gosling, as well as the generation of a catalog consisting of HTML pages with visualizations tailored for data provided. 

## Gosling Graphical User interface
A simple GUI was developed for easy use of the Gosling grammar using data provided by the user. 

## Gene catalog
A collection of scripts involved in the creation of visualizations of adaptive variation within Northern krill. The script can generate a large catalogue of plots for candidate genes linked to ecological adaptation, and the scripts are customized for these genes. However the code can be adapted to fit other use cases. 

## View Control
Regarding the views, you can create max 3 different views.
You can use those views with different fields, and it will reflect the canvas that is currently active.
Each view control can have its own settings and options.


## How it works!
You can upload file either locally from your machine or from a url, the file has to be CSV or TSV format.
You have to press on apply button for any change you make.
You can export your figure as HTML.
The exported files will be downloaded into your machine.


## For Production
create a `.env` file in the project’s root directory.
Include the PORT and ALLOWED_ORIGINS variables.
Update ALLOWED_ORIGINS to include the URL where the application will be hosted.
Dependencies Installation:

Run `npm install` to install all required dependencies.
Starting the Application:

Run npm start to start the server.
Ensure the port specified in .env is open and accessible.
Update the Host URL (if needed):

If the application is being accessed from a domain other than https://export.uppmax.uu.se/, then you should update the ALLOWED_ORIGINS in the .env file to include the new domain or subdomain.
Example Scenario:
If the application is hosted at https://myapp.example.com, then you should:

1. Modify the .env file like this:

`PORT=3000
ALLOWED_ORIGINS=https://myapp.example.com`

2. Install dependencies with `npm install`.

3. Start the server with `npm start`.