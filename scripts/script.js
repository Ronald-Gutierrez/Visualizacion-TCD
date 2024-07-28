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
function drawAndUpdateChartsPollutionForHour(date, stationId, variable) {
    // Limpiar el contenedor antes de dibujar el nuevo gráfico
    d3.select("#chart-hour-pollution").selectAll("*").remove();

    // Crear el nuevo SVG para el gráfico por hora
    var svg = d3.select("#chart-hour-pollution").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Filtrar los datos por la fecha y la estación
    d3.csv("data/hour_beijing_17_18_aq.csv").then(function(hourlyData) {
        var parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

        // Filtrar datos para la estación seleccionada y la fecha seleccionada
        hourlyData = hourlyData.filter(function(d) {
            return d.stationId === stationId && formatDate(parseDateTime(d.date + " " + d.time)) === formatDate(date);
        });

        hourlyData.forEach(function(d) {
            d.date = parseDateTime(d.date + " " + d.time);
            d[variable] = +d[variable];
        });

        // Escala temporal para el gráfico por hora
        var xHour = d3.scaleTime()
            .range([0, width])
            .domain(d3.extent(hourlyData, function(d) { return d.date; })).nice();

        // Escala lineal para el eje Y
        var yHour = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(hourlyData, function(d) { return d[variable]; })]).nice();

        // Línea de la serie temporal por hora
        var line = d3.line()
            .x(function(d) { return xHour(d.date); })
            .y(function(d) { return yHour(d[variable]); });

        // Añadir la línea al gráfico
        svg.append("path")
            .datum(hourlyData)
            .attr("class", "line")
            .attr("d", line)
            .style("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", 1.5);

        // Ejes
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xHour).tickFormat(d3.timeFormat("%H:%M")));

        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yHour).ticks(7));

    });
}
var currentStationId = "yufa_aq"; // Variable global para almacenar la estación actual


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
    var stationId = "yufa_aq"; // Por ejemplo, asegúrate de definirlo adecuadamente

    d3.csv("data/real-daily_aqi_output.csv").then(function(csvData) {
        data = csvData; // Asignar los datos cargados a la variable global

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
            updateHourlyChartForStation(selectedRange, stationId, variable);
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
                // drawHourlyChart(variable, "popup-chart-container", stationId, d.date);

                drawAndUpdateChartsPollutionForHour(d.date, d.stationId, variable);
                updateOtherCharsMeteorogical(d.date);
                // Restaurar todos los puntos al tamaño original y eliminar el borde amarillo
                d3.selectAll(".dot")
                    .attr("r", 3)
                    .style("stroke", null);
            
                // Si el punto no estaba ampliado, ampliarlo y resaltar otros puntos
                if (!isEnlarged) {
                    showTimeSeries(d.date);
                    updateOtherCharts(d.date,d.stationId);
                    
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
    
    function updateHourlyChartForStation(selectedRange, stationId, variable) {
        d3.csv("data/hour_beijing_17_18_aq.csv").then(function(hourlyData) {
            // Filtrar datos para la estación seleccionada
            hourlyData = hourlyData.filter(function(d) {
                return d.stationId === stationId;
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
    
            // Limpiar el contenedor antes de dibujar el nuevo gráfico
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
    
            // Escala lineal para el eje Y
            var yHour = d3.scaleLinear()
                .range([height, 0])
                .domain([0, d3.max(filteredData, function(d) { return d[variable]; })]).nice();
    
            // Línea de la serie temporal por hora
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



function updateChartsForStation(stationId) {
    variables.forEach(function(variable) {
        var svg = d3.select("#chart-" + variable).select("svg").select("g");

        // Obtener datos actualizados para la estación seleccionada
        d3.csv("data/real-daily_aqi_output.csv").then(function(data) {
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
                
                var isEnlarged = clickedCircle.attr("r") == 1;
                // Restaurar todos los puntos al tamaño original y eliminar el borde amarillo
                d3.selectAll(".dot")
                    .attr("r", 3)
                    .style("stroke", null);
            
                // Si el punto no estaba ampliado, ampliarlo y resaltar otros puntos
                if (!isEnlarged) {
                    showTimeSeries(d.date);
                    updateOtherCharts(d.date,d.stationId);
                    // drawCorrelationPollutions(d.date,d.stationId);
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
            // drawCorrelationPollutions(d.date,d.stationId);
    
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

function updateOtherCharts(date, stationId) {
    // Parsea la fecha si es una cadena
    var selectedDate = (typeof date === 'string') ? new Date(date) : date;

    // Vuelve al tamaño original todos los puntos de todas las gráficas y elimina el borde amarillo
    d3.selectAll(".dot")
        .attr("r", 3)
        .style("stroke", null);

    // Selecciona todos los puntos con la misma fecha en todas las gráficas y los resalta
    d3.selectAll(".dot")
        .filter(function(d) {
            // Asegúrate de que d.date sea un objeto Date
            var dotDate = (typeof d.date === 'string') ? new Date(d.date) : d.date;
            return dotDate && dotDate.getTime() === selectedDate.getTime();
        })
        .attr("r", 15)
        .style("stroke", "yellow");

    // Implementa la lógica para resaltar la fecha seleccionada en otras gráficas
    console.log("Actualizar otras gráficas para la fecha: " + formatDate(selectedDate));
    drawCorrelationPollutions(selectedDate, stationId);
}

function drawCorrelationPollutions(date, stationId) {
    console.log("Estación:", stationId);
    console.log("Fecha:", date);

    d3.csv("data/hour_beijing_17_18_aq.csv").then(function(data) {
        // Filtrar los datos por fecha y estación
        data = data.filter(function(d) {
            return d.stationId === stationId && d.date === formatDate(date); // Asegúrate de tener la fecha en el formato correcto
        });

        // Obtener los nombres de los contaminantes
        var pollutants = ["PM2_5", "PM10", "NO2", "CO", "O3", "SO2"];

        // Crear una matriz de datos para calcular la correlación
        var matrix = [];
        pollutants.forEach(function(pollutant1) {
            var row = [];
            pollutants.forEach(function(pollutant2) {
                // Obtener los valores de los contaminantes
                var values1 = data.map(function(d) { return +d[pollutant1]; });
                var values2 = data.map(function(d) { return +d[pollutant2]; });

                // Calcular la correlación de Pearson
                var correlation = pearsonCorrelation(values1, values2);

                // Añadir el valor de correlación a la fila
                row.push(correlation);
            });
            // Añadir la fila a la matriz
            matrix.push(row);
        });

        // Renderizar la matriz de correlación usando D3.js
        var chartContainer = d3.select("#chart-hour-correlation .chart-hour-correlation");
        renderCorrelationMatrix(matrix, pollutants, chartContainer);
    });
}

// Función para calcular la correlación de Pearson
function pearsonCorrelation(x, y) {
    var sumX = 0;
    var sumY = 0;
    var sumXY = 0;
    var sumX2 = 0;
    var sumY2 = 0;

    var n = x.length;

    for (var i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    var numerator = sumXY - (sumX * sumY / n);
    var denominator = Math.sqrt((sumX2 - sumX * sumX / n) * (sumY2 - sumY * sumY / n));

    if (denominator === 0) return 0;

    return numerator / denominator;
}
// Función para renderizar la matriz de correlación
function renderCorrelationMatrix(matrix, pollutants, container) {
    // Limpiar el contenedor antes de renderizar
    container.selectAll("*").remove();

    // Configurar la escala de color para la matriz de correlación
    var colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
        .domain([-1, 1]);

    // Configurar el tamaño de la celda y el margen
    var cellSize = 28;
    var margin = { top: 40, right: 20, bottom: 20, left: 45 }; // Aumentar margen para los nombres

    // Calcular el tamaño del contenedor
    var size = (pollutants.length * cellSize);

    // Configurar el lienzo SVG
    var svg = container.append("svg")

        .attr("width", size + margin.left + margin.right)
        .attr("height", size + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Configurar el texto de los contaminantes para las filas
    var textRow = svg.selectAll(".pollutantRow")
        .data(pollutants)
        .enter().append("text")
        .text(function(d) { return d; })
        .attr("x", -6)
        .attr("y", function(d, i) { return i * cellSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
        .style("font-size", "10px"); // Ajustar tamaño de fuente aquí

    // Configurar el texto de los contaminantes para las columnas
    var textCol = svg.selectAll(".pollutantCol")
        .data(pollutants)
        .enter().append("text")
        .text(function(d) { return d; })
        .attr("x", 0)
        .attr("y", function(d, i) { return i * cellSize; })
        .style("text-anchor", "start")
        .attr("transform", "translate(" + cellSize / 1.5 + ", -6) rotate(-90)")
        .style("font-size", "10px"); // Ajustar tamaño de fuente aquí

    // Configurar los rectángulos de la matriz de correlación con texto de correlación
    var rect = svg.selectAll(".rect")
        .data(matrix)
        .enter().append("g")
        .selectAll("rect")
        .data(function(d, i) { return d.map(function(value, j) { return {row: i, col: j, value: value}; }); })
        .enter().append("rect")
        .attr("class", "rect")
        .attr("x", function(d) { return d.col * cellSize; })
        .attr("y", function(d) { return d.row * cellSize; })
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", function(d) { return colorScale(d.value); })
        .append("title")
        .text(function(d) { return "Correlación: " + d.value.toFixed(2); });

    // Añadir texto de correlación dentro de cada rectángulo
    rect.append("text")
        .attr("x", cellSize / 2)
        .attr("y", cellSize / 2)
        .attr("dy", "0.3em")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "10px") // Ajustar tamaño de fuente aquí
        .text(function(d) { return d.value.toFixed(2); });

    // // Añadir título
    // svg.append("text")
    //     .attr("x", (size + margin.left + margin.right) / 2)
    //     .attr("y", -margin.top / 2)
    //     .attr("text-anchor", "middle")
    //     .text("Matriz de Correlación de Contaminantes");

    // // Añadir leyenda de colores
    // var legend = svg.append("g")
    //     .attr("id", "legend-container")
    //     .attr("transform", "translate(" + (size + margin.left + margin.right - 100) + "," + margin.top + ")");

    // var legendScale = d3.scaleLinear()
    //     .domain([-1, 1])
    //     .range([0, 100]);

    // var legendAxis = d3.axisRight(legendScale)
    //     .tickSize(13)
    //     .ticks(5);

    // legend.append("image")
    //     .attr("xlink:href", "img/logo-corr.png")
    //     .attr("width", 24)
    //     .attr("height", 15)
    //     .attr("transform", "translate(0, -10)");

    // legend.append("text")
    //     .attr("x", 30)
    //     .attr("y", 0)
    //     .text("Leyenda de Correlación");

    // legend.append("g")
    //     .attr("transform", "translate(30,20)")
    //     .call(legendAxis);
}





//=======================================================================================================
//VIZUALIZACION DE METOROLOGIA
//
var weatherAttributes = ["temperature", "pressure", "humidity", "wind_direction", "wind_speed"];
weatherAttributes.forEach(function(attribute) {
    drawWeatherChart(attribute, "chart-" + attribute);
});

function updateOtherCharsMeteorogical(date) {
    // Vuelve al tamaño original todos los puntos de todas las gráficas y elimina el borde amarillo
    d3.selectAll(".dot")
        .attr("r", 3)
        .style("stroke", null);

    // Remueve cualquier línea vertical previamente agregada
    d3.selectAll(".highlight-line").remove();

    // Parsea la fecha si es una cadena
    var selectedDate = (typeof date === 'string') ? new Date(date) : date;

    // Selecciona todos los puntos con la misma fecha en todas las gráficas y los resalta
    d3.selectAll(".dot")
        .filter(function(d) {
            // Asegúrate de que d.date sea un objeto Date
            var dotDate = (typeof d.date === 'string') ? new Date(d.date) : d.date;
            return dotDate && dotDate.getTime() === selectedDate.getTime();
        })
        .attr("r", 15)
        .style("stroke", "yellow");

    // Añade una línea vertical en la fecha seleccionada para identificarla visualmente en los gráficos meteorológicos
    d3.selectAll(".chart").each(function() {
        var svg = d3.select(this).select("svg").select("g");
        var cx = x(selectedDate);

        // Agregar la línea vertical
        var line = svg.append("line")
            .attr("class", "highlight-line")
            .attr("x1", cx)
            .attr("y1", 0)
            .attr("x2", cx)
            .attr("y2", height)
            .style("stroke", "red")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "3, 3")
            .on("click", function() {
                console.log("Haz clic en la línea para la fecha: " + formatDate(selectedDate));
            })
            .on("mouseover", function() {
                tooltip.style("visibility", "visible");
            })
            .on("mousemove", function() {
                tooltip.style("left", (d3.event.pageX + 10) + "px")
                       .style("top", (d3.event.pageY - 15) + "px")
                       .html("Fecha: " + formatDate(selectedDate));
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });

        // Mostrar tooltip con información
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("visibility", "hidden")
            .html("Fecha: " + formatDate(selectedDate));
    });

    console.log("Actualizar otras gráficas para la fecha: " + formatDate(selectedDate));
}



function drawWeatherChart(attribute, containerId,stationId) {
    // Limpiar el contenedor antes de dibujar el nuevo gráfico
    d3.select("#" + containerId).select("svg").remove();

    var svg = d3.select("#" + containerId)
        .append("svg")
        .attr("class", "weather-chart")
        .attr("data-attribute", attribute) // Añadir atributo de datos
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
            .on("click", function(d) { // Agregar evento de clic
                console.log("Estación:", d.station_id);
                console.log("Atributo:", attribute);
                console.log("Fecha:", d.date);
                console.log("Valor:", d[attribute]);
                drawHourForStationMeteorological(d.date, d.station_id, attribute);

            })
            .on("mouseover", function(d) {
                var tooltip = d3.select("#tooltip")
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("opacity", 0.9);
                tooltip.html("Fechas: " + formatDate(d.date) + "<br/>" +
                    "Valor de " + attribute + ": " + d[attribute]);
            })

            .on("mouseout", function(d) {
                d3.select("#tooltip").style("opacity", 0);
            });
    });
}

//////////////////////

function drawHourForStationMeteorological(date, stationId, attribute) {
    d3.csv("data/hour_meo_output.csv").then(function(data) {
        // Filtrar los datos por fecha y estación
        data = data.filter(function(d) {
            return d.stationId === stationId && d.date === formatDate(date); // Asegúrate de tener la fecha en el formato correcto
        });

        // Parsear la hora si es necesario
        var parseHour = d3.timeParse("%H:%M:%S");

        data.forEach(function(d) {
            d.time = parseHour(d.time); // Parsear la hora si es necesario
            d[attribute] = +d[attribute];
        });

        // Llamar a una función para dibujar el nuevo gráfico por hora
        drawHourChart(data, attribute);
    });
}

function drawHourChart(data, attribute) {
    // Limpiar el contenedor antes de dibujar el nuevo gráfico
    d3.select("#chart-hour-meteorological").select("svg").remove();
    var margin = { top: 20, right: 20, bottom: 30, left: 50 };
    var width = 900 - margin.left - margin.right;
    var height = 100 - margin.top - margin.bottom;

    var svg = d3.select("#chart-hour-meteorological")
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

    // Definir dominios y escalas
    var xHour = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.time; }))
        .range([0, width]);

    var yHour = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d[attribute]; }))
        .nice()
        .range([height, 0]);

    // Añadir ejes
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xHour));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yHour));

    // Definir la línea
    var line = d3.line()
        .x(function(d) { return xHour(d.time); })
        .y(function(d) { return yHour(d[attribute]); });

    // Dibujar la línea
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Añadir tooltips u otras interacciones si las necesitas
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 5)
        .attr("cx", function(d) { return xHour(d.time); })
        .attr("cy", function(d) { return yHour(d[attribute]); })
        .style("fill", "steelblue")
        .style("opacity", 0)
        .on("mouseover", function(d) {
            var tooltip = d3.select("#tooltip")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 20) + "px")
                .style("opacity", 0.9);
            tooltip.html(
                "Valor de " + attribute + ": " + d[attribute]);
        });
}


/////////////////



function updateWeatherChartForStation(stationId) {
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

        });
    });
}


