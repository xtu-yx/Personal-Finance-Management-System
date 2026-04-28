const baseURL = "http://localhost:8080";

const instance = axios.create({
  baseURL: baseURL,
  timeout: 5000
});

instance.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers["token"] = token;
  }
  return config;
});

instance.interceptors.response.use(res => {
  return res.data;
}, err => {
  alert("请求失败：" + err.message);
  return Promise.reject(err);
});

export function register(data) {
  return instance.post("/user/register", data);
}

export function login(data) {
  return instance.post("/user/login", data);
}

export function addRecord(data) {
  return instance.post("/record/add", data);
}

export function getRecordList(params) {
  return instance.get("/record/list", { params });
}

export function deleteRecord(id) {
  return instance.delete(`/record/delete/${id}`);
}

export function setBudget(data) {
  return instance.post("/budget/set", data);
}

export function getBudget() {
  return instance.get("/budget/info");
}

export function getStatistics() {
  return instance.get("/record/statistics");
}