import throttle from 'lodash/throttle'
import assign from 'lodash/assign'


const findFn = function(arrayLike, fn) {
  return Array.prototype.find.call(arrayLike, fn)
}

export default {
  findFn,
  throttle,
  assign
}
