(function () {
  var currentUser = window.financeApp.requireCurrentUser();
  if (!currentUser) return;

  var showToast = window.financeApp.showToast || alert;
  var currentMonth = getCurrentMonth();

  // 支出分类列表
  var expenseCategories = ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '日用'];

  // 初始化
  document.getElementById('username').textContent = currentUser.username || '用户#' + currentUser.id;
  document.getElementById('logoutBtn').addEventListener('click', window.financeApp.logout);
  document.getElementById('saveBudgetBtn').addEventListener('click', saveTotalBudget);
  document.getElementById('addCategoryBudgetBtn').addEventListener('click', openAddModal);
  document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
  document.getElementById('cancelAddBtn').addEventListener('click', closeAddModal);
  document.getElementById('saveCategoryBudgetBtn').addEventListener('click', saveCategoryBudget);

  // 设置默认月份
  document.getElementById('budgetMonth').value = currentMonth;
  document.getElementById('budgetMonth').addEventListener('change', function() {
    currentMonth = this.value;
    loadBudgetInfo();
  });

  // 加载预算信息
  loadBudgetInfo();

  function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  async function saveTotalBudget() {
    var monthMoney = parseFloat(document.getElementById('monthMoney').value);
    if (!monthMoney || monthMoney <= 0) {
      showToast('请输入有效的预算金额', 'warning');
      return;
    }

    var btn = document.getElementById('saveBudgetBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      await api.post('/api/budget', {
        userId: currentUser.id,
        category: '总预算',
        amount: monthMoney,
        month: currentMonth
      });
      showToast('总预算保存成功！', 'success');
      loadBudgetInfo();
    } catch (err) {
      showToast('保存失败: ' + (err.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存总预算';
    }
  }

  async function loadBudgetInfo() {
    try {
      var budgets = await api.get('/api/budget', { params: { userId: currentUser.id, month: currentMonth } });
      var budgetList = Array.isArray(budgets) ? budgets : [];
      
      // 分离总预算和分类预算
      var totalBudget = budgetList.find(function(b) { return b.category === '总预算'; });
      var categoryBudgets = budgetList.filter(function(b) { return b.category !== '总预算'; });

      // 渲染总预算
      renderTotalBudget(totalBudget, categoryBudgets);

      // 渲染分类预算列表
      renderCategoryBudgets(categoryBudgets);

      // 渲染分类预算进度
      renderCategoryProgress(categoryBudgets);

      // 填充分类下拉框
      populateCategorySelect(categoryBudgets);
    } catch (err) {
      showToast('加载预算信息失败', 'error');
    }
  }

  function renderTotalBudget(totalBudget, categoryBudgets) {
    var totalAmount = totalBudget ? Number(totalBudget.budgetAmount || totalBudget.amount || 0) : 0;
    var totalSpent = 0;
    
    // 计算总支出
    categoryBudgets.forEach(function(b) {
      totalSpent += Number(b.spent || 0);
    });

    var remain = totalAmount - totalSpent;
    var rate = totalAmount > 0 ? (totalSpent / totalAmount * 100).toFixed(1) : 0;

    // 更新总预算输入框
    document.getElementById('monthMoney').value = totalAmount || '';

    // 更新摘要
    var summary = document.getElementById('budgetSummary');
    summary.innerHTML = 
      '<div class="budget-summary-item">' +
        '<span class="budget-label">总预算</span>' +
        '<span class="budget-value">¥' + formatNumber(totalAmount) + '</span>' +
      '</div>' +
      '<div class="budget-summary-item">' +
        '<span class="budget-label">已支出</span>' +
        '<span class="budget-value expense">¥' + formatNumber(totalSpent) + '</span>' +
      '</div>' +
      '<div class="budget-summary-item">' +
        '<span class="budget-label">剩余</span>' +
        '<span class="budget-value ' + (remain >= 0 ? 'income' : 'expense') + '">¥' + formatNumber(remain) + '</span>' +
      '</div>';

    // 更新进度条
    var bar = document.getElementById('totalProgressBar');
    var text = document.getElementById('totalProgressText');
    bar.style.width = Math.min(rate, 100) + '%';
    text.textContent = '已使用 ' + rate + '%';

    if (rate >= 90) bar.className = 'progress-bar danger';
    else if (rate >= 70) bar.className = 'progress-bar warning';
    else bar.className = 'progress-bar';

    // 更新标签
    var tag = document.getElementById('totalBudgetTag');
    if (totalAmount > 0) {
      tag.textContent = rate >= 90 ? '预算紧张' : (rate >= 70 ? '预算预警' : '正常');
      tag.className = 'soft-tag ' + (rate >= 90 ? 'tag-danger' : (rate >= 70 ? 'tag-warning' : 'tag-success'));
    } else {
      tag.textContent = '未设置';
      tag.className = 'soft-tag';
    }
  }

  function renderCategoryBudgets(categoryBudgets) {
    var container = document.getElementById('categoryBudgetList');
    container.innerHTML = '';

    if (categoryBudgets.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无分类预算，点击上方按钮添加</p></div>';
      return;
    }

    categoryBudgets.forEach(function(budget) {
      var item = document.createElement('div');
      item.className = 'category-budget-item';
      item.innerHTML = 
        '<div class="category-budget-info">' +
          '<span class="category-budget-name">' + escapeHtml(budget.category) + '</span>' +
          '<span class="category-budget-amount">¥' + formatNumber(budget.budgetAmount || budget.amount || 0) + '</span>' +
        '</div>' +
        '<button class="btn btn-sm btn-danger delete-budget-btn" data-category="' + escapeHtml(budget.category) + '">删除</button>';
      container.appendChild(item);
    });

    // 绑定删除事件
    container.querySelectorAll('.delete-budget-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteCategoryBudget(this.getAttribute('data-category'));
      });
    });
  }

  function renderCategoryProgress(categoryBudgets) {
    var container = document.getElementById('categoryProgressList');
    container.innerHTML = '';

    if (categoryBudgets.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无分类预算进度</p></div>';
      return;
    }

    categoryBudgets.forEach(function(budget) {
      var amount = Number(budget.budgetAmount || budget.amount || 0);
      var spent = Number(budget.spent || 0);
      var rate = amount > 0 ? (spent / amount * 100).toFixed(1) : 0;
      var remain = amount - spent;

      var item = document.createElement('div');
      item.className = 'category-progress-item';
      item.innerHTML = 
        '<div class="category-progress-header">' +
          '<span class="category-progress-name">' + escapeHtml(budget.category) + '</span>' +
          '<span class="category-progress-rate">' + rate + '%</span>' +
        '</div>' +
        '<div class="progress-bar-container">' +
          '<div class="progress-bar ' + (rate >= 90 ? 'danger' : (rate >= 70 ? 'warning' : '')) + '" style="width: ' + Math.min(rate, 100) + '%"></div>' +
        '</div>' +
        '<div class="category-progress-detail">' +
          '<span>预算: ¥' + formatNumber(amount) + '</span>' +
          '<span>已用: ¥' + formatNumber(spent) + '</span>' +
          '<span>剩余: ¥' + formatNumber(remain) + '</span>' +
        '</div>';
      container.appendChild(item);
    });
  }

  function populateCategorySelect(existingBudgets) {
    var select = document.getElementById('budgetCategory');
    select.innerHTML = '<option value="">请选择分类</option>';
    
    // 获取已有预算的分类
    var existingCategories = existingBudgets.map(function(b) { return b.category; });
    
    // 只显示没有设置预算的分类
    expenseCategories.forEach(function(cat) {
      if (existingCategories.indexOf(cat) === -1) {
        var option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      }
    });
  }

  function openAddModal() {
    document.getElementById('budgetAmount').value = '';
    document.getElementById('addBudgetModal').classList.add('active');
  }

  function closeAddModal() {
    document.getElementById('addBudgetModal').classList.remove('active');
  }

  async function saveCategoryBudget() {
    var category = document.getElementById('budgetCategory').value;
    var amount = parseFloat(document.getElementById('budgetAmount').value);

    if (!category) {
      showToast('请选择分类', 'warning');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('请输入有效的预算金额', 'warning');
      return;
    }

    var btn = document.getElementById('saveCategoryBudgetBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      await api.post('/api/budget', {
        userId: currentUser.id,
        category: category,
        amount: amount,
        month: currentMonth
      });
      showToast('分类预算保存成功！', 'success');
      closeAddModal();
      loadBudgetInfo();
    } catch (err) {
      showToast('保存失败: ' + (err.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存';
    }
  }

  async function deleteCategoryBudget(category) {
    if (!confirm('确定删除「' + category + '」的预算吗？')) return;

    try {
      await api.delete('/api/budget', { params: { userId: currentUser.id, category: category, month: currentMonth } });
      showToast('删除成功', 'success');
      loadBudgetInfo();
    } catch (err) {
      showToast('删除失败: ' + (err.message || '未知错误'), 'error');
    }
  }

  function formatNumber(value) {
    return Number(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function escapeHtml(value) {
    return window.financeApp.escapeHtml(value);
  }
})();
