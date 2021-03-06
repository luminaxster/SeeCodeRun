// import * as d3 from 'd3';
/*global d3*/

export class ScatterPlot {

  constructor() {
    this.config = {
      type: 'ScatterPlot',
      styleClass: 'scatter-plot',
      title: 'Scatter Plot',
      trace: null,
      formatTraceFx: this.formatTraceFx,
      renderFx: this.renderFx,
      errorMessage: null
    };
  }

  formatTraceFx(trace) {
    if(!trace)
      return;

    let variables = [];
    let toReturn = [];

    for (let variable of trace.variables) {
      variables.push({ variableName: variable.id, values: [] });
    }

    for (let variable of trace.timeline) {
      if (variable.type !== 'VariableDeclarator' && variable.type !== 'AssignmentExpression')
        continue;

      for (let t of variables) {

        if (t.variableName !== variable.id) {
          if (t.values.length > 0) {

            // set the current time periods value to the previous value
            t.values.push({
              variableName: t.variableName,
              value: t.values[t.values.length - 1].value,
              timePeriod: t.values.length
            });

          } else {

            // the variable does not exist so insert a blank value
            t.values.push({
              variableName: t.variableName,
              value: null,
              timePeriod: t.values.length
            });
          }
        } else {

          // the variable changed so add the new value
          t.values.push({
            variableName: t.variableName,
            value: variable.value,
            timePeriod: t.values.length
          });
        }
      }
    }

    for (let variable of variables) {
      for (let value of variable.values) {
        toReturn.push(value);
      }
    }

    return toReturn;
  }

  renderFx(trace, divElement) {
    if (!trace)
      return;

    // clear the div element
    d3.select(divElement).html("");

    let data = trace;

    let margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 400 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

    let x = d3.scaleLinear()
        .range([0, width]);

    let y = d3.scaleLinear()
        .range([height, 0]);

    let color = d3.scaleOrdinal(d3.schemeCategory10);

    let xAxis = d3.axisBottom(x);
    let yAxis = d3.axisLeft(y);

    let svg = d3.select(divElement).append("svg")
      .style("width", "99%")
      .style("height", "99%")
      .attr("position", "relative")
      .call(d3.zoom()
        .on("zoom", function () {
          svg.attr("transform", function () {
            let devent = d3.event.transform;
            return "translate(" + devent.x + ", " + devent.y + ") scale(" + devent.k + ")";
          });
        }))
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function(d) {
      d.timePeriod = +d.timePeriod;
      d.value = +d.value;
    });

    x.domain(d3.extent(data, function(d) { return d.timePeriod; })).nice();
    y.domain(d3.extent(data, function(d) { return d.value; })).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Time Period");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Value");

    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.timePeriod); })
        .attr("cy", function(d) { return y(d.value); })
        .style("fill", function(d) { return color(d.variableName); });

    let legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });
    }
}
