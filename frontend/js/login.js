document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alert = document.getElementById('alert');
  const btn = document.getElementById('loginBtn');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert.textContent = '请填写用户名和密码';
    alert.className = 'alert alert-error show';
    return;
  }

  btn.disabled = true;
  btn.textContent = '登录中...';
  alert.className = 'alert';

  try {
    const user = await api.post('/api/user/login', { username, password });
    window.financeApp.saveCurrentUser(user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    alert.textContent = err.message || '登录失败，请检查用户名和密码';
    alert.className = 'alert alert-error show';
  } finally {
    btn.disabled = false;
    btn.textContent = '登 录';
  }
});
