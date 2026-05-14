(function() {
  var showToast = window.financeApp.showToast || alert;

  // 从URL获取token
  var urlParams = new URLSearchParams(window.location.search);
  var token = urlParams.get('token');

  if (!token) {
    document.getElementById('alert').textContent = '无效的重置链接，缺少token参数';
    document.getElementById('alert').className = 'alert alert-error show';
    document.getElementById('resetForm').style.display = 'none';
    return;
  }

  // 显示token
  document.getElementById('tokenDisplay').textContent = token.substring(0, 20) + '...';

  document.getElementById('resetForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    var alert = document.getElementById('alert');
    var btn = document.getElementById('submitBtn');

    if (!newPassword) {
      alert.textContent = '请输入新密码';
      alert.className = 'alert alert-error show';
      return;
    }

    if (newPassword.length < 6) {
      alert.textContent = '密码长度不能少于6位';
      alert.className = 'alert alert-error show';
      return;
    }

    if (newPassword !== confirmPassword) {
      alert.textContent = '两次输入的密码不一致';
      alert.className = 'alert alert-error show';
      return;
    }

    btn.disabled = true;
    btn.textContent = '重置中...';
    alert.className = 'alert';

    try {
      await api.post('/api/user/reset-password', {
        token: token,
        newPassword: newPassword
      });
      
      showToast('密码重置成功！', 'success');
      
      // 延迟跳转到登录页
      setTimeout(function() {
        window.location.href = 'login.html';
      }, 1500);
    } catch (err) {
      alert.textContent = err.message || '重置失败，token可能已过期';
      alert.className = 'alert alert-error show';
    } finally {
      btn.disabled = false;
      btn.textContent = '重置密码';
    }
  });
})();
