
// import assign from 'lodash/assign'


const findFn = function(arrayLike, fn) {
  return Array.prototype.find.call(arrayLike, fn)
}

function assign(obj1, obj2) {
  Object.keys(obj2).forEach((key) => {})

  return obj1
}
function throttle(fn, threshold, scope) {
  let timer;
  let prev = Date.now();
  return function () {
      let context = scope || this, args = arguments;
      let now = Date.now();
      if (now - prev > threshold) {
          prev = now;
          fn.apply(context, args);
      }
  }
}


export default {
  findFn,
  throttle,
  // assign?
}
