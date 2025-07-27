# 管理系统前端

这是一个基于SpringBoot风格的管理系统前端，用于管理用户信息。

## 功能特性

- 🎨 现代化的SpringBoot风格界面设计
- 📱 响应式布局，支持移动端
- 👥 完整的用户管理功能（增删改查）
- 🔒 表单验证和错误处理
- 🚀 基于Cloudflare Worker后端API

## 部署到Cloudflare Pages

### 方法一：通过Git仓库部署

1. 将此文件夹推送到Git仓库
2. 登录Cloudflare Dashboard
3. 进入Pages页面
4. 点击"创建项目"
5. 连接Git仓库
6. 设置构建配置：
   - 构建命令：`npm run build`
   - 构建输出目录：`./`
   - 根目录：`/admin`

### 方法二：直接上传文件

1. 登录Cloudflare Dashboard
2. 进入Pages页面
3. 点击"上传资源"
4. 上传此文件夹中的所有文件

## 本地开发

```bash
# 启动本地服务器
npm run dev

# 或者直接使用Python
python3 -m http.server 8080
```

然后访问 http://localhost:8080

## 文件结构

```
admin/
├── index.html          # 入口页面（重定向到admin.html）
├── admin.html          # 主管理页面
├── admin.js           # 前端逻辑
├── package.json       # 项目配置
└── README.md          # 说明文档
```

## 后端API

确保后端Worker已部署并配置正确的API端点：

- `GET /api/admin/users` - 获取用户列表
- `POST /api/admin/users` - 创建用户
- `PUT /api/admin/users/{id}` - 更新用户
- `DELETE /api/admin/users/{id}` - 删除用户

## 环境变量

在Cloudflare Pages中可以设置以下环境变量：

- `API_BASE_URL` - 后端API基础URL（可选，默认使用相对路径）