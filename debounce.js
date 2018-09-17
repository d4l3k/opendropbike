export const debounce = (f, time) => {
  let last = null
  let lastTime = 0
  return function () {
    const now = +new Date
    if (!last || now - lastTime > time) {
      last = f.apply(this, arguments)
      lastTime = now
      return last
    }

    return last
  }
}
