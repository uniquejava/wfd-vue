import editorStyle from '../util/defaultStyle';

export default function(G6) {
  G6.registerBehavior('dragEdge', {
    getDefaultCfg() {
      return {
        updateEdge: true,
        delegate: true,
        delegateStyle: {},
        dragEdge: false,
      };
    },
    getEvents() {
      // https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API
      return {
        // 当用户开始拖拽一个元素或选中的文本时触发
        'anchor:dragstart': 'onDragStart',

        // 当拖拽元素或选中的文本时触发
        'anchor:drag': 'onDrag',

        // 当拖拽操作结束时触发 (比如松开鼠标按键或敲“Esc”键)
        'anchor:dragend': 'onDragEnd',

        // 当拖拽元素或选中的文本到一个可释放目标时触发
        'anchor:dragenter': 'onDragEnter',

        // 当拖拽元素或选中的文本离开一个可释放目标时触发。
        'anchor:dragleave': 'onDragLeave',
      };
    },
    onDragEnter(e) {
      if (!this.origin) {
        return;
      }
      if (!this.sameNode(e)) {
        e.item.setHotspotActived(true);
        this.origin.targetNode = e.target
          .getParent()
          .getParent()
          .get('item');
        this.origin.targetAnchor = e.item.get('index');
      }
    },
    onDragLeave(e) {
      if (!this.origin) {
        return;
      }
      if (!this.sameNode(e)) {
        e.item.setHotspotActived(false);
        this.origin.targetNode = null;
        this.origin.targetAnchor = null;
      }
    },
    onDragStart(e) {
      // e.target= Marker {isKeyShape: true
      console.log('e.target=', e.target);

      // e.target.getParent()= Group
      console.log('e.target.getParent()=', e.target.getParent());

      // e.target.getParent().getParent()= Group {anchorShapes: Array(3), showAnchor: ƒ, clearAnchor: ƒ
      console.log('e.target.getParent().getParent()=', e.target.getParent().getParent());

      const node = e.target
        .getParent()
        .getParent()
        .get('item');

      // node= Node
      console.log('node=', node);

      // e.item= Item {_cfg: {…}, isAnchor: true, showHotpot: ƒ, setActived: ƒ, clearActived: ƒ
      console.log('e.item=', e.item);

      const anchorIndex = e.item.get('index');
      const point = node.getAnchorPoints()[anchorIndex];
      this.target = e.item;
      this.origin = {
        x: point.x,
        y: point.y,
        sourceNode: node,
        sourceAnchor: anchorIndex,
      };
      this.dragEdgeBeforeShowAnchor(e);
      this.graph.set('onDragEdge', true);
    },
    onDrag(e) {
      if (!this.origin) {
        return;
      }
      this._updateEdge(this.target, e);
    },
    onDragEnd(e) {
      if (!this.origin) {
        return;
      }
      const delegateShape = e.item.get('edgeDelegate');
      if (delegateShape) {
        delegateShape.remove();
        this.target.set('edgeDelegate', null);
      }
      this._updateEdge(this.target, e, true);
      this.graph.setItemState(this.origin.sourceNode, 'show-anchor', false);
      this.target = null;
      this.origin = null;
      this.graph.set('onDragEdge', false);
    },
    sameNode(e) {
      return (
        e.target.type === 'marker' &&
        e.target.getParent() &&
        e.target
          .getParent()
          .getParent()
          .get('item')
          .get('id') === this.origin.sourceNode.get('id')
      );
    },
    dragEdgeBeforeShowAnchor(e) {
      this.graph.getNodes().forEach(node => {
        if (
          node.getModel().clazz === 'startEvent' ||
          node.getModel().clazz === 'timerStartEvent' ||
          node.getModel().clazz === 'messageStartEvent'
        )
          return;
        const group = node.getContainer();
        group.showAnchor(group);
        group.anchorShapes.forEach(a => a.get('item').showHotpot());
      });
    },
    _updateEdge(item, e, force) {
      const x = e.x;
      const y = e.y;
      if (this.delegate && !force) {
        this._updateEdgeDelegate(item, x, y);
        return;
      }
      this._addEdge(e);
      this._clearAllAnchor();
      this.graph.paint();
    },
    _updateEdgeDelegate(item, x, y) {
      const self = this;
      let edgeShape = item.get('edgeDelegate');
      if (!edgeShape) {
        const parent = self.graph.get('group');
        edgeShape = parent.addShape('line', {
          attrs: {
            x1: this.origin.x,
            y1: this.origin.y,
            x2: x,
            y2: y,
            ...editorStyle.edgeDelegationStyle,
          },
        });
        edgeShape.set('capture', false);
        item.set('edgeDelegate', edgeShape);
      }
      edgeShape.attr({ x2: x, y2: y });
      this.graph.paint();
    },
    _clearAllAnchor() {
      this.graph.getNodes().forEach(node => {
        const group = node.getContainer();
        group.clearAnchor(group);
      });
    },
    _addEdge() {
      if (this.origin.targetNode) {
        const addModel = {
          clazz: 'flow',
          source: this.origin.sourceNode.get('id'),
          target: this.origin.targetNode.get('id'),
          sourceAnchor: this.origin.sourceAnchor,
          targetAnchor: this.origin.targetAnchor,
        };
        if (this.graph.executeCommand) {
          this.graph.executeCommand('add', {
            type: 'edge',
            addModel: addModel,
          });
        } else {
          this.graph.add('edge', addModel);
        }
      }
    },
  });
}
