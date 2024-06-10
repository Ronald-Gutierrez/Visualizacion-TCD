// Define the dimensions of the map
const width_MAP = 1000;
const height_MAP = 1000;

// Create an SVG element to contain the map
const svg = d3.select("#map").append("svg")
    .attr("width", width_MAP)
    .attr("height", height_MAP);

// Create a group element for the map
const g = svg.append("g");

// Define a zoom behavior
const zoom = d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
});

// Apply the zoom behavior to the SVG element
svg.call(zoom);

// Define a projection to convert GeoJSON coordinates to screen coordinates
const projection = d3.geoMercator()
    .center([116.4074, 39.9042]) // Center the map on Beijing
    .scale(20000) // Adjust the scale to fit the map size
    .translate([width_MAP / 2, height_MAP / 2]);

// Define a path generator to convert GeoJSON paths to SVG paths
const path = d3.geoPath().projection(projection);

// Load the GeoJSON data
d3.json("map/beijing.json")
    .then(data => {
        // Bind data and create one path per GeoJSON feature
        g.selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", "#69b3a2")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("fill", "#ffcc00")
                    .attr("stroke-width", 2);
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("fill", "#69b3a2")
                    .attr("stroke-width", 1);
            });
    })
    .catch(error => console.error('Error loading or parsing data:', error));
