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
    .attr("id", "title")
    .attr("class", "plot-title")
    .text("Core Quota");

var plotCanvas = plotArea.append("div")
    .attr("class", "plot-canvas-container")	
	.append("div")
    .attr("id", "canvas");

var plotGroup = plotCanvas.append("svg")
    .attr("width", width + padding * 2)
    .attr("height", height + padding * 2)
  .append("g")
    .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");

//---- Define the plot layout and plotting algorithm - a sunburst.

var partition = d3.layout.partition()
    .sort(function(a, b) { return d3.ascending(a.name, b.name); })
    .size([2 * Math.PI, radius]);

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

d3.json("./data/allocation_tree_final_2.json", function(error, json) {

	var root = {children: json};
	var nodes = partition
    	.value(function(d) { return d.coreQuota; })
    	.nodes(root);
    	
	nodes.forEach(function(d) {
		d._children = d.children;
		d.sum = d.value;
		d.key = key(d);
		d.fill = colour(d);
	});

  partition
	.children(function(d, depth) { 
		return depth < (levels - 1) ? d._children : null; 
	})
	.value(function(d) { return d.sum; });
	

//---- Plot sectors

	nodes = partition.nodes(root).slice(1);
	var path = plotGroup.selectAll("path").data(nodes);
	path.enter().append("path")
		.attr("id", function(d, i) { return "path-" + i; })
		.attr("d", arc)
		.attr("fill-rule", "evenodd")
		.style("fill", function(d) { return d.fill; })
		.each(function(d) { this._current = updateArc(d); })
		.on("click", zoomIn)
		;

  var zoomOutButton = plotGroup.append("circle")
      .attr("id", "inner-circle")
      .attr("r", radius / (levels + 1))
      .on("click", zoomOut);
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
	.on("click", zoomIn);

plotArea.append("p")
    .attr("id", "intro")
    .text("Click to zoom!");
    
//---- User interaction

 function zoomIn(p) {
 
    if (p.depth > 1) {
    	p = p.parent;
    }
    
    if (!p.children) {
    	return;
    }
    zoom(p, p);
  }

  function zoomOut(p) {
  
    if (!p.parent) {
    	return;
    }
    
    zoom(p.parent, p);
  }

  // Zoom to the specified new root.
  function zoom(root, p) {
  
    if (document.documentElement.__transition__) {
    	return;
    }

    // Rescale outside angles to match the new layout.
    var enterArc,
        exitArc,
        outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

    function insideArc(d) {
      return p.key > d.key
          ? {depth: d.depth - 1, x: 0, dx: 0} : p.key < d.key
          ? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
          : {depth: 0, x: 0, dx: 2 * Math.PI};
    }

    function outsideArc(d) {
      return {
      	depth: d.depth + 1, 
      	x: outsideAngle(d.x), 
      	dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)};
    }

    zoomOutButton.datum(root);

    // When zooming in, arcs enter from the outside and exit to the inside.
    // Entering outside arcs start from the old layout.
    if (root === p) {
    	enterArc = outsideArc, 
    	exitArc = insideArc, 
    	outsideAngle.range([p.x, p.x + p.dx]);
    }

    path = path.data(partition.nodes(root).slice(1), function(d) { 
    	return d.key; 
    });

    // When zooming out, arcs enter from the inside and exit to the outside.
    // Exiting outside arcs transition to the new layout.
    if (root !== p) {
    	enterArc = insideArc, 
    	exitArc = outsideArc, 
    	outsideAngle.range([p.x, p.x + p.dx]);
    }

    d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
      path.exit().transition()
          .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
          .attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
          .remove();

      path.enter().append("path")
          .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
          .style("fill", function(d) { return d.fill; })
          .on("click", zoomIn)
          .each(function(d) { this._current = enterArc(d); });

      path.transition()
          .style("fill-opacity", 1)
          .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
    });
  }

//---- Load FOR codes and build legend

	d3.json("./data/for_codes_final_2.json", function(error, forItems) {

		//---- Load FOR codes
		var forItemCount = forItems.length;
		for (var forItemIndex = 0; forItemIndex < forItemCount; forItemIndex++) {
			var forItem = forItems[forItemIndex];
			forTitleMap[forItem.FOR_CODE] = forItem.Title;
		}
	
		//---- Build and display legend

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
	
	});

});

//---- Utilities

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

function textTransformation(d, multiline) {
	var angle = (d.x + d.dx / 2) * 180 / Math.PI - 90;
	var rotate = angle + (multiline ? -.5 : 0);
	var translate = (d.depth * 1.0 / (levels + 1)) * radius  + padding;
	return "rotate(" + rotate + ")" + " translate(" + translate + ")";
}

function availableSpace (d) {
	var c2pi = 2.0 * Math.PI;
	var circumference = c2pi * radius * (d.depth / (levels + 1));
	var sectorWidth = (d.dx / c2pi) * circumference;
	var sectorHeight = radius / (levels + 1);
	available = {width: sectorHeight, height: sectorWidth};
	return available;
}

function arcTween(b) {
  var i = d3.interpolate(this._current, b);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}

function updateArc(d) {
  return {depth: d.depth, x: d.x, dx: d.dx};
}

function key(d) {
  var k = [], p = d;
  while (p.depth) k.push(p.name), p = p.parent;
  return k.reverse().join(".");
}