//=======================================================================================================
// VIZUALIZACION DE MAPA
//
// Define las dimensiones del mapa
const width_MAP = 800;
const height_MAP = 1100;

// Crea un elemento SVG para contener el mapa
const svg = d3.select("#map").append("svg")
    .attr("width", width_MAP)
    .attr("height", height_MAP);

// Crea un elemento 'g' para el mapa
const g = svg.append("g");

// Define el comportamiento de zoom
const zoom = d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
});

// Aplica el comportamiento de zoom al elemento SVG
svg.call(zoom);

// Define la proyección para convertir coordenadas GeoJSON a coordenadas de pantalla
const projection = d3.geoMercator()
    .center([116.4074, 39.9042]) // Centra el mapa en Beijing
    .scale(10000) // Ajusta la escala para que quepa en el tamaño del mapa
    .translate([width_MAP / 3.5, height_MAP / 4]);

// Define el generador de ruta para convertir rutas GeoJSON a rutas SVG
const path = d3.geoPath().projection(projection);

// Carga los datos GeoJSON
d3.json("map/beijing.json")
    .then(data => {
        // Enlaza los datos y crea un path por cada entidad GeoJSON
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
    .catch(error => console.error('Error cargando o parseando los datos:', error));

    function updateMapWithDate(selectedDate, stationData) {
        // Carga los datos de AQI general por día
        d3.csv("data/aqi_general_for_day.csv").then(function(aqiData) {
            // Filtra los datos de AQI para la fecha seleccionada
            var filteredData = aqiData.filter(function(d) {
                return d.date === selectedDate;
            });
    
            // Crea un objeto para mapear AQI a colores
            var aqiColorScale = d3.scaleOrdinal()
                .domain([1, 2, 3, 4, 5, 6])
                .range(["rgb(0, 128, 0)", "rgb(238, 176, 9)", "rgb(250, 145, 74)", 
                        "rgb(255, 0, 0)", "rgb(128, 0, 128)", "rgb(165, 42, 42)"]);
    
            // Actualiza las formas en el mapa con los nuevos datos de AQI
            g.selectAll(".station-shape")
                .data(stationData)
                .join("path")
                .attr("class", "station-shape")
                .attr("transform", function(d) {
                    return `translate(${projection([+d.longitude, +d.latitude])})`; // Transforma según la proyección
                })
                .attr("d", function(d) {
                    // Define diferentes formas según la nota
                    switch (d.Notes) {
                        case "Urban":
                            return d3.symbol().type(d3.symbolSquare)();
                        case "Cross Reference":
                            return d3.symbol().type(d3.symbolDiamond)();
                        case "Rural":
                            return d3.symbol().type(d3.symbolCircle)();
                        case "Traffic":
                            return d3.symbol().type(d3.symbolTriangle)();
                        default:
                            return d3.symbol().type(d3.symbolStar)();
                    }
                })
                .attr("fill", function(d) {
                    // Obtén el AQI para esta estación en la fecha seleccionada
                    var aqiValue = filteredData.find(function(aqi) {
                        return aqi.stationId === d.stationId;
                    }).AQI_general;
                    // Devuelve el color correspondiente según el AQI
                    return aqiColorScale(aqiValue);
                })
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .style("opacity", 0.8)
                .on("mouseover", function(d) {
                    var stationId = d.stationId; // Obtén el station_id desde los datos
                    var formattedId = formatStationId(stationId);
                    
                    // Muestra el tooltip
                    d3.select("#tooltip")
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 20) + "px")
                        .style("opacity", 0.9)
                        .html("Estación de AQ: " + formattedId + "<br/>" +
                            "Area: "+ d.Notes+"<br/>" +
                            "AQI: " + filteredData.find(function(aqi) {
                                return aqi.stationId === stationId;
                            }).AQI_general);
                })
                .on("mouseout", function() {
                    // Oculta el tooltip al quitar el mouse
                    d3.select("#tooltip").style("opacity", 0);
                })     
                .on("click", function(d) {
                    var stationId = d.stationId;
                    console.log("Haz clic en la estación AQI:", stationId);
                    updateChartsForStation(stationId); // Actualiza gráficos con la nueva estación
                    evolutionEspatialPCA_All(stationId,selectedDate);
                    
                });
    
        }).catch(function(error) {
            console.log("Error al cargar los datos de AQI CSV:", error); // Maneja errores de carga de datos de AQI
        });
    }
    function updateMapWithDateMeteorological(selectedDate) {
        // Eliminar todas las flechas existentes antes de cargar las nuevas
        g.selectAll(".wind-arrow-group").remove();
    
        // Carga los datos de velocidad y dirección del viento por día
        d3.csv("data/speed_wind_weather_for_day.csv").then(function(windData) {
            // Filtra los datos de viento para la fecha seleccionada
            var filteredWindData = windData.filter(function(d) {
                return d.date === selectedDate;
            });
    
            // Escala para ajustar el tamaño de la flecha según la velocidad del viento
            var windScale = d3.scaleLinear()
                .domain([0, d3.max(filteredWindData, function(d) { return +d.wind_speed; })])
                .range([5, 25]); // Rango de tamaños de flecha
    
            // Crear un grupo para cada estación de monitoreo
            var windArrows = g.selectAll(".wind-arrow-group")
                .data(filteredWindData)
                .join("g")
                .attr("class", "wind-arrow-group")
                .attr("transform", function(d) {
                    var coords = projection([+d.longitude, +d.latitude]);
                    return `translate(${coords[0]}, ${coords[1]}) rotate(${d.wind_direction})`;
                });
    
            // Añadir la línea de la flecha
            windArrows.append("line")
                .attr("class", "wind-arrow-line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", function(d) {
                    return -windScale(d.wind_speed); // Longitud de la línea escalada según la velocidad
                })
                .attr("stroke", "#ff0000")  // Color rojo
                .attr("stroke-width", function(d) {
                    return windScale(d.wind_speed) / 5; // Ancho de la línea escalado
                });
                
    
            // Añadir el triángulo de la punta de la flecha
            windArrows.append("polygon")
                .attr("class", "wind-arrow-head")
                .attr("points", function(d) {
                    var headSize = windScale(d.wind_speed) + 2; // Tamaño de la cabeza escalado
                    return `0,-${headSize} 5,-${headSize - 5} -5,-${headSize - 5}`;
                })
                .attr("fill", "#ff0000");  // Color rojo
                
    
            // Eventos del mouse para mostrar el tooltip
            windArrows
                .on("mouseover", function(d) {
                    // Mostrar el tooltip con la dirección y velocidad del viento para ese día
                    d3.select("#tooltip")
                        .style("left", (d3.pageX + 10) + "px")
                        .style("top", (d3.pageY - 20) + "px")
                        .style("opacity", 0.9)
                        .html("Dirección del Viento: " + d.wind_direction + "°<br/>" +
                              "Velocidad del Viento: " + d.wind_speed + " m/s" +"°<br/>" +
                                "Clima: " + d.weather);
                })
                
                .on("mouseout", function() {
                    // Ocultar el tooltip al quitar el mouse
                    d3.select("#tooltip").style("opacity", 0);
                });
        }).catch(function(error) {
            console.log("Error al cargar los datos de viento CSV:", error); // Maneja errores de carga de datos de viento
        });
    }
    
    
    
    
// Función para obtener una fecha aleatoria dentro del rango disponible en el dataset
function getRandomDate(data) {
    var dates = data.map(function(d) { return d.date; });
    var randomDate = dates[Math.floor(Math.random() * dates.length)];
    return randomDate;
}

// Carga los datos de latitud y longitud de las estaciones de AQ
d3.csv("data/lat_lon_beijijng_aq.csv").then(function(stationData) {
    // Verifica que los datos se están cargando correctamente
    console.log("Datos de estaciones cargados:", stationData);

    // Carga los datos de AQI general por día
    d3.csv("data/aqi_general_for_day.csv").then(function(aqiData) {
        // Obtiene una fecha aleatoria del dataset de AQI al inicio
        var randomDate = getRandomDate(aqiData);
        console.log("Fecha aleatoria inicial seleccionada:", randomDate);

        // Llama a la función para actualizar las formas con la fecha aleatoria inicial
        updateMapWithDate(randomDate, stationData);
        updateMapWithDateMeteorological(randomDate);
        // Configuración del datepicker
        $("#datepicker").datepicker({
            dateFormat: "yy-mm-dd",
            minDate: new Date("2017-01-01"),
            maxDate: new Date("2018-01-31"),
            onSelect: function(date) {
                console.log("Fecha seleccionada:", date);
                // Llama a la función para actualizar las formas con la nueva fecha seleccionada
                updateMapWithDate(date, stationData);
                updateMapWithDateMeteorological(date);
            }
        });

    }).catch(function(error) {
        console.log("Error al cargar los datos de AQI CSV:", error); // Maneja errores de carga de datos de AQI
    });

}).catch(function(error) {
    console.log("Error al cargar los datos de estaciones CSV:", error); // Maneja errores de carga de datos de estaciones
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
            var date = $("#datepicker").datepicker("getDate");
            console.log("Haz clic en la imagen de la estación ME0:", stationId, "para la fecha:", date);
            updateWeatherChartForStation(stationId); // Actualizar gráficos con la nueva estación

        });
        // updateMapWithDateMeteorological(date);
});

