////// Hierarchical Pie Plot of NeCTAR Allocations

//==== Data manipulation

// Breadcrumbs - keep track of the current hierarchy level.
// Made up of an array of FOR codes.
var breadCrumbs = ['*'];
var allocationTree = {};
var forList = [];

// Is this the level for FOR codes or projects.
function isForCodeLevel() {
	return breadCrumbs.length < 4;
}  

// Recursive code to return allocation tree branch (children) addressed by FOR code.
// The forCode is the FOR2, FOR4 or FOR6 code.
// The allocationObjects is the allocationTree object being passed in.
function traverseHierarchy(route, allocationTree) {
	var children = allocationTree;
	var forCodes = route;
	return nextLevel(forCodes, children);
}

// Recurse the allocation tree to return a branch.
function nextLevel(forCodes, children) {
	var forCode = forCodes.pop();
	if (forCode) {
		var childCount = children.length;
		for (var childIndex = 0; childIndex < childCount; childIndex++) {
			var child = children[childIndex];
			var name = child.name;
			if (name == forCode) {
				return nextLevel(forCodes, child.children);
			} 
		}
	}
	return children;
}

// Restructure allocation tree into a single level array of objects.
// The tree is flattened by taking the sum of all allocations on the branch.
function restructureAllocations(allocationTree, isCoreQuota) {
    var dataset = [];
    var allocationCount = allocationTree.length;
    for (var allocationIndex = 0; allocationIndex < allocationCount; allocationIndex++) {
    	var sum = 0.0;
    	var child = allocationTree[allocationIndex]
    	var name = child.name;
    	var allocationItem = {};
    	if (child.children) {
    		//add the branch value.
			sum = nextLevelSum(child.children, isCoreQuota);
    	} else {
    		// add the leaf value.
			allocationItem.projectName = child.name;
			allocationItem.coreQuota = child.coreQuota;
			allocationItem.instanceQuota = child.instanceQuota;
			allocationItem.useCase = child.useCase;			
			sum = isCoreQuota ? child.coreQuota : child.instanceQuota;
    	}
    	allocationItem.target = name
    	allocationItem.value = sum;
    	dataset.push(allocationItem);
    }    
    return dataset;
}
    
// Recurse the allocation tree to return a sum.
function nextLevelSum(children, isCoreQuota) {
    var sum = 0.0;
	var childCount = children.length;
	for (var childIndex = 0; childIndex < childCount; childIndex++) {
		var child = children[childIndex];
		if (child.children) {
			sum += nextLevelSum(child.children, isCoreQuota);
		} else {
			sum += isCoreQuota ? child.coreQuota : child.instanceQuota;
		}
	}
	return sum;
}

// Restructure FOR codes as a map.
var forTitleMap = {};
function restructureForCodes(forList) {	
	var forItemCount = forList.length;
	for (var forItemIndex = 0; forItemIndex < forItemCount; forItemIndex++) {
		var forItem = forList[forItemIndex];
		forTitleMap[forItem.FOR_CODE] = forItem.Title;
	}
}

//==== Data visualisation

//---- Visualisation Constants

// Chart dimensions
var WIDTH = 960,
    HEIGHT = 700,
    PIE_WIDTH = 960,
    PIE_HEIGHT = 500,
    RADIUS = Math.min(PIE_WIDTH, PIE_HEIGHT) / 2;

var ZOOM_OUT_MESSAGE = "Click to zoom out!";

var INNER_RADIUS = RADIUS - 120;
var OUTER_RADIUS = RADIUS - 20;

// Animation speed - duration in msec.
var DURATION = 750;
var DURATION_FAST = 400;

var enterClockwise = {
  startAngle: 0,
  endAngle: 0
};

var enterAntiClockwise = {
  startAngle: Math.PI * 2,
  endAngle: Math.PI * 2
};

var x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

var color = d3.scale.category20();

var TEXT_HEIGHT_ALLOWANCE = .1;

//---- Popup on mouseover for sectors and table rows.

var toolTip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("a simple tooltip");


//---- Chart area on web page.
 
// A div with id="plot-area" is located on the web page 
// and then populated with these chart elements.

var plotGroup = d3.select("#plot-area").append("svg")
      .attr("width", WIDTH)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", "translate(" + WIDTH / 2 + "," + HEIGHT / 2 + ")");

