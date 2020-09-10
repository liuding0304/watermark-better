import utils from './utils'


// 水印默认参数
const waterMarkCanvasOption = {
  text: '', // 水印文字内容
  rootEl: document.body, // 水印挂载节点
  canvasId: 'sis023ksd', // 水印唯一标识id
  lineHeight: 30, // 行高
  fillStyle: 'rgba(1, 1, 1, 0.015)', // 文字颜色
  watermarkWidth: 100, // 水印内容宽
  watermarkHeight: 50, // 水印内容高
  rotate: -20, // 旋转角度
  xGap: 50, // 水印x方向间隔
  yGap: 50 // 水印y方向间隔
}


class WaterMark {
  constructor(event) {
    // 不支持pointerEvents时， 需要代理的事件  element-ui使用mouseup和mousedown来关闭popover
    this.delegateEvents = ['click', 'dblclick', 'mouseup', 'mousedown']
    this.canvasEl = null // canvas 容器
    this.event = event
    this.supportPointerEvents = this.getSupportPointerEvents()
  }
  render(option) {
    this.remove()

    Object.assign(this, waterMarkCanvasOption, option)

    this.genCanvas()
    // 异步：处理ie多次删除问题
    setTimeout(() => {
      this.rootEl.appendChild(this.canvasEl)
      if (!this.supportPointerEvents) {
        this.delegatePointerEvents()
      }
      this.event.trigger('render', this.rootEl, this.canvasEl)
    }, 0)
  }
  // 生成canvas
  genCanvas() {
    const el = document.createElement('canvas')
    const ctx = el.getContext('2d')
    const { innerWidth, innerHeight } = window

    // 属性设置
    el.id = this.canvasId
    el.width = innerWidth
    el.height = innerHeight
    el.style.position = 'fixed'
    el.style.top = 0
    el.style.left = 0
    el.style.pointerEvents = 'none'
    el.style.zIndex = 99999

    // 文字设置
    ctx.font = '16px'
    ctx.fillStyle = this.fillStyle
    ctx.textBaseline = 'hanging'

    // 画布长宽为对角线长度
    const squareWidth = parseInt(
      Math.sqrt(Math.pow(innerWidth, 2) + Math.pow(innerHeight, 2))
    )

    // 设置切斜度并移动坐标
    ctx.translate(
      (innerWidth - squareWidth) / 2,
      (innerHeight - squareWidth) / 2
    )
    ctx.translate(squareWidth * 0.5, squareWidth * 0.5)
    ctx.rotate((this.rotate * Math.PI) / 180)
    ctx.translate(-squareWidth * 0.5, -squareWidth * 0.5)

    // 计算出行数和列数
    let col = Math.ceil(squareWidth / (this.watermarkWidth + this.xGap))
    let row = Math.ceil(squareWidth / (this.watermarkHeight + this.yGap))

    // 画画咯
    for (let i = 0; i < col; i++) {
      for (let j = 0; j < row; j++) {
        this.fillTextWrap(
          ctx,
          this.text,
          parseInt((squareWidth / col) * i),
          parseInt((squareWidth / row) * j),
          this.lineHeight,
          this.watermarkWidth
        )
      }
    }

    this.canvasEl = el
  }
  /**
   * ie9 ie10 不支持pointerEvents的代理水印的事件
   * @memberof WaterMarkCanvas
   */
  delegatePointerEvents() {
    const el = this.canvasEl

    this.handler = e => {
      // 暂停对水印的变更监听， 并隐藏canvas
      this.event.trigger('pauseObserve')
      el.style.display = 'none'
      // 获取点击位置的元素
      const eventEl = document.elementFromPoint(e.clientX, e.clientY)

      // 模拟事件
      let event
      event = document.createEvent('MouseEvents')

      event.initMouseEvent(
        e.type,
        true,
        true,
        window,
        0,
        e.screenX,
        e.screenY,
        e.clientX,
        e.clientY,
        0,
        0,
        0,
        0,
        0,
        null
      )
      eventEl.dispatchEvent(event)

      // 点击了可编辑元素， 自动在点击位置插入光标
      const editNode = this.getEditNode(eventEl)
      if (editNode && e.type === 'click') {
        const x = e.clientX
        const y = e.clientY
        if (eventEl.nodeName === 'INPUT') {
          // input 元素 处理
          eventEl.focus()
          const range = eventEl.createTextRange()
          const textLen = range.text.length
          const scrollLeft = eventEl.scrollLeft
          range.collapse(true)
          let moveLength = 0
          // 寻找到光标的位置
          const move = () => {
            moveLength++
            if (moveLength > textLen) {
              return
            }
            range.expand('character')
            const {
              boundingLeft,
              boundingTop,
              boundingWidth,
              boundingHeight
            } = range
            const pointLeft = boundingLeft + scrollLeft
            if (
              pointLeft <= x &&
              x <= pointLeft + boundingWidth &&
              boundingTop <= y &&
              y <= boundingTop + boundingHeight
            ) {
              eventEl.setSelectionRange(moveLength, moveLength)
            } else {
              range.collapse(false)
              move()
            }
          }
          move()
        } else {
          // textarea 和 conenteditable
          try {
            const range = document.body.createTextRange()
            range.moveToPoint(x, y)
            range.expand('character')
            range.collapse(true)
            range.select()
            eventEl.focus()
          } catch (error) {
            // 点击位置不能插入光标时，将光标设置到末尾
            eventEl.focus()
            const html = editNode.innerHTML
            editNode.innerHTML = html
          }
        }
      }

      // 显示水印和恢复监听
      el.style.display = 'block'
      this.event.trigger('recoverObserve')

      e.stopPropagation()
      e.preventDefault()
      return false
    }

    this.delegateEvents.forEach(name => {
      el.addEventListener(name, this.handler)
    })
  }
  // 是否为可编辑元素，是则返回可以编辑元素、否返回null
  getEditNode(node) {
    if (['INPUT', 'TEXTAREA'].includes(node.nodeName)) {
      return node
    }
    if (node.getAttribute('contenteditable') === 'true') {
      return node
    }
    const contentEditEls = document.querySelectorAll('[contenteditable=true]')
    const findEditEl = findFn(contentEditEls, el => {
      return el.contains(node)
    })
    if (findEditEl) {
      return findEditEl
    }
    return null
  }
  // canvas支持换行文字
  fillTextWrap(ctx, text, x, y, lineHeight, maxWidth) {
    const chars = text.split('')
    const rows = []
    let rowTemp = ''
    chars.forEach(i => {
      if (ctx.measureText(rowTemp + i).width < maxWidth) {
        rowTemp += i
      } else {
        rows.push(rowTemp), (rowTemp = i)
      }
    })

    if (rowTemp) {
      rows.push(rowTemp)
    }

    rows.forEach((rowText, index) => {
      const yPosition = y + index * lineHeight
      ctx.fillText(rowText, x, yPosition)
    })
  }
  remove() {
    this.removeListener()
    const node = document.querySelector(`#${this.canvasId}`)
    if (node) {
      node.parentNode.removeChild(node)
    }
  }
  removeListener() {
    if (this.canvasEl && !this.supportPointerEvents) {
      this.delegateEvents.forEach(name => {
        this.canvasEl.removeEventListener(name, this.handler)
      })
    }
  }
  /**
   * ie11以下不支持pointerEvents
   * @returns 是否支持pointerEvents
   * @memberof WaterMarkCanvas
   */
  getSupportPointerEvents() {
    if (navigator.appName == 'Microsoft Internet Explorer') {
      const agent = navigator.userAgent
      if (agent.match(/MSIE ([0-9]{1,}[.0-9]{0,})/) != null) {
        const version = parseFloat(RegExp.$1)
        if (version < 11) return false
      }
    }
    return true
  }
}

export default  WaterMark
