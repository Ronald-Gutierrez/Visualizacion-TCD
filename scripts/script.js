var margin = { top: 50, right: 20, bottom: 34, left: 80 },
    width = 860 - margin.left - margin.right,
    height = 150 - margin.top - margin.bottom;

var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var color = d3.scaleOrdinal()
    .domain([1, 2, 3, 4, 5, 6])
    .range(["rgb(0, 128, 0)", "rgb(238,176,9)", "rgb(250,145,74)", "rgb(255, 0, 0)", "rgb(128, 0, 128)", "rgb(165, 42, 42)"]);

var legendData = [
    { color: "rgb(0, 128, 0)", label: "Excelente" },
    { color: "rgb(238,176,9)", label: "Bueno" },
    { color: "rgb(250,145,74)", label: "Ligeramente" },
    { color: "rgb(255, 0, 0)", label: "Moderadamente" },
    { color: "rgb(128, 0, 128)", label: "Fuerte" },
    { color: "rgb(165, 42, 42)", label: "Severo" }
];

var variables = ["PM2_5", "PM10", "SO2", "NO2", "CO", "O3"];

function drawChart(variable, containerId) {
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", -70)
        .attr("y", 30)
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        // .style("text-decoration", "underline")
        .text(variable);

    d3.csv("data/daily_aqi_output.csv").then(function(data) {
        data = data.filter(function(d) {
            return d.stationId === "aotizhongxin_aq";
        });

        var parseTime = d3.timeParse("%Y-%m-%d");
        data.forEach(function(d) {
            d.date = parseTime(d.date);
            d[variable] = +d[variable];
        });

        x.domain(d3.extent(data, function(d) { return d.date; })).nice();
        y.domain([0, d3.max(data, function(d) { return d[variable]; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y).ticks(7));

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.date); })
            .attr("cy", function(d) { return y(d[variable]); })
            .style("fill", function(d) { return color(d[variable]); })
            .on("click", function(d) {
                var clickedCircle = d3.select(this);
                var isEnlarged = clickedCircle.attr("r") == 15;
            
                // Restaurar todos los puntos al tamaño original y eliminar el borde amarillo
                d3.selectAll(".dot")
                    .attr("r", 5)
                    .style("stroke", null);
            
                // Si el punto no estaba ampliado, ampliarlo y resaltar otros puntos
                if (!isEnlarged) {
                    showTimeSeries(d.date);
                    updateOtherCharts(d.date);
                    clickedCircle
                        .transition()
                        .duration(200)
                        .attr("r", 15);
                }
            })
            
            .on("mouseover", function(d) {
                var tooltip = d3.select("#tooltip")
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("opacity", 0.9);
                tooltip.html("Fecha: " + formatDate(d.date) + "<br/>" +
                    "Valor de " + variable + ": " + d[variable]);
            })
            .on("mouseout", function(d) {
                d3.select("#tooltip").style("opacity", 0);
            });
    });
}

variables.forEach(function(variable) {
    drawChart(variable, "chart-" + variable);
});

var svgLegend = d3.select("#legend-container").append("svg")
    .attr("width", 1500)
    .attr("height", 50)
  .append("g")
    .attr("transform", "translate(" + margin.left + ",0)");

var legend = svgLegend.selectAll(".legend-item")
    .data(legendData)
    .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", function(d, i) { return "translate(" + (i * 130) + ",0)"; });

legend.append("rect")
    .attr("x", 0)
    .attr("width", 149)
    .attr("height", 18)
    .style("fill", function(d) { return d.color; });

legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("font-size", "12px")
    .style("fill", "black")
    .style("font-weight", "bold")
    .style("text-anchor", "start")
    .text(function(d) { return d.label; });

function formatDate(date) {
    var formatTime = d3.timeFormat("%Y-%m-%d");
    return formatTime(date);
}

function showTimeSeries(date) {
    // Implementa la lógica para mostrar la serie temporal debajo del punto
    console.log("Mostrar serie temporal para la fecha: " + formatDate(date));
}

function updateOtherCharts(date) {
    // Vuelve al tamaño original todos los puntos de todas las gráficas y elimina el borde amarillo
    d3.selectAll(".dot")
        .attr("r", 5) // Vuelve al tamaño original
        .style("stroke", null); // Elimina el borde amarillo
        

    // Selecciona todos los puntos con la misma fecha en todas las gráficas y los resalta
    d3.selectAll(".dot")
        .filter(function(d) { return d.date.getTime() === date.getTime(); })
        .attr("r", 15) // Amplía el punto
        .style("stroke", "yellow"); // Agrega un borde amarillo
        

    // Implementa la lógica para resaltar la fecha seleccionada en otras gráficas
    console.log("Actualizar otras gráficas para la fecha: " + formatDate(date));
}

//=======================================================================================================
//VIZUALIZACION DE METOROLOGIA
//

var weatherAttributes = ["temperature", "pressure", "humidity", "wind_direction", "wind_speed"];
weatherAttributes.forEach(function(attribute) {
    drawWeatherChart(attribute, "chart-" + attribute);
});

function drawWeatherChart(attribute, containerId) {
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", -margin.left)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(attribute);

    d3.csv("data/beijing_17_18_meo.csv").then(function(data) {
        data = data.filter(function(d) {
            return d.station_id === "shunyi_meo";
        });

        var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        data.forEach(function(d) {
            d.utc_time = parseTime(d.utc_time);
            d[attribute] = +d[attribute];
        });

        x.domain(d3.extent(data, function(d) { return d.utc_time; })).nice();
        if (attribute === "wind_direction") {
            y.domain([0, 90, 180, 270, 360]);
        } else {
            y.domain(d3.extent(data, function(d) { return d[attribute]; })).nice();
        }

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return x(d.utc_time) })
                .y(function(d) { return y(d[attribute]) })
            );

        // svg.selectAll(".dot")
        //     .data(data)
        //     .enter()
        //     .append("circle")
        //     .attr("class", "dot")
        //     .attr("r", 5)
        //     .attr("cx", function(d) { return x(d.utc_time); })
        //     .attr("cy", function(d) { return y(d[attribute]); })
        //     .style("fill", "red")
        //     .style("opacity", 0)
        //     .on("mouseover", function(d) {
        //         var tooltip = d3.select("#tooltip")
        //             .style("left", (d3.event.pageX + 10) + "px")
        //             .style("top", (d3.event.pageY - 20) + "px")
        //             .style("opacity", 0.9);
        //         tooltip.html("Fecha: " + formatDate(d.utc_time) + "<br/>" +
        //                      "Valor de " + attribute + ": " + d[attribute]);
        //     })
        //     .on("mouseout", function(d) {
        //         d3.select("#tooltip").style("opacity", 0);
        //     });
    });
}
//=======================================================================================================
//VIZUALIZACION DE MAPA
//
// Create an SVG element to contain the map
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
