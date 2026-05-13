(function () {
  var currentUser = window.financeApp.requireCurrentUser();
  if (!currentUser) return;

  document.getElementById('username').textContent = currentUser.username || '用户#' + currentUser.id;
  document.getElementById('logoutBtn').addEventListener('click', window.financeApp.logout);
  document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);

  loadBudgetInfo();

  async function saveBudget() {
    var monthMoney = Number(document.getElementById('monthMoney').value);
    if (!monthMoney) { alert('请输入预算金额！'); return; }
    var currentMonth = new Date().toISOString().slice(0, 7);
    try {
      await api.post('/api/budget', {
        userId: currentUser.id,
        category: '总预算',
        amount: monthMoney,
        month: currentMonth
      });
      alert('预算保存成功！');
      loadBudgetInfo();
    } catch (err) { alert('保存失败：' + (err.message || '未知错误')); }
  }

  async function loadBudgetInfo() {
    try {
      var currentMonth = new Date().toISOString().slice(0, 7);
      var budgets = await api.get('/api/budget', { params: { userId: currentUser.id, month: currentMonth } });
      var total = 0;
      var used = 0;
      if (Array.isArray(budgets)) {
        budgets.forEach(function(item) {
          total += Number(item.budgetAmount || item.amount || 0);
          used += Number(item.spent || 0);
        });
      }
      var remain = total - used;
      var rate = total > 0 ? (used / total * 100).toFixed(1) : 0;

      var infoEl = document.getElementById('budgetInfo');
      infoEl.textContent = '';
      var lines = [
        '月度总预算：¥ ' + total,
        '已消费金额：¥ ' + used,
        '剩余预算：¥ ' + remain
      ];
      lines.forEach(function (line, i) {
        infoEl.appendChild(document.createTextNode(line));
        if (i < lines.length - 1) {
          infoEl.appendChild(document.createElement('br'));
        }
      });

      var bar = document.getElementById('progressBar');
      var text = document.getElementById('progressText');
      bar.style.width = rate + '%';
      text.textContent = '已使用 ' + rate + '%';

      if (rate >= 90) bar.style.background = '#f56c6c';
      else if (rate >= 70) bar.style.background = '#e6a23c';
      else bar.style.background = '#409eff';
    } catch (err) {
      // 静默处理
    }
  }
})();
