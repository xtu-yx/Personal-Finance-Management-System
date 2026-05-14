(function () {
  var currentUser = window.financeApp.requireCurrentUser();
  if (!currentUser) return;

  var showToast = window.financeApp.showToast || alert;

  // 默认分类
  var defaultCategories = {
    expense: ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '日用'],
    income: ['工资', '奖金', '兼职', '投资', '理财', '红包']
  };

  // 初始化
  document.getElementById('username').textContent = currentUser.username || '用户#' + currentUser.id;
  document.getElementById('logoutBtn').addEventListener('click', window.financeApp.logout);
  document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('saveEditBtn').addEventListener('click', saveEdit);

  // 加载分类
  loadCategories();

  async function loadCategories() {
    try {
      var result = await api.get('/api/categories', { params: { userId: currentUser.id } });
      var categories = result || [];
      
      // 如果没有分类，使用默认分类
      if (categories.length === 0) {
        renderDefaultCategories();
        return;
      }

      var expenseCategories = categories.filter(function(c) { return c.type === 'expense'; });
      var incomeCategories = categories.filter(function(c) { return c.type === 'income'; });

      renderCategoryList('expenseCategoryList', expenseCategories, 'expense');
      renderCategoryList('incomeCategoryList', incomeCategories, 'income');

      document.getElementById('expenseCount').textContent = expenseCategories.length + ' 个';
      document.getElementById('incomeCount').textContent = incomeCategories.length + ' 个';
    } catch (e) {
      // 如果API不可用，使用默认分类
      renderDefaultCategories();
    }
  }

  function renderDefaultCategories() {
    var expenseList = defaultCategories.expense.map(function(name, index) {
      return { id: 'default-expense-' + index, name: name, type: 'expense' };
    });
    var incomeList = defaultCategories.income.map(function(name, index) {
      return { id: 'default-income-' + index, name: name, type: 'income' };
    });

    renderCategoryList('expenseCategoryList', expenseList, 'expense');
    renderCategoryList('incomeCategoryList', incomeList, 'income');

    document.getElementById('expenseCount').textContent = expenseList.length + ' 个';
    document.getElementById('incomeCount').textContent = incomeList.length + ' 个';
  }

  function renderCategoryList(containerId, categories, type) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';

    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无分类</p></div>';
      return;
    }

    categories.forEach(function(category) {
      var item = document.createElement('div');
      item.className = 'category-item';
      item.innerHTML = 
        '<span class="category-name">' + escapeHtml(category.name) + '</span>' +
        '<div class="category-actions">' +
          '<button class="btn btn-sm btn-outline edit-btn" data-id="' + category.id + '" data-name="' + escapeHtml(category.name) + '">编辑</button>' +
          '<button class="btn btn-sm btn-danger delete-btn" data-id="' + category.id + '">删除</button>' +
        '</div>';
      container.appendChild(item);
    });

    // 绑定事件
    container.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openEditModal(this.getAttribute('data-id'), this.getAttribute('data-name'));
      });
    });
    container.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteCategory(this.getAttribute('data-id'));
      });
    });
  }

  async function addCategory() {
    var name = document.getElementById('newCategoryName').value.trim();
    var type = document.getElementById('newCategoryType').value;

    if (!name) {
      showToast('请输入分类名称', 'warning');
      return;
    }

    if (name.length > 20) {
      showToast('分类名称不能超过20个字符', 'warning');
      return;
    }

    var btn = document.getElementById('addCategoryBtn');
    btn.disabled = true;
    btn.textContent = '添加中...';

    try {
      await api.post('/api/categories', {
        userId: currentUser.id,
        name: name,
        type: type
      });
      showToast('添加成功！', 'success');
      document.getElementById('newCategoryName').value = '';
      loadCategories();
    } catch (e) {
      showToast('添加失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '添加分类';
    }
  }

  function openEditModal(id, name) {
    document.getElementById('editCategoryId').value = id;
    document.getElementById('editCategoryName').value = name;
    document.getElementById('editCategoryModal').classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('editCategoryModal').classList.remove('active');
  }

  async function saveEdit() {
    var id = document.getElementById('editCategoryId').value;
    var name = document.getElementById('editCategoryName').value.trim();

    if (!name) {
      showToast('请输入分类名称', 'warning');
      return;
    }

    var btn = document.getElementById('saveEditBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      await api.put('/api/categories/' + id, { name: name });
      showToast('修改成功！', 'success');
      closeEditModal();
      loadCategories();
    } catch (e) {
      showToast('修改失败: ' + (e.message || '未知错误'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存';
    }
  }

  async function deleteCategory(id) {
    if (!confirm('确定删除这个分类吗？')) return;

    try {
      await api.delete('/api/categories/' + id);
      showToast('删除成功', 'success');
      loadCategories();
    } catch (e) {
      showToast('删除失败: ' + (e.message || '未知错误'), 'error');
    }
  }

  function escapeHtml(value) {
    return window.financeApp.escapeHtml(value);
  }
})();
