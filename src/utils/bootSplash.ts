/** 淡出并移除 HTML 冷启动壳（#boot-splash） */
export function dismissBootSplash() {
  const el = document.getElementById('boot-splash')
  if (!el || el.classList.contains('boot-splash--hide')) return

  el.classList.add('boot-splash--hide')
  window.setTimeout(() => {
    el.remove()
  }, 280)
}