//---- Define the plot layout and plotting algorithm - a pie chart.

var pie = d3.layout.pie()
      .value(function(d) { return d.value; });

var arc = d3.svg.arc()
      .innerRadius(INNER_RADIUS)
      .outerRadius(OUTER_RADIUS);

// Pie slices showing sub-totals.
// Set the start and end angles to 0 so we can transition
// clockwise to the actual values later.
var slices = plotGroup.selectAll("g.slice")
      .data(pie([]))
      .enter()
      .append('g')
      .attr('class', 'slice');

slices.transition()  // update
  .duration(DURATION)
  .attrTween("d", arcTween); 
  

var zoomOutButton = plotGroup.append("g")
	.on("click", zoomOut)
	.datum({}); // Avoid "undefined" error on clicking.
zoomOutButton.append("circle")
	.attr("id", "inner-circle")
	.attr("r", INNER_RADIUS)
	.style("fill", "white");
zoomOutButton.append("text")
	.attr("class", "click-message")
	.attr("text-anchor", "middle")
	.attr("dy", "0.3em")
	.text(ZOOM_OUT_MESSAGE);

// Text for showing totals.
var statisticsArea = d3.select("#statistics-area");
var totalText = statisticsArea.append("text")
	.attr("class", "total")
	.attr("dy", ".40em")
	.style("text-anchor", "middle");


	 function zoomIn(p) {
	 	var target = p.data.target;
	 	if (isForCodeLevel()) {
			var forCode = target;
	 		breadCrumbs.push(forCode);
	 		var route = breadCrumbs.slice(1).reverse();
			var children = traverseHierarchy(route, allocationTree);
			var isCoreQuota = selectedCoreQuota();
			var dataset = restructureAllocations(children, isCoreQuota);
			var totalResource = d3.sum(dataset, function (d) {
			  return d.value;
			});
			visualise(dataset, totalResource);	
	 	}
	  }

	function zoomOut(p) { 
	 	if (breadCrumbs.length > 1) {
	 		breadCrumbs.pop();
	 		var route = breadCrumbs.slice(1).reverse(); 		
			var children = traverseHierarchy(route, allocationTree);
			var isCoreQuota = selectedCoreQuota();
			var dataset = restructureAllocations(children, isCoreQuota);
			var totalResource = d3.sum(dataset, function (d) {
			  return d.value;
			});
			visualise(dataset, totalResource);	
	 	}
	}
	
	//----- Build and display project table

	var masterListArea = d3.select("#master-list-area");
	var masterListTable = masterListArea
		.append("div")
		.attr("class", "master-list-container")
			.append("table")
				.attr("class", "master-list-table");
	masterListTable.append("caption")
		.attr("class", "master-list-text")
		.text("Project list: ");
	var masterListBody = masterListTable.append("tbody")
			.attr("class", "master-list-text");
			
	var masterListHeader = masterListBody.append("tr");		
	masterListHeader.append("th").text("Name");		

	function handleProjectMouseOver(d) {
		$(this).find('span.glyphicon').removeClass('glyphicon-inactive').addClass('glyphicon-active');
		showDetails(d)
		return toolTip.style("visibility", "visible");
	}	
	
	function handleProjectMouseMove () {
		var cellLocation = this.getBoundingClientRect();
		var top = (d3.event.pageY-10)+"px";
		var left = (cellLocation.right + 8)+"px";
		return toolTip.style("top", top).style("left", left);
	}
	   
	function handleProjectMouseOut() {
		$(this).find('span.glyphicon').removeClass('glyphicon-active').addClass('glyphicon-inactive');
		return toolTip.style("visibility", "hidden");
	}

	//---- Popup showing details.
		  	
	function showDetails(d) {
	 		var markup = "<div class='details-container centred-container'>" 
 			+ "<table class='details-table'>" 
 			+ "<tr>"
 			+ "<th>"
 			+ "Name: " 
 			+ "</th>"
 			+ "<td>"
 			+ d.data.projectName
 			+ "</td>"
 			+ "</tr>"
 			+ "<tr>"
 			+ "<th>"
 			+ "Core quota: " 
 			+ "</th>"
 			+ "<td>"
 			+ d.data.coreQuota
 			+ "</td>"
 			+ "</tr>"
 			+ "<tr>"
 			+ "<th>"
 			+ "Instance quota: " 
 			+ "</th>"
 			+ "<td>"
 			+ d.data.instanceQuota
 			+ "</td>"
 			+ "</tr>"
 			+ "<tr>"
 			+ "<th>"
 			+ "Use case: " 
 			+ "</th>"
 			+ "<td>"
 			+ d.data.useCase 
 			+ "</td>"
 			+ "</tr>"
 			+ "</table>"
 			+ "</div>";
		var plotDetails = toolTip.html(markup);
	}

	//----- Visualise Data

