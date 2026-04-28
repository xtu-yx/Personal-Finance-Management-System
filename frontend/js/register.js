document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alert = document.getElementById('alert');
  const btn = document.getElementById('registerBtn');

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!username || !email || !password) {
    alert.textContent = '请填写所有字段';
    alert.className = 'alert alert-error show';
    return;
  }

  if (password !== confirmPassword) {
    alert.textContent = '两次密码输入不一致';
    alert.className = 'alert alert-error show';
    return;
  }

  if (password.length < 6) {
    alert.textContent = '密码长度不能少于6位';
    alert.className = 'alert alert-error show';
    return;
  }

  btn.disabled = true;
  btn.textContent = '注册中...';
  alert.className = 'alert';

  try {
    await api.post('/api/user/register', { username, password, email });
    window.location.href = 'index.html';
  } catch (err) {
    alert.textContent = err.message || '注册失败';
    alert.className = 'alert alert-error show';
  } finally {
    btn.disabled = false;
    btn.textContent = '注 册';
  }
});
