// 登录功能
class LoginManager {
    constructor() {
        this.isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
        this.init();
    }

    init() {
        if (this.isLoggedIn) {
            this.showAdminPanel();
        } else {
            this.showLoginPage();
        }
        this.bindLoginEvents();
    }

    bindLoginEvents() {
        // 登录事件绑定已移至主初始化函数中
        console.log('bindLoginEvents 被调用，但事件绑定已在主初始化中完成');
    }

    async handleLogin() {
        console.log('开始处理登录请求...');
        
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const errorEl = document.getElementById('login-error');
        
        if (!usernameEl || !passwordEl || !errorEl) {
            console.error('登录表单元素未找到:', {
                username: !!usernameEl,
                password: !!passwordEl,
                error: !!errorEl
            });
            alert('页面加载异常，请刷新页面重试');
            return;
        }
        
        const username = usernameEl.value.trim();
        const password = passwordEl.value.trim();
        
        console.log('登录信息:', { username, passwordLength: password.length });

        // 清除之前的错误信息
        errorEl.style.display = 'none';

        if (!username || !password) {
            this.showLoginError('请输入用户名和密码');
            return;
        }

        // 验证用户名和密码
        if (username === 'demo' && password === 'demo') {
            console.log('登录验证成功，开始切换界面...');
            
            // 登录成功
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_username', username);
            this.isLoggedIn = true;
            
            try {
                this.showAdminPanel();
                console.log('界面切换完成');
                
                // 初始化管理系统
                if (window.adminSystem) {
                    window.adminSystem.loadUsers();
                    window.adminSystem.updateSystemInfo();
                    console.log('管理系统初始化完成');
                } else {
                    console.warn('adminSystem 未找到');
                }
            } catch (error) {
                console.error('登录后初始化失败:', error);
                this.showLoginError('登录后初始化失败，请刷新页面重试');
            }
        } else {
            console.log('登录验证失败');
            this.showLoginError('用户名或密码错误');
        }
    }

