(function () {
  var currentUser = window.financeApp.requireCurrentUser();
  if (!currentUser) return;

  var showToast = window.financeApp.showToast || alert;
  var currentPage = 1;
  var pageSize = 10;
  var totalRecords = 0;
  var currentFilters = {};

  // 初始化
  document.getElementById('username').textContent = currentUser.username || '用户#' + currentUser.id;
  document.getElementById('logoutBtn').addEventListener('click', window.financeApp.logout);
  document.getElementById('addRecordBtn').addEventListener('click', addRecord);
  document.getElementById('filterBtn').addEventListener('click', applyFilters);
  document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
  document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('saveEditBtn').addEventListener('click', saveEdit);

  // 设置默认日期
  document.getElementById('createTime').value = new Date().toISOString().slice(0, 10);
  document.getElementById('filterMonth').value = getCurrentMonth();

  // 加载记录
  loadRecords();

  function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  async function loadRecords() {
    var loading = document.getElementById('loading');
    var emptyState = document.getElementById('emptyState');
    var tbody = document.getElementById('recordTable');
    
    loading.style.display = 'flex';
    emptyState.style.display = 'none';
    tbody.innerHTML = '';

    try {
      var params = {
        userId: currentUser.id,
        page: currentPage,
        size: pageSize
      };
      
      if (currentFilters.month) params.month = currentFilters.month;
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.type) params.type = currentFilters.type;

      var result = await api.get('/api/records', { params: params });
      var records = result.records || result || [];
      totalRecords = result.total || records.length;

      if (records.length === 0) {
        emptyState.style.display = 'block';
      } else {
        records.forEach(function (item) {
          var tr = document.createElement('tr');
          var typeText = item.type === 'expense' ? '支出' : '收入';
          var typeClass = item.type === 'expense' ? 'expense' : 'income';
          tr.innerHTML =
            '<td><span class="tag-' + typeClass + '">' + escapeHtml(typeText) + '</span></td>' +
            '<td>' + escapeHtml(item.category) + '</td>' +
            '<td class="value ' + typeClass + '">¥' + formatNumber(item.amount || item.money || 0) + '</td>' +
            '<td>' + escapeHtml(item.recordDate || item.createTime || '--') + '</td>' +
            '<td>' + escapeHtml(item.note || '--') + '</td>' +
            '<td>' +
              '<button class="btn btn-sm btn-outline edit-btn" data-id="' + item.id + '">编辑</button> ' +
              '<button class="btn btn-sm btn-danger delete-btn" data-id="' + item.id + '">删除</button>' +
            '</td>';
          tbody.appendChild(tr);
        });

        // 绑定编辑和删除事件
        document.querySelectorAll('.edit-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            openEditModal(this.getAttribute('data-id'), records);
          });
        });
        document.querySelectorAll('.delete-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            deleteRecord(this.getAttribute('data-id'));
          });
        });
      }

      renderPagination();
    } catch (e) {
      showToast('加载失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      loading.style.display = 'none';
    }
  }

  function renderPagination() {
    var container = document.getElementById('pagination');
    var totalPages = Math.ceil(totalRecords / pageSize);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    var html = '<div class="pagination-info">共 ' + totalRecords + ' 条，第 ' + currentPage + '/' + totalPages + ' 页</div>';
    html += '<div class="pagination-controls">';
    html += '<button class="pagination-btn" data-page="1" ' + (currentPage === 1 ? 'disabled' : '') + '>首页</button>';
    html += '<button class="pagination-btn" data-page="' + (currentPage - 1) + '" ' + (currentPage === 1 ? 'disabled' : '') + '>上一页</button>';
    
    // 显示页码
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="pagination-btn ' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    
    html += '<button class="pagination-btn" data-page="' + (currentPage + 1) + '" ' + (currentPage === totalPages ? 'disabled' : '') + '>下一页</button>';
    html += '<button class="pagination-btn" data-page="' + totalPages + '" ' + (currentPage === totalPages ? 'disabled' : '') + '>末页</button>';
    html += '</div>';
    html += '<div class="pagination-size"><span>每页</span><select id="pageSizeSelect">';
    [10, 20, 50].forEach(function(size) {
      html += '<option value="' + size + '"' + (size === pageSize ? ' selected' : '') + '>' + size + '</option>';
    });
    html += '</select><span>条</span></div>';

    container.innerHTML = html;

    // 绑定事件
    container.querySelectorAll('.pagination-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = parseInt(this.getAttribute('data-page'));
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          loadRecords();
        }
      });
    });

    document.getElementById('pageSizeSelect').addEventListener('change', function() {
      pageSize = parseInt(this.value);
      currentPage = 1;
      loadRecords();
    });
  }

  async function addRecord() {
    var type = document.getElementById('type').value;
    var category = document.getElementById('category').value;
    var money = parseFloat(document.getElementById('money').value);
    var createTime = document.getElementById('createTime').value;
    var note = document.getElementById('note').value.trim();

    if (!money || money <= 0) {
      showToast('请输入有效金额', 'warning');
      return;
    }
    if (!createTime) {
      showToast('请选择日期', 'warning');
      return;
    }

    var btn = document.getElementById('addRecordBtn');
    btn.disabled = true;
    btn.textContent = '提交中...';

    try {
      await api.post('/api/records', {
        userId: currentUser.id,
        type: type,
        category: category,
        amount: money,
        recordDate: createTime,
        note: note
      });
      showToast('添加成功！', 'success');
      document.getElementById('money').value = '';
      document.getElementById('note').value = '';
      currentPage = 1;
      loadRecords();
    } catch (e) {
      showToast('添加失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '提交记录';
    }
  }

  function openEditModal(id, records) {
    var record = records.find(function(r) { return String(r.id) === String(id); });
    if (!record) return;

    document.getElementById('editRecordId').value = id;
    document.getElementById('editType').value = record.type || 'expense';
    document.getElementById('editCategory').value = record.category || '';
    document.getElementById('editMoney').value = record.amount || record.money || '';
    document.getElementById('editDate').value = record.recordDate || record.createTime || '';
    document.getElementById('editNote').value = record.note || '';

    document.getElementById('editModal').classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
  }

  async function saveEdit() {
    var id = document.getElementById('editRecordId').value;
    var type = document.getElementById('editType').value;
    var category = document.getElementById('editCategory').value;
    var money = parseFloat(document.getElementById('editMoney').value);
    var date = document.getElementById('editDate').value;
    var note = document.getElementById('editNote').value.trim();

    if (!money || money <= 0) {
      showToast('请输入有效金额', 'warning');
      return;
    }
    if (!date) {
      showToast('请选择日期', 'warning');
      return;
    }

    var btn = document.getElementById('saveEditBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      await api.put('/api/records/' + id, {
        type: type,
        category: category,
        amount: money,
        recordDate: date,
        note: note
      });
      showToast('修改成功！', 'success');
      closeEditModal();
      loadRecords();
    } catch (e) {
      showToast('修改失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存';
    }
  }

  async function deleteRecord(id) {
    if (!confirm('确定删除这条记录吗？')) return;
    
    try {
      await api.delete('/api/records/' + id);
      showToast('删除成功', 'success');
      loadRecords();
    } catch (e) {
      showToast('删除失败: ' + (e.message || '未知错误'), 'error');
    }
  }

  function applyFilters() {
    currentFilters = {
      month: document.getElementById('filterMonth').value,
      category: document.getElementById('filterCategory').value,
      type: document.getElementById('filterType').value
    };
    currentPage = 1;
    loadRecords();
  }

  function resetFilters() {
    document.getElementById('filterMonth').value = getCurrentMonth();
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterType').value = '';
    currentFilters = {};
    currentPage = 1;
    loadRecords();
  }

  async function exportCSV() {
    showToast('正在导出...', 'info');
    try {
      var params = { userId: currentUser.id, page: 1, size: 10000 };
      if (currentFilters.month) params.month = currentFilters.month;
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.type) params.type = currentFilters.type;

      var result = await api.get('/api/records', { params: params });
      var records = result.records || result || [];

      if (records.length === 0) {
        showToast('没有数据可导出', 'warning');
        return;
      }

      var csv = '\uFEFF日期,类型,分类,金额,备注\n';
      records.forEach(function(r) {
        csv += escapeCSV(r.recordDate || r.createTime) + ',' +
               escapeCSV(r.type === 'expense' ? '支出' : '收入') + ',' +
               escapeCSV(r.category) + ',' +
               (r.amount || r.money || 0) + ',' +
               escapeCSV(r.note || '') + '\n';
      });

      downloadFile(csv, 'records_' + getCurrentMonth() + '.csv', 'text/csv;charset=utf-8');
      showToast('导出成功', 'success');
    } catch (e) {
      showToast('导出失败: ' + (e.message || '未知错误'), 'error');
    }
  }

  async function exportExcel() {
    showToast('正在导出...', 'info');
    try {
      var params = { userId: currentUser.id, page: 1, size: 10000 };
      if (currentFilters.month) params.month = currentFilters.month;
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.type) params.type = currentFilters.type;

      var result = await api.get('/api/records', { params: params });
      var records = result.records || result || [];

      if (records.length === 0) {
        showToast('没有数据可导出', 'warning');
        return;
      }

      var html = '<html><head><meta charset="UTF-8"></head><body>';
      html += '<table border="1"><tr><th>日期</th><th>类型</th><th>分类</th><th>金额</th><th>备注</th></tr>';
      records.forEach(function(r) {
        html += '<tr>' +
          '<td>' + escapeHtml(r.recordDate || r.createTime) + '</td>' +
          '<td>' + (r.type === 'expense' ? '支出' : '收入') + '</td>' +
          '<td>' + escapeHtml(r.category) + '</td>' +
          '<td>' + (r.amount || r.money || 0) + '</td>' +
          '<td>' + escapeHtml(r.note || '') + '</td>' +
          '</tr>';
      });
      html += '</table></body></html>';

      downloadFile(html, 'records_' + getCurrentMonth() + '.xls', 'application/vnd.ms-excel');
      showToast('导出成功', 'success');
    } catch (e) {
      showToast('导出失败: ' + (e.message || '未知错误'), 'error');
    }
  }

  function escapeCSV(value) {
    if (!value) return '';
    value = String(value);
    if (value.indexOf(',') !== -1 || value.indexOf('"') !== -1 || value.indexOf('\n') !== -1) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  function downloadFile(content, filename, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return window.financeApp.escapeHtml(value);
  }

  function formatNumber(value) {
    return Number(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
})();
