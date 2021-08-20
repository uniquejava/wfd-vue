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

    // 当拖拽元素或选中的文本到一个可释放目标时触发
    onDragEnter(e) {
      // this.origin是edge的起点
      // 如果没有起点，直接返回
      if (!this.origin) {
        return;
      }

      // 如果node不相同（也就是起点和终点不是同一个节点）
      if (!this.sameNode(e)) {
        // e.item就是当前的目标anchor
        e.item.setHotspotActived(true);

        //
        // 设置edge的targetNode属性
        this.origin.targetNode = e.target
          .getParent()
          .getParent()
          .get('item');

        // 设置edge的targetAnchor属性
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
      // 为图绑定事件监听
      // 见文档： https://g6.antv.vision/zh/docs/api/graphFunc/on_off

      // e.target= Marker {isKeyShape: true,} e.taget只被操作的具体图形: 就是那个大蓝圈
      // console.log('e.target=', e.target);

      // e.target.getParent()= Group， 就是anchor所在的group（包含anchor和marker两个shape)
      // console.log('e.target.getParent()=', e.target.getParent());

      // e.target.getParent().getParent()= Group {anchorShapes: Array(3), showAnchor: ƒ, clearAnchor: ƒ
      // 就是node所在的组， anchorShapes(3)表示这个group有三个anchor
      // console.log('e.target.getParent().getParent()=', e.target.getParent().getParent());

      // group.get('item')是取这个group中的keyShape， 就是核心节点
      const node = e.target
        .getParent()
        .getParent()
        .get('item');

      // node= Node，这个group中的keyShape， 就是核心节点start-node
      // console.log('node=', node);

      // e.item= Item {_cfg: {…}, isAnchor: true, showHotpot: ƒ, setActived: ƒ, clearActived: ƒ
      // e.item指Anchor这个Item
      // console.log('e.item=', e.item);

      const anchorIndex = e.item.get('index');
      const point = node.getAnchorPoints()[anchorIndex];
      this.target = e.item;
      this.origin = {
        x: point.x,
        y: point.y,
        sourceNode: node,
        sourceAnchor: anchorIndex,
      };

      // 在全部的节点上显示anchor point（会排除三种类型的节点）
      this.dragEdgeBeforeShowAnchor(e);

      // 设置属性值。
      this.graph.set('onDragEdge', true);
    },

    // 当拖拽元素或选中的文本时触发
    onDrag(e) {
      if (!this.origin) {
        return;
      }
      // 画边（将edge不断延长）
      this._updateEdge(this.target, e);
    },

    onDragEnd(e) {
      if (!this.origin) {
        return;
      }

      // e.item是Anchor
      // delegateShape是那条虚线
      const delegateShape = e.item.get('edgeDelegate');
      if (delegateShape) {
        delegateShape.remove();
        this.target.set('edgeDelegate', null);
      }
      this._updateEdge(this.target, e, true);
      this.graph.setItemState(this.origin.sourceNode, 'show-anchor', false);
      this.target = null;
      this.origin = null;

      // 设置属性值。
      this.graph.set('onDragEdge', false);
    },

    /**
     * onDragEnter/onDragLeave中使用, 判断起点和当前节点（终点）不是同一个节点
     */
    sameNode(e) {
      // 如果当前的event target 是Marker
      // marker => anchorGroup => nodeGroup => node
      return (
        e.target.type === 'marker' &&
        e.target.getParent() &&
        e.target
          .getParent() // anchorGroup
          .getParent() // nodeGroup
          .get('item') // node
          .get('id') === this.origin.sourceNode.get('id')
      );
    },

    /**
     * 在全部的节点上显示anchor point（会排除三种类型的节点）
     */
    dragEdgeBeforeShowAnchor(e) {
      this.graph.getNodes().forEach(node => {
        // 打印出每一个节点的类型
        // start, timerStart, userTask, scriptTask, inclusiveGateway, receiveTask, signalCatch, end
        // console.log('node=', node);
        // console.log('node.getModel().clazz=', node.getModel().clazz);
        if (
          node.getModel().clazz === 'startEvent' ||
          node.getModel().clazz === 'timerStartEvent' ||
          node.getModel().clazz === 'messageStartEvent'
        )
          return;

        // 如果是需要显示anchor point的节点
        // item.getContainer() 获取元素的容器, 等价于item.get('group')
        const group = node.getContainer();

        // 显示这个节点上的anchor
        group.showAnchor(group);

        // 显示这个节点上的hotspot/marker
        group.anchorShapes.forEach(a => {
          // a是group
          // console.log('a=', a);

          // a.get('item') 才是 anchor
          // console.log('a.get("item")=', a.get('item'));
          a.get('item').showHotpot();
        });
      });
    },

    /**
     * 画边（将edge不断延长）
     * @param {*} item
     * @param {*} e
     * @param {*} force
     */
    _updateEdge(item, e, force) {
      const x = e.x;
      const y = e.y;

      // this.delegate返回true， 表示是否先画一条虚线
      // console.log('this.delegate=', this.delegate);

      // 连得过程中force返回undeinfed
      // console.log('force=', force);
      if (this.delegate && !force) {
        // 连得过程中会走这个分支
        this._updateEdgeDelegate(item, x, y);
        return;
      }

      // 连接成功才会走这里
      // 画一条带箭头的edge
      this._addEdge(e);

      // 移除几乎所有节点上出现的anchor point
      this._clearAllAnchor();

      // 仅重新绘制画布。当设置了元素样式或状态后，通过调用 paint() 方法，让修改生效。
      this.graph.paint();
    },

    /**
     * 画虚线
     * @param {*} item
     * @param {*} x
     * @param {*} y
     */
    _updateEdgeDelegate(item, x, y) {
      // item是Anchor  => new Item({type: 'anchor})
      // console.log('item=', item);

      // this 是registerBe
      // console.log('this=', this);

      const self = this;
      let edgeShape = item.get('edgeDelegate');

      if (!edgeShape) {
        // 没有虚线则创建
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

      // 已经有虚线则更新
      edgeShape.attr({ x2: x, y2: y });

      // 仅重新绘制画布。当设置了元素样式或状态后，通过调用 paint() 方法，让修改生效。
      this.graph.paint();
    },

    /**
     * 移除几乎所有节点上出现的anchor point
     */
    _clearAllAnchor() {
      this.graph.getNodes().forEach(node => {
        const group = node.getContainer();
        group.clearAnchor(group);
      });
    },

    /**
     * 画一条带箭头的edge
     */
    _addEdge() {
      if (this.origin.targetNode) {
        const addModel = {
          clazz: 'flow',
          source: this.origin.sourceNode.get('id'),
          target: this.origin.targetNode.get('id'),
          sourceAnchor: this.origin.sourceAnchor,
          targetAnchor: this.origin.targetAnchor,
        };

        // graph.executeCommand是在src/plugins/command.js中定义的
        if (this.graph.executeCommand) {
          // 走的这段
          this.graph.executeCommand('add', {
            type: 'edge',
            addModel: addModel,
          });
        } else {
          // https://g6.antv.vision/zh/docs/api/graphFunc/item/#graphadditemtype-model-stack
          // add 同 graph.addItem(type, model) ， 参见G6源代码 @antv/g6/src/graph/graph.js
          // type 元素类型，可选值为 'node'、'edge'
          // model 元素的数据模型，具体内容参见元素配置项。
          this.graph.add('edge', addModel);
        }
      }
    },
  });
}
