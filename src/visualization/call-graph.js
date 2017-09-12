/*global d3*/
import {DataNode} from "./data-node.js";
import {AceUtils} from "../utils/ace-utils";

export class CallGraph {
  focusedNode = null;
  currentDirection = "groovy"; // or "right"
  directionManager = {
    right: {
      nodeRenderer: function translateRight(d) {
        return "translate(" + d.y + "," + d.x + ")";
      },
      linkRenderer: function linkRenderer(d) {
        return "M" + d.y + "," + d.x +
          "C" + (d.parent.y + 100) + "," + d.x +
          " " + (d.parent.y + 100) + "," + d.parent.x +
          " " + d.parent.y + "," + d.parent.x;
      }
    },

    /*
    // adds the links between the nodes
    var link = g.selectAll(".link")
      .data( nodes.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        return "M" + d.x + "," + d.y
          + "C" + d.x + "," + (d.y + d.parent.y) / 2
          + " " + d.parent.x + "," +  (d.y + d.parent.y) / 2
          + " " + d.parent.x + "," + d.parent.y;
      });
  */
    down: {
      nodeRenderer: function translateRight(d) {
        return "translate(" + d.x + "," + d.y + ")";
      },
      linkRenderer: function linkRenderer(d) {
        return "M" + d.x + "," + d.y +
          "C" + (d.parent.x + 100) + "," + d.y +
          " " + (d.parent.x + 100) + "," + d.parent.y +
          " " + d.parent.x + "," + d.parent.y;
      }
    },
    groovy: {
      nodeRenderer: function translateRight(d) {
        return "translate(" + d.x+ "," + d.y + ")";
      },
      linkRenderer: function link(d) {
        if(d.source){
          return "M" + d.source.y + "," + d.source.x
            + "C" + (d.source.y + d.target.y) / 2 + "," + d.source.x
            + " " + (d.source.y + d.target.y) / 2 + "," + d.target.x
            + " " + d.target.y + "," + d.target.x;
        }

        return "M" + d.x + "," + d.y +
          "C" + (d.parent.x + 100) + "," + d.y +
          " " + (d.parent.x + 100) + "," + d.parent.y +
          " " + d.parent.x + "," + d.parent.y;

      }
    }
  };

  constructor() {
    this.prepareFx();
    this.config = {
      type: 'CallGraph',
      styleClass: 'call-graph',
      title: 'Call Graph',
      trace: null,
      formatTraceFx: this.formatTraceFx,
      renderFx: this.renderFx,
      errorMessage: null
    };
    this.aceUtils = new AceUtils();
    this.focusMarker = this.aceUtils.makeAceMarkerManager(null, this.aceUtils.getAvailableMarkers().callGraphFocusMarker, "line");
    this.hoverMarker = this.aceUtils.makeAceMarkerManager(null, this.aceUtils.getAvailableMarkers().callGraphHoverMarker);

  }

