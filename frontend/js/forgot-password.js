(function() {
  var showToast = window.financeApp.showToast || alert;

  document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var email = document.getElementById('email').value.trim();
    var alert = document.getElementById('alert');
    var btn = document.getElementById('submitBtn');

    if (!email) {
      alert.textContent = '请输入邮箱地址';
      alert.className = 'alert alert-error show';
      return;
    }

    if (!isValidEmail(email)) {
      alert.textContent = '请输入有效的邮箱地址';
      alert.className = 'alert alert-error show';
      return;
    }

    btn.disabled = true;
    btn.textContent = '发送中...';
    alert.className = 'alert';

    try {
      await api.post('/api/user/forgot-password', { email: email });
      
      // 显示成功信息
      document.getElementById('formSection').style.display = 'none';
      document.getElementById('successSection').style.display = 'block';
      
      showToast('重置链接已发送', 'success');
    } catch (err) {
      alert.textContent = err.message || '发送失败，请检查邮箱是否正确';
      alert.className = 'alert alert-error show';
    } finally {
      btn.disabled = false;
      btn.textContent = '发送重置链接';
    }
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();
