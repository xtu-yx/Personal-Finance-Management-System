(function () {
  const { requireCurrentUser, logout, getCurrentMonth, formatCurrency, escapeHtml } = window.financeApp;
  const currentUser = requireCurrentUser();

  if (!currentUser) {
    return;
  }

  const monthInput = document.getElementById('statisticsMonth');
  const trendMonthsSelect = document.getElementById('trendMonths');
  const alertEl = document.getElementById('statisticsAlert');
  const rankingEl = document.getElementById('categoryRanking');
  const pieChart = echarts.init(document.getElementById('statisticsPieChart'));
  const trendChart = echarts.init(document.getElementById('trendChart'));

  document.getElementById('username').textContent = currentUser.username || `用户#${currentUser.id}`;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  monthInput.value = getCurrentMonth();
  monthInput.addEventListener('change', loadStatistics);
  trendMonthsSelect.addEventListener('change', loadStatistics);
  window.addEventListener('resize', () => {
    pieChart.resize();
    trendChart.resize();
  });

  loadStatistics();

  async function loadStatistics() {
    const month = monthInput.value || getCurrentMonth();
    const months = Number(trendMonthsSelect.value || 6);

    const [summaryResult, trendResult] = await Promise.allSettled([
      getSummary(month),
      getTrend(months),
    ]);

    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
    const trend = trendResult.status === 'fulfilled' ? trendResult.value : { trend: [] };

    renderSummary(summary);
    renderPieChart(summary?.categoryStats || []);
    renderRanking(summary?.categoryStats || []);
    renderTrendChart(trend?.trend || []);

    const notices = [];
    if (summaryResult.status === 'rejected') {
      notices.push('月度汇总接口不可用，当前使用记录数据本地汇总。');
    }
    if (trendResult.status === 'rejected') {
      notices.push('趋势接口不可用，当前使用记录数据本地聚合趋势。');
    }
    showAlert(notices.join(' '), notices.length ? 'warning' : '');
  }

  async function getSummary(month) {
    try {
      return await api.get('/api/statistics/summary', {
        params: { userId: currentUser.id, month },
      });
    } catch (error) {
      const pageData = await api.get('/api/records', {
        params: { userId: currentUser.id, page: 1, size: 300, month },
      });
      return buildSummaryFromRecords(pageData.records || []);
    }
  }

  async function getTrend(months) {
    try {
      return await api.get('/api/statistics/trend', {
        params: { userId: currentUser.id, months },
      });
    } catch (error) {
      const pageData = await api.get('/api/records', {
        params: { userId: currentUser.id, page: 1, size: 500 },
      });
      return {
        trend: buildTrendFromRecords(pageData.records || [], months),
      };
    }
  }

  function buildSummaryFromRecords(records) {
    const categoryMap = new Map();
    const summary = records.reduce((acc, record) => {
      const amount = Number(record.amount || 0);
      if (record.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
        categoryMap.set(record.category || '未分类', (categoryMap.get(record.category || '未分类') || 0) + amount);
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

  function buildTrendFromRecords(records, months) {
    const now = new Date();
    const monthKeys = [];
    for (let index = months - 1; index >= 0; index -= 1) {
      const current = new Date(now.getFullYear(), now.getMonth() - index, 1);
      monthKeys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
    }

    const grouped = new Map(monthKeys.map((key) => [key, { month: key, income: 0, expense: 0 }]));

    records.forEach((record) => {
      const dateValue = record.recordDate || record.createTime;
      if (!dateValue) {
        return;
      }
      const monthKey = String(dateValue).slice(0, 7);
      if (!grouped.has(monthKey)) {
        return;
      }

      const item = grouped.get(monthKey);
      const amount = Number(record.amount || 0);
      if (record.type === 'income') {
        item.income += amount;
      } else {
        item.expense += amount;
      }
    });

    return monthKeys.map((key) => grouped.get(key));
  }

  function renderSummary(summary) {
    const income = Number(summary?.income || 0);
    const expense = Number(summary?.expense || 0);
    const balance = Number(summary?.balance ?? income - expense);

    document.getElementById('statisticsIncome').textContent = formatCurrency(income);
    document.getElementById('statisticsExpense').textContent = formatCurrency(expense);
    document.getElementById('statisticsBalance').textContent = formatCurrency(balance);
  }

  function renderPieChart(categoryStats) {
    const data = normalizeCategoryStats(categoryStats);
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: 0, top: 'center' },
      series: [
        {
          type: 'pie',
          radius: ['36%', '68%'],
          center: ['35%', '50%'],
          label: { formatter: '{b}: {d}%' },
          data: data.length ? data : [{ name: '暂无支出数据', value: 1 }],
        },
      ],
    });
  }

  function renderRanking(categoryStats) {
    const data = normalizeCategoryStats(categoryStats).sort((a, b) => b.value - a.value);
    if (!data.length) {
      rankingEl.innerHTML = '<div class="empty-state compact-empty"><p>当前月份暂无分类支出数据。</p></div>';
      return;
    }

    const maxValue = data[0].value || 1;
    rankingEl.innerHTML = data.slice(0, 6).map((item, index) => {
      const width = Math.max((item.value / maxValue) * 100, 10);
      return `
        <div class="ranking-item">
          <div class="ranking-meta">
            <span class="ranking-index">${index + 1}</span>
            <span class="ranking-name">${escapeHtml(item.name)}</span>
            <span class="ranking-value">${escapeHtml(formatCurrency(item.value))}</span>
          </div>
          <div class="ranking-bar-bg">
            <div class="ranking-bar-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTrendChart(trendData) {
    const normalized = Array.isArray(trendData) ? trendData : [];
    const labels = normalized.map((item) => item.month || item.label || '--');
    const incomeSeries = normalized.map((item) => Number(item.income || item.incomeAmount || 0));
    const expenseSeries = normalized.map((item) => Number(item.expense || item.expenseAmount || 0));

    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '支出'] },
      grid: { left: 48, right: 24, top: 48, bottom: 36 },
      xAxis: {
        type: 'category',
        data: labels,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '收入',
          type: 'line',
          smooth: true,
          data: incomeSeries,
          itemStyle: { color: '#10b981' },
          areaStyle: { color: 'rgba(16, 185, 129, 0.12)' },
        },
        {
          name: '支出',
          type: 'line',
          smooth: true,
          data: expenseSeries,
          itemStyle: { color: '#ef4444' },
          areaStyle: { color: 'rgba(239, 68, 68, 0.10)' },
        },
      ],
    });
  }

  function normalizeCategoryStats(categoryStats) {
    return Array.isArray(categoryStats)
      ? categoryStats.map((item) => ({
          name: item.name || item.category || '未分类',
          value: Number(item.value || item.amount || item.total || 0),
        }))
      : [];
  }

  function showAlert(message, type) {
    if (!message) {
      alertEl.className = 'alert';
      alertEl.textContent = '';
      return;
    }
    alertEl.className = `alert alert-${type} show`;
    alertEl.textContent = message;
  }
})();
