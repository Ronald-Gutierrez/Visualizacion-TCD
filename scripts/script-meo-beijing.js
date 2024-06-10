
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

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.utc_time); })
            .attr("cy", function(d) { return y(d[attribute]); })
            .style("fill", "red")
            .style("opacity", 0)
            .on("mouseover", function(d) {
                var tooltip = d3.select("#tooltip")
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
                    .style("opacity", 0.9);
                tooltip.html("Fecha: " + formatDate(d.utc_time) + "<br/>" +
                             "Valor de " + attribute + ": " + d[attribute]);
            })
            .on("mouseout", function(d) {
                d3.select("#tooltip").style("opacity", 0);
            });
    });
}