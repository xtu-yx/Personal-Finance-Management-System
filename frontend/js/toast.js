/**
 * Toast 通知系统
 * 替代原生 alert()，提供非阻断式通知
 */
(function() {
  // 创建 Toast 容器
  function createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * 显示 Toast 通知
   * @param {string} message - 消息内容
   * @param {string} type - 类型: 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - 显示时长(ms)，默认3000
   */
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    const container = createContainer();
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    // 图标
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = 
      '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
      '<span class="toast-message">' + escapeHtml(message) + '</span>' +
      '<button class="toast-close" onclick="this.parentElement.remove()">×</button>';

    container.appendChild(toast);

    // 触发动画
    requestAnimationFrame(function() {
      toast.classList.add('toast-show');
    });

    // 自动关闭
    setTimeout(function() {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(function() {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duration);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 导出到全局
  window.financeApp = window.financeApp || {};
  window.financeApp.showToast = showToast;
})();