function visualise( dataset, totalResource ) {

	var countLabelPrefix = selectedCoreQuota() ? "Core count: " : "Instance count: "; 
    totalText.text(function(d) { return countLabelPrefix + totalResource.toFixed(2); });

	// Build the node list, attaching the new data.
	var nodes = pie(dataset);
	
    slices = plotGroup.selectAll("g.slice").data(nodes);
    
    slices.select('path')
       .on("click", zoomIn)
      .transition()
      .duration(DURATION)
      .attrTween("d", arcTween);

	// Begin text annotation.
    slices.selectAll('text').remove();

	// Annotate slices with name of corresponding domain.
    slices
      .filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; })
      .append("text")
      .text(function(d) {
      	var label = d.data.target;
      	if (isForCodeLevel()) {
      		var forCode = d.data.target;
      		label = forTitleMap[forCode].toLowerCase() + " (" + forCode + ")";
      	}
        return label;
      })
      .attr("transform", function(d) {
        return "translate(" + offset_label(d, this.getComputedTextLength()) + ") rotate(" + angle(d) + ")";
      })
      .style("opacity", 0)
      .style("text-transform", "capitalize")
       .on("click", zoomIn)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1);

	// Annotate slices with virtual CPU count for corresponding domain.
    slices.filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; })
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        d.outerRadius = OUTER_RADIUS;
        d.innerRadius = OUTER_RADIUS/2;
        return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value.toFixed(2); })
      .style("opacity", 0)
       .on("click", zoomIn)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1);


    // Display new data items:
    
    // -- slices first.
    
    var newSlices = slices.enter()
          .append('g')
          .attr('class', 'slice');

    newSlices.append("path")
      .attr("fill", function (d, i) {
        return color(i);
      })
      .attr('d', arc(enterClockwise))
      .each(function (d) {
        this._current = {
          data: d.data,
          value: d.value,
          startAngle: enterAntiClockwise.startAngle,
          endAngle: enterAntiClockwise.endAngle
        };        
      })
      .on("click", zoomIn)
      .transition()
      .duration(DURATION)
      .attrTween("d", arcTween)
		;

    // -- Text annotations second, domain names.
    
    newSlices.filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; })
      .append("text")
      .text(function(d) {
      	var label = d.data.target;
      	if (isForCodeLevel()) {
      		var forCode = d.data.target;
      		label = forTitleMap[forCode].toLowerCase() + " (" + forCode + ")";
      	}
        return label;
      })
      .attr("transform", function(d) {
        return "translate(" + offset_label(d, this.getComputedTextLength()) + ") rotate(" + angle(d) + ")";
      }).style("opacity", 0)
      .style("text-transform", "capitalize")
       .on("click", zoomIn)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1)
		;

    // -- Text annotations third, virtual CPU count for corresponding domain.
    newSlices.filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; }).append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        d.outerRadius = OUTER_RADIUS;
        d.innerRadius = OUTER_RADIUS/2;
        return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value.toFixed(2); })
      .style("opacity", 0)
       .on("click", zoomIn)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1)
		;

    // Remove old elements:
    
    // -- remove old annotations 
    slices.exit().select('text')
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 0)
      .remove();

    // -- remove old slices 
    slices.exit().select('fill')
      .transition()
      .duration(DURATION)
      .attrTween('d', arcTweenOut)
      .remove();
    slices.exit().transition().remove();
    
	  //----- Build and display breadcrumbs

    navigate();
    
	  //----- Update project table
	
	var masterListItems = masterListBody.selectAll("tr").data(nodes
						.filter(function(d){
								return !isForCodeLevel()
							})
						.sort(function(a, b) { 
								return d3.ascending(a.data.target, b.data.target); 
							}));

	masterListItems.exit().remove();
						
	var masterListEnter = masterListItems.enter()
		.append("tr")
			.append("td")
			.on("mouseover", handleProjectMouseOver)
			.on("mousemove", handleProjectMouseMove)
			.on("mouseout", handleProjectMouseOut)
			.html(function(d) {
					return d.data.target 
					+ '&nbsp;'
					+ '<span class="glyphicon glyphicon-info-sign glyphicon-inactive"></span>'; 
				});

  }

function navigate() {
    var breadcrumb = d3.select("#chart-navigator-1").select('.breadcrumb');
    breadcrumb.selectAll('li').remove();
    breadcrumb.selectAll('li')
      .data(breadCrumbs)
      .enter()
        .append("li")
        .attr("class", function(d, i) { return i == breadCrumbs.length - 1 ? "active" : ""})
        .html(function(d, i) {
        	var forCode = d;
        	var markup = forCode == '*' 
        		? '<span class="glyphicon glyphicon-home"></span>' 
        		: '<span style="text-transform: capitalize">' 
        			+ forTitleMap[forCode].toLowerCase() 
        			+ '</span>';
        	if (i < breadCrumbs.length - 1) {
        		markup = '<a href="#">' + markup + '</a>';
        	}
			return markup;
        })
        .on("click", function(d, i) {
			if (breadCrumbs.length > 1 && i < breadCrumbs.length - 1) {
				breadCrumbs = breadCrumbs.slice(0, i + 1);
				var route = breadCrumbs.slice(1).reverse(); 		
				var children = traverseHierarchy(route, allocationTree);
				var isCoreQuota = selectedCoreQuota();
				var dataset = restructureAllocations(children, isCoreQuota);
				var totalResource = d3.sum(dataset, function (d) {
				  return d.value;
				});
				visualise(dataset, totalResource);
			}	
        });
  }

//---- Plotting and Animation Utilities

function offset_label(d, length) {
  //we have to make sure to set these before calling arc.centroid
  d.outerRadius = OUTER_RADIUS; // Set Outer Coordinate
  d.innerRadius = OUTER_RADIUS/2; // Set Inner Coordinate
  var center = arc.centroid(d), // gives you the center point of the slice
      x = center[0],
      y = center[1],
      h = Math.sqrt(x*x + y*y),
      blx = x/h * 250,
      bly = y/h * 250,
      lx = x/h * (250 + length),
      ly = y/h * (250 + length);
  var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
  if (a > 90) {
    return lx + "," + ly;
  } else  {
    return blx + "," + bly;
  }
}

// Computes the angle of an arc, converting from radians to degrees.
function angle(d) {
  var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
  return a > 90 ? a - 180 : a;
}

function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
  return arc(i(t));
  };
}

function arcTweenOut(a) {
  var i = d3.interpolate(this._current, {startAngle: Math.PI * 2, endAngle: Math.PI * 2, value: 0});
  this._current = i(0);
  return function (t) {
    return arc(i(t));
  };
}

//---- Main Function: Process the data and visualise it.

function selectedCoreQuota() {
	var activeButton = $('button#cores.active').text();
	var isCoreQuota = activeButton == "Cores";
	return isCoreQuota;
}

function processResponse(allocationTree, forList, resource) {
	var isCoreQuota = selectedCoreQuota();
	var dataset = restructureAllocations(allocationTree, isCoreQuota);
	var sum = d3.sum(dataset, function (d) {
      return d.value;
    });
    resource.total = sum;
    return dataset;
}

//---- Additional User Interactions and Data Loading.

function load() {
	d3.json("./data/for_codes_final_2.json", function(error, forObjects) {
		d3.json("./data/allocation_tree_final_2.json", function(error, allocationObjects) {
			breadCrumbs = ['*'];
			forList = forObjects;
			restructureForCodes(forList);
			allocationTree = allocationObjects;
			var resource = {};
			var dataset = processResponse(allocationTree, forList, resource);
			visualise(dataset, resource.total);	
		});
	});
}

load();

function change() {
	$('#graph-buttons button').removeClass('active');
	$(this).addClass('active');
	var route = breadCrumbs.slice(1).reverse();
	var children = traverseHierarchy(route, allocationTree);
	var resource = {};
	var dataset = processResponse(children, forList, resource);
	visualise(dataset, resource.total);	
}

d3.selectAll("button").on("click", change);

//$("#cores").click();
