(function () {
  const { requireCurrentUser, logout, getCurrentMonth, formatCurrency, formatDate, escapeHtml } = window.financeApp;
  const currentUser = requireCurrentUser();

  if (!currentUser) {
    return;
  }

  const usernameEl = document.getElementById('username');
  const monthInput = document.getElementById('dashboardMonth');
  const alertEl = document.getElementById('dashboardAlert');
  const recordsBody = document.getElementById('recentRecordsBody');
  const recordsEmpty = document.getElementById('recordsEmpty');
  const budgetSummary = document.getElementById('budgetSummary');
  const pieChart = echarts.init(document.getElementById('expensePieChart'));

  usernameEl.textContent = currentUser.username || `用户#${currentUser.id}`;
  monthInput.value = getCurrentMonth();
  document.getElementById('logoutBtn').addEventListener('click', logout);
  monthInput.addEventListener('change', loadDashboard);
  window.addEventListener('resize', () => pieChart.resize());

  loadDashboard();

  async function loadDashboard() {
    const month = monthInput.value || getCurrentMonth();
    const [summaryResult, recentRecordsResult, budgetResult] = await Promise.allSettled([
      getMonthlySummary(month),
      getRecentRecords(),
      getBudgetProgress(month),
    ]);

    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
    const recentRecords = recentRecordsResult.status === 'fulfilled' ? recentRecordsResult.value : [];
    const budgets = budgetResult.status === 'fulfilled' ? budgetResult.value : [];

    renderSummary(summary);
    renderRecentRecords(recentRecords);
    renderBudgetProgress(budgets);
    renderExpenseChart(summary?.categoryStats || []);

    const notices = [];
    if (summaryResult.status === 'rejected') {
      notices.push('统计接口不可用，当前已回退为基于记录的本地汇总。');
    }
    if (budgetResult.status === 'rejected') {
      notices.push('预算接口暂不可用，预算概览未展示真实后端数据。');
    }
    showAlert(notices.join(' '), notices.length ? 'warning' : '');
  }

  async function getMonthlySummary(month) {
    try {
      return await api.get('/api/statistics/summary', {
        params: { userId: currentUser.id, month },
      });
    } catch (error) {
      const recordsPage = await api.get('/api/records', {
        params: { userId: currentUser.id, page: 1, size: 200, month },
      });
      return buildSummaryFromRecords(recordsPage.records || []);
    }
  }

  async function getRecentRecords() {
    const pageData = await api.get('/api/records', {
      params: { userId: currentUser.id, page: 1, size: 5 },
    });
    return pageData.records || [];
  }

  async function getBudgetProgress(month) {
    return await api.get('/api/budget', {
      params: { userId: currentUser.id, month },
    });
  }

  function buildSummaryFromRecords(records) {
    const categoryMap = new Map();
    const summary = records.reduce((acc, record) => {
      const amount = Number(record.amount || 0);
      if (record.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
        categoryMap.set(record.category, (categoryMap.get(record.category) || 0) + amount);
      }
      return acc;
    }, { income: 0, expense: 0 });

    return {
      income: summary.income,
      expense: summary.expense,
      balance: summary.income - summary.expense,
      categoryStats: Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })),
    };
  }

  function renderSummary(summary) {
    const income = Number(summary?.income || 0);
    const expense = Number(summary?.expense || 0);
    const balance = Number(summary?.balance ?? income - expense);

    document.getElementById('incomeValue').textContent = formatCurrency(income);
    document.getElementById('expenseValue').textContent = formatCurrency(expense);
    document.getElementById('balanceValue').textContent = formatCurrency(balance);
  }

  function renderExpenseChart(categoryStats) {
    const chartData = Array.isArray(categoryStats)
      ? categoryStats.map((item) => ({
          name: item.name || item.category || '未分类',
          value: Number(item.value || item.amount || item.total || 0),
        }))
      : [];

    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          name: '支出分类',
          type: 'pie',
          radius: ['42%', '72%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            formatter: '{b}\n{d}%',
          },
          data: chartData.length ? chartData : [{ name: '暂无支出数据', value: 1 }],
        },
      ],
    });
  }

  function renderRecentRecords(records) {
    if (!records.length) {
      recordsBody.innerHTML = '';
      recordsEmpty.hidden = false;
      return;
    }

    recordsEmpty.hidden = true;
    recordsBody.innerHTML = records.map((record) => {
      const typeClass = record.type === 'income' ? 'income' : 'expense';
      const typeText = record.type === 'income' ? '收入' : '支出';
      const amountPrefix = record.type === 'income' ? '+' : '-';

      return `
        <tr>
          <td>${escapeHtml(formatDate(record.recordDate || record.createTime))}</td>
          <td><span class="type-badge ${typeClass}">${typeText}</span></td>
          <td>${escapeHtml(record.category || '未分类')}</td>
          <td>${escapeHtml(record.remark || '--')}</td>
          <td>${amountPrefix}${escapeHtml(formatCurrency(record.amount || 0))}</td>
        </tr>
      `;
    }).join('');
  }

  function renderBudgetProgress(budgets) {
    if (!Array.isArray(budgets) || !budgets.length) {
      budgetSummary.innerHTML = '<div class="empty-state compact-empty"><p>当前月份暂无预算数据。</p></div>';
      return;
    }

    budgetSummary.innerHTML = budgets.map((item) => {
      const progress = Math.min(Number(item.progress || 0), 100);
      const fillClass = progress >= 100 || item.overBudget ? 'danger' : progress >= 80 ? 'warning' : 'normal';
      return `
        <div class="budget-item">
          <div class="budget-header">
            <span class="category">${escapeHtml(item.category || '未分类')}</span>
            <span class="amount">${escapeHtml(formatCurrency(item.spent || 0))} / ${escapeHtml(formatCurrency(item.budgetAmount || 0))}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${fillClass}" style="width:${progress}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function showAlert(message, type) {
    if (!message) {
      alertEl.className = 'alert';
      alertEl.textContent = '';
      return;
    }
    alertEl.textContent = message;
    alertEl.className = `alert alert-${type} show`;
  }
})();
