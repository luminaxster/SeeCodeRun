// Written by: Execution Trace Feature Team 
// (@author: Han Tsung Liu
//  @started: 02-24-16
//  @last-modified: 02-26-16)
// Reviewed by: Dana Pepporuby and Venkat Polumahanti (02-26-16)
// Referenced: David Gonzalez (isRangeInRange(isRange, inRange) function)
// Interface created by execution trace team to provide the trace table
// and useable functions to be called.
// Example of using the class
// Step 1) Create a new instance of the class
// var eti = new ExecutionTraceInterface(source_code);
// Step 2) Check to see if the object is ready to be used
// if(eti.linkEstablished){
//      Step 3) Call any functions to get parts of the trace 
// }
'use strict'
class ExecutionTraceInterface{
    /*
     * Constructor(source)
     * @ param source - source code for the trace
     */
    constructor(source){
        // checks to see if the source code is provided by the caller
        if(source===undefined){
            // if source code not given by caller then retrieve source code through ace editor
            this.sourceCode = editor.getSession().getDocument().getValue();
        }
        else{
            // if the source code is provided by the caller of the class, then store the source code
            this.sourceCode = source;
        }
        // if the source code is undefined then set the link to false (not ready to call object functions)
        if(this.sourceCode === undefined){
            this.link = false;
        }
        // if the source code is provided then create new trace with source code and a event listener
        else{
        	window.traceExecution(this.sourceCode,
                function eventListener (event){
                    if(event.status === "Finished"){
                        this.link = true;
                    }
		    });
        }
    }
    /*
     * linkEstablished()
     * @ param - none
     * @ return this.link - if true, the getter functions are ready to be called
     *                    - if false, the getter functions are not ready 
     */
    linkEstablished(){
        return this.link;
    }
    /*
     * getLineValues(lineNumber)
     * @ param lineNumber - the line number in the editor for retrieving all the associated values
     * @ pre - this.valueTable is defined and lineNumber > 0
     * @ returns - an array of values for the current line
     * @ comment - line number should start with 1 same as the gutter
     */
    getLineValues(lineNumber){
        // retrieves the execution trace
        this.valueTable = window.TRACE.getExecutionTrace();
        // if the execution trace is undefined the return undefined
        if(this.valueTable===undefined || lineNumber<=0){
            return undefined;
        }
        // sorts out the conflict for the ace editor starting with row #0
    	lineNumber--;
    	// new array for storing all the return values
    	this.returnValues = [];
    	// i = iteration, entry = each traced element
		var i,entry;
        // iterates through all the elements of the execution trace
        for(i=0;i<this.valueTable.length;i++){
            // stores current element in entry
        	entry = this.valueTable[i];
        	// retrieves all the keys for the current element in the trace
            // Object.keys(valueTable[entry]);
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // determines if the current range element row number matches line number
                if(entry.range.start.row===lineNumber){
                    // calls this.getValues() to get the value based on the range
                    this.entryResult = this.getValues(entry.range);
                    // if the returned result is not false
                    if(this.entryResult!=false)
                        // push the result into the array
                	    this.returnValues.push(this.entryResult);
                }
            }
        }
        // return all the values for the current line
        return this.returnValues;
    }
    /*
     * getLineValues(lineNumber)
     * @ param inputEsprimaRange - start row and column & end row and column
     * @ example: {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}
     * @ pre - inputEsprimaRange is not undefined
     * @ returns - (currently) a single value within the range
     *             (later/future implementation) multiple values within the range
     *             else, if no value within range, return false
     * @ comment - none
     */    
    getValues(inputEsprimaRange){
        if(inputEsprimaRange===undefined){
            return false; // return false if inputEsprimaRange is undefined
        }
        // find the element that meets the range requirement
        var i, entry;
        // iterates through all the elements of the execution trace
        for(i=0;i<this.valueTable.length;i++){
            // stores current element in entry
            entry = this.valueTable[i];
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // check to see if inputEsprimaRange is within the entry.range
                if(this.isRangeInRange(inputEsprimaRange,entry.range)){
                        //alert(Object.keys(this.valueTable[i]));
                        // check to see if the current entry element has the values property
                        if(entry.hasOwnProperty("values")){
                            //alert(entry.values); // if return stackIndex + values
                            // returns the value within thin the range
                            return entry.values[0].value; // return only values
                        }
                        else { return false; //return false if not found
                        }
                }
            }
        }
        return false; // return false if not found
    }
    /*
     * Direct Source from David Gonzalez for finding range.
     */
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }
}