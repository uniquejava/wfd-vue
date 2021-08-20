import { getShapeName } from '../util/clazz';

const mix = require('@antv/util/lib/mix');
const clone = require('@antv/util/lib/clone');
const isString = require('@antv/util/lib/type/is-string');

class Command {
  constructor() {}

  getDefaultCfg() {
    return { _command: { zoomDelta: 0.1, queue: [], current: 0, clipboard: [] } };
  }

  get(key) {
    return this._cfgs[key];
  }
  set(key, val) {
    this._cfgs[key] = val;
  }

  // 1. 在实例化G6.Graph对象时由G6框架自动调用一次， new G6.Graph({plugins})
  // 2. 在Wdf.vue中的data变化时调用一次 （暂未出现过）
  initPlugin(graph) {
    console.log('initPlugin ....');
    this._cfgs = this.getDefaultCfg();

    // list是cmd 对象字面量的集合,
    // cmd1 = {name: 'add', executTimes: 1, int(){}, enable(){}, execute(){}, back(){}}
    // this.list = [cmd1, cmd2, ...]

    // 同时，每个cmd对象作为this的属性直接附加在this对象上
    // this.add = cmd1
    // this.update= cmd2
    // this.delete= cmd3
    // this.redo= cmd4
    // this.undo= cmd5
    // this.copy= cmd6
    // this.paste= cmd7
    // this.zoomIn= cmd8
    // this.zoomOut= cmd9
    // this.zoomReset= cmd10
    // this.toFront= cmd11
    // this.toBack= cmd12

    this.list = [];

    // 允许做undo操作的cmd，在执行cmd前，需要先把cmd放在queue中
    this.queue = [];

    this.initCommands();
    graph.getCommands = () => {
      return this.get('_command').queue;
    };
    graph.getCurrentCommand = () => {
      const c = this.get('_command');
      return c.queue[c.current - 1];
    };

    /**
     * 在behaviour比如dragPanelItemAddNode.js的onMouseUp时触发
     * => canvas:mouseup
     * => dragPanelItemAddNode.onMouseup
     * => dragPanelItemAddNode._addNode
     * => graph.executeCommand('add', addModel)
     *
     * @param {*} name cmd的名字，如add
     * @param {*} cfg 传给cmd的额外配置（如addModel)
     */
    graph.executeCommand = (name, cfg) => {
      this.execute(name, graph, cfg);
    };

    graph.commandEnable = name => {
      return this.enable(name, graph);
    };
  }

  registerCommand(name, cfg) {
    if (this[name]) {
      mix(this[name], cfg);
    } else {
      const cmd = mix(
        {},

        // cmd对象的默认配置
        {
          name: name,
          shortcutCodes: [],
          queue: true,
          executeTimes: 1,
          init() {},
          enable() {
            return true;
          },
          execute(graph) {
            this.snapShot = graph.save();
            this.selectedItems = graph.get('selectedItems');
            this.method && (isString(this.method) ? graph[this.method]() : this.method(graph));
          },
          back(graph) {
            graph.read(this.snapShot);
            graph.set('selectedItems', this.selectedItems);
          },
        },

        // cmd对象的自定义配置
        cfg
      );

      // 往this对象上注册cmd
      this[name] = cmd;

      // 同时将cmd追加至this.list
      this.list.push(cmd);
    }
  }

