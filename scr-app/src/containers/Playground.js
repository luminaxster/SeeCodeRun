import React, {Component} from 'react';
import classnames from 'classnames';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import _ from 'lodash';
import {Subject} from "rxjs";

import AutoLog from "../seecoderun/modules/AutoLog";
import {updatePlaygroundInstrumentationSuccess} from "../redux/modules/playground";
import {updatePlaygroundInstrumentationFailure} from "../redux/modules/playground";


const styles=() => {
  return {
    playground: {
      margin: 0,
      padding: 0,
    }
  }
};

class Playground extends Component {
  mounted=false;
  playgroundDOMNode=null;
  isBundling=false;
  currentEditorsTexts=null;
  unsubscribes=[];
  
  render() {
    const {classes, appClasses}=this.props;
    return (
      <div className={classnames(classes.playground, appClasses.content)}
           ref={(DOMNode) => {
             this.playgroundDOMNode=DOMNode;
           }}
      ></div>
    );
  }
  
  shouldBundle=(editorsTexts) => {
    if (!_.isEqual(this.currentEditorsTexts, editorsTexts)) {
      if (editorsTexts) {
        const {editorIds}=this.props;
        for (const editorId in editorIds) {
          if (!_.isString(editorsTexts[editorIds[editorId]])) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  };
  
  observeBundling=bundlingObservable => {
    return bundlingObservable
      .throttleTime(500)
      .debounceTime(1000)
      .subscribe(currentEditorsTexts => {
        this.isBundling=true;
        this.bundle(currentEditorsTexts);
        this.isBundling=false;
      })
  };
  
  componentDidMount() {
    this.autoLog=new AutoLog();
    this.unsubscribes=[];
    const {store}=this.context;
    this.bundlingSubject=new Subject();
    const unsubscribe0=store.subscribe(() => {
      const editorsTexts=store.getState().pastebinReducer.editorsTexts;
      if (this.shouldBundle(editorsTexts)) {
        this.currentEditorsTexts=editorsTexts;
        if (this.runIframe) {
          this.playgroundDOMNode.removeChild(this.runIframe);
          this.runIframe=null;
        }
        this.bundlingSubject.next(this.currentEditorsTexts);
      }
    });
    
    this.unsubscribes.push(unsubscribe0);
    this.observeBundling(this.bundlingSubject);
    
  }
  
  componentWillUnmount() {
    this.mounted=false;
    this.bundlingSubject.complete();
    for (const i in this.unsubscribes) {
      this.unsubscribes[i]();
    }
  }
  
  /**
   *
   * @param {Object} editorsTexts - Requires editorsTexts.html,
   * editorsTexts.css and editorsTexts.js to contain text.
   */
  bundle(editorsTexts) {
    const playgroundDOMNode=this.playgroundDOMNode;
    if (!playgroundDOMNode) {
      return;
    }
    const {editorIds}=this.props;
    const {store}=this.context;
    
    const html=editorsTexts[editorIds['html']];
    const css=editorsTexts[editorIds['css']];
    const js=editorsTexts[editorIds['js']];
    
    if (!_.isString(html) || !_.isString(css) || !_.isString(js)) {
      console.log("[CRITICAL ERROR]: editor[s] text[s] missing", html, css, js);
    }
    let alJs=js;// Auto-logged script.
    
    const autoLog=this.autoLog;
    
    let ast=null;
    let al=null;
    try {
      ast=autoLog.toAst(js);
      al=autoLog.transform(ast);
      alJs=al.code;
      store.dispatch(updatePlaygroundInstrumentationSuccess('js', al));
    } catch (error) {
      store.dispatch(updatePlaygroundInstrumentationFailure('js', error));
    }
    if (al) {
      console.log("al");
      const runIframe=document.createElement('iframe');
      autoLog.configureIframe(runIframe, store, al, html, css, js, alJs);
      playgroundDOMNode.appendChild(runIframe);
      this.runIframe=runIframe;
    } else {
      if (ast) {
        console.log("ast");
        const runIframe=document.createElement('iframe');
        autoLog.configureIframe(runIframe, store, al, html, css, js, js);
        playgroundDOMNode.appendChild(runIframe);
        this.runIframe=runIframe;
      }
    }
  }
}

Playground.contextTypes={
  store: PropTypes.object.isRequired
};

Playground.propTypes={
  classes: PropTypes.object.isRequired,
  editorIds: PropTypes.object.isRequired,
  appClasses: PropTypes.object.isRequired,
  appStyle: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playground);
