// 事件类
class Event {
  constructor() {
    this.events = {}
  }
  on(key, callback) {
    this.events[key] = this.events[key] || []
    this.events[key].push(callback)
  }
  trigger(key, ...arg) {
    const callbacks = this.events[key]
    if (Array.isArray(callbacks)) {
      callbacks.forEach(fn => {
        fn.apply(null, arg)
      })
    }
  }
  off() {
    this.events = {}
  }
}


export default Event