    showLoginError(message) {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    showLoginPage() {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('admin-container').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-container').style.display = 'flex';
    }

    logout() {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_username');
        this.isLoggedIn = false;
        this.showLoginPage();
        
        // 清空表单
        document.getElementById('login-form').reset();
        document.getElementById('login-error').style.display = 'none';
        
        // 更新系统信息
        if (window.adminSystem) {
            window.adminSystem.updateSystemInfo();
        }
    }
}

// 管理系统主要功能
class AdminSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.users = [];
        this.editingUserId = null;
        // 根据当前域名动态设置API基础URL
        const currentHost = window.location.hostname;
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            // 本地开发环境
            this.apiBase = 'https://backend.hackpro.tech';
        } else if (currentHost.includes('github.io') || currentHost.includes('pages.dev')) {
            // GitHub Pages 或其他默认Pages域名
            this.apiBase = 'https://backend.hackpro.tech';
        } else {
            // 自定义域名，使用相对路径或同域API
            this.apiBase = window.location.origin + '/api';
        }
        this.token = localStorage.getItem('admin_token');
        
        this.init();
    }

    init() {
        this.bindEvents();
        // 只有在已登录状态下才加载用户数据
        if (window.loginManager && window.loginManager.isLoggedIn) {
            this.loadUsers();
        }
        // 初始化系统信息
        setTimeout(() => this.updateSystemInfo(), 100);
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
            'operations': '操作记录',
            'settings': '系统设置'
        };
        document.getElementById('breadcrumb-text').textContent = breadcrumbMap[page];

        this.currentPage = page;

        // 如果切换到用户页面，刷新用户列表
        if (page === 'users') {
            this.loadUsers();
        }
        
        // 如果切换到操作记录页面，加载操作记录
        if (page === 'operations') {
            this.loadOperations();
        }
        
        // 如果切换到设置页面，更新系统信息
        if (page === 'settings') {
            this.updateSystemInfo();
        }
    }

    // 加载用户列表
    async loadUsers() {
        console.log('开始加载用户列表...');
        
        try {
            const response = await this.apiRequest('/api/admin/users', {
                method: 'GET'
            });

            if (response.success) {
                this.users = response.data || [];
                console.log(`成功加载 ${this.users.length} 个用户`);
                this.renderUsersTable();
                this.showMessage(`成功加载 ${this.users.length} 个用户`, 'success');
            } else {
                console.error('加载用户失败:', response.error);
                this.showMessage(`加载用户失败: ${response.error}`, 'error');
                // 只有在API返回错误时才显示空列表
                this.users = [];
                this.renderUsersTable();
            }
        } catch (error) {
            console.error('加载用户失败:', error);
            this.showMessage(`加载用户失败: ${error.message}`, 'error');
            this.users = [];
            this.renderUsersTable();
        }
    }



    // 渲染用户表格
    renderUsersTable() {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            const avatarHtml = user.avatar ? 
                `<img src="${user.avatar}" alt="头像" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : 
                `<div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">无</div>`;
            
            row.innerHTML = `
                <td>${user.id || user.openid}</td>
                <td>${avatarHtml}</td>
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
        document.getElementById('user-avatar').value = user.avatar || '';
        
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
            signature: document.getElementById('user-signature').value.trim(),
            avatar: document.getElementById('user-avatar').value.trim()
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
            this.showMessage(`保存用户失败: ${error.message}`, 'error');
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
            this.showMessage(`删除用户失败: ${error.message}`, 'error');
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

        const fullUrl = this.apiBase + url;
        console.log(`发起API请求: ${options.method || 'GET'} ${fullUrl}`);

        try {
            const response = await fetch(fullUrl, config);
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API响应数据:', data);
            return data;
        } catch (error) {
            console.error(`API请求失败 (${fullUrl}):`, error.message);
            throw error;
        }
    }



    // 加载操作记录
    async loadOperations() {
        const loadingEl = document.getElementById('operations-loading');
        const errorEl = document.getElementById('operations-error');
        const tableEl = document.getElementById('operations-table');
        const emptyEl = document.getElementById('operations-empty');
        
        // 显示加载状态
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        tableEl.style.display = 'none';
        emptyEl.style.display = 'none';
        
        try {
            const response = await this.apiRequest('/api/operations', {
                method: 'GET'
            });
            
            loadingEl.style.display = 'none';
            
            if (response.success && response.data) {
                if (response.data.length > 0) {
                    this.renderOperationsTable(response.data);
                    tableEl.style.display = 'table';
                } else {
                    emptyEl.style.display = 'block';
                }
            } else {
                errorEl.style.display = 'block';
                console.error('加载操作记录失败:', response.error);
            }
        } catch (error) {
            console.error('加载操作记录失败:', error);
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
        }
    }
    
    // 渲染操作记录表格
    renderOperationsTable(operations) {
        const tbody = document.getElementById('operations-tbody');
        tbody.innerHTML = '';
        
        operations.forEach(operation => {
            const row = document.createElement('tr');
            
            // 操作类型显示
            const typeMap = {
                'open': '开门',
                'close': '关门',
                'pause': '暂停',
                'stop': '停止'
            };
            const typeText = typeMap[operation.type] || operation.type;
            
            // 状态显示
            const statusText = operation.success ? '成功' : '失败';
            const statusClass = operation.success ? 'success' : 'error';
            
            // 用户代理简化显示
            const userAgent = operation.userAgent || '';
            const shortUserAgent = userAgent.length > 30 ? userAgent.substring(0, 30) + '...' : userAgent;
            
            row.innerHTML = `
                <td><span class="operation-type">${typeText}</span></td>
                <td>${operation.deviceId || 'N/A'}</td>
                <td>${this.formatDate(operation.time)}</td>
                <td><span class="status-${statusClass}">${statusText}</span></td>
                <td title="${userAgent}">${shortUserAgent}</td>
                <td>${this.formatDate(operation.created_at)}</td>
            `;
            tbody.appendChild(row);
        });
        
        // 添加状态样式
        if (!document.querySelector('#operation-styles')) {
            const style = document.createElement('style');
            style.id = 'operation-styles';
            style.textContent = `
                .operation-type {
                    padding: 4px 8px;
                    border-radius: 4px;
                    background: #e6f7ff;
                    color: #1890ff;
                    font-size: 12px;
                }
                .status-success {
                    color: #52c41a;
                    font-weight: 500;
                }
                .status-error {
                    color: #ff4d4f;
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 刷新操作记录
    refreshOperations() {
        this.loadOperations();
    }

    // 更新系统信息显示
    updateSystemInfo() {
        const hostname = window.location.hostname;
        const currentMode = this.getCurrentMode();
        const loginStatus = window.loginManager && window.loginManager.isLoggedIn ? '已登录' : '未登录';
        
        document.getElementById('current-hostname').textContent = hostname;
        document.getElementById('current-api-base').textContent = this.apiBase;
        document.getElementById('current-mode').textContent = currentMode;
        document.getElementById('login-status').textContent = loginStatus;
    }
    
    // 获取当前运行模式
    getCurrentMode() {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return '本地开发';
        } else if (hostname.includes('github.io') || hostname.includes('pages.dev')) {
            return 'Pages默认域名';
        } else {
            return '自定义域名';
        }
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
    if (adminSystem) adminSystem.showAddUserModal();
}

function hideUserModal() {
    if (adminSystem) adminSystem.hideUserModal();
}

function saveUser() {
    if (adminSystem) adminSystem.saveUser();
}

function refreshOperations() {
    if (adminSystem) adminSystem.refreshOperations();
}

function logout() {
    if (loginManager) loginManager.logout();
}

// 诊断工具函数
function runDiagnostics() {
    const resultsEl = document.getElementById('diagnostic-results');
    resultsEl.style.display = 'block';
    
    const results = [];
    
    // 检查基本环境
    results.push(`<strong>环境检查:</strong>`);
    results.push(`- 当前URL: ${window.location.href}`);
    results.push(`- 用户代理: ${navigator.userAgent}`);
    results.push(`- 本地存储支持: ${typeof(Storage) !== "undefined" ? '✓' : '✗'}`);
    
    // 检查关键DOM元素
    results.push(`<br><strong>DOM元素检查:</strong>`);
    const elements = {
        'username': document.getElementById('username'),
        'password': document.getElementById('password'),
        'login-error': document.getElementById('login-error'),
        'login-container': document.getElementById('login-container'),
        'admin-container': document.getElementById('admin-container')
    };
    
    for (const [name, el] of Object.entries(elements)) {
        results.push(`- ${name}: ${el ? '✓' : '✗'}`);
    }
    
    // 检查JavaScript对象
    results.push(`<br><strong>JavaScript对象检查:</strong>`);
    results.push(`- window.loginManager: ${window.loginManager ? '✓' : '✗'}`);
    results.push(`- window.adminSystem: ${window.adminSystem ? '✓' : '✗'}`);
    
    // 检查登录状态
    results.push(`<br><strong>登录状态:</strong>`);
    results.push(`- 本地存储登录状态: ${localStorage.getItem('admin_logged_in') || '未设置'}`);
    results.push(`- LoginManager状态: ${window.loginManager ? window.loginManager.isLoggedIn : '未知'}`);
    
    resultsEl.innerHTML = results.join('<br>');
}

function testLogin() {
    const resultsEl = document.getElementById('diagnostic-results');
    resultsEl.style.display = 'block';
    
    try {
        // 设置测试凭据
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        
        if (usernameEl && passwordEl) {
            usernameEl.value = 'demo';
            passwordEl.value = 'demo';
            
            resultsEl.innerHTML = '正在测试登录功能...<br>';
            
            // 触发登录
            if (window.loginManager) {
                window.loginManager.handleLogin().then(() => {
                    resultsEl.innerHTML += '登录测试完成，请检查控制台日志。';
                }).catch(error => {
                    resultsEl.innerHTML += `登录测试失败: ${error.message}`;
                });
            } else {
                resultsEl.innerHTML += 'LoginManager未找到，无法执行测试。';
            }
        } else {
            resultsEl.innerHTML = '登录表单元素未找到，无法执行测试。';
        }
    } catch (error) {
        resultsEl.innerHTML = `测试过程中发生错误: ${error.message}`;
    }
}

function clearStorage() {
    localStorage.clear();
    sessionStorage.clear();
    alert('本地存储已清除，页面将刷新。');
    window.location.reload();
}

function testApiConnection() {
    const resultsEl = document.getElementById('diagnostic-results');
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = '正在测试API连接...<br>';
    
    if (!window.adminSystem) {
        resultsEl.innerHTML += '错误：AdminSystem未初始化<br>';
        return;
    }
    
    const apiBase = window.adminSystem.apiBase;
    resultsEl.innerHTML += `API基础地址: ${apiBase}<br>`;
    
    // 测试用户API
    resultsEl.innerHTML += '正在测试用户API...<br>';
    
    window.adminSystem.apiRequest('/api/admin/users', { method: 'GET' })
        .then(response => {
            resultsEl.innerHTML += `✓ 用户API响应成功<br>`;
            resultsEl.innerHTML += `- 成功状态: ${response.success}<br>`;
            if (response.success && response.data) {
                resultsEl.innerHTML += `- 用户数量: ${response.data.length}<br>`;
                if (response.data.length > 0) {
                    resultsEl.innerHTML += `- 第一个用户: ${response.data[0].nickname || response.data[0].openid}<br>`;
                }
            } else {
                resultsEl.innerHTML += `- 错误信息: ${response.error || '未知错误'}<br>`;
            }
            
            // 测试操作记录API
            resultsEl.innerHTML += '<br>正在测试操作记录API...<br>';
            return window.adminSystem.apiRequest('/api/operations', { method: 'GET' });
        })
        .then(response => {
            resultsEl.innerHTML += `✓ 操作记录API响应成功<br>`;
            resultsEl.innerHTML += `- 成功状态: ${response.success}<br>`;
            if (response.success && response.data) {
                resultsEl.innerHTML += `- 操作记录数量: ${response.data.length}<br>`;
            }
            resultsEl.innerHTML += '<br><strong>API连接测试完成！</strong><br>';
        })
        .catch(error => {
            resultsEl.innerHTML += `✗ API连接失败: ${error.message}<br>`;
            resultsEl.innerHTML += `- 这可能表示后端服务不可用或网络连接问题<br>`;
            resultsEl.innerHTML += `- 系统将自动使用模拟数据作为降级方案<br>`;
        });
}

// 初始化系统
let adminSystem;
let loginManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化系统...');
    
    // 先初始化登录管理器
    loginManager = new LoginManager();
    console.log('LoginManager初始化完成');
    
    // 再初始化管理系统
    adminSystem = new AdminSystem();
    console.log('AdminSystem初始化完成');
    
    // 将实例挂载到window对象，方便其他地方访问
    window.loginManager = loginManager;
    window.adminSystem = adminSystem;
    
    // 绑定登录表单事件
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('找到登录表单，绑定事件...');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('登录表单提交事件触发');
            window.loginManager.handleLogin();
        });
        
        // 也绑定回车键事件
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput && passwordInput) {
            [usernameInput, passwordInput].forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('回车键触发登录');
                        window.loginManager.handleLogin();
                    }
                });
            });
        }
    } else {
        console.error('未找到登录表单元素');
    }
    
    console.log('系统初始化完成');
});