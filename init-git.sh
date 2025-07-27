#!/bin/bash

# 管理系统Git初始化脚本
# 用于快速设置Git仓库并准备部署到Cloudflare Pages

echo "🚀 初始化管理系统Git仓库..."

# 检查是否已经是Git仓库
if [ -d ".git" ]; then
    echo "⚠️  当前目录已经是Git仓库"
    read -p "是否要重新初始化？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .git
        echo "🗑️  已删除现有Git仓库"
    else
        echo "❌ 取消操作"
        exit 1
    fi
fi

# 初始化Git仓库
git init
echo "✅ Git仓库初始化完成"

# 添加所有文件
git add .
echo "📁 已添加所有文件到暂存区"

# 创建初始提交
git commit -m "Initial commit: SpringBoot style admin system

- 添加管理系统主页面 (admin.html)
- 添加前端逻辑 (admin.js)
- 添加入口页面 (index.html)
- 添加项目配置 (package.json)
- 添加部署文档 (README.md, deploy.md)

功能特性:
- SpringBoot风格界面设计
- 响应式布局
- 用户管理CRUD操作
- 与Cloudflare Worker后端集成"

echo "✅ 初始提交完成"

echo ""
echo "🎉 Git仓库设置完成！"
echo ""
echo "下一步操作："
echo "1. 在GitHub/GitLab等平台创建新仓库"
echo "2. 添加远程仓库地址："
echo "   git remote add origin <your-repo-url>"
echo "3. 推送代码："
echo "   git push -u origin main"
echo "4. 在Cloudflare Pages中连接该仓库进行部署"
echo ""
echo "📖 详细部署说明请查看 deploy.md 文件"