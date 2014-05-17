//---- Sunburst Plot of NeCTAR Allocations ----

//---- Chart dimensions

// 3 inner levels of FOR codes and one outer level of projects.
var levels = 4;

// Tried calculating this from the SVG text metrics, but it's too slow.
var displayCharacterCount = 10;
var textBoxHeight = 16;

var width = 700,
    height = width,
    radius = width / 2,
    padding = 5,
    duration = 1000;

//---- Chart area on web page. 
// A div with id="chart" is located on the web page 
// and then populated with chart elements.

var plotArea = d3.select("#plot-area");

plotArea.append("div")
    .attr("class", "plot-title-container")	
	.append("div")
    //.attr("class", "plot-title-centre")	
	//.append("div")
    .attr("id", "title")
    .attr("class", "plot-title")
    .text("Core Quota");

var plotGroup = plotArea.append("svg")
    .attr("width", width + padding * 2)
    .attr("height", height + padding * 2)
  .append("g")
    .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");

//---- Define the plot layout and plotting algorithm - a sunburst.

var partition = d3.layout.partition()
    .sort(function(a, b) { return d3.ascending(a.name, b.name); })
    .value(function(d) { return d.coreQuota; })
    .size([2 * Math.PI, radius])
    ;

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

  var path = plotGroup.selectAll("path").data(nodes);
  path.enter().append("path")
      .attr("id", function(d, i) { return "path-" + i; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", colour)
      .on("click", click);

  var zoomOutButton = plotGroup.append("circle")
      .attr("id", "inner-circle")
      .attr("r", radius / (levels + 1))
      .on("click", click);
  zoomOutButton.append("title")
  		.attr("class", "zoom-out")
		.text("Zoom out");

//---- Plot labels

  var plotLabel = plotGroup.selectAll("text").data(nodes);
  var plotLabelEnter = plotLabel.enter().append("text")
	.style("fill-opacity", 1)
	.style("fill", function(d) {
		return d.depth == 1 ? "#333" : "#333";
	})
	.attr("dy", ".2em")
	.attr("transform", function(d) {
		var multiline = false;
		return textTransformation(d, multiline);
	})
	.text(function(d) {
		var labelStr = "";
		if (d.depth) {
			labelStr = d.name;
			if (labelStr.length > displayCharacterCount) {
				labelStr = labelStr.substring(0, displayCharacterCount - 3) + "...";
			}
		}
		return labelStr;
	})
	// Hide label if sector is not big enough.
	.style("opacity", function(d) {
			var available = availableSpace(d);
			if(textBoxHeight <= available.height) {
				return 1; 
			} else {
				return 0; 
			}
	})
	.on("click", click);

//---- Legend

plotArea.append("p")
    .attr("id", "intro")
    .text("Click to zoom!");

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
      // Lowercase so the CSS can capitalise it.
      .text(function(d) { return d.name + ":" + forTitleMap[d.name].toLowerCase(); });

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
        .attrTween("transform", function(d) {
          var multiline = false;
          return function() {
            return textTransformation(d, multiline);
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

// The colour is based on the major FOR code by
// lookup from a palette.
function colour(d) {
	if (d.name) {
		var majorCode = d.name.substring(0, 2);
		var colourStr = colourScale(majorCode) || "#eee";
		if (d.depth == 0) {
			return "#fff";
		} else if (d.depth == 1) {
			return colourStr;
		} else if (d.depth == 4) {
			majorCode = d.parent.name.substring(0, 2);
			colourStr = colourScale(majorCode) || "#eee";
			return colourStr;
		} else {
			return d3.rgb(colourStr).toString();
		}
	}
	return 	"#f0ff8";
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

function textTransformation(d, multiline) {
	var angle = (d.x + d.dx / 2) * 180 / Math.PI - 90;
	var rotate = angle + (multiline ? -.5 : 0);
	var translate = (d.depth * 1.0 / (levels + 1)) * radius  + padding;
	return "rotate(" + rotate + ")" + " translate(" + translate + ")";
}

function isMultiline(d) {
	return (d.name || "").split(" ").length > 1;
}

function availableSpace (d) {
	var c2pi = 2.0 * Math.PI;
	var circumference = c2pi * radius * (d.depth / (levels + 1));
	var sectorWidth = (d.dx / c2pi) * circumference;
	var sectorHeight = radius / (levels + 1);
	available = {width: sectorHeight, height: sectorWidth};
	return available;
}
