const deepMix = require('@antv/util/lib/deep-mix');
const each = require('@antv/util/lib/each');
const createDOM = require('@antv/util/lib/dom/create-dom');

class AddItemPanel {
  constructor(cfgs) {
    this._cfgs = deepMix(this.getDefaultCfg(), cfgs);
  }
  getDefaultCfg() {
    return { container: null };
  }

  get(key) {
    return this._cfgs[key];
  }
  set(key, val) {
    this._cfgs[key] = val;
  }

  /**
   * 在实例化G6.Graph对象时由G6框架自动调用一次， new G6.Graph({plugins})
   */
  initPlugin(graph) {
    const parentNode = this.get('container');

    // 看不见的1x1大小的图片
    // 谷歌搜索one pixel gif
    const ghost = createDOM(
      '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"' +
        ' style="opacity:0"/>'
    );
    const children = parentNode.querySelectorAll(
      'div > .el-collapse-item > .el-collapse-item__wrap > .el-collapse-item__content > img[data-item]'
    );
    each(children, (child, i) => {
      // data-item是一个定义在ItemPanel.vue中的配置对象 {clazz:'start',size:'30*30',label:''}
      // console.log('child.getAttribute("data-item")=', child.getAttribute('data-item'));

      // 为什么不直接用 child.getAttribute('data-item') ？
      const addModel = new Function('return ' + child.getAttribute('data-item'))();

      child.addEventListener('dragstart', e => {
        // 拖拽图标时隐藏 默认的拖拽图标（改用自定义的虚线框）
        // 见 https://www.kryogenix.org/code/browser/custom-drag-image.html
        e.dataTransfer.setDragImage(ghost, 0, 0);

        graph.set('onDragAddNode', true);
        graph.set('addModel', addModel);
      });
      child.addEventListener('dragend', e => {
        graph.emit('canvas:mouseup', e);
        graph.set('onDragAddNode', false);
        graph.set('addModel', null);
      });
    });
  }

  destroy() {
    this.get('canvas').destroy();
    const container = this.get('container');
    container.parentNode.removeChild(container);
  }
}

export default AddItemPanel;
