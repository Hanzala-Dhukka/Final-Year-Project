import React from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./DashboardGrid.css";

export default function DashboardGrid({
  layout,
  widgets,
  onLayoutChange,
  cols = 12,
  rowHeight = 120,
  width = 1200,
  margin = [10, 10],
  containerPadding = [10, 10],
  isDraggable = true,
  isResizable = true,
  useCSSTransforms = true,
}) {
  return (
    <div className="dashboard-grid">
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={width}
        margin={margin}
        containerPadding={containerPadding}
        onLayoutChange={onLayoutChange}
        isDraggable={isDraggable}
        isResizable={isResizable}
        useCSSTransforms={useCSSTransforms}
        preventCollision={false}
        compactType="vertical"
      >
        {widgets.map((widget) => (
          <div key={widget.i} data-grid={{ i: widget.i, x: widget.x, y: widget.y, w: widget.w, h: widget.h }}>
            {widget.component}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}