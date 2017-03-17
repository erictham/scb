
// For MSIE < 9, forget it
function D3notok() {
  document.getElementById('sidepanel').style.visibility = 'hidden';
  var nocontent = document.getElementById('nocontent');
  nocontent.style.visibility = 'visible';
  nocontent.style.pointerEvents = 'all';
  var t = document.getElementsByTagName('body');
  var body = document.getElementsByTagName('body')[0];
  body.style.backgroundImage = "url('img/movie-network-screenshot-d.png')";
  body.style.backgroundRepeat = "no-repeat";
}

// -------------------------------------------------------------------
// A number of forward declarations. These variables need to be defined since 
// they are attached to static code in HTML. But we cannot define them yet
// since they need D3.js stuff. So we put placeholders.


// Highlight a movie in the graph. It is a closure within the d3.json() call.
var selectMovie = undefined;
var nblimit = undefined
// Change status of a panel from visible to hidden or viceversa
var toggleDiv = undefined;

// Clear all help boxes and select a movie in network and in movie details panel
var clearAndSelect = undefined;


// The call to set a zoom value -- currently unused
// (zoom is set via standard mouse-based zooming)
var zoomCall = undefined;

var searchNode = undefined;
var default_node_color = "#ccc";	
var nominal_stroke = 1.5;
var selectedItem = "GE.json";
var optionItems = [
 {"text": "Macy's", "value": "Macy.json"},
  {"text": "General Electric", "value": "GE.json"},
  {"text": "Tata", "value": "Tata.json"},
  {"text": "Inditex", "value": "Inditex.json"},
  {"text": "H&M", "value": "HM.json"}
];

var analyticItems = [
  {"text": "ETB Hub Analysis"},
  {"text": "NTB/ ETB Cluster Analysis"},
  {"text": "NTB Centrality Analysis"}
];
var hubTable = undefined;
var sortingField = "degree";
var sortingDirection = "desc";
var tableData = undefined;
var heightOffset = 140;
var widthOffset = 420;
var hubGrid = undefined;
var hubGridContainer = undefined;
var weightTooltip = undefined;

var initializeSelect = function () {
  var select = document.querySelector("#organizationsSelect");
  if (select) {
    optionItems.forEach(function (item) {
      var option = document.createElement("option");
      option.text = item.text;
      option.value = item.value;
      select.appendChild(option);
    });

    select.addEventListener("change", handleSelectChanged);

    select.value = selectedItem;
  }
  
  var select_anal = document.querySelector("#analyticSelect");
    if (select_anal) {
    analyticItems.forEach(function (item) {
      var option = document.createElement("option");
      option.text = item.text;
   //   option.value = item.value;
      select_anal.appendChild(option);
    });

  //  select.addEventListener("change", handleSelectChanged);

  //  select.value = selectedItem;
  }
  
  var select_anal = document.querySelector("#analyticSelect");
};

var handleSelectChanged = function (event) {
  console.log(event.target.value);
  selectedItem = event.target.value;

  resetGraphContainer();
  hideInfoPanel();

  D3ok();
};

var handleResize = function () {
  resetGraphContainer();
  //hideInfoPanel();
  resizeGrid();

  D3ok();
};

var resetGraphContainer = function () {
  document.querySelector("#graph-container").innerHTML = "";
};

var resizeGrid = function () {
  hubGrid.jqGrid('setGridHeight', hubGridContainer.clientHeight - 65);
};

var hideInfoPanel = function () {
  document.querySelector("#movieInfo").className = "panel_off";
};

var initializeResize = function () {
  window.addEventListener("resize", handleResize);
};

var initializeAutocomplete = function (data) {
  console.log(data);
  var names = [];
  for (var i = 0; i < data.length - 1; i++) {
      names.push(data[i].label);
  }
  names = names.sort();
  $("#search").autocomplete({
      source: names
  });

  var search = document.querySelector("#search");
  if (search) {
    search.addEventListener("keyup", handleEnter);
  }
};

var handleEnter = function (event) {
  console.log(event);
  if (event.keyCode === 13) {
    searchNode();
  }
};

