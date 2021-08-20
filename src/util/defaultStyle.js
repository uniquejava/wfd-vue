export default {
  nodeActivedOutterStyle: { lineWidth: 0 },
  groupSelectedOutterStyle: { stroke: '#E0F0FF', lineWidth: 2 },
  nodeSelectedOutterStyle: { stroke: '#E0F0FF', lineWidth: 2 },
  edgeActivedStyle: { stroke: '#1890FF', strokeOpacity: 0.92 },
  nodeActivedStyle: { fill: '#F3F9FF', stroke: '#1890FF' },
  groupActivedStyle: { stroke: '#1890FF' },
  edgeSelectedStyle: { lineWidth: 2, strokeOpacity: 0.92, stroke: '#A3B1BF' },
  nodeSelectedStyle: { fill: '#F3F9FF', stroke: '#1890FF', fillOpacity: 0.4 },
  groupSelectedStyle: { stroke: '#1890FF', fillOpacity: 0.92 },
  nodeStyle: {
    stroke: '#CED4D9',
    fill: '#FFFFFF',
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    shadowBlur: 10,
    shadowColor: 'rgba(13, 26, 38, 0.08)',
    lineWidth: 1,
    radius: 4,
    strokeOpacity: 0.7,
  },
  edgeStyle: { stroke: '#A3B1BF', strokeOpacity: 0.92, lineWidth: 1, lineAppendWidth: 8, endArrow: true },
  groupBackgroundPadding: [40, 10, 10, 10],
  groupLabelOffsetX: 10,
  groupLabelOffsetY: 10,
  edgeLabelStyle: { fill: '#666', textAlign: 'center', textBaseline: 'middle' },
  edgeLabelRectPadding: 4,
  edgeLabelRectStyle: { fill: 'white' },
  nodeLabelStyle: { fill: '#666', textAlign: 'center', textBaseline: 'middle' },
  groupStyle: { stroke: '#CED4D9', radius: 4 },
  groupLabelStyle: { fill: '#666', textAlign: 'left', textBaseline: 'top' },
  multiSelectRectStyle: { fill: '#1890FF', fillOpacity: 0.08, stroke: '#1890FF', opacity: 0.1 },
  dragNodeHoverToGroupStyle: { stroke: '#1890FF', lineWidth: 2 },
  dragNodeLeaveFromGroupStyle: { stroke: '#BAE7FF', lineWidth: 2 },

  // 鼠标浮在node上时出现的anchor小白圈
  anchorPointStyle: { radius: 3.5, fill: '#fff', stroke: '#1890FF', lineAppendWidth: 12 },

  // 拖拽开始时，几乎所有anchor上都会显示的大蓝圈(hotspot)， 类型为marker
  // marker是对shape的再一次封装，方便快速使用内置图形
  anchorHotsoptStyle: { radius: 12, fill: '#1890FF', fillOpacity: 0.25 },

  // 拖拽到目标hotspot上时， 大蓝圈会略微放大
  anchorHotsoptActivedStyle: { radius: 14 },

  // 鼠标浮在node上的anchor小白圈上时， 小白圈会变蓝， radius也会变大一点点 3.5 -> 4
  anchorPointHoverStyle: { radius: 4, fill: '#1890FF', fillOpacity: 1, stroke: '#1890FF' },

  nodeControlPointStyle: { radius: 4, fill: '#fff', shadowBlur: 4, shadowColor: '#666' },
  edgeControlPointStyle: { radius: 6, symbol: 'square', lineAppendWidth: 6, fillOpacity: 0, strokeOpacity: 0 },
  nodeSelectedBoxStyle: { stroke: '#C2C2C2' },
  cursor: {
    panningCanvas: '-webkit-grabbing',
    beforePanCanvas: '-webkit-grab',
    hoverNode: 'move',
    hoverEffectiveAnchor: 'crosshair',
    hoverEdge: 'default',
    hoverGroup: 'move',
    hoverUnEffectiveAnchor: 'default',
    hoverEdgeControllPoint: 'crosshair',
    multiSelect: 'crosshair',
  },

  // 从item panel拖拽创建node时，出现的节点虚线框
  nodeDelegationStyle: {
    stroke: '#1890FF',
    fill: '#1890FF',
    fillOpacity: 0.08,
    lineDash: [4, 4],
    radius: 4,
    lineWidth: 1,
  },

  // 连线时， 中途线都是虚线
  edgeDelegationStyle: { stroke: '#1890FF', lineDash: [4, 4], lineWidth: 1 },
};
