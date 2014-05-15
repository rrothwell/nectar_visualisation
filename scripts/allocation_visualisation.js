//---- Sunburst Plot of NeCTAR Allocations ----

//---- Chart dimensions
// x and y are x() and y() scaling functions used in function arc()
// for the pseudo-dimensions x and y.

// 3 inner levels of FOR codes and one outer level of projects.
var levels = 4;

var width = 700,
    height = width,
    radius = width / 2,
    x = d3.scale.linear().range([0, 2 * Math.PI]),
    y = d3.scale.linear().domain([0, 1]).range([0, radius]),
    padding = 5,
    duration = 1000;

//---- Chart area on web page. 
// A div with id="chart" is located on the web page 
// and then populated with chart elements.

var plotArea = d3.select("#plot-area");

var plotArea = plotArea.append("svg")
    .attr("width", width + padding * 2)
    .attr("height", height + padding * 2)
  .append("g")
    .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");

//---- Define the plot layout and plotting algorithm - a sunburst.

var partition = d3.layout.partition()
    .sort(function(a, b) { return d3.ascending(a.name, b.name); })
    //.value(function(d) { return 5.8 - d.depth; })
    .value(function(d) { return d.coreQuota; })
    .size([2 * Math.PI, radius])
    ;

//var arc = d3.svg.arc()
//    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
//    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
//    .innerRadius(function(d) { return Math.max(0, d.y ? y(d.y) : d.y); })
//    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx - .01 / (d.depth + .5); })
    .innerRadius(function(d) { return radius / (levels + 1) * d.depth; })
    .outerRadius(function(d) { return radius / (levels + 1) * (d.depth + 1) - 1; });
    
var colourScale = d3.scale.ordinal()
    .domain(["00", "01", "01", "02", "03", "04", "05", "06", "07", "08", 
    		"10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
    		"20", "21", "22", "23", "24", "25", "26", "27", "28", "29"])
    .range(colorbrewer.Set3[12].concat(colorbrewer.Paired[12]));

//---- Read the data.

var forTitleMap = {};

d3.json("./for_codes_final_2.json", function(error, forItems) {
	var forItemCount = forItems.length;
	for (var forItemIndex = 0; forItemIndex < forItemCount; forItemIndex++) {
		var forItem = forItems[forItemIndex];
		forTitleMap[forItem.FOR_CODE] = forItem.Title;
	}	
});

d3.json("./allocation_tree_final_2.json", function(error, json) {

  var nodes = partition.nodes({children: json});

//---- Plot sectors

  var path = plotArea.selectAll("path").data(nodes);
  path.enter().append("path")
      .attr("id", function(d, i) { return "path-" + i; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", colour)
      .on("click", click);

//---- Plot labels

  var plotLabel = plotArea.selectAll("text").data(nodes);
  var plotLabelEnter = plotLabel.enter().append("text")
      .style("fill-opacity", 1)
      .style("fill", function(d) {
        return brightness(d3.rgb(colour(d))) < 125 ? "#eee" : "#000";
      })
      .attr("text-anchor", function(d) {
        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
      })
      .attr("dy", ".2em")
      .attr("transform", function(d) {
        var multiline = (d.name || "").split(" ").length > 1,
            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
            rotate = angle + (multiline ? -.5 : 0);
        return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
      })
      .on("click", click);
  plotLabelEnter.append("tspan")
      .attr("x", 0)
      .text(function(d) { return d.depth ? d.name.split(" ")[0] : ""; });
  plotLabelEnter.append("tspan")
      .attr("x", 0)
      .attr("dy", "1em")
      .text(function(d) { return d.depth ? d.name.split(" ")[1] || "" : ""; });

//---- Legend

plotArea.append("p")
    .attr("id", "intro")
    .text("Click to zoom!");

	//var legend = plotArea.select("div")
	//	.attr("id", "legend");

	var legend = d3.select("#legend-area");
	legend.append("h1")
			.attr("class", "legend-text")
			.text("Legend: ");

  var legendItems = legend.selectAll("div").data(nodes
  						.filter(function(d){return d.depth == 1})
  						.sort(function(a, b) { return d3.ascending(a.name, b.name); }));
  var legendEnter = legendItems.enter().append("div")
      .attr("class", "legend-text legend-item")
      .style("background-color", function(d) {
          	return colourScale(d.name);
      })
      .style("border-color", function(d) {
          	return colourScale(d.name);
      })
      .text(function(d) { return d.name + ":" + forTitleMap[d.name]; });

//---- User interaction

  function click(d) {
    path.transition()
      .duration(duration)
      .attrTween("d", arcTween(d));

    // Somewhat of a hack as we rely on arcTween updating the scales.
    text.style("visibility", function(e) {
          return isParentOf(d, e) ? null : d3.select(this).style("visibility");
        })
      .transition()
        .duration(duration)
        .attrTween("text-anchor", function(d) {
          return function() {
            return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
          };
        })
        .attrTween("transform", function(d) {
          var multiline = (d.name || "").split(" ").length > 1;
          return function() {
            var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                rotate = angle + (multiline ? -.5 : 0);
            return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
          };
        })
        .style("fill-opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
        .each("end", function(e) {
          d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
        });
  }
});

//---- Utilities

function isParentOf(p, c) {
  if (p === c) return true;
  if (p.children) {
    return p.children.some(function(d) {
      return isParentOf(d, c);
    });
  }
  return false;
}

function colour(d) {
	if (d.depth == 1) {
  		return colourScale(d.name) || "#eee";
	}
	return 	"#edf";
}

// Interpolate the scales!
function arcTween(d) {
  var my = maxY(d),
      xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, my]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
  return function(d) {
    return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}

function maxY(d) {
  return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
}

// http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
function brightness(rgb) {
  return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
}
