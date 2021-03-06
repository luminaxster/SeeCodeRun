import {TraceQueryManager} from './trace-query-manager';
export class TraceHelper {
  blockScopes = [];
  timelineLength = 0;

  constructor(trace, traceModel, event) {
    this.traceModel = traceModel;
    this.description = trace.description;
    this.event = event;
    this.error = trace.error;
    this.traceQueryManager = new TraceQueryManager(this.traceModel);
    this.setTrace(trace);
  }

  isRepOK() {
    if (!this.trace) {
      return false;
    }

    if (!this.trace.timeline) {
      return false;
    }

    if (!this.trace.data) {
      return false;
    }

    return this.trace.stack;
  }

  isValid() {
    return (this.error === "" && this.trace);
  }

  getTimeline() {
    if (this.trace && this.trace.timeline) {
      return this.trace.timeline;
    }
    return [];
  }

  setTrace(trace) {
    this.trace = this.traceModel.makeTrace(trace);
    this.timelineLength = this.getTimeline().length;
  }

  getExpressionAtPosition(traceData, acePosition) {
    let isPositionInRange = this.isPositionInRange;
    let isRangeInRange = this.isRangeInRange;

    if (!acePosition || !traceData) {
      return null;
    }
    let ignoreTypeList = this.traceModel.expressionMatcherIgnoreTypeList;
    let match = null;
    for (let i in traceData) {
      let entry = traceData[i];
      if (entry.hasOwnProperty("range") && ignoreTypeList.indexOf(entry.type) === -1) {
        if (isPositionInRange(acePosition, entry.range)) {
          if (match) {
            if (isRangeInRange(entry.range, match.range)) {
              match = entry;
            }
          } else {
            match = entry;
          }

        }
      }
    }
    return match;
  }

  /*
   * getTraceDataInRange(traceData, aceRange)
   * @ param traceData - an array based on the available properties of a Trace, that is, arrays with each entry having a range.
   * @ param aceRange - a range in Ace's format, that is, with start row and column and end row and column.
   * @ example {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}.
   * @ post   if aceRange is not defined or there are no values in the trace data, returns an empty array
   *             otherwise, returns an array with all the entries within the aceRange.
   */
  getTraceDataInRange(traceData, aceRange) {
    if (!aceRange || !traceData) {
      return [];
    }
    let allValues = [];
    for (let i = 0; i < traceData.length; i++) {
      let entry = traceData[i];
      if (entry.hasOwnProperty("range")) {
        if (this.isRangeInRange(aceRange, entry.range)) {
          allValues.push(entry);
        }
      }
    }
    return allValues;
  }

  /*
   * getTraceDataInLine(traceData, lineNumber)
   * @ param traceData - an array based on the available properties of a Trace, that is, arrays with each entry having a range.
   * @ param lineNumber - the line number in the editor for retrieving all  associated data.
   * @ post  if there are no values in the trace data or line number is less than 1, returns an empty array;
   *              otherwise, returns an array of entries that start or end at lineNumber.
   * @ comment - line numbers start at 1, which matches what is normally displayed in the gutter.
   */
  getTraceDataInLine(traceData, lineNumber) {
    if (!traceData || lineNumber < 1) {
      return [];
    }
    let returnValues = [];
    for (let i = 0; i < traceData.length; i++) {
      let entry = traceData[i];
      if (entry.hasOwnProperty("range")) {
        if (this.isRangeInLine(entry.range.start.row, lineNumber)) {
          returnValues.push(entry);
        }
      }
    }
    return returnValues;
  }

  /*
   * getValuesInLine(lineNumber)
   * @ param lineNumber - the line number in the editor for retrieving all  associated values.
   * @ post  if there are no values in the trace or line number is less than 1, returns an empty array;
   *              otherwise, returns an array of values of variables that start or end at lineNumber.
   * @ comment - line numbers start at 1, which matches what is normally displayed in the gutter.
   */
  getValuesInLine(lineNumber) {
    let values = this.getValues();
    return this.getTraceDataInLine(values, lineNumber);
  }

  /*
   * getValuesInRange(aceRange)
   * @ param aceRange - a range in Ace's format, that is, with start row and column and end row and column.
   * @ example {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}.
   * @ post   if aceRange is not defined or there are no values in the trace, returns an empty array
   *             otherwise, returns an array with all the values within  the aceRange.
   */
  getValuesInRange(aceRange) {
    let values = this.getValues();
    return this.getTraceDataInRange(values, aceRange);
  }

  isRangeInRange(isRange, inRange) {
    let l1 = (isRange.start.row > inRange.start.row);
    let l2 = (isRange.start.row == inRange.start.row && isRange.start.column >= inRange.start.column);
    let r1 = (isRange.end.row < inRange.end.row);
    let r2 = (isRange.end.row == inRange.end.row && isRange.end.column <= inRange.end.column);
    return ((r1 || r2)) && ((l1 || l2));
  }

