/*global $ */
export class TraceViewUtils {
  static attachExpressionDataExplorerOnHover(type, $selector, eventAggregator, elementDecorator) {// jscs:ignore maximumLineLength
    let $selection = $($selector);
    let timeout = null;
    $selection.mouseenter(function selectionShowDataExplorer() {
      clearTimeout(timeout);
      let indexInTimeline = $(this).data('itimeline');
      timeout = setTimeout(function publishShowTooltip() {
        eventAggregator.publish('expressionDataExplorerShowTooltip', {
          type: type,
          indexInTimeline: indexInTimeline,
          elementDecorator: elementDecorator
        });
      });
    });

    $selection.mouseleave(function selectionHideDataExplorer() {
      clearTimeout(timeout);
      let indexInTimeline = $(this).data('itimeline');
      timeout = setTimeout(function publishHideTooltip() {
        eventAggregator.publish('expressionDataExplorerHideTooltip', {
          type: type,
          indexInTimeline: indexInTimeline,
          elementDecorator: elementDecorator
        });
      });
    });
  }
}
