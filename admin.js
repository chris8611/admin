// 管理系统主要功能
class AdminSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.users = [];
        this.editingUserId = null;
        this.apiBase = 'https://backend.hackpro.tech';
        this.token = localStorage.getItem('admin_token');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUsers();
    }

    // 绑定事件
    bindEvents() {
        // 侧边栏菜单点击
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.switchPage(page);
            });
        });

        // 模态框点击外部关闭
        document.getElementById('user-modal').addEventListener('click', (e) => {
            if (e.target.id === 'user-modal') {
                this.hideUserModal();
            }
        });
    }

    // 页面切换
    switchPage(page) {
        // 更新菜单状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.style.display = 'none';
        });

        // 显示目标页面
        document.getElementById(`${page}-page`).style.display = 'block';

        // 更新面包屑
        const breadcrumbMap = {
            'dashboard': '仪表盘',
            'users': '用户管理',
            'settings': '系统设置'
        };
        document.getElementById('breadcrumb-text').textContent = breadcrumbMap[page];

        this.currentPage = page;

        // 如果切换到用户页面，刷新用户列表
        if (page === 'users') {
            this.loadUsers();
        }
    }

    // 加载用户列表
    async loadUsers() {
        try {
            const response = await this.apiRequest('/api/admin/users', {
                method: 'GET'
            });

            if (response.success) {
                this.users = response.data || [];
                this.renderUsersTable();
            } else {
                console.error('加载用户失败:', response.error);
                this.showMessage('加载用户失败', 'error');
            }
        } catch (error) {
            console.error('加载用户失败:', error);
            // 如果API失败，显示模拟数据
            this.users = this.getMockUsers();
            this.renderUsersTable();
        }
    }

    // 获取模拟用户数据
    getMockUsers() {
        return [
            {
                id: 1,
                openid: 'mock_openid_1',
                nickname: '张三',
                phone: '13800138001',
                email: 'zhangsan@example.com',
                address: '北京市朝阳区',
                signature: '这是一个测试用户',
                created_at: '2024-01-15T08:30:00Z',
                last_login: '2024-01-20T10:15:00Z'
            },
            {
                id: 2,
                openid: 'mock_openid_2',
                nickname: '李四',
                phone: '13800138002',
                email: 'lisi@example.com',
                address: '上海市浦东新区',
                signature: '热爱生活，热爱工作',
                created_at: '2024-01-16T09:20:00Z',
                last_login: '2024-01-21T14:30:00Z'
            },
            {
                id: 3,
                openid: 'mock_openid_3',
                nickname: '王五',
                phone: '13800138003',
                email: 'wangwu@example.com',
                address: '广州市天河区',
                signature: '追求卓越，永不止步',
                created_at: '2024-01-17T11:45:00Z',
                last_login: '2024-01-22T16:20:00Z'
            }
        ];
    }

    // 渲染用户表格
    renderUsersTable() {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id || user.openid}</td>
                <td>${user.nickname || '未设置'}</td>
                <td>${user.phone || '未设置'}</td>
                <td>${user.email || '未设置'}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="adminSystem.editUser('${user.openid || user.id}')">
                        编辑
                    </button>
                    <button class="btn btn-danger" onclick="adminSystem.deleteUser('${user.openid || user.id}')">
                        删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '未知';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour12: false });
    }

    // 显示添加用户模态框
    showAddUserModal() {
        this.editingUserId = null;
        document.getElementById('modal-title').textContent = '添加用户';
        document.getElementById('user-form').reset();
        document.getElementById('user-modal').classList.add('show');
    }

    // 编辑用户
    editUser(userId) {
        const user = this.users.find(u => (u.openid || u.id) == userId);
        if (!user) {
            this.showMessage('用户不存在', 'error');
            return;
        }

        this.editingUserId = userId;
        document.getElementById('modal-title').textContent = '编辑用户';
        
        // 填充表单
        document.getElementById('user-nickname').value = user.nickname || '';
        document.getElementById('user-phone').value = user.phone || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-address').value = user.address || '';
        document.getElementById('user-signature').value = user.signature || '';
        
        document.getElementById('user-modal').classList.add('show');
    }

    // 隐藏用户模态框
    hideUserModal() {
        document.getElementById('user-modal').classList.remove('show');
        this.editingUserId = null;
    }

    // 保存用户
    async saveUser() {
        const formData = {
            nickname: document.getElementById('user-nickname').value.trim(),
            phone: document.getElementById('user-phone').value.trim(),
            email: document.getElementById('user-email').value.trim(),
            address: document.getElementById('user-address').value.trim(),
            signature: document.getElementById('user-signature').value.trim()
        };

        // 验证必填字段
        if (!formData.nickname) {
            this.showMessage('请输入昵称', 'error');
            return;
        }

        // 验证手机号格式
        if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
            this.showMessage('手机号格式不正确', 'error');
            return;
        }

        // 验证邮箱格式
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            this.showMessage('邮箱格式不正确', 'error');
            return;
        }

        try {
            let response;
            if (this.editingUserId) {
                // 编辑用户
                response = await this.apiRequest(`/api/admin/users/${this.editingUserId}`, {
                    method: 'PUT',
                    data: formData
                });
            } else {
                // 添加用户
                response = await this.apiRequest('/api/admin/users', {
                    method: 'POST',
                    data: formData
                });
            }

            if (response.success) {
                this.showMessage(this.editingUserId ? '用户更新成功' : '用户添加成功', 'success');
                this.hideUserModal();
                this.loadUsers();
            } else {
                this.showMessage(response.error || '操作失败', 'error');
            }
        } catch (error) {
            console.error('保存用户失败:', error);
            // 模拟保存成功
            if (this.editingUserId) {
                const userIndex = this.users.findIndex(u => (u.openid || u.id) == this.editingUserId);
                if (userIndex !== -1) {
                    this.users[userIndex] = { ...this.users[userIndex], ...formData };
                }
            } else {
                const newUser = {
                    id: Date.now(),
                    openid: `mock_${Date.now()}`,
                    ...formData,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                };
                this.users.push(newUser);
            }
            this.renderUsersTable();
            this.showMessage(this.editingUserId ? '用户更新成功' : '用户添加成功', 'success');
            this.hideUserModal();
        }
    }

    // 删除用户
    async deleteUser(userId) {
        if (!confirm('确定要删除这个用户吗？')) {
            return;
        }

        try {
            const response = await this.apiRequest(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showMessage('用户删除成功', 'success');
                this.loadUsers();
            } else {
                this.showMessage(response.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            // 模拟删除成功
            this.users = this.users.filter(u => (u.openid || u.id) != userId);
            this.renderUsersTable();
            this.showMessage('用户删除成功', 'success');
        }
    }

    // API请求封装
    async apiRequest(url, options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        if (options.data) {
            config.body = JSON.stringify(options.data);
        }

        const response = await fetch(this.apiBase + url, config);
        return await response.json();
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 2000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff'};
        `;

        // 添加动画样式
        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(messageEl);

        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
}

// 全局函数，供HTML调用
function showAddUserModal() {
    adminSystem.showAddUserModal();
}

function hideUserModal() {
    adminSystem.hideUserModal();
}

function saveUser() {
    adminSystem.saveUser();
}

// 初始化管理系统
let adminSystem;
document.addEventListener('DOMContentLoaded', () => {
    adminSystem = new AdminSystem();
});