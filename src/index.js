/****
 * 水印功能 兼容到ie9
 *
 * 使用：
 *  watermark.init({text: '名字-工号'}) 生成水印
 *  watermark.clear() 清除水印
 */
import utils from './utils'
import Event from './events'
import Observe from './observe'
import Watermark from './watermark'


// 控制类
class WaterMarkController {
  constructor() {
    this.event = new Event()
    this.observe = new Observe(this.event)
    this.canvas = new Watermark(this.event)
    this.handlerResize = utils.throttle(
      () => {
        this.clear()
        this.init(this.option)
      },
      200,
      { leading: true }
    )
  }
  init(option) {
    this.clear()
    this.option = option
    this.canvas.render(option)

    this.event.on('render', (rootEl, canvasEl) => {
      // 添加监听
      this.observe.add(rootEl, canvasEl)
    })

    this.event.on('nodeChanged', () => {
      // 重新生成
      this.init(option)
    })

    window.addEventListener('resize', this.handlerResize)
  }
  clear() {
    this.event.off()
    this.observe.remove()
    this.canvas.remove()
    window.removeEventListener('resize', this.handlerResize)
  }
}

export default WaterMarkController
