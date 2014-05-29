//---- Hierarchical Pie Plot of NeCTAR Allocations ----

//---- Data manipulation

// Perform an in-place update of the data
function update(dest, source) {
  hash_map = {};
  for (var i in source) {
	var source_item = source[i]
    hash_map[source[i]['target']] = source_item;
  }

  for (var j in dest) {
    var key = dest[i]['target'];
    if (source[key]) {
      dest[i]['value'] = source[key]['value'];
    }
  }

  for (var k in hash_map) {
    if (hash_map.hasOwnProperty(k)) {
      dest.push(hash_map[k]);
    }
  }
}

	function zero(array) {
	  for (var i in array) {
		array[i].value = 0;
	  }
	};

function restructureData(responseData) {
    var dataset = [];
    zero(dataset);
    update(dataset,  responseData);
    return dataset;
}

//---- Visualisation Constants

// Chart dimensions
var WIDTH = 960,
    HEIGHT = 700,
    PIE_WIDTH = 960,
    PIE_HEIGHT = 500,
    radius = Math.min(PIE_WIDTH, PIE_HEIGHT) / 2;

var innerRadius = radius - 120;
var outerRadius = radius - 20;

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
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

// Text for showing totals.
var totalText = plotGroup.append("text")
	.attr("class", "total")
	.attr("dy", ".40em")
	.style("text-anchor", "middle");

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
  

function visualise( dataset, totalVirtualCpus ) {

    totalText.text(function(d) { return "VCPU Used: " + totalVirtualCpus; });

	// Build the node list, attaching the new data.
	var nodes = pie(dataset);
	
    slices = plotGroup.selectAll("g.slice").data(nodes);
    
    slices.select('path')
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
        return d.data.target;
      })
      .attr("transform", function(d) {
        return "translate(" + offset_label(d, this.getComputedTextLength()) + ") rotate(" + angle(d) + ")";
      })
      .style("opacity", 0)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1);

	// Annotate slices with virtual CPU count for corresponding domain.
    slices.filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; })
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        d.outerRadius = outerRadius;
        d.innerRadius = outerRadius/2;
        return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value; })
      .style("opacity", 0)
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
      .transition()
      .duration(DURATION)
      .attrTween("d", arcTween);

    // -- Text annotations second, domain names.
    
    newSlices.filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; })
      .append("text")
      .text(function(d) {
        return d.data.target;
      })
      .attr("transform", function(d) {
        return "translate(" + offset_label(d, this.getComputedTextLength()) + ") rotate(" + angle(d) + ")";
      }).style("opacity", 0)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1);

    // -- Text annotations third, virtual CPU count for corresponding domain.
    newSlices.filter(function(d) { return d.endAngle - d.startAngle > TEXT_HEIGHT_ALLOWANCE; }).append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        d.outerRadius = outerRadius;
        d.innerRadius = outerRadius/2;
        return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value; })
      .style("opacity", 0)
      .transition()
      .duration(DURATION_FAST)
      .style("opacity", 1);

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
    
  }

//---- Plotting and Animation Utilities

function offset_label(d, length) {
  //we have to make sure to set these before calling arc.centroid
  d.outerRadius = outerRadius; // Set Outer Coordinate
  d.innerRadius = outerRadius/2; // Set Inner Coordinate
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

function processResponse(responseObject) {
	var dataset = restructureData(responseObject);
	var totalVirtualCpus = d3.sum(dataset, function (d) {
      return d.value;
    });
	visualise(dataset, totalVirtualCpus);	
}

//---- Additional User Interactions.

function change() {
  $('#graph-buttons button').removeClass('active');
  $(this).addClass('active');
  $.get( "./domain/cores_per_domain_2", {'az': this.id}, processResponse, 'json');
}

d3.selectAll("button").on("click", change);

$("#all").click();