  prepareFx() {
    let self = this;
    this.formatTraceFx = function makeTree(trace = this.trace, traceHelper) {
      if (!trace)
        return;
      if (traceHelper) {
        self.traceHelper = traceHelper;
        self.isRangeInRange = traceHelper.isRangeInRange;
      }
      console.log("RENDER_______________________________________", traceHelper);
      let formattedTrace = new DataNode("trunk", "Program");

      let calls = 0;
      let functions = {};
      for(let index in trace.timeline) {
        let entry = trace.timeline[index];
        if(entry.type === "FunctionDeclaration" || entry.type === "FunctionExpression" || entry.type === "FunctionData"){
          functions[JSON.stringify(entry.range)] = entry;
        }
      }
      console.log("functions", functions);

      for(let index in trace.timeline){
        let entry = trace.timeline[index];
        let containingFunction = null;
        if(entry.type === "CallExpression"){
          for(let i in functions){
            if(self.isRangeInRange(entry.range, functions[i].range)){
              if(containingFunction){
                if(self.isRangeInRange(functions[i].range, containingFunction.range)){
                  containingFunction = functions[i];
                }
              }else{
                containingFunction = functions[i];
              }
            }

          }
          let rangeinfo= "program";
          if(containingFunction){
            // rangeinfo = containingFunction.range.start.row +1;
            // formattedTrace.children.push(new DataNode(entry.type, entry.name, entry.range, entry.value, entry.text));
            for(let ind in formattedTrace.children){
              if(self.isRangeInRange(containingFunction.range, formattedTrace.children[ind].range)){
                formattedTrace.children[ind].children.push(new DataNode(entry.type, entry.id || entry.name || "anonymous", entry.range, entry.value, entry.text));
              }
            }
          }else{
            formattedTrace.children.push(new DataNode(entry.type, entry.id || entry.name || "anonymous", entry.range, entry.value, entry.text));
          }
          // console.log("expression", entry.range.start.row +1, entry.range.start.column,  "belongs to ", rangeinfo);
        }
        // if(entry.type === "FunctionData"){
        // if(entry.type === "FunctionDeclaration" || entry.type === "FunctionExpression" || entry.type === "FunctionData"){
        //     for(let i = --index; i > 0; i--){
        //     let previousEntry = trace.timeline[i];
        //     if(previousEntry.type === "CallExpression" ){
        //       //&& JSON.stringify(entry.callExpressionRange) === JSON.stringify(previousEntry.range)
        //       // console.log("Function definition", entry);
        //       console.log("function call " +(calls++), functions[JSON.stringify(previousEntry.range)]);
        //       break;
        //     }
        //   }
        //
        // }
      }



      return formattedTrace;


//
//       //the text starts at line 0 by default, plus one to match natural line numbers
//       let map = {};
//       let funcs = [];
//       //
//       funcs = self.findFuncs(trace);
// //random comment: I see
//       for (let i = 0; i < funcs.length; i++)
//         map[funcs[i].name] = funcs[i]; //try with adjacency list
//
//       map = self.makeMatrixList(funcs, map);
//       //
//       let rootsList = []; //list of functions that arent called
//       for (let key in map) {
//         //console.log( key ) ;
//         if (map[key].parents.length === 0)
//           rootsList.push(map[key]);
//       }
//
//
//       let masterHead = new DataNode("Program", "Program");
//
//       // rootsList.map(function(e) {
//       //   masterHead.children.push(e);
//       // })
//
//       // return rootsList[ 0 ] ;
//       return rootsList[0];
    };

    this.renderFx = function renderFx(formattedTrace, divElement, query, queryType, aceUtils, aceMarkerManager, dimensions, eventAggregator) {
      // if(true){
      //   return;
      // }
      // execution trace formatted for use in d3.hierarchy
      if (!formattedTrace) {
        return;
      }
      // console.log(formattedTrace);

      // user search handling: when the user searches, the renderFx will use scrubTree and scrubLeaves to remove not matching nodes
      if (query !== null && (query == undefined || query.trim() === "")) {
        query = null;
      }

      function scrubLeaves(root, hasLeaves = 0) {
        if (root === undefined || root.children === undefined) {
          return hasLeaves;
        }

        let children = root.children;

        for (let i = 0; i < children.length; i++) {
          if (children[i].children.length === 0 && !children[i].name.includes(query)) {
            hasLeaves++;
            root.children.splice(i, 1);
          }
          hasLeaves += scrubLeaves(children[i], hasLeaves);
        }
        return hasLeaves;
      }

      function scrubTree(root) {
        while (scrubLeaves(root)) {

        }
        ;
      }

      function makeQuery() {
        scrubTree(formattedTrace);
      }

      if (query !== null && queryType === "functions") {
        makeQuery();
      }
      // end of user search handling

      // d3.select(divElement).html("");

      let visualizationContainer = d3.select(divElement).node();
      let rectWidth = 100,
        rectHeight = 30;

      let defaultWidth = visualizationContainer && visualizationContainer.getBoundingClientRect().width? visualizationContainer.getBoundingClientRect().width: 500;
      let tree = d3.tree()
        .nodeSize([100, 70]).separation(function separation(a, b) {
          // console.log(a, a.height, a.data, a.boxWidth, a.data.name);
          // return a.parent == b.parent ? .2 + (a.data.name ? getBoxWidth(a.data.name)/defaultWidth: .8) : 2;
          // let nodeProportion = getBoxWidth(a.data.name)/100;
          // return  nodeProportion ;
          return 1;
        });

      let diagonal = self.directionManager[self.currentDirection].linkRenderer;

      let nodeRenderer = self.directionManager[self.currentDirection].nodeRenderer;

      d3.select(divElement).select("svg").remove();
      let graph = d3.select(divElement).append("svg")
        .classed("svg-container", true)
        .style("width", "100%")
        .style("height", "99%")
        .attr("position", "relative")
        .call(d3.zoom()
          .on("zoom", function () {
            graph.attr("transform", function () {
              let d3Event = d3.event.transform;
              return "translate(" + d3Event.x + ", " + d3Event.y + ") scale(" + d3Event.k + ")";
            });
          }))
        .append("g");

      graph.attr("transform", "translate(100,0)");

      // svg.on('mouseover', mouseover);
      // function mouseover() {
      //   var mousePositionX = (d3.event.clientX);
      //   var mousePositionY = (d3.event.clientY);
      //   var nodeRow = (d3);
      //   console.log(d3.event);
      //   console.log(d3.data);
      //   console.log(d3.data.row);
      //   console.log(d3.event.data.row);
      // }

      let root = d3.hierarchy(formattedTrace),
        nodes = root.descendants(),
        links = root.descendants().slice(1);

      tree(root);
      // Normalize for fixed-depth.
      // nodes.forEach(function(d) { d.y = d.depth * 180; });
      let graphLinks = graph
        .selectAll(".link")
        .data(links)
        .enter()
        .append("g")
        .attr("class", "link");

      graphLinks.append("line")
        .attr("x1", function (d) {
          return d.parent.x;
        })
        .attr("y1", function (d) {
          return !d.parent.data.name.includes(query) ? d.parent.y + rectHeight / 2 : d.parent.y + rectHeight;
        })
        .attr("x2", function (d) {
          return d.x;
        })
        .attr("y2", function (d) {
          return !d.data.name.includes(query) ? d.y + rectHeight / 2 : d.y;
        })
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "1.5px");

      // graphLinks.append("text")
      //   .attr("class","num_text")
      //   .attr("x", function(d) {
      //     return (d.x + d.parent.x)/2;
      //   })
      //   .attr("y", function(d) {
      //     return (d.y + d.parent.y + rectHeight)/2;
      //   })
      //   .attr("text-anchor", "middle")
      //   .text(function (d) {
      //     return d.data.childCalls;//Math.floor((Math.random() * 10) + 1);
      //   })
      //   .style("font","10px sans-serif");

      function showHoverText(g, d) {
        d3.select(g).append("text")
          .attr("class", "hover")
          .attr("transform", function () {
            return "translate(5, -5)";
          })
          .text(d.data.name);
      }

      function hideHoverText(g) {
        d3.select(g).select("text.hover").remove();
      }

      function highlight(d) {
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.hoverMarker, elements: [d.data.range]});
      }

      function unhighlight() {
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.hoverMarker, elements: []});
      }

      function onMouseOver(d) {
        // console.log("this:", this, "data:", d.data);
        let position = {};
        // position.pageX = d3.event.clientX;
        // position.pageY = d3.event.clientY;
        // console.log(d3.event, $(this).position());

        position.pageX = $(this).position().left;
        position.pageY = $(this).position().top - 14;
        let row = d.data.range.start.row;
        // le rowData =
        eventAggregator.publish("showBranchNavigator", {
          context: "call-graph",
          target: this,
          row: row,
          pixelPosition: position
        });
        // console.log(d.data);
        // eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.focusMarker, elements: [d.data.range]});
        // showHoverText(this, d);
        highlight(d);
      }

      function onMouseOut(d) {
        hideHoverText(this);
        unhighlight(d);
      }

      function getBoxWidth(text) {
        return (text.length || 1) * 10 + 10;
      }

      function focus(d) {
        if (d.data.isFocused === true) {
          unfocus()
          d.data.isFocused = false;
          return;
        }
        if (self.focusedNode) {
          unfocus();
          self.focusedNode.data.isFocused = false;
        }
        self.focusedNode = d;
        d.data.isFocused = true;
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.focusMarker, elements: d.data.ranges});
      }

      function unfocus() {
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.focusMarker, elements: []});
      }

      // console.log('nodes')
      // console.log(node)
      let graphNodes = graph.selectAll(".node")
        .data(nodes)
        .enter().append("g");

      let multiParents = graphNodes.filter(function (d, i) {
        return d.data.parents.length > 1;
      });

      let parentPairs = [];

      multiParents.each(function (d) {
        for (let i = 1; i < d.data.parents.length; i++) {
          let p;
          graphNodes.filter(function (d2, i2) {
            return d2.data.id === d.data.parents[i].id;
          }).each(function (pNode) {
            p = pNode;
          })
          parentPairs.push({
            parent: p,
            child: d
          });
        }
      });

      parentPairs.forEach(function (multiPair) {
        graphLinks.append("line")
          .attr("class", "additionalParentLink")
          .attr("x1", multiPair.parent.x)
          .attr("y1", !multiPair.parent.data.name.includes(query) ? multiPair.parent.y + rectHeight / 2 : multiPair.parent.y + rectHeight)
          .attr("x2", multiPair.child.x)
          .attr("y2", !multiPair.child.data.name.includes(query) ? multiPair.child.y + rectHeight / 2 : multiPair.child.y)
          .style("fill", "none")
          .style("stroke", "#ccc")
          .style("shape-rendering", "geometricPrecision")
          .style("stroke-width", "1.5px")
      })

      graphNodes.attr("class", "node")
        // .attr("class", function (d) {
        //   return "node" + (d.children ? " node--internal" : " node--leaf");
        // })
        .attr("transform", nodeRenderer)
        .style("font", "10px sans-serif");

      let filteredNodes = graphNodes.filter(function (d, i) {
        if (queryType === "functions") {
          return query === null || d.data.name.includes(query) || i === 0;
        }
        else {
          return true; // TODO support other query types
        }
      });

      filteredNodes.append("rect")
        .attr("width", function (d) {
          d.boxWidth = (d.data.name.length || 1) * 6 + 6;
          return d.boxWidth;
        })
        .attr("height", rectHeight)
        .attr("transform", function (d) {
            return "translate(" + (-1 * d.boxWidth / 2) + ", 0)"
          }
        )
        .style("fill", "#fff")
        .style("stroke", "green")
        .style("stroke-width", "1px");

      filteredNodes.append("text")
        .attr("dy", 18)
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d.data.name;
        });

      filteredNodes.on("mouseover", onMouseOver)
        .on("mouseout", onMouseOut);

      filteredNodes.on("mousedown", focus)
        .on("mouseup", unfocus);


      let i = 0, duration = 750;
      // update(root);
      filteredNodes.on("click", click);
      // filteredNodes.append("circle")
      //   .attr("r", 6)
      //   .attr("transform", "translate(0," + rectHeight / 2 + ")");

      // Toggle children on click.
      function click(d) {
        if (d.children) {
          d.data.children = d.children;
          d.children = null;
        } else {
          d.children = d.data.children;
          d.data.children = null;
        }
        tree(root);
        update(d);
      }

      function update(source) {

        // Compute the new tree layout.
        let nodes = root.descendants(),
          links = root.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.x = d.depth * 180; });

        // Update the nodes…
        var node = graph.selectAll(".node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
          .on("click", click);

        nodeEnter.append("circle")
          // .attr("r", 1e-6)
          .style("fill", function(d) { return d.data.children ? "lightsteelblue" : "#fff"; });

        nodeEnter.append("text")
          .attr("y", function(d) { return d.children || d.data.children ? -10 : 10; })
          .attr("dx", ".35em")
          .attr("text-anchor", function(d) { return d.children || d.data.children ? "end" : "start"; })
          .text(function(d) { return d.text; })
          .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        nodeUpdate.select("rect")
          // .attr("r", 4.5)
          .style("fill", function(d) { return d.data.children ? "lightsteelblue" : "#fff"; });

        nodeUpdate.select("text")
          .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().
          // attr("cx", source.y).
          // attr("cy", source.x).
          transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
          .remove();

        nodeExit.select("rect")
          // .attr("r", 1e-6);
      .style("stroke", "red");

        nodeExit.select("text")
          .style("fill-opacity", 1e-6);

        // Update the links…
        var link = graph.selectAll("line")
          .data(links, function(d) { return d.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("link", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.y0, y: source.x0};
            return diagonal({source: o, target: o});
          });

        // Transition links to their new position.
        link.transition()
          .duration(duration)
          .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.y, y: source.x};
            return diagonal({source: o, target: o});
          }).remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
          d.y0 = d.x;
          d.x0 = d.y;
        });
      }
    }
  }


  findFuncs(trace) {

    let funcs = []
    if (!trace) {
      return funcs;
    }
    if (!trace.timeline) {
      return funcs;
    }
    let self = this;
    let doesFuncExist = {};
    let doesCallExist = {};
    let lastBlockRange = null;
    let callfuncs = [];
    //
    for (let index = 1; index < trace.timeline.length - 1; index++) //precomputes all the funcs
    {   // dangerous direct modification ot the trace
      let entry = trace.timeline[index];
      // shallow copy of values of interest, careful with value and range(they are the only properties that are "objects"), do not modify their properties, create a copy if needed
      let step = {id: entry.id, value: entry.value, range: entry.range, type: entry.type, text: entry.text};
      step = self.scrubStep(step);
      //
      switch (step.type) {
        case "BlockStatement":
          lastBlockRange = step.range;
          break;
        //
        case "FunctionData":
          if (!doesFuncExist[step.id]) {
            if (!lastBlockRange)
              funcs.push(new DataNode(step.type, step.id, step.range, step.value, step.text));
            else {
              funcs.push(new DataNode(step.type, step.id, lastBlockRange, step.value, step.text));
              lastBlockRange = null;
            }
            doesFuncExist[step.id] = true;
          }
          else {

          }
          break;
        case "CallExpression":
          let found = false;
          for (let i = 0; i < callfuncs.length; i++) {
            if (callfuncs[i] === step.id) {
              found = true;
            }
          }
          if (!found || step.id.includes(".")) {
            let currentVertex = new DataNode(step.type, step.id, step.range, null, step.text);
            funcs.push(currentVertex);
            callfuncs.push(step.id)
          }
          else {
            for (let i = 0; i < funcs.length; i++) {
              if (funcs[i].name === step.id) {
                funcs[i].callRanges.push({
                  range: step.range,
                  timelineIndex: index
                })
              }
            }
          }
          break;

        default: {
        }

      }
    }
    return funcs;
  }

  makeMatrixList(funcs, map) {
    // console.log(map)
    let self = this;
    for (let index1 = 0; index1 < funcs.length; index1++) {
      for (let index2 = 0; index2 < funcs.length; index2++) {

        if (funcs[index2].type === "FunctionData") {

          if (index1 !== index2 && self.isRangeInRange(funcs[index1].range, funcs[index2].range)) {
            // the smallest containing range should be selected
            let mom = funcs[index2].name;
            let child = funcs[index1].name;

            if (!map[mom].childCalls[child]) {
              map[mom].children.push(map[child]);
              if (funcs[index1].type !== "CallExpression")
                map[child].parents.push(map[mom]);
              //
              map[mom].childCalls[child] = ["testing"];
            }
            else {
              map[mom].childCalls[child].push("testing");
            }

          }
          //	if( index1 !== index2 && funcs[index1].type === "CallExpression"
          //		&& funcs[index1].text.indexOf( funcs[index2].name.replace( /[()""]/g , "" ) ) )
          //	{
          //		let mom = funcs[ index2 ].name ;
          //		let child = funcs[ index1 ].name ;
          //
          //		console.log( "callback found" ) ;
          //		map[ mom ].children.push( map[ child ] ) ;
          //		map[ child ].parents.push( map[ mom ] ) ;
          //		map[ child ].isCallback = true ;
          //	}
        }
      }
    }
    return map;
  }

  //
  //helpers
  //

  scrubStep(step) {
    if (step !== null) {
      if (step.text !== null) {
        step.text = step.text.replace(/"/g, ""); //scrubs for "
      }
      if (step.id !== null) {
        step.id = step.id.replace(/[()""]/g, "") + "()";

      }
      if (step.type !== null) {
        step.type = step.type.replace(/"/g, "");
      }
    }
    return step;
  }
}
