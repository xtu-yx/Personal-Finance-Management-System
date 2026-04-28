# Personal Finance Management — Frontend

前端静态页面，基于 HTML5 + CSS3 + Vanilla JavaScript + ECharts + Axios 构建。

## 开发说明

- 后端先启动：在 `backend/finance/` 下执行 `mvn spring-boot:run`
- 前端直接浏览器打开各 HTML 文件即可（或任意静态服务器）
- 后端运行在 `http://localhost:8080`，CORS 已由后端 `CorsConfig.java` 开启
- Axios 配置 `withCredentials: true`，登录态由后端 Session 管理

## 页面清单

| 页面 | 文件 | 依赖 API | 功能 |
|------|------|----------|------|
| 登录 | `index.html` | `POST /api/user/login` | 表单校验 → 跳转仪表盘 |
| 注册 | `register.html` | `POST /api/user/register` | 表单校验 → 跳转登录 |
| 仪表盘 | `dashboard.html` | `GET /api/statistics/summary`, `/api/records`, `/api/budget` | 月度汇总 + 近期账单 + 预算进度 |
| 记账 | `records.html` | CRUD `/api/records` | 添加/编辑/删除/分页查询收支记录 |
| 统计 | `statistics.html` | `GET /api/statistics/summary`, `/api/statistics/trend` | ECharts 饼图 + 折线图 |
| 预算 | `budget.html` | `POST/GET /api/budget` | 按分类设置月度预算 + 进度展示 |

## 目录结构

```
web/
├── index.html              # 登录页
├── register.html           # 注册页
├── dashboard.html          # 仪表盘
├── records.html            # 记账页
├── statistics.html         # 统计分析
├── budget.html             # 预算管理
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── axios-config.js     # Axios 统一配置（baseURL + withCredentials + 响应拦截）
│   ├── login.js
│   ├── register.js
│   ├── records.js
│   ├── statistics.js
│   └── budget.js
└── assets/
```

## API 响应格式

后端统一返回 `Result<T>`，Axios 拦截器解包后业务代码直接使用 `data` 字段。

```json
// 成功
{ "code": 200, "message": "操作成功", "data": ... }
// 失败
{ "code": 500, "message": "错误信息", "data": null }
```

## 开发顺序

1. **基础设施**：`axios-config.js` + `style.css`
2. **用户模块**：`index.html` + `register.html`（含对应 JS）
3. **核心记账**：`records.html`
4. **仪表盘**：`dashboard.html`
5. **统计分析**：`statistics.html`
6. **预算管理**：`budget.html`

## 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 样式 |
| JavaScript | 业务逻辑 + DOM 操作 |
| ECharts (CDN) | 数据可视化 |
| Axios (CDN) | HTTP 请求 |
| Session/Cookie | 登录态保持 |
