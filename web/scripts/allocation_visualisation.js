//---- Sunburst Plot of NeCTAR Allocations ----

//---- Chart dimensions

// 3 inner levels of FOR codes and one outer level of projects.
var levels = 4;

// Tried calculating this from the SVG text metrics, but it's too slow.
var DISPLAY_CHARACTER_COUNT = 10;
var TEXT_BOX_HEIGHT = 16;

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

	nodes = partition.nodes(root);
	// Remove the node representing the root data item. 
	nodes = nodes.slice(1);
	var sectors = plotGroup.selectAll("path").data(nodes);
	sectors.enter().append("path")
		.attr("d", arc)
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
	zoomOutButton.datum({});

//---- Plot labels

  var plotLabels = plotGroup.selectAll("text").data(nodes);
  var plotLabelEnter = plotLabels.enter().append("text")
	.style("fill-opacity", 1)
	.style("fill", "#333")
	.each(function(d) { this._current = updateArc(d); })
	.attr("dy", ".2em")
	.attr("transform", function(d) {
		return textTransformation(d);
	})
	.text(function(d) {
		var labelStr = "";
		if (d.depth) {
			labelStr = d.name;
			if (labelStr.length > DISPLAY_CHARACTER_COUNT) {
				labelStr = labelStr.substring(0, DISPLAY_CHARACTER_COUNT - 3) + "...";
			}
		}
		return labelStr;
	})
	// Hide label if sector is not big enough.
	.style("opacity", textOpacity)
	.on("click", zoomIn);

plotArea.append("p")
    .attr("id", "intro")
    .text("Click a sector to zoom in!");
    
//---- User interaction

 function zoomIn(p) {
 
 	// Set p to next ring in unless p is already innermost ring.
    if (p.depth > 1) {
    	p = p.parent;
    }
    
    // Can't zoom in with no children.
    if (!p.children) {
    	return;
    }
    zoom(p, p);
  }

  function zoomOut(p) {
  
  // Can't zoom out without a parent.
    if (!p.parent) {
    	return;
    }
    
    zoom(p.parent, p);
  }

