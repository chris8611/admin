# 部署到Cloudflare Pages指南

## 快速部署步骤

### 1. 准备Git仓库（推荐方式）

```bash
# 在admin文件夹中初始化Git仓库
cd admin
git init
git add .
git commit -m "Initial commit: Admin system"

# 推送到GitHub/GitLab等Git托管服务
git remote add origin <your-git-repo-url>
git push -u origin main
```

### 2. 在Cloudflare Pages中创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的账户
3. 点击左侧菜单中的 "Pages"
4. 点击 "创建项目" 或 "Create a project"
5. 选择 "连接到Git" 或 "Connect to Git"

### 3. 配置构建设置

在Cloudflare Pages的构建配置中设置：

- **项目名称**: `admin-system` (或你喜欢的名称)
- **生产分支**: `main`
- **构建命令**: `npm run build` (可选，因为是静态文件)
- **构建输出目录**: `./`
- **根目录**: `/` (如果整个仓库就是admin文件夹)

### 4. 环境变量配置（可选）

在Cloudflare Pages的设置中，可以添加环境变量：

- `API_BASE_URL`: 后端API地址 (默认: `https://backend.hackpro.tech`)

### 5. 自定义域名（可选）

部署完成后，你可以：
1. 使用Cloudflare提供的默认域名：`https://admin-system.pages.dev`
2. 或者绑定自定义域名

## 替代方案：直接上传文件

如果不想使用Git，可以直接上传文件：

1. 在Cloudflare Pages中选择 "上传资源"
2. 将admin文件夹中的所有文件打包成zip
3. 上传zip文件
4. Cloudflare会自动解压并部署

## 验证部署

部署完成后，访问你的Pages URL，应该能看到：
1. 自动重定向到管理系统界面
2. 侧边栏导航正常工作
3. 用户管理功能可以连接到后端API

## 故障排除

### 如果API连接失败
1. 检查后端Worker是否正常运行
2. 确认CORS设置正确
3. 检查API基础URL配置

### 如果页面无法访问
1. 检查构建日志
2. 确认所有文件都已上传
3. 检查index.html是否存在

## 更新部署

使用Git方式部署的项目会自动更新：
- 推送新代码到main分支
- Cloudflare Pages会自动重新构建和部署

直接上传方式需要手动重新上传文件。