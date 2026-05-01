const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const CURRENT_USER_KEY = 'finance.currentUser';

function saveCurrentUser(user) {
  if (!user || !user.id) {
    return;
  }
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getCurrentUser() {
  const raw = sessionStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

function clearCurrentUser() {
  sessionStorage.removeItem(CURRENT_USER_KEY);
}

function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user || !user.id) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function logout() {
  clearCurrentUser();
  window.location.href = 'index.html';
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 200) {
      return res.data;
    }
    throw new Error(res.message || '请求失败');
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      clearCurrentUser();
      window.location.href = 'index.html';
    }
    throw new Error(error.response?.data?.message || '网络错误');
  }
);

window.financeApp = {
  saveCurrentUser,
  getCurrentUser,
  clearCurrentUser,
  requireCurrentUser,
  logout,
  getCurrentMonth,
  formatCurrency,
  formatDate,
  escapeHtml,
};
