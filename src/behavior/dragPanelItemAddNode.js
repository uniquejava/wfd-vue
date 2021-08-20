import editorStyle from '../util/defaultStyle';
import { getShapeName } from '../util/clazz';

export default function(G6) {
  G6.registerBehavior('dragPanelItemAddNode', {
    getDefaultCfg() {
      return {};
    },
    getEvents() {
      return {
        'canvas:mousemove': 'onMouseMove',
        'canvas:mouseup': 'onMouseUp',
        'canvas:mouseleave': 'onMouseLeave',
      };
    },
    onMouseMove(e) {
      if (this.graph.get('onDragAddNode')) {
        let delegateShape = this.graph.get('addDelegateShape');

        // 在插件addItemPanel.js的初始化方法 initPlugin 中设置了dragstart事件
        // 在dragstart中，取到当前图标对应的data-item作为addModel
        // graph.set('addModel', addModel)
        const addModel = this.graph.get('addModel');

        // 解析 size: 30*30
        const width = parseInt(addModel.size.split('*')[0]);
        const height = parseInt(addModel.size.split('*')[1]);
        const point = this.graph.getPointByClient(e.x, e.y);
        const x = point.x;
        const y = point.y;

        // 如果还没有创建虚线框
        if (!delegateShape) {
          // 创建一个虚线框
          const parent = this.graph.get('group');
          delegateShape = parent.addShape('rect', {
            attrs: {
              width,
              height,
              x: x - width / 2,
              y: y - height / 2,
              ...editorStyle.nodeDelegationStyle,
            },
          });
          delegateShape.set('capture', false);

          // 在graph上创建一个临时变量
          this.graph.set('addDelegateShape', delegateShape);
        }

        delegateShape.attr({ x: x - width / 2, y: y - height / 2 });

        this.graph.paint();
        this.graph.emit('afternodedrag', delegateShape);
      }
    },
    onMouseUp(e) {
      if (this.graph.get('onDragAddNode')) {
        const p = this.graph.getPointByClient(e.clientX, e.clientY);
        if (p.x > 0 && p.y > 0) this._addNode(p);
      }
    },
    onMouseLeave(e) {
      if (this.graph.get('onDragAddNode')) {
        this._clearDelegate();
        this.graph.emit('afternodedragend');
      }
    },
    _clearDelegate() {
      if (this.graph.get('onDragAddNode')) {
        const delegateShape = this.graph.get('addDelegateShape');
        if (delegateShape) {
          delegateShape.remove();
          this.graph.set('addDelegateShape', null);
          this.graph.paint();
        }
      }
    },
    _addNode(p) {
      // 如果发生过dragstart， 并且暂未dragend
      // 在canvas:mouseup时 创建真实的node
      if (this.graph.get('onDragAddNode')) {
        const addModel = this.graph.get('addModel');
        const { clazz = 'userTask' } = addModel;
        addModel.shape = getShapeName(clazz);
        const timestamp = new Date().getTime();
        const id = clazz + timestamp;
        const x = p.x;
        const y = p.y;
        if (this.graph.executeCommand) {
          // 执行在plugins/command.js中注册的add命令
          this.graph.executeCommand('add', {
            type: 'node',
            addModel: {
              ...addModel,
              x: x,
              y: y,
              id: id,
            },
          });
        } else {
          // 直接调用g6提供的api
          this.graph.add('node', {
            ...addModel,
            x: x,
            y: y,
            id: id,
          });
        }
      }
    },
  });
}