var initializeTable = function () {
  hubTable = document.querySelector("#hubs-table");
  if (hubTable) {
    var cols = hubTable.querySelectorAll("th.sortable");
    cols.forEach(function (col) {
      col.addEventListener("click", handleHeaderClick);
    });
  }  
};

var initializeGrid = function () {
  hubGridContainer = document.querySelector('.table-container');
  if (hubGridContainer) {
    hubGrid = $("#hubs-grid");
    hubGrid.jqGrid({
      datatype: "local",
      height: hubGridContainer.clientHeight - 65,
      colNames: ['No', 'Hub Name', 'Connections', 'Transactions', 'URL'],
      colModel: [
          { name: 'no', width: 40, sortable: false },
          { name: 'label', sorttype: "string", formatter: hubNameFormatter },
          { name: 'degree', width: 100, align: "right", sorttype: "int", classes:"monospace", formatter: numberFormatter },
          { name: 'notional', width: 100, align: "right", sorttype: "int", classes:"monospace", formatter: numberFormatter },
          { name: 'EikonWeb_attr', hidden: true }
      ],
      multiselect: false,
      rowNum: 100,
      viewrecords: false,
      caption: "Graphical Analytic Results",
    });
  }  
};

var hubNameFormatter = function (value, options, model) {
  var output = value;
  if (model['EikonWeb_attr']) {
    output = '<a href="' + model['EikonWeb_attr'] + '" target="_blank">' + value + '</a>';
  }
  return output;
};

var numberFormatter = function (value, options, model) {
  var output = value;
  if (output === '') {
    output = '-';
  }
  return output;
};

var handleHeaderClick = function (event) {
  var target = event.currentTarget;
  var field = target.getAttribute("field");
  var icons = hubTable.querySelectorAll("th.sortable .icon");
  var icon = target.querySelector(".icon");
  icons.forEach(function (icon) {
    if (icon.className.indexOf("hidden") === -1) {
      icon.className += " hidden";
    }
  });
  if (field === sortingField) {
    var from = "down", to = "up";
    if (sortingDirection === "asc") {
      sortingDirection = "desc";
      from = "up";
      to = "down";
    }
    else {
      sortingDirection = "asc";
      from = "down";
      to = "up";
    }
    icon.className = icon.className.replace(from, to);
    icon.className = icon.className.replace("hidden", "");
  }
  else {
    sortingField = field;
    sortingDirection = "desc";
    icon.className = "icon icon-mini-down";
  }

  tableData.sort(sortData.bind(undefined, sortingField, sortingDirection));
  clearTable();
  renderTable(tableData);

};

var sortData = function (field, direction, a, b) {
  var output;
  if (a[field] > b[field]) {
    output = -1;
  }
  else if (a[field] < b[field]) {
    output = 1;
  }
  else {
    output = 0;
  }
  if (direction.toLowerCase() === "asc") {
    output *= -1;
  }
  return output;
};

var clearTable = function () {
  if (hubTable) {
    hubTable.querySelector("tbody").innerHTML = "";
  }
};

var renderTable = function (nodes) {
  clearTable();
  if (hubTable) {
    var body = hubTable.querySelector("tbody");
    if (body) {
      nodes.forEach(function (node, index) {
        var row = document.createElement("tr");
        var no = document.createElement("td");
        var name = document.createElement("td");
        var connections = document.createElement("td");
        var transitions = document.createElement("td");

        body.appendChild(row);

        no.innerHTML = index + 1;

        if (node.EikonWeb_attr) {
          name.innerHTML = "<a href='" + node.EikonWeb_attr + "' target='_blank'>" + node.label + "</a>";
        }
        else {
          name.innerHTML = node.label;
        }        
        connections.className = "text-right";
        connections.innerHTML = node.degree ? node.degree : "-";
        transitions.className = "text-right";
        transitions.innerHTML = node.notional ? node.notional : "-";

        row.appendChild(no);
        row.appendChild(name);
        row.appendChild(connections);
        row.appendChild(transitions);
      });
    }    
  }
};

var renderGrid = function (data) {
  hubGrid.jqGrid('clearGridData');
  for (var i = 0; i < data.length; i++) {
    data[i].no = i + 1;
    hubGrid.addRowData(i + 1, data[i]);  
  }
};

var displayWeightTooltip = function (link, weight) {  
  if (weightTooltip) {
    var box = link[0][0].getBoundingClientRect();
    if (box) {
      weightTooltip.style.top = box.top + 'px';
      weightTooltip.style.left = box.left + 'px';
      weightTooltip.style.display = '';
      weightTooltip.innerHTML = weight;
    }
  }
  else {
    weightTooltip = document.querySelector('#weightTooltip');
    displayWeightTooltip(link, weight);
  }
};

var hideWeightTooltip = function () {
  if (weightTooltip) {
    weightTooltip.style.display = 'none';
  }
};
// -------------------------------------------------------------------

// Do the stuff -- to be called after D3.js has loaded
function D3ok() {

  DEBUG = false;

  // In debug mode, ensure there is a console object (MSIE does not have it by 
  // default). In non-debug mode, ensure the console log does nothing
  if( !window.console || !DEBUG ) {
    window.console = {};
    window.console.log = function () {};
  }

  // Some constants
  var WIDTH = document.body.offsetWidth - widthOffset,
      HEIGHT = document.body.offsetHeight - heightOffset,
      SHOW_THRESHOLD = 2.5;

  // Variables keeping graph state
  var activeMovie = undefined;
  var currentOffset = { x : 0, y : 0 };
  var currentZoom = 1.0;

  // The D3.js scales
  var xScale = d3.scale.linear()
    .domain([0, WIDTH])
    .range([0, WIDTH]);
  var yScale = d3.scale.linear()
    .domain([0, HEIGHT])
    .range([0, HEIGHT]);
  var zoomScale = d3.scale.linear()
    .domain([1,6])
    .range([1,6])
    .clamp(true);


/* .......................................................................... */

  // The D3.js force-directed layout
  var force = d3.layout.force()
    .charge(-50)
    .size( [WIDTH, HEIGHT] )
    .linkStrength( function(d,idx) { return d.weight; } );

  // Add to the page the SVG element that will contain the movie network
  var svg = d3.select("#graph-container").append("svg:svg")
    .attr('xmlns','http://www.w3.org/2000/svg')
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("id","graph")
    .attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT )
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Arrow
  svg.append("defs").selectAll("marker")
      .data(["suit", "licensing", "resolved"])
    .enter().append("marker")
      .attr("id", function(d) { return d; })
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
      .style("stroke", "#B2D9D8")
      .style("opacity", "1");

  // Movie panel: the div into which the movie details info will be written
  movieInfoDiv = d3.select("#movieInfo");

  /* ....................................................................... */

  // Get the current size & offset of the browser's viewport window
  function getViewportSize( w ) {
    var w = w || window;
    console.log(w);
    if( w.innerWidth != null ) 
      return { w: w.innerWidth, 
	       h: w.innerHeight,
	       x : w.pageXOffset,
	       y : w.pageYOffset };
    var d = w.document;
    if( document.compatMode == "CSS1Compat" )
      return { w: d.documentElement.clientWidth,
	       h: d.documentElement.clientHeight,
	       x: d.documentElement.scrollLeft,
	       y: d.documentElement.scrollTop };
    else
      return { w: d.body.clientWidth, 
	       h: d.body.clientHeight,
	       x: d.body.scrollLeft,
	       y: d.body.scrollTop};
  }

  function getQStringParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }
  /* Change status of a panel from visible to hidden or viceversa
     id: identifier of the div to change
     status: 'on' or 'off'. If not specified, the panel will toggle status
  */
  toggleDiv = function( id, status ) {
    d = d3.select('div#'+id);
    console.log( 'TOGGLE', id, d.attr('class'), '->', status );
    if( status === undefined )
      status = d.attr('class') == 'panel_on' ? 'off' : 'on';
    d.attr( 'class', 'panel_' + status );
    return false;
  }

  /* Clear all help boxes and select a movie in the network and in the 
     movie details panel
  */
  clearAndSelect = function (id) {
    toggleDiv('faq','off'); 
    toggleDiv('help','off'); 
    selectMovie(id,true);	// we use here the selectMovie() closure
  }

  /* Compose the content for the panel with movie details.
     Parameters: the node data, and the array containing all nodes
  */
  function getMovieInfo( n, nodeArray ) {
    console.log( "INFO", n );
    info = '<div id="cover">';
 /*   if( n.cover )
      info += '<img class="cover" height="300" src="' + n.cover + '" title="' + n.label + '"/>';
    else		*/
	
    info += '<img src="images/close.png" class="close-button" title="close panel" onClick="toggleDiv(\'movieInfo\');"/>';
    info += '<img src="images/target-32.png" class="center-button" title="center graph on movie" onclick="selectMovie('+n.index+',true);"/>';
    info += '<h2 class="t">' + n.label + '</h2>';
	
    info += '<br/></div><div style="clear: both;">'
	if( n.uris )
      info += '<div class=f><span class=l>Unique Identifier</span>: <span class=d>' 
           + n.uris + '</span></div>';
    if( n.degree )
      info += '<div class=f><span class=l>No of transacted parties</span>: <span class=g>' 
           + n.degree + '</span></div>';
    if( n.EikonWeb_attr )
      info += '<div class=f><span class=l>EikonWeb</span>: <span class=d> <a href ="' 
           + n.EikonWeb_attr + '" target="_blank" >Eikon Link</a></span></div>';
	if( n.website )
      info += '<div class=f><span class=l>Home Page</span>: <span class=d> <a href ="' 
           + n.website + '" target="_blank" >Home Page</a></span></div>';
	if( n.score )
      info += '<div class=f><span class=l>Transactional Notional (total in million)</span>: <span class=d>' 
           + n.notional + '</span></div>';
	if( n.SCB_LEID )
      info += '<div class=f><span class=l>SCB LEID</span>: <span class=d>' 
           + n.SCB_LEID + '</span></div>';
    if( n.country )
      info += '<div class=f><span class=l>Country of Incorporation</span>: <span class=c>' 
           + n.country + '</span></div>';
    if( n.links ) {
      info += '<div class=f><span class=l>Related to</span>: ';
      n.links.forEach( function(idx) {
	info += '[<a href="javascript:void(0);" onclick="selectMovie('  
	     + idx + ',true);">' + nodeArray[idx].label + '</a>]'
      });
      info += '</div>';
    }
    return info;
  }
  
  function filterArray(arrayy) {
    return arrayy['degree'] != 0;
}

  // *************************************************************************

  function drawGraph(selected) {
    d3.json(
    //'/data/movie-network-25-7-3.json',
    'data/' + selected,
      function(data) {

      // Declare the variables pointing to the node & link arrays
      var nodeArray_original = data.nodes;
      var linkArray = data.links;
	  var noLinks = data.nodelink;
	  //var nodeArray = nodeArray_original
	  nblimit = data.nodelink;
	 // var nodeArray ; //= $.extend(true, [], nodeArray_original);
	  var nodeArray = nodeArray_original.filter(filterArray)
/* 	  for(var i = 0; nodeArray_original.length - 1 ; i++) {
		  try{
		   if (nodeArray[i]['degree'] ==0) {
			//var idx = nodeArray.indexOf(i)
			//nodeArray.splice(i, 1);
			delete nodeArray[i];
		  }}
		catch (err){
			console.log(i);
		}
	  } */
	  
      console.log("NODES:",nodeArray);
      console.log("LINKS:",linkArray);
	  console.log("NOLINKS:",noLinks);
	  
      initializeAutocomplete(nodeArray);

      minLinkWeight = 
        Math.min.apply( null, linkArray.map( function(n) {return n.weight;} ) );
      maxLinkWeight = 
        Math.max.apply( null, linkArray.map( function(n) {return n.weight;} ) );
      console.log( "link weight = ["+minLinkWeight+","+maxLinkWeight+"]" );

    
    min_score = 0;    //   Math.min.apply( null, nodeArray.map( function(n) {return n.score;} ) );
   // max_score =   Math.max.apply( null, linkArray.map( function(n) {return n.score;} ) );  
    max_score =1.0;
    var color = d3.scale.linear()   /*  scale for ratings   */
    .domain([min_score, (min_score+max_score)/2, max_score])
    .range(["lime", "yellow", "red"]);
    
      // Add the node & link arrays to the layout, and start it
      force
        .nodes(nodeArray)
        .links(linkArray)
        .start();

    var optArray = [];
    for (var i = 0; i < nodeArray.length - 1; i++) {
      optArray.push(nodeArray[i].label);}
    optArray = optArray.sort();
  //$(function () {
    //  $("#search").autocomplete({
    //      source: optArray
    //  });
  //});
      
      // A couple of scales for node radius & edge width
    // need to adjust the scores here for visibility;
    // this is dependent on the data scores
      var node_size = d3.scale.linear()
        //.domain([5,10]) // we know score is in this domain
        .domain([0,50]) // the full domain of the data - doesnt really affect size but whether it appears or not
        .range([1,250])	// parameters to correct for good sizing
        .clamp(true);
      var edge_width = d3.scale.pow().exponent(8)
        .domain( [minLinkWeight,maxLinkWeight] )
       // .range([1,3])
      .range([1,3])
        .clamp(true);

      /* Add drag & zoom behaviours */
      svg.call( d3.behavior.drag()
          .on("drag",dragmove) );
      svg.call( d3.behavior.zoom()
          .x(xScale)
          .y(yScale)
          .scaleExtent([1, 6])
          .on("zoom", doZoom) );

      // ------- Create the elements of the layout (links and nodes) ------

      var networkGraph = svg.append('svg:g').attr('class','grpParent');

      // links: simple lines
      var graphLinks = networkGraph.append('svg:g').attr('class','grp gLinks')
        .selectAll("line")
        .data(linkArray, function(d) {return d.source.id+'-'+d.target.id;} )
        .enter().append("line")
        .style('stroke-width', function(d) { return edge_width(d.weight);} )
        .attr("class", "link")
        .style("marker-end",  "url(#suit)")
        .attr("title", function (d) {
          return d.weight;
        })
        .on("mouseover", function (d) {
          var link = d3.select(this);
          link.style("stroke", "#0072AA");
          
          displayWeightTooltip(link, d.weight);
        })
        .on("mouseout", function (d) {
          d3.select(this).style("stroke", null);
          hideWeightTooltip();
        });

      // nodes: an SVG circle
      var graphNodes = networkGraph.append('svg:g').attr('class','grp gNodes')
        .selectAll("circle")
        .data( nodeArray, function(d){ return d.id; } )
        .enter().append("svg:circle")
        .attr('id', function(d) { return "c" + d.index; } )
        .attr('class', function(d) { return 'node level'+d.level;} )
    //    .attr('r', function(d) { return node_size(d.score || 3); } )
        .attr('r', function(d) { return node_size(d.score ); } )
        .attr('pointer-events', 'all')
      .attr('cursor', 'crosshair')
        //.on("click", function(d) { highlightGraphNode(d,true,this); } )    
        .on("click", function(d) { showMoviePanel(d); } )
        .on("mouseover", function(d) { highlightGraphNode(d,true,this);  } )
        .on("mouseout",  function(d) { highlightGraphNode(d,false,this); } )
     //.style("fill", '#EBC763')
	 .style("fill", function(d) { 
        if ( d.ntb>=0) return color(d.ntb)
        else return default_node_color; });


      // labels: a group with two SVG text: a title and a shadow (as background)
      var graphLabels = networkGraph.append('svg:g').attr('class','grp gLabel')
        .selectAll("g.label")
        .data( nodeArray, function(d){return d.label} )
        .enter().append("svg:g")
        .attr('id', function(d) { return "l" + d.index; } )
        .attr('class','label');
     
      shadows = graphLabels.append('svg:text')
        .attr('x','-2em')
        .attr('y','-.3em')
        .attr('pointer-events', 'none') // they go to the circle beneath
        .attr('id', function(d) { return "lb" + d.index; } )
        .attr('class','nshadow')
        .text( function(d) { return d.label; } );

      labels = graphLabels.append('svg:text')
        .attr('x','-2em')
        .attr('y','-.3em')
        .attr('pointer-events', 'none') // they go to the circle beneath
        .attr('id', function(d) { return "lf" + d.index; } )
        .attr('class','nlabel')
        .text( function(d) { return d.label; } );

    function dosearchNode() {
      //find the node
      var selectedVal = document.getElementById('search').value;
      var node = svg.selectAll(".node");
      if (selectedVal == "none") {
        node.style("stroke", "white").style("stroke-width", "1");
      } else {
        var selected = node.filter(function (d, i) {
          return d.label != selectedVal;
        });
        selected.style("opacity", "0");
        var link = svg.selectAll(".link")
        link.style("opacity", "0");
        d3.selectAll(".node, .link").transition()
          .duration(10000)
          .style("opacity", 1);
      }
    }
      
      
      /* --------------------------------------------------------------------- */
      /* Select/unselect a node in the network graph.
         Parameters are: 
         - node: data for the node to be changed,  
         - on: true/false to show/hide the node
      */
      function highlightGraphNode( node, on ) {
        //if( d3.event.shiftKey ) on = false; // for debugging

        // If we are to activate a movie, and there's already one active,
        // first switch that one off
        if( on && activeMovie !== undefined ) {
          console.log("..clear: ",activeMovie);
          highlightGraphNode( nodeArray[activeMovie], false );
          console.log("..cleared: ",activeMovie); 
        }

        console.log("SHOWNODE "+node.index+" ["+node.label + "]: " + on);
        console.log(" ..object ["+node + "]: " + on);
        // locate the SVG nodes: circle & label group
        circle = d3.select( '#c' + node.index );
        label  = d3.select( '#l' + node.index );
        console.log(" ..DOM: ",label);

        // activate/deactivate the node itself
        console.log(" ..box CLASS BEFORE:", label.attr("class"));
        console.log(" ..circle",circle.attr('id'),"BEFORE:",circle.attr("class"));
        circle.classed( 'main', on );
        label.classed( 'on', on || currentZoom >= SHOW_THRESHOLD );
        label.selectAll('text')
          .classed( 'main', on );
        console.log(" ..circle",circle.attr('id'),"AFTER:",circle.attr("class"));
        console.log(" ..box AFTER:",label.attr("class"));
        console.log(" ..label=",label);

        // activate all siblings
        console.log(" ..SIBLINGS ["+on+"]: "+node.links);
        Object(node.links).forEach( function(id) {
          d3.select("#c"+id).classed( 'sibling', on );
          label = d3.select('#l'+id);
          label.classed( 'on', on || currentZoom >= SHOW_THRESHOLD );
          label.selectAll('text.nlabel')
            .classed( 'sibling', on );
        });

        // set the value for the current active movie
        activeMovie = on ? node.index : undefined;
        console.log("SHOWNODE finished: "+node.index+" = "+on );
      }


      /* --------------------------------------------------------------------- */
      /* Show the details panel for a movie AND highlight its node in 
         the graph. Also called from outside the d3.json context.
         Parameters:
         - new_idx: index of the movie to show
         - doMoveTo: boolean to indicate if the graph should be centered
           on the movie
      */
      selectMovie = function( new_idx, doMoveTo ) 
    {
        console.log("SELECT", new_idx, doMoveTo );
        // do we want to center the graph on the node?
        doMoveTo = doMoveTo || false;
        if( doMoveTo ) {
        console.log("..POS: ", currentOffset.x, currentOffset.y, '->', 
            nodeArray[new_idx].x, nodeArray[new_idx].y );
        s = getViewportSize();
        width  = s.w<WIDTH ? s.w : WIDTH;
        height = s.h<HEIGHT ? s.h : HEIGHT;
        offset = { x : s.x + width/2  - nodeArray[new_idx].x*currentZoom,
             y : s.y + height/2 - nodeArray[new_idx].y*currentZoom };
        repositionGraph( offset, undefined, 'move' );
        }
        // Now highlight the graph node and show its movie panel
        highlightGraphNode( nodeArray[new_idx], true );
        showMoviePanel( nodeArray[new_idx] );
      }


      /* --------------------------------------------------------------------- */
      /* Show the movie details panel for a given node
       */
      function showMoviePanel( node ) {
        // Fill it and display the panel
        movieInfoDiv
          .html(getMovieInfo(node,nodeArray))
          .attr("class","panel_on");
      }
      
      /* --------------------------------------------------------------------- */
      /* Move all graph elements to its new positions. Triggered:
         - on node repositioning (as result of a force-directed iteration)
         - on translations (user is panning)
         - on zoom changes (user is zooming)
         - on explicit node highlight (user clicks in a movie panel link)
         Set also the values keeping track of current offset & zoom values
      */
      function repositionGraph( off, z, mode ) {
        console.log( "REPOS: off="+off, "zoom="+z, "mode="+mode );

        // do we want to do a transition?
        var doTr = (mode == 'move');

        // drag: translate to new offset
        if( off !== undefined &&
      (off.x != currentOffset.x || off.y != currentOffset.y ) ) {
    g = d3.select('g.grpParent')
    if( doTr )
      g = g.transition().duration(500);
    g.attr("transform", function(d) { return "translate("+
              off.x+","+off.y+")" } );
    currentOffset.x = off.x;
    currentOffset.y = off.y;
        }

        // zoom: get new value of zoom
        if( z === undefined ) {
      if( mode != 'tick' )
        return; // no zoom, no tick, we don't need to go further
        z = currentZoom;
        }
        else
      currentZoom = z;

        // move edges
        e = doTr ? graphLinks.transition().duration(500) : graphLinks;
        e
    .attr("x1", function(d) { return z*(d.source.x); })
          .attr("y1", function(d) { return z*(d.source.y); })
          .attr("x2", function(d) { return z*(d.target.x); })
          .attr("y2", function(d) { return z*(d.target.y); });

        // move nodes
        n = doTr ? graphNodes.transition().duration(500) : graphNodes;
        n
    .attr("transform", function(d) { return "translate("
             +z*d.x+","+z*d.y+")" } );
        // move labels
        l = doTr ? graphLabels.transition().duration(500) : graphLabels;
        l
    .attr("transform", function(d) { return "translate("
             +z*d.x+","+z*d.y+")" } );
      }
             

      /* --------------------------------------------------------------------- */
      /* Perform drag
       */
      function dragmove(d) {
        console.log("DRAG",d3.event);
        offset = { x : currentOffset.x + d3.event.dx,
       y : currentOffset.y + d3.event.dy };
        repositionGraph( offset, undefined, 'drag' );
      }


      /* --------------------------------------------------------------------- */
      /* Perform zoom. We do "semantic zoom", not geometric zoom
       * (i.e. nodes do not change size, but get spread out or stretched
       * together as zoom changes)
       */
      function doZoom( increment ) {
        newZoom = increment === undefined ? d3.event.scale 
            : zoomScale(currentZoom+increment);
        console.log("ZOOM",currentZoom,"->",newZoom,increment);
        if( currentZoom == newZoom )
    return; // no zoom change

        // See if we cross the 'show' threshold in either direction
        if( currentZoom<SHOW_THRESHOLD && newZoom>=SHOW_THRESHOLD )
    svg.selectAll("g.label").classed('on',true);
        else if( currentZoom>=SHOW_THRESHOLD && newZoom<SHOW_THRESHOLD )
    svg.selectAll("g.label").classed('on',false);

        // See what is the current graph window size
        s = getViewportSize();
        width  = s.w<WIDTH  ? s.w : WIDTH;
        height = s.h<HEIGHT ? s.h : HEIGHT;

        // Compute the new offset, so that the graph center does not move
        zoomRatio = newZoom/currentZoom;
        newOffset = { x : currentOffset.x*zoomRatio + width/2*(1-zoomRatio),
          y : currentOffset.y*zoomRatio + height/2*(1-zoomRatio) };
        console.log("offset",currentOffset,"->",newOffset);

        // Reposition the graph
        repositionGraph( newOffset, newZoom, "zoom" );
      }

      zoomCall = doZoom;  // unused, so far
    searchNode = dosearchNode;

      /* --------------------------------------------------------------------- */

      /* process events from the force-directed graph */
      force.on("tick", function() {
        repositionGraph(undefined,undefined,'tick');
      });

      /* A small hack to start the graph with a movie pre-selected */
      mid = getQStringParameterByName('id')
      if( mid != null )
        clearAndSelect( mid );

      tableData = data.nodes;      
      renderGrid(tableData);
      /*tableData.sort(sortData.bind(undefined, sortingField, sortingDirection));
      renderTable(tableData);*/
    });
  }

  drawGraph(selectedItem);
} // end of D3ok()
