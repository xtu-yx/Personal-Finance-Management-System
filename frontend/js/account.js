(function () {
  var currentUser = window.financeApp.requireCurrentUser();
  if (!currentUser) return;

  var showToast = window.financeApp.showToast || alert;

  // 初始化
  document.getElementById('username').textContent = currentUser.username || '用户#' + currentUser.id;
  document.getElementById('logoutBtn').addEventListener('click', window.financeApp.logout);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);

  // 加载用户信息
  loadUserInfo();

  async function loadUserInfo() {
    try {
      var user = await api.get('/api/user/info', { params: { userId: currentUser.id } });
      
      document.getElementById('profileUsername').value = user.username || currentUser.username || '';
      document.getElementById('profileEmail').value = user.email || '';
      document.getElementById('accountId').textContent = user.id || currentUser.id || '--';
      document.getElementById('accountCreateTime').textContent = formatDate(user.createTime) || '--';
    } catch (e) {
      // 使用本地存储的用户信息
      document.getElementById('profileUsername').value = currentUser.username || '';
      document.getElementById('profileEmail').value = currentUser.email || '';
      document.getElementById('accountId').textContent = currentUser.id || '--';
    }
  }

  async function saveProfile() {
    var email = document.getElementById('profileEmail').value.trim();
    
    if (!email) {
      showToast('请输入邮箱', 'warning');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('请输入有效的邮箱地址', 'warning');
      return;
    }

    var btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      await api.put('/api/user/info', {
        userId: currentUser.id,
        email: email
      });
      showToast('个人信息保存成功！', 'success');
      
      // 更新本地存储
      currentUser.email = email;
      window.financeApp.saveCurrentUser(currentUser);
    } catch (e) {
      showToast('保存失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存修改';
    }
  }

  async function changePassword() {
    var currentPwd = document.getElementById('currentPassword').value;
    var newPwd = document.getElementById('newPassword').value;
    var confirmPwd = document.getElementById('confirmPassword').value;

    if (!currentPwd) {
      showToast('请输入当前密码', 'warning');
      return;
    }
    if (!newPwd) {
      showToast('请输入新密码', 'warning');
      return;
    }
    if (newPwd.length < 6) {
      showToast('新密码长度不能少于6位', 'warning');
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast('两次输入的密码不一致', 'warning');
      return;
    }

    var btn = document.getElementById('changePasswordBtn');
    btn.disabled = true;
    btn.textContent = '修改中...';

    try {
      await api.put('/api/user/password', {
        userId: currentUser.id,
        oldPassword: currentPwd,
        newPassword: newPwd
      });
      showToast('密码修改成功！', 'success');
      
      // 清空输入框
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } catch (e) {
      showToast('密码修改失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '修改密码';
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function formatDate(value) {
    if (!value) return '--';
    var date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  }
})();
