const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      window.location.href = 'index.html';
    }
    throw new Error(error.response?.data?.message || '网络错误');
  }
);
