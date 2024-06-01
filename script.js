// Tamaño del gráfico
var margin = { top: 50, right: 20, bottom: 30, left: 40 },
    width = 860 - margin.left - margin.right,
    height = 150 - margin.top - margin.bottom;

// Escala para los ejes X e Y
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// Escala para los colores
var color = d3.scaleOrdinal()
    .domain([1, 2, 3, 4, 5, 6])
    .range(["rgb(0, 128, 0)", "rgb(238,176,9)", "rgb(250,145,74)", "rgb(255, 0, 0)", "rgb(128, 0, 128)", "rgb(165, 42, 42)"]);

// Leyenda de colores
var legendData = [
    { color: "rgb(0, 128, 0)", label: "Excelente" },
    { color: "rgb(238,176,9)", label: "Bueno" },
    { color: "rgb(250,145,74)", label: "Ligeramente" },
    { color: "rgb(255, 0, 0)", label: "Moderadamente" },
    { color: "rgb(128, 0, 128)", label: "Fuerte" },
    { color: "rgb(165, 42, 42)", label: "Severo" }
];

// Variables para los gráficos
var variables = ["PM2_5", "PM10", "SO2", "NO2", "CO", "O3"];

// Función para dibujar cada gráfico
function drawChart(variable, containerId) {
    // Crear SVG para el gráfico
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Añadir título del gráfico
    svg.append("text")
        .attr("x", -margin.left)  // Ajustar el valor de x para mover más a la izquierda
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(variable);


    // Cargar los datos
    d3.csv("data/test.csv").then(function(data) {
        data = data.filter(function(d) {
            return d.stationId === "aotizhongxin_aq";
        });

        var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        data.forEach(function(d) {
            d.utc_time = parseTime(d.utc_time);
            d[variable] = +d[variable];
        });

        // Dominio para los ejes X e Y
        x.domain(d3.extent(data, function(d) { return d.utc_time; })).nice();
        y.domain([0, 6]); // Cambiado a 0-6

        // Agregar ejes X e Y
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y).ticks(7)); // Ticks en incrementos de 1

        // Agregar puntos al gráfico con eventos de mouseover
        svg.selectAll(".dot")
            .data(data)
            .enter()
            .filter(function(d) { return d[variable] !== 0; }) 
            .append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.utc_time); })
            .attr("cy", function(d) { return y(d[variable]); })
            .style("fill", function(d) { return color(d[variable]); })
            // Evento de mouseover para mostrar la fecha
            .on("mouseover", function(d) {
                var tooltip = d3.select("#tooltip")
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("opacity", 0.9);
                tooltip.html(formatDate(d.utc_time));
            })
            .on("mouseout", function(d) {
                d3.select("#tooltip").style("opacity", 0);
            });
    });
}

// Dibujar todos los gráficos
variables.forEach(function(variable) {
    drawChart(variable, "chart-" + variable);
});

// Crear la leyenda una vez en la parte superior
var svgLegend = d3.select("#legend-container").append("svg")
    .attr("width", 1500)
    .attr("height", 50)
  .append("g")
    .attr("transform", "translate(" + margin.left + ",0)");

var legend = svgLegend.selectAll(".legend-item")
    .data(legendData)
    .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", function(d, i) { return "translate(" + (i * 130) + ",0)"; }); // Ajustar el espaciado horizontal

legend.append("rect")
    .attr("x", 0)
    .attr("width",149)
    .attr("height", 18)
    .style("fill", function(d) { return d.color; });

legend.append("text")
    .attr("x", 24) // Ajusta la posición x para centrar el texto
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("font-size", "12px")
    .style("fill", "black")
    .style("font-weight", "bold")
    .style("text-anchor", "start")
    .text(function(d) { return d.label; });

// Función para formatear la fecha
function formatDate(date) {
    var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
    return formatTime(date);
}
