export class TraceViewModel {
    constructor(aceUtils, aceEditor, tooltipElement, gutterDecorationCSSClassName){
        this.editor= aceEditor;
        this.tooltip = tooltipElement;
        this.gutterDecorationClassName = gutterDecorationCSSClassName;
        this.aceUtils = aceUtils;
        this.resetData();
        this.bind();
    }
    
    resetData(){
        this.resetTraceGutterData();
        this.resetTraceValuesData();
    }

    bind(){
        let editor = this.editor;
        let tooltip = this.tooltip;
        let traceGutterData =  this.traceGutterData;
        let traceValuesData =  this.traceValuesData;
        let gutterDecorationClassName = this.gutterDecorationClassName;
    	let aceUtils = this.aceUtils;
    	
    	aceUtils.setTraceGutterRenderer(editor, traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, tooltip, gutterDecorationClassName, traceGutterData);
    	aceUtils.subscribeToCodeHoverEvents(editor, tooltip, traceValuesData);

    }
    
    onTraceChanged(traceHelper){
            this.traceHelper = traceHelper;
            
            let stackTrace = traceHelper.getStackBlockCounts();

            let previousRows = this.traceGutterData.rows;
            this.updateTraceGutterData(stackTrace);
            this.aceUtils.updateGutterDecorations(this.editor, previousRows, this.traceGutterData.rows, this.gutterDecorationClassName);
            
            this.traceValuesData.ranges = traceHelper.getExecutionTrace();
    }
    
    updateTraceGutterData(stackTrace){
        let localTraceGutterData = this.extractTraceGutterData(stackTrace);
        this.traceGutterData.maxCount = localTraceGutterData.maxCount;
        this.traceGutterData.rows = localTraceGutterData.rows;
    }
    
    resetTraceGutterData(){
        if(!this.traceGutterData){
            this.traceGutterData = {  maxCount : 0, rows : []  };
            return;
        }
        this.traceGutterData.maxCount = 0;
        this.traceGutterData.rows = [];
    }
    
    resetTraceValuesData(){
        if(!this.traceValuesData){
            this.traceValuesData = { ranges: [] };
            return;
        }

        this.traceValuesData.ranges = [];
    }
    
    
    
    extractTraceGutterData(trace){
	    let result = {  maxCount : 0, rows : []  };

        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;
			
			if(!result.rows.hasOwnProperty(row)){
             result.rows[row] = {count: entry.count, text: "This block has been called " + entry.count + " times"};
			}
            
            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}
    
}
