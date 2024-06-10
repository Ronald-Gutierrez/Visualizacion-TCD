var w = 1080, h = 960;

var svg = d3.select("#map")
            .attr("width", w)
            .attr("height", h);

var myMercatorProjection = d3.geoMercator()
                        .center([107, 31])
                        .scale(550)
                        .translate([w/2, h/2]);

var myAlbersProjection = d3.geoConicEqualArea()
                            .center([105, 35])
                            .parallels([27, 45])
                            .scale(1000)
                            .translate([w/2, h/2]);

var path_gen = d3.geoPath().projection(myMercatorProjection)

d3.json("china_topo_quantized.json", function(error, china){
    if (error) return console.error(error);
    china_features = topojson.feature(china, china.objects.provinces).features;
    svg.append("g")
        .attr("class", "provinces")
        .selectAll("path")
        .data(china_features)
        .enter()
        .append("path")
        .attr("d", path_gen);

    svg.append("g")
        .attr("class", "province-labels")
        .selectAll(".province-label")
        .data(china_features)
        .enter()
        .append("text")
        .attr("class", "province-label")
        .attr("transform", function(d){return "translate("+path_gen.centroid(d)+")";})
        .attr("dy",".35em")
        .text(function(d){return d.properties.engName});
});
