(function () {
  var currentUser = window.financeApp.requireCurrentUser();
  if (!currentUser) return;

  document.getElementById('username').textContent = currentUser.username || '用户#' + currentUser.id;
  document.getElementById('logoutBtn').addEventListener('click', window.financeApp.logout);
  document.getElementById('addRecordBtn').addEventListener('click', addRecordFunc);

  document.getElementById('createTime').value = new Date().toISOString().slice(0, 10);
  getRecordList();

  async function getRecordList() {
    try {
      var pageData = await api.get('/api/records', { params: { userId: currentUser.id } });
      var list = pageData.records || [];
      var tbody = document.getElementById('recordTable');
      tbody.innerHTML = '';
      list.forEach(function (item) {
        var typeText = item.type === 'expense' ? '支出' : '收入';
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + window.financeApp.escapeHtml(typeText) + '</td>' +
          '<td>' + window.financeApp.escapeHtml(item.category) + '</td>' +
          '<td>' + window.financeApp.escapeHtml(item.amount || item.money || 0) + '</td>' +
          '<td>' + window.financeApp.escapeHtml(item.recordDate || item.createTime || '--') + '</td>' +
          '<td><button class="btn btn-danger" data-id="' + Number(item.id) + '">删除</button></td>';
        tr.querySelector('button').addEventListener('click', function () {
          deleteRecord(Number(this.getAttribute('data-id')));
        });
        tbody.appendChild(tr);
      });
    } catch (e) {
      alert('加载失败');
    }
  }

  async function addRecordFunc() {
    var type = document.getElementById('type').value;
    var category = document.getElementById('category').value;
    var money = Number(document.getElementById('money').value);
    var createTime = document.getElementById('createTime').value;
    if (!money || !createTime) { alert('请填写完整'); return; }
    try {
      await api.post('/api/records', { userId: currentUser.id, type: type, category: category, amount: money, recordDate: createTime });
      alert('添加成功！');
      document.getElementById('money').value = '';
      getRecordList();
    } catch (e) { alert('添加失败'); }
  }

  async function deleteRecord(id) {
    if (!confirm('确定删除？')) return;
    try {
      await api.delete('/api/records/' + id);
      alert('删除成功');
      getRecordList();
    } catch (e) { alert('删除失败'); }
  }
})();
