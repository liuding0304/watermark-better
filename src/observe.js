// 监听类
class Observe {
  constructor(event) {
    this.pause = false
    this.event = event
    // MutationObserver 默认参数
    this.observerOptions = {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      attributes: true, // 观察属性变动
      subtree: false // 观察后代节点，默认为 false
    }

    this.MutationObserver = (() => {
      return (
        window.MutationObserver ||
        window.WebKitMutationObserver ||
        window.MozMutationObserver
      )
    })()
    this.supportMutationObserver = !!this.MutationObserver

    if (this.supportMutationObserver) {
      this.observer = new MutationObserver(
        this.MutationObserverCallback.bind(this)
      )
    }

    this.event.on('pauseObserve', () => {
      this.pause = true
    })
    this.event.on('recoverObserve', () => {
      this.pause = false
    })
  }
  add(rootEl, canvasEl) {
    this.rootEl = rootEl
    this.canvasEl = canvasEl
    if (this.supportMutationObserver) {
      this.observer.observe(canvasEl, this.observerOptions)
      this.observer.observe(rootEl, this.observerOptions)
    } else {
      canvasEl.addEventListener('DOMAttrModified', this.attributesChange)
      canvasEl.addEventListener('DOMNodeRemoved', this.nodeChange)
    }
  }

  /**
   * 移除canvas元素的变更监听
   *
   */
  remove() {
    if (this.supportMutationObserver) {
      this.observer.disconnect()
    } else if (this.canvasEl) {
      this.canvasEl.removeEventListener(
        'DOMAttrModified',
        this.attributesChange
      )
      this.canvasEl.removeEventListener('DOMNodeRemoved', this.nodeChange)
    }
  }
  /**
   * MutationObserver 回调
   * @param {*} records
   */
  MutationObserverCallback(records) {
    records.forEach(record => {
      if (record.type === 'attributes') {
        this.attributesChange(record)
      } else if (record.type === 'childList') {
        this.nodeChange(record)
      }
    })
  }

  /**
   * canvas属性变更处理函数
   * @param {*} record 变更记录event
   * @returns
   */
  attributesChange(record) {
    if (this.pause) {
      return
    }
    if (record.target === this.canvasEl) {
      this.event.trigger('nodeChanged')
    }
  }
  /**
   * canvas元素移除处理
   * @param {*} record
   */
  nodeChange(record) {
    if (this.pause) {
      return
    }
    if (this.supportMutationObserver) {
      const { removedNodes } = record
      if (
        removedNodes &&
        removedNodes.length &&
        findFn(removedNodes, i => i === this.canvasEl)
      ) {
        this.event.trigger('nodeChanged')
      }
    } else if (record.target === this.canvasEl) {
      this.event.trigger('nodeChanged')
    }
  }
}


export observe