  /**
   * 在behaviour比如dragPanelItemAddNode.js的onMouseUp时触发
   *
   * => canvas:mouseup
   * => dragPanelItemAddNode#onMouseup
   * => _addNode
   * => graph.executeCommand('add', addModel)
   * => command.execute('add',graph, addModel)
   *
   * @param {*} name 比如'add'
   * @param {*} graph
   * @param {*} cfg 比如addModel
   * @returns
   */
  execute(name, graph, cfg) {
    // 合并传入的addModel到cmd对象中
    const cmd = mix({}, this[name], cfg);

    // _command在 getDefaultCfg()中定义, 并放在了this._cfgs中
    // this.get('_command') 等价于 this._cfgs.get('_command')
    // 初始值为 { zoomDelta: 0.1, queue: [], current: 0, clipboard: [] }

    // 注意this.get('xxx') 和 graph.get('xxx') 的区别
    const manager = this.get('_command');

    // add: 只要有type属性和addModel属性就算enable
    // undo: 只要_command.current > 0
    if (cmd.enable(graph)) {
      // add: init方法为空
      cmd.init();

      // add: queue为true
      // undo: queue为false
      if (cmd.queue) {
        // 第一次add: [].splice(0, 0-0, cmd1), 即在queue的0号位置插入cmd对象
        // 第二次add: [].splice(1, 1-1, cmd2), 即在queue的1号位置插入cmd对象

        manager.queue.splice(manager.current, manager.queue.length - manager.current, cmd);

        // current: 0 => 1
        manager.current++;

        console.log('manager=', manager);
      }
    }
    graph.emit('beforecommandexecute', { command: cmd });
    cmd.execute(graph);
    graph.emit('aftercommandexecute', { command: cmd });
    return cmd;
  }

  enable(name, graph) {
    return this[name].enable(graph);
  }

  destroyPlugin() {
    this._events = null;
    this._cfgs = null;
    this.list = [];
    this.queue = [];
    this.destroyed = true;
  }

  /**
   * 在实例化G6.Graph对象时,G6框架会调用一次initPlugin
   * 然后initPlugin会调用initCommands，
   * 调用时机： Wdf.vue执行new G6.Graph({plugins})
   */
  initCommands() {
    const cmdPlugin = this;
    cmdPlugin.registerCommand('add', {
      enable: function() {
        return this.type && this.addModel;
      },
      execute: function(graph) {
        const item = graph.add(this.type, this.addModel);
        if (this.executeTimes === 1) this.addId = item.get('id');
      },
      back: function(graph) {
        graph.remove(this.addId);
      },
    });
    cmdPlugin.registerCommand('update', {
      enable: function() {
        return this.itemId && this.updateModel;
      },
      execute: function(graph) {
        const item = graph.findById(this.itemId);
        if (item) {
          if (this.executeTimes === 1) this.originModel = mix({}, item.getModel());
          graph.update(item, this.updateModel);
        }
      },
      back: function(graph) {
        const item = graph.findById(this.itemId);
        graph.update(item, this.originModel);
      },
    });
    cmdPlugin.registerCommand('delete', {
      enable: function(graph) {
        const mode = graph.getCurrentMode();
        const selectedItems = graph.get('selectedItems');
        return mode === 'edit' && selectedItems && selectedItems.length > 0;
      },
      method: function(graph) {
        const selectedItems = graph.get('selectedItems');
        graph.emit('beforedelete', { items: selectedItems });
        if (selectedItems && selectedItems.length > 0) {
          selectedItems.forEach(i => graph.remove(i));
        }
        graph.emit('afterdelete', { items: selectedItems });
      },
      shortcutCodes: ['Delete', 'Backspace'],
    });
    cmdPlugin.registerCommand('redo', {
      queue: false,
      enable: function(graph) {
        const mode = graph.getCurrentMode();
        const manager = cmdPlugin.get('_command');
        return mode === 'edit' && manager.current < manager.queue.length;
      },
      execute: function(graph) {
        const manager = cmdPlugin.get('_command');
        const cmd = manager.queue[manager.current];
        cmd && cmd.execute(graph);
        manager.current++;
      },
      shortcutCodes: [
        ['metaKey', 'shiftKey', 'z'],
        ['ctrlKey', 'shiftKey', 'z'],
      ],
    });
    cmdPlugin.registerCommand('undo', {
      queue: false,
      enable: function(graph) {
        const mode = graph.getCurrentMode();
        return mode === 'edit' && cmdPlugin.get('_command').current > 0;
      },
      execute: function(graph) {
        const manager = cmdPlugin.get('_command');
        const cmd = manager.queue[manager.current - 1];
        if (cmd) {
          cmd.executeTimes++;
          cmd.back(graph);
        }
        manager.current--;
      },
      shortcutCodes: [
        ['metaKey', 'z'],
        ['ctrlKey', 'z'],
      ],
    });
    cmdPlugin.registerCommand('copy', {
      queue: false,
      enable: function(graph) {
        const mode = graph.getCurrentMode();
        const items = graph.get('selectedItems');
        return mode === 'edit' && items && items.length > 0;
      },
      method: function(graph) {
        const manager = cmdPlugin.get('_command');
        manager.clipboard = [];
        const items = graph.get('selectedItems');
        if (items && items.length > 0) {
          const item = graph.findById(items[0]);
          if (item) {
            manager.clipboard.push({ type: item.get('type'), model: item.getModel() });
          }
        }
      },
    });
    cmdPlugin.registerCommand('paste', {
      enable: function(graph) {
        const mode = graph.getCurrentMode();
        return mode === 'edit' && cmdPlugin.get('_command').clipboard.length > 0;
      },
      method: function(graph) {
        const manager = cmdPlugin.get('_command');
        this.pasteData = clone(manager.clipboard[0]);
        const addModel = this.pasteData.model;
        addModel.x && (addModel.x += 10);
        addModel.y && (addModel.y += 10);
        const { clazz = 'userTask' } = addModel;
        const timestamp = new Date().getTime();
        const id = clazz + timestamp;
        addModel.id = id;
        const item = graph.add(this.pasteData.type, addModel);
        item.toFront();
      },
    });
    cmdPlugin.registerCommand('zoomIn', {
      queue: false,
      enable: function(graph) {
        const zoom = graph.getZoom();
        const maxZoom = graph.get('maxZoom');
        const minZoom = graph.get('minZoom');
        return zoom <= maxZoom && zoom >= minZoom;
      },
      execute: function(graph) {
        const manager = cmdPlugin.get('_command');
        const maxZoom = graph.get('maxZoom');
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        let currentZoom = zoom + manager.zoomDelta;
        if (currentZoom > maxZoom) currentZoom = maxZoom;
        graph.zoomTo(currentZoom);
      },
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
      shortcutCodes: [
        ['metaKey', '='],
        ['ctrlKey', '='],
      ],
    });
    cmdPlugin.registerCommand('zoomOut', {
      queue: false,
      enable: function(graph) {
        const zoom = graph.getZoom();
        const maxZoom = graph.get('maxZoom');
        const minZoom = graph.get('minZoom');
        return zoom <= maxZoom && zoom >= minZoom;
      },
      execute: function(graph) {
        const manager = cmdPlugin.get('_command');
        const minZoom = graph.get('minZoom');
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        let currentZoom = zoom - manager.zoomDelta;
        if (currentZoom < minZoom) currentZoom = minZoom;
        graph.zoomTo(currentZoom);
      },
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
      shortcutCodes: [
        ['metaKey', '-'],
        ['ctrlKey', '-'],
      ],
    });
    cmdPlugin.registerCommand('zoomReset', {
      queue: false,
      execute: function(graph) {
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        graph.zoomTo(1);
      },
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
    });
    cmdPlugin.registerCommand('autoFit', {
      queue: false,
      execute: function(graph) {
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        graph.fitView(5);
      },
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
    });
    cmdPlugin.registerCommand('toFront', {
      queue: false,
      enable: function(graph) {
        const items = graph.get('selectedItems');
        return items && items.length > 0;
      },
      execute: function(graph) {
        const items = graph.get('selectedItems');
        if (items && items.length > 0) {
          const item = graph.findById(items[0]);
          item.toFront();
          graph.paint();
        }
      },
      back: function(graph) {},
    });
    cmdPlugin.registerCommand('toBack', {
      queue: false,
      enable: function(graph) {
        const items = graph.get('selectedItems');
        return items && items.length > 0;
      },
      execute: function(graph) {
        const items = graph.get('selectedItems');
        if (items && items.length > 0) {
          const item = graph.findById(items[0]);
          item.toBack();
          graph.paint();
        }
      },
      back: function(graph) {},
    });
  }
}
export default Command;