//---- Animation

  // Zoom in/out to the specified new root.
  function zoom(newRoot, p) {
  
  	var isZoomIn = newRoot === p;
  	
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

    zoomOutButton.datum(newRoot);

    // When zooming in, arcs enter from the outside and exit to the inside.
    // Entering outside arcs start from the old layout.
    if (isZoomIn) {
    	enterArc = outsideArc, 
    	exitArc = insideArc, 
    	outsideAngle.range([p.x, p.x + p.dx]);
    }

	// Get the new set of nodes and use it to update the 
	// sectors list, based on matching by the key value.
	var nodes = partition.nodes(newRoot);
	if (nodes[0].key == "") {
		// Again get rid of the root node.
		nodes = nodes.slice(1);
	}

	// Make sure button and plot labels stay on top by removing then re-adding them.
	// Remove them first.
    plotLabels.remove();
	zoomOutButton.remove();
    	
    // Reselect the sectors.	
	// This fixes the sector node array indexing.
	// This is needed because of a D3.js bug:
	// - internal code traverses an array by index, 
	// - but the array has gaps so the internal code fails.
    sectors = plotGroup.selectAll("path").data(nodes, function(d) { 
    	return d.key; 
    });
    
    // Now re-add the plot labels so they stay on top of the sectors.
    var plotLabelCount = plotLabels[0].length;
	for (var plotLabelIndex = 0; plotLabelIndex < plotLabelCount; plotLabelIndex++) {
		var plotLabel = plotLabels[0][plotLabelIndex];
		if (!(plotLabel == undefined)) {
			plotGroup.append(function() {return plotLabel} );
		}
	}
    
	// Reselect the plotLabels.
	plotLabels = plotGroup.selectAll("text").data(nodes, function(d) { 
		return d.key; 
	});

    // When zooming out, arcs enter from the inside and exit to the outside.
    // Exiting outside arcs transition to the new layout.
    if (!isZoomIn) {
    	enterArc = insideArc, 
    	exitArc = outsideArc, 
    	outsideAngle.range([p.x, p.x + p.dx]);
    }

	// Manage the zoom transition.
	// We try 1sec. Too fast looks bad on slower machines.
    d3.transition().duration(d3.event.altKey ? 10000 : 1000).each(function() {
    
    	// Animate the sectors
    	
    	// Handle the obsolete sectors
      sectors.exit().transition()
          .style("fill-opacity", function(d) { 
          		return d.depth === 1 + isZoomIn ? 1 : 0; 
          	})
          .attrTween("d", function(d) { 
          		return arcTween.call(this, exitArc(d)); 
          	})
          .remove();

    	// Handle the new sectors
      sectors.enter().append("path")
          .style("fill-opacity", function(d) { 
          		return d.depth === 3 - isZoomIn ? 1 : 0;
          	})
          .style("fill", function(d) {
          		return d.fill; 
          	})
          .on("click", zoomIn)
          .each(function(d) { 
          		this._current = enterArc(d); 
          	})
          	;

    	// Handle the retained sectors
      sectors.transition()
			.style("fill-opacity", 1)
			.attrTween("d", function(d) { 
          		return arcTween.call(this, updateArc(d)); 
          	});

    	// Animate the plot labels
    	          
    	// Handle the obsolete plot labels
        plotLabels.exit()
        	.style("opacity", 0)
			.transition()
			.style("fill", "#333")
        	.attr("transform", function(d) { 
          		return transformationTween.call(this, exitArc(d)); 
          	})
          .remove();

    	// Handle the new plot labels
        plotLabels.enter().append("text")
			.style("opacity", 0)
			.style("fill", "#333")
			.on("click", zoomIn)
          	.each(function(d) { 
          		this._current = enterArc(d); 
          	})
          	.attr("transform", function(d) { 
          		return textTransformation(d); 
          	})
         	.text(function(d) {
				var labelStr = "";
				if (d.depth) {
					labelStr = d.name;
					if (labelStr.length > DISPLAY_CHARACTER_COUNT) {
						labelStr = labelStr.substring(0, DISPLAY_CHARACTER_COUNT - 3) + "...";
					}
				}
				return labelStr;
			})
			;
          	
    	// Handle the retained plot labels
        plotLabels.transition()
			.style("opacity", textOpacity)
			.style("fill", "#333")
        	.attrTween("transform", function(d) { 
          		return transformationTween.call(this, updateArc(d)); 
         	})
         	.text(function(d) {
				var labelStr = "";
				if (d.depth) {
					labelStr = d.name;
					if (labelStr.length > DISPLAY_CHARACTER_COUNT) {
						labelStr = labelStr.substring(0, DISPLAY_CHARACTER_COUNT - 3) + "...";
					}
				}
				return labelStr;
			})
			;

		// Make sure the inner-circle is on top.
		// and that the plot labels transition in, with regard to the
		// text clipping behaviour inside small sectors.
		plotGroup.transition().each("end", function() {
			plotGroup.append(function() {
				return zoomOutButton[0][0];
				} )
			plotGroup.selectAll("text").transition().duration(500)
				.style("opacity", textOpacity)
			});
    });
	

  }

//---- Load FOR codes and build legend.
//     The load is asynchronous and dependent on the asynchronous
//     load of the allocation data being completed.

	d3.json("./data/for_codes_final_2.json", function(error, forItems) {

		//---- Restructure FOR codes as a map.
		
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

// The colour is based on the major FOR2 code by
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

function textTransformation(d) {
	var angle = (d.x + d.dx / 2) * 180 / Math.PI - 90;
	var rotate = angle;
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

function textOpacity(d) {
	var available = availableSpace(d);
	if(TEXT_BOX_HEIGHT <= available.height) {
		return 1; 
	} else {
		return 0; 
	}
}

function arcTween(b) {
  var i = d3.interpolate(this._current, b);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}

function transformationTween(b) {
  var i = d3.interpolate(this._current, b);
  this._current = i(0);
  return function(t) {
    return textTransformation(i(t));
	};
}

function updateArc(d) {
  return {depth: d.depth, x: d.x, dx: d.dx};
}

// Assemble the unique key for the current record
// by concatenating the name with the parent names
// through to the tree root.
function key(d) {
  var names = [], currentRecord = d;
  while (currentRecord.depth) {
  	names.push(currentRecord.name), currentRecord = currentRecord.parent;
  }
  return names.reverse().join(".");
}