  isRangeInRangeStrict(isRange, inRange) {
    let l1 = (isRange.start.row > inRange.start.row);
    let l2 = (isRange.start.row == inRange.start.row && isRange.start.column > inRange.start.column);
    let r1 = (isRange.end.row < inRange.end.row);
    let r2 = (isRange.end.row == inRange.end.row && isRange.end.column < inRange.end.column);
    return ((r1 || r2)) && ((l1 || l2));
  }

  rangeEquals(isRange, inRange) {
    return (isRange && inRange && isRange.start && inRange.start && isRange.end && inRange.end && (isRange.start.row == inRange.start.row && isRange.start.column == inRange.start.column) && (isRange.end.row == inRange.end.row && isRange.end.column == inRange.end.column));
  }

  isRangeInLine(isRange, inLine) {
    return ((isRange.start.row == (inLine - 1)) || (isRange.end.row == (inLine - 1)));
  }

  isPositionInRange(position, inRange) {
    let l1 = (position.row > inRange.start.row);
    let l2 = (position.row == inRange.start.row && position.column >= inRange.start.column);
    let r1 = (position.row < inRange.end.row);
    let r2 = (position.row == inRange.end.row && position.column <= inRange.end.column);
    return ((r1 || r2)) && ((l1 || l2));
  }

  //pending
  handleBlockRescope(entry) {
    if (!entry) {
      return;
    }

    if (entry.type !== "BlockStatement") {
      return;
    }

    let isBadScope = false;

    do {
      let topScope = this.blockScopes.length ? this.blockScopes[this.blockScopes.length - 1] : entry;
      if (topScope.range === entry.range) {
        return;
      }

      if (this.isRangeInRange(entry.range, topScope.range)) {
        this.blockScopes.push(entry);
      } else {
        isBadScope = true;
        this.blockScopes.pop();
      }
    } while (this.blockScopes.length && isBadScope);
  }

  getStackBlockCounts() {
    let stack = this.trace.stack, data = this.trace.data;
    let stackData = [];
    for (let key in stack) {
      stackData.push({text: key.split(':')[0], range: data[key].range, count: stack[key]});
    }
    return stackData;
  }

  getExpressions() {
    return {variables: this.trace.identifiers, timeline: this.trace.timeline};
  }

  getVariables() {
    return {variables: this.trace.identifiers};
  }

  getValues() {
    return this.trace.values;
  }

  getExecutionTraceAll() {
    let result = [];
    let execution = this.trace.execution, data = this.trace.data;

    for (let i in execution) {
      let entry = execution[i];
      if (data.hasOwnProperty(entry)) {
        result.push(data[entry]);
      }
    }
    return result;
  }

  getExecutionTrace() {
    let executionTrace = [];
    let execution = this.trace.execution, data = this.trace.data, traceTypes = this.traceModel.traceTypes;
    for (let i in execution) {
      let entry = execution[i];
      if (data.hasOwnProperty(entry)) {
        let dataEntry = data[entry];
        if (traceTypes.Expression.indexOf(dataEntry.type) > -1) {
          executionTrace.push(dataEntry);
        }
      }
    }
    return executionTrace;
  }

  getTraceForExpression(expression, traceHelper = this) {

    let trace = {
      timeline: [],
      variables: [],
      values: []
    };

    if (!traceHelper) {
      return trace;
    }

    if (!traceHelper.isRepOK()) {
      return trace;
    }

    let expressions = traceHelper.getExpressions();
    let variables = traceHelper.getVariables();

    for (let i = 0; i < expressions.variables.length; i++) {
      if (traceHelper.isRangeInRange(expressions.variables[i].range, expression.range)) {
        trace.variables.push(expressions.variables[i]);

        for (let j = 0; j < expressions.timeline.length; j++) {
          if (traceHelper.isRangeInRange(expressions.timeline[j].range, expression.range)) {
            trace.timeline.push(expressions.timeline[j]);
          }
        }
      }
    }

    for (let k = 0; k < variables.variables.length; k++) {
      if (traceHelper.isRangeInRange(variables.variables[k].range, expression.range)) {
        trace.values.push(variables.variables[k]);
      }
    }
    return trace;
  }

  getBranchIndexesForExpression(expression, traceHelper = this) {
    let branching = {
      branch: expression,
      branchIndexes: []
    };

    if (!traceHelper) {
      return branching;
    }

    let timeline = this.trace.timeline;
    for (let i in timeline) {
      if (timeline.hasOwnProperty(i)) {
        let entry = timeline[i];
        if (traceHelper.isRangeInRange(entry.range, expression.range)) {
          branching.branchIndexes.push(i);
        }
      }
    }

    return branching;
  }

}
