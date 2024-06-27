var margin = { top: 50, right: 20, bottom: 34, left: 80 },
    width = 880 - margin.left - margin.right,
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

function formatStationId(stationId) {
    var formattedId = stationId.charAt(0).toUpperCase() + stationId.slice(1);
    formattedId = formattedId.replace("_aq", "");
    formattedId = formattedId.replace("_meo", "");

    return formattedId;
}

/////////////////// 
//VISUALIZACION DE MI SERIE TEMPORAL DE CONTAMINACION, Y SERIE TEMPORAL POR HORA
///////////////////

function drawChart(variable, containerId, stationId) {
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
        .text(variable);
    
    var data; // Variable global para almacenar los datos

    d3.csv("data/real-daily_aqi_output.csv").then(function(csvData) {
        data = csvData; // Asignar los datos cargados a la variable global
        var stationId = "yufa_aq"; // Por ejemplo, asegúrate de definirlo adecuadamente

        data = data.filter(function(d) {
            return d.stationId === "yufa_aq";
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

        var brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", brushed);

        svg.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed() {
            if (!d3.event.selection) return; // No hay selección
            
            var selectedRange = d3.event.selection.map(x.invert);
            
            // Verificar y corregir el formato de las fechas
            selectedRange = selectedRange.map(function(date) {
                return new Date(date); // Convertir a objeto Date
            });
            
            console.log("Selected range:", selectedRange);
            console.log("Station ID:", stationId); // Imprimir el stationId en la consola
            
            // Llamar a la función para dibujar el gráfico por hora
            drawHourlyChart(selectedRange);
        }
            
            

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 3)
            .attr("cx", function(d) { return x(d.date); })
            .attr("cy", function(d) { return y(d[variable]); })
            .style("fill", function(d) { return color(d[variable]); })
            .on("click", function(d) {
                var clickedCircle = d3.select(this);
                var isEnlarged = clickedCircle.attr("r") == 15;
                d3.select("#popup-chart-container").selectAll("*").remove();

                // Mostrar el contenedor del gráfico emergente
                d3.select("#popup-chart-container").style("display", "block");

                // Crear el gráfico emergente
                drawHourlyChart(variable, "popup-chart-container", stationId, d.date);
                // Restaurar todos los puntos al tamaño original y eliminar el borde amarillo
                d3.selectAll(".dot")
                    .attr("r", 3)
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
    
    // Función para dibujar el gráfico por hora en otro contenedor
    function drawHourlyChart(selectedRange) {
        d3.csv("data/hour_beijing_17_18_aq.csv").then(function(hourlyData) {
            hourlyData = hourlyData.filter(function(d) {
                return d.stationId === "yufa_aq";
            });

            var parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
            hourlyData.forEach(function(d) {
                d.date = parseDateTime(d.date + " " + d.time);
                d[variable] = +d[variable];
            });

            // Filtrar los datos por el rango de fechas seleccionado
            var filteredData = hourlyData.filter(function(d) {
                return d.date >= selectedRange[0] && d.date <= selectedRange[1];
            });

            // Limpiar el contenedor antes de dibujar
            d3.select("#chart-hour-pollution").selectAll("*").remove();

            // Crear el nuevo SVG para el gráfico por hora
            var svg = d3.select("#chart-hour-pollution").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Escala temporal para el gráfico por hora
            var xHour = d3.scaleTime()
                .range([0, width])
                .domain(d3.extent(filteredData, function(d) { return d.date; })).nice();

            // Recalcular la escala Y
            var yHour = d3.scaleLinear()
                .range([height, 0])
                .domain([0, d3.max(filteredData, function(d) { return d[variable]; })]).nice();

            // Línea de la serie temporal
            var line = d3.line()
                .x(function(d) { return xHour(d.date); })
                .y(function(d) { return yHour(d[variable]); });

            // Añadir la línea al gráfico
            svg.append("path")
                .datum(filteredData)
                .attr("class", "line")
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "steelblue")
                .style("stroke-width", 1.5);

            // Ejes
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xHour).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S")));

            svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yHour).ticks(7));
        });
    }
    
}

function updatedrawHourlyChart(stationId) {

    
}
function updateChartsForStation(stationId) {
    variables.forEach(function(variable) {
        var svg = d3.select("#chart-" + variable).select("svg").select("g");

        // Obtener datos actualizados para la estación seleccionada
        d3.csv("data/daily_aqi_output.csv").then(function(data) {
            data = data.filter(function(d) {
                return d.stationId === stationId;
            });

            var parseTime = d3.timeParse("%Y-%m-%d");
            data.forEach(function(d) {
                d.date = parseTime(d.date);
                d[variable] = +d[variable];
            });

            // Actualizar dominios y ejes
            x.domain(d3.extent(data, function(d) { return d.date; })).nice();
            y.domain([0, d3.max(data, function(d) { return d[variable]; })]);

            svg.select(".x.axis")
                .transition()
                .duration(500)
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

            svg.select(".y.axis")
                .transition()
                .duration(500)
                .call(d3.axisLeft(y).ticks(7));

            // Actualizar puntos
            var dots = svg.selectAll(".dot")
                .data(data);

            dots.exit().remove(); // Eliminar puntos que ya no se necesitan

            dots.enter()
                .append("circle")
                .attr("class", "dot")
                .merge(dots) // Fusionar puntos nuevos y existentes
                .transition()
                .duration(500)
                .attr("r", 3)
                .attr("cx", function(d) { return x(d.date); })
                .attr("cy", function(d) { return y(d[variable]); })
                .style("fill", function(d) { return color(d[variable]); });
        });
        
    });
}


function UpdateChart(variable, containerId, stationId) {
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
            return d.stationId === stationId;
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
            .attr("r", 3)
            .attr("cx", function(d) { return x(d.date); })
            .attr("cy", function(d) { return y(d[variable]); })
            .style("fill", function(d) { return color(d[variable]); })
            .on("click", function(d) {
                var clickedCircle = d3.select(this);
                var isEnlarged = clickedCircle.attr("r") == 15;
            
                // Restaurar todos los puntos al tamaño original y eliminar el borde amarillo
                d3.selectAll(".dot")
                    .attr("r", 3)
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
    .attr("width", 900)
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
        .attr("r", 3) // Vuelve al tamaño original
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
    // Limpiar el contenedor antes de dibujar el nuevo gráfico
    d3.select("#" + containerId).select("svg").remove();

    var svg = d3.select("#" + containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", -margin.left)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        .text(attribute);

    // Cargar los datos iniciales para la estación miyun_meo
    d3.csv("data/daily_meo_output.csv").then(function(data) {
        data = data.filter(function(d) {
            return d.station_id === "miyun_meo";
        });

        var parseTime = d3.timeParse("%Y-%m-%d");
        data.forEach(function(d) {
            d.date = parseTime(d.date);
            d[attribute] = +d[attribute];
        });

        x.domain(d3.extent(data, function(d) { return d.date; })).nice();
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
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d[attribute]); })
            );

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.date); })
            .attr("cy", function(d) { return y(d[attribute]); })
            .style("fill", "red")
            .style("opacity", 0)
            .on("mouseover", function(d) {
                var tooltip = d3.select("#tooltip")
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("opacity", 0.9);
                tooltip.html("Fecha: " + formatDate(d.date) + "<br/>" +
                    "Valor de " + attribute + ": " + d[attribute]);
            })
            .on("mouseout", function(d) {
                d3.select("#tooltip").style("opacity", 0);
            });
    });
}
function updateWeatherChartForStation(stationId) {
    var weatherAttributes = ["temperature", "pressure", "humidity", "wind_direction", "wind_speed"];

    weatherAttributes.forEach(function(attribute) {
        var svg = d3.select("#chart-" + attribute).select("svg").select("g");

        // Obtener datos actualizados para la estación seleccionada
        d3.csv("data/daily_meo_output.csv").then(function(data) {
            data = data.filter(function(d) {
                return d.station_id === stationId;
            });

            var parseTime = d3.timeParse("%Y-%m-%d");
            data.forEach(function(d) {
                d.date = parseTime(d.date);
                d[attribute] = +d[attribute];
            });

            // Actualizar dominios y ejes
            x.domain(d3.extent(data, function(d) { return d.date; })).nice();
            if (attribute === "wind_direction") {
                y.domain([0, 90, 180, 270, 360]);
            } else {
                y.domain(d3.extent(data, function(d) { return d[attribute]; })).nice();
            }

            // Seleccionar el grupo SVG y aplicar transiciones a los ejes
            svg.select(".x.axis")
                .transition()
                .duration(500)
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

            svg.select(".y.axis")
                .transition()
                .duration(500)
                .call(d3.axisLeft(y).ticks(7));

            // Actualizar la línea
            var line = d3.line()
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d[attribute]); });

            var path = svg.selectAll(".line")
                .data([data]);

            // Eliminar línea antigua y agregar nueva
            path.exit().remove();

            path.enter()
                .append("path")
                .attr("class", "line")
                .merge(path)
                .transition()
                .duration(500)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5);

            // Actualizar puntos
            var dots = svg.selectAll(".dot")
                .data(data);

            // Eliminar puntos antiguos
            dots.exit().remove();

            // Añadir nuevos puntos
            dots.enter()
                .append("circle")
                .attr("class", "dot")
                .merge(dots) // Fusionar puntos nuevos y existentes
                .transition()
                .duration(500)
                .attr("r", 5)
                .attr("cx", function(d) { return x(d.date); })
                .attr("cy", function(d) { return y(d[attribute]); })
                .style("fill", "red")
                .style("opacity", 0)
                .on("mouseover", function(d) {
                    var tooltip = d3.select("#tooltip")
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 20) + "px")
                        .style("opacity", 0.9);
                    tooltip.html("Fecha: " + formatDate(d.date) + "<br/>" +
                        "Valor de " + attribute + ": " + d[attribute]);
                })
                .on("mouseout", function(d) {
                    d3.select("#tooltip").style("opacity", 0);
                });
        });
    });
}



//=======================================================================================================
//VIZUALIZACION DE MAPA
//
// Create an SVG element to contain the map
// Define the dimensions of the map
const width_MAP = 800;
const height_MAP = 1100;

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
    .scale(15000) // Adjust the scale to fit the map size
    .translate([width_MAP / 2.5, height_MAP / 2.5]);

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
            .attr("fill", "#c6dbef")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("fill", "#9ecae1")
                    .attr("stroke-width", 2);
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("fill", "#c6dbef")
                    .attr("stroke-width", 1);
            });
    })
    .catch(error => console.error('Error loading or parsing data:', error));
// Función para cargar los datos y actualizar los puntos en el mapa según la fecha seleccionada
function updateMapWithDate(selectedDate, stationData) {
    // Cargar los datos de AQI general por día
    d3.csv("data/aqi_general_for_day.csv").then(function(aqiData) {
        // Filtrar los datos de AQI para la fecha seleccionada
        var filteredData = aqiData.filter(function(d) {
            return d.date === selectedDate;
        });

        // Crear un objeto para mapear AQI a colores
        var aqiColorScale = d3.scaleOrdinal()
            .domain([1, 2, 3, 4, 5, 6])
            .range(["rgb(0, 128, 0)", "rgb(238, 176, 9)", "rgb(250, 145, 74)", 
                    "rgb(255, 0, 0)", "rgb(128, 0, 128)", "rgb(165, 42, 42)"]);

        // Actualizar los círculos en el mapa con los nuevos datos de AQI
        g.selectAll(".station-circle")
            .data(stationData)
            .join("circle")
            .attr("class", "station-circle")
            .attr("cx", function(d) {
                return projection([+d.longitude, +d.latitude])[0]; // Coordenada x del centro del círculo
            })
            .attr("cy", function(d) {
                return projection([+d.longitude, +d.latitude])[1]; // Coordenada y del centro del círculo
            })
            .attr("r", 5) // Radio inicial del círculo
            .style("fill", function(d) {
                // Obtener AQI para esta estación en la fecha seleccionada
                var aqiValue = filteredData.find(function(aqi) {
                    return aqi.stationId === d.stationId;
                }).AQI_general;
                // Devolver el color correspondiente según el AQI
                return aqiColorScale(aqiValue);
            })
            .style("opacity", 0.8) // Opacidad del círculo
            .on("mouseover", function() {
                d3.select(this)
                    .transition()
                    .duration(200) // Duración de la transición en milisegundos
                    .attr("r", 7); // Nuevo radio al pasar el mouse sobre el círculo
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200) // Duración de la transición en milisegundos
                    .attr("r", 5); // Restaurar el radio original al quitar el mouse del círculo
            })
            .on("click", function(d) {
                var stationId = d.stationId;
                console.log("Haz clic en la estación AQI:", stationId);
                updateChartsForStation(stationId); // Actualizar gráficos con la nueva estación
            });

    }).catch(function(error) {
        console.log("Error al cargar los datos de AQI CSV:", error); // Manejar errores de carga de datos de AQI
    });
}

// Función para obtener una fecha aleatoria dentro del rango disponible en el dataset
function getRandomDate(data) {
    var dates = data.map(function(d) { return d.date; });
    var randomDate = dates[Math.floor(Math.random() * dates.length)];
    return randomDate;
}

// Cargar los datos de latitud y longitud de las estaciones de AQ
d3.csv("data/lat_lon_beijijng_aq.csv").then(function(stationData) {
    // Verificar que los datos se están cargando correctamente
    console.log("Datos de estaciones cargados:", stationData);

    // Cargar los datos de AQI general por día
    d3.csv("data/aqi_general_for_day.csv").then(function(aqiData) {
        // Obtener una fecha aleatoria del dataset de AQI al inicio
        var randomDate = getRandomDate(aqiData);
        console.log("Fecha aleatoria inicial seleccionada:", randomDate);

        // Llamar a la función para actualizar los círculos con la fecha aleatoria inicial
        updateMapWithDate(randomDate, stationData);

        // Configuración del datepicker
        $("#datepicker").datepicker({
            dateFormat: "yy-mm-dd",
            minDate: new Date("2017-01-01"),
            maxDate: new Date("2018-01-31"),
            onSelect: function(date) {
                console.log("Fecha seleccionada:", date);
                // Llamar a la función para actualizar los círculos con la nueva fecha seleccionada
                updateMapWithDate(date, stationData);
            }
        });

        // Agregar los círculos al mapa inicialmente con la fecha aleatoria inicial
        var width = 600; // Ajusta según el tamaño deseado
        var height = 400; // Ajusta según el tamaño deseado

        var projection = d3.geoMercator()
            .center([116.3975, 39.9085])
            .scale(100000)
            .translate([width / 2, height / 2]);

        var svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        var g = svg.append("g");

    }).catch(function(error) {
        console.log("Error al cargar los datos de AQI CSV:", error); // Manejar errores de carga de datos de AQI
    });

}).catch(function(error) {
    console.log("Error al cargar los datos de estaciones CSV:", error); // Manejar errores de carga de datos de estaciones
});

// Cargar los datos de latitud y longitud de las estaciones de ME0
d3.csv("data/lat_lon_beijijng_meo.csv").then(function(data) {
    // Agregar las imágenes al mapa
    g.selectAll(".data-image")
        .data(data)
        .enter()
        .append("image")
        .attr("class", "data-image")
        .attr("x", function(d) {
            // Proyectar la longitud en el sistema de coordenadas del mapa
            return projection([+d.longitude, +d.latitude])[0] - 15; // Ajusta la posición en x para centrar la imagen
        })
        .attr("y", function(d) {
            // Proyectar la latitud en el sistema de coordenadas del mapa
            return projection([+d.longitude, +d.latitude])[1] - 15; // Ajusta la posición en y para centrar la imagen
        })
        .attr("station-label", function(d) {
            return d.stationId; // Ajusta esto según tu estructura de datos
        })
        .attr("width", 20) // Ancho de la imagen
        .attr("height", 20) // Altura de la imagen
        .attr("xlink:href", "img/mark_meo.png") // Ruta a la imagen que deseas cargar
        .on("mouseover", function(d) {
            var stationId = d.stationId; // Obtener el station_id desde los datos
            var formattedId = formatStationId(stationId);
            d3.select(this)
            .transition()
            .attr("width", 30) // Cambiar el ancho al pasar el mouse
            .attr("height", 30); // Cambiar la altura al pasar el mouse

            // Mostrar el tooltip
            d3.select("#tooltip")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 20) + "px")
                .style("opacity", 0.9)
                .html("Estación de Meo: " + formattedId);
        })
        .on("mouseout", function() {
            // Ocultar el tooltip al quitar el mouse
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this)
            .transition()
            .attr("width", 20) // Restaurar el ancho al quitar el mouse
            .attr("height", 20);
        })   
        .on("click", function(d) {
            var stationId = d.stationId;
            console.log("Haz clic en la imagen de la estación ME0:", stationId);
            updateWeatherChartForStation(stationId); // Actualizar gráficos con la nueva estación

        });
});