///////////////// GRAFICOS PARA COMPARACION DE CONTAMINANTES.
///////////////////////////
// Cargar los datos CSV usando D3.js
d3.csv("data/hour_beijing_17_18_aq.csv").then(function(data) {
    // Función para convertir fechas y valores de contaminantes
    var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    data.forEach(function(d) {
        d.date = parseDate(d.date + " " + d.time); // Combinar fecha y hora
        d.PM2_5 = +d.PM2_5;
        d.PM10 = +d.PM10;
        d.NO2 = +d.NO2;
        d.CO = +d.CO;
        d.O3 = +d.O3;
        d.SO2 = +d.SO2;
    });

    // Extraer las estaciones únicas de los datos
    var stations = d3.map(data, function(d) { return d.stationId; }).keys();

    // Ordenar las estaciones alfabéticamente (opcional)
    stations.sort();

    // Selección del elemento <select> de estaciones
    var stationSelect1 = d3.select("#station");
    var stationSelect2 = d3.select("#station2");

    // Agregar opciones de estación al elemento <select> para ambas estaciones
    [stationSelect1, stationSelect2].forEach(function(select) {
        select.selectAll("option")
            .data(stations)
            .enter().append("option")
            .attr("value", function(d) { return d; })
            .text(function(d) { return formatStationName(d); });
    });

    // Función para formatear el nombre de la estación
    function formatStationName(stationId) {
        // Convertir la inicial a mayúscula y quitar "_aq" al final
        var formattedName = stationId.charAt(0).toUpperCase() + stationId.slice(1).replace(/_aq$/, "");
        return "Estación " + formattedName;
    }

    // Función para dibujar el gráfico de línea
    function drawLineChart(selectedContaminants, selectedStation, startDate, endDate, chartId) {
        // Filtrar datos para la estación seleccionada y rango de fechas
        var filteredData = data.filter(function(d) {
            return d.stationId === selectedStation &&
                (!startDate || d.date >= startDate) &&
                (!endDate || d.date <= endDate);
        });

        // Configurar dimensiones y márgenes del gráfico
        var margin = { top: 10, right: 70, bottom: 50, left: 20 };
        var width = 690 - margin.left - margin.right;
        var height = 180 - margin.top - margin.bottom;

        // Remover gráfico anterior si existe
        d3.select(chartId).selectAll("*").remove();

        // Crear el lienzo SVG
        var svg = d3.select(chartId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Crear escalas x e y
        var xScale = d3.scaleTime()
            .domain(d3.extent(filteredData, function(d) { return d.date; }))
            .range([0, width]);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, function(d) {
                var maxVal = 0;
                selectedContaminants.forEach(function(contaminant) {
                    maxVal = Math.max(maxVal, d[contaminant]);
                });
                return maxVal;
            })])
            .nice()
            .range([height, 0]);

        // Configurar el eje x e y
        var xAxis = d3.axisBottom(xScale);
        var yAxis = d3.axisLeft(yScale);

        // Añadir líneas y puntos al lienzo para cada contaminante seleccionado
        selectedContaminants.forEach(function(contaminant) {
            // Crear línea
            svg.append("path")
                .datum(filteredData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", contaminantColor(contaminant))
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(function(d) { return xScale(d.date); })
                    .y(function(d) { return yScale(d[contaminant]); })
                );

            // Añadir puntos con tooltips
            svg.selectAll(".dot-" + contaminant)
                .data(filteredData)
                .enter().append("circle")
                .attr("class", "dot-" + contaminant)
                .attr("r", 3) // Tamaño reducido de los puntos
                .attr("cx", function(d) { return xScale(d.date); })
                .attr("cy", function(d) { return yScale(d[contaminant]); })
                .style("fill", contaminantColor(contaminant))
                .style("stroke", "#fff")
                .style("stroke-width", 1)
                .on("mouseover", function(d) {
                    // Mostrar tooltip al pasar el cursor
                    var tooltipText = "Fecha: " + d3.timeFormat("%Y-%m-%d %H:%M:%S")(d.date) + "<br>" +
                                      "Contaminante: " + contaminant + "<br>" +
                                      "Valor: " + d[contaminant];
                    showTooltip(tooltipText);
                })
                .on("mouseout", function() {
                    // Ocultar tooltip al quitar el cursor
                    hideTooltip();
                });
        });

        // Añadir ejes x e y
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // Añadir etiqueta al eje y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            // .text("Niveles de Contaminante");

        // Añadir título al gráfico
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            // .text("Estacion " + formatStationName(selectedStation));

        // Función para asignar colores a cada contaminante
        function contaminantColor(contaminant) {
            // Definir colores según el contaminante
            switch (contaminant) {
                case "PM2_5":
                    return "blue";
                case "PM10":
                    return "green";
                case "SO2":
                    return "red";
                case "NO2":
                    return "orange";
                case "CO":
                    return "purple";
                case "O3":
                    return "brown";
                default:
                    return "black";
            }
        }

        // Función para mostrar tooltips
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        function showTooltip(text) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(text)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        }

        function hideTooltip() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }
    }

    // Función para manejar el cambio en la selección de contaminantes y fechas
    function updateChart() {
        var selectedContaminants = [];
        d3.selectAll("input[name='contaminante']:checked").each(function() {
            selectedContaminants.push(this.value);
        });
    
        var selectedStation1 = d3.select("#station").node().value;
        var selectedStation2 = d3.select("#station2").node().value;
        var startDate = null, endDate = null;
    
        // Verificar si se ha seleccionado un rango de fechas
        if (d3.select("input[name='date-range']:checked").node().value === "date-range") {
            startDate = new Date(d3.select("#start-date").node().value);
            endDate = new Date(d3.select("#end-date").node().value);
    
            // Agregar un día al inicio del rango de fechas
            startDate.setDate(startDate.getDate() + 1);
            // Disminuir un día al final del rango de fechas
            endDate.setDate(endDate.getDate() + 1);
        } else {
            startDate = new Date(d3.select("#specific-date").node().value);
            startDate.setDate(startDate.getDate() + 1); // Restar un día
            endDate = new Date(startDate);
        }
    
        // Ajustar las fechas para incluir todas las horas del día seleccionado
        startDate.setHours(0, 0, 0, 0); // Establecer hora mínima para la fecha de inicio
        endDate.setHours(23, 59, 59, 999); // Establecer hora máxima para la fecha de fin
    
        // Llamar a la función para dibujar el gráfico con los parámetros seleccionados
        drawLineChart(selectedContaminants, selectedStation1, startDate, endDate, "#chart-for-hour-compare");
        drawLineChart(selectedContaminants, selectedStation2, startDate, endDate, "#chart-for-hour-compare2");
    }

    // Escuchar cambios en la selección de contaminantes y fechas
    d3.selectAll("input[name='contaminante'], input[name='date-range']").on("change", updateChart);

    // Llamar a la función inicialmente con los valores por defecto
    updateChart();
});

// // // // // // // // // // // // // // // // // // // // // // // // 
// ANALISIS DE LA EVOLUCION ESPACIAL, PCA POR ESTACION AL HACER CLICK EN EL MAPA

// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
function evolutionEspatialPCA_All(stationId, selectedDate) {
    console.log("Estacion seleccionada: ", stationId, "PCA");

    d3.csv("data/PCA_VIZ_AQI.csv").then(data => {
        // Filtra los datos por stationId
        const filteredData = data.filter(d => d.stationId === stationId);

        // Borra cualquier gráfico existente excepto el título
        d3.select(".chart-pca").selectAll("*").remove();

        // Configura las dimensiones y márgenes del gráfico
        const margin = { top: 10, right: 30, bottom: 40, left: 20 },
              width = 400 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Añade el SVG
        const svg = d3.select(".chart-pca")
                      .append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", `translate(${margin.left},${margin.top})`);

        // Configura los ejes
        const x = d3.scaleLinear()
                    .domain(d3.extent(filteredData, d => +d.PC1))
                    .range([0, width]);

        const y = d3.scaleLinear()
                    .domain(d3.extent(filteredData, d => +d.PC2))
                    .range([height, 0]);

        svg.append("g")
           .attr("transform", `translate(0,${height})`)
           .call(d3.axisBottom(x));

        svg.append("g")
           .call(d3.axisLeft(y));

        // Define la escala de colores para el AQI
        const colorScale = d3.scaleOrdinal()
                             .domain([1, 2, 3, 4, 5, 6])
                             .range([
                                 "rgb(0, 128, 0)",   // Excelente
                                 "rgb(238,176,9)",   // Bueno
                                 "rgb(250,145,74)",  // Ligeramente
                                 "rgb(255, 0, 0)",   // Moderadamente
                                 "rgb(128, 0, 128)", // Fuerte
                                 "rgb(165, 42, 42)"  // Severo
                             ]);

        // Añade los puntos
        svg.selectAll("circle")
           .data(filteredData)
           .enter()
           .append("circle")
           .attr("cx", d => x(+d.PC1))
           .attr("cy", d => y(+d.PC2))
           .attr("r", 5)
           .style("fill", d => colorScale(+d.AQI));

        // Añade el tooltip
        const tooltip = d3.select("body").append("div")
                          .attr("class", "tooltip")
                          .style("opacity", 0);
        // Añadir interactividad al pasar el mouse por los puntos


        svg.selectAll("circle")
           .on("click", (event, d) => {
               console.log("Fecha seleccionada: ", d.date || 'N/A', d.time || 'N/A');
               evolutionEspatialPCA_For_Day(stationId, selectedDate);
           });
    });
}

function evolutionEspatialPCA_For_Day(stationId, selectedDate) {
    console.log("Estacion seleccionada: ", stationId, "Fecha seleccionada: ", selectedDate, "PCA");

    d3.csv("data/data_tsne_real.csv").then(data => {
        // Filtra los datos por stationId y por la fecha seleccionada
        const filteredData = data.filter(d => d.stationId === stationId && d.date === selectedDate);

        // Borra cualquier gráfico existente excepto el título
        d3.select(".chart-pca").selectAll("*:not(.chart-title)").remove();

        // Configura las dimensiones y márgenes del gráfico
        const margin = { top: 10, right: 30, bottom: 40, left: 20 },
              width = 400 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Añade el SVG
        const svg = d3.select(".chart-pca")
                      .append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", `translate(${margin.left},${margin.top})`);

        // Configura los ejes
        const x = d3.scaleLinear()
                    .domain(d3.extent(filteredData, d => +d.PC1))
                    .range([0, width]);

        const y = d3.scaleLinear()
                    .domain(d3.extent(filteredData, d => +d.PC2))
                    .range([height, 0]);

        svg.append("g")
           .attr("transform", `translate(0,${height})`)
           .call(d3.axisBottom(x));

        svg.append("g")
           .call(d3.axisLeft(y));

        // Define la escala de colores para el AQI
        const colorScale = d3.scaleOrdinal()
                             .domain([1, 2, 3, 4, 5, 6])
                             .range([
                                 "rgb(0, 128, 0)",   // Excelente
                                 "rgb(238,176,9)",   // Bueno
                                 "rgb(250,145,74)",  // Ligeramente
                                 "rgb(255, 0, 0)",   // Moderadamente
                                 "rgb(128, 0, 128)", // Fuerte
                                 "rgb(165, 42, 42)"  // Severo
                             ]);

        // Añade los puntos
        svg.selectAll("circle")
           .data(filteredData)
           .enter()
           .append("circle")
           .attr("cx", d => x(+d.PC1))
           .attr("cy", d => y(+d.PC2))
           .attr("r", 5)
           .style("fill", d => colorScale(+d.AQI))
        //    .on("mouseover", (event, d) => {
        //        const xCoord = x(+d.PC1);
        //        const yCoord = y(+d.PC2);

        //        // Asegúrate de que las coordenadas no sean NaN
        //        if (!isNaN(xCoord) && !isNaN(yCoord)) {
        //            tooltip.transition()
        //                   .duration(200)
        //                   .style("opacity", .9);
        //            tooltip.html(`Estación: ${d.stationId}<br/>Fecha: ${d.date} ${d.time}<br/>Coordenadas: (${xCoord.toFixed(2)}, ${yCoord.toFixed(2)})`)
        //                   .style("left", (event.pageX + 5) + "px")
        //                   .style("top", (event.pageY - 28) + "px");
        //        } else {
        //            console.error('Error: Coordenadas no válidas para el punto', d);
        //        }
        //    })
        //    .on("mouseout", () => {
        //        tooltip.transition()
        //               .duration(500)
        //               .style("opacity", 0);
        //    })
        //    .on("click", (event, d) => {
        //        const xCoord = x(+d.PC1);
        //        const yCoord = y(+d.PC2);
        //        console.log("Fecha seleccionada: ", selectedDate);
        //        // Asegúrate de que las coordenadas no sean NaN
        //        if (!isNaN(xCoord) && !isNaN(yCoord)) {
        //            console.log("Fecha seleccionada: ", d.date, d.time);
        //            console.log("Coordenadas del punto: ", xCoord.toFixed(2), yCoord.toFixed(2));
        //            console.log("Estación: ", d.stationId);
        //        } else {
        //            console.error('Error: Coordenadas no válidas para el punto', d);
        //        }
        //    });

        // Añade el tooltip
        const tooltip = d3.select("body").append("div")
                          .attr("class", "tooltip")
                          .style("opacity", 0);
    });
}
