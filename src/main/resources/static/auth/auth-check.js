// === 常量定义 (与 auth.js 中的 TOKEN_KEY 保持一致) ===
const TOKEN_KEY = 'employee_token';
const LOGIN_PAGE_URL = '/static/auth/auth.html';

/**
 * 检查本地存储中是否有有效的Token
 * @returns {string | null} 返回Token字符串或null
 */
function checkAuthStatus() {
    const token = localStorage.getItem(TOKEN_KEY);

    // 实际项目中，这里应该加入 Token 解码和过期时间 (exp) 检查
    if (token) {
        // 简化处理：只要有Token就认为已登录
        return token;
    }
    return null;
}

/**
 * 处理退出登录逻辑
 */
function handleLogout() {
    // 1. 清除本地存储的Token
    localStorage.removeItem(TOKEN_KEY);
    console.log('用户已退出，Token已清除');

    // 2. 跳转到登录页
    window.location.href = LOGIN_PAGE_URL;
}

// === 主程序：检查用户是否已登录 ===
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 检查本地认证状态
    const authToken = checkAuthStatus();

    if (!authToken) {
        // 用户未登录，重定向到登录页面
        console.log('未检测到有效Token，重定向到登录页面');
        window.location.href = LOGIN_PAGE_URL;
        return;
    }

    // 2. 用户已登录
    console.log('Token有效，用户已登录');

    // 可选：将 Token 存储到全局对象，方便后续使用
    window.currentUser = { token: authToken };

    // 3. 添加退出登录按钮 (恢复原有的 DOM 注入逻辑)
    const schedulePanel = document.querySelector('.schedule-header');
    if (schedulePanel) {
        const logoutButton = document.createElement('button');
        logoutButton.textContent = '退出登录';

        // 恢复原始样式
        logoutButton.style.marginLeft = 'auto';
        logoutButton.style.padding = '5px 10px';
        logoutButton.style.backgroundColor = '#f44336';
        logoutButton.style.color = 'white';
        logoutButton.style.border = 'none';
        logoutButton.style.borderRadius = '5px';
        logoutButton.style.cursor = 'pointer';

        // 绑定新的退出事件
        logoutButton.addEventListener('click', handleLogout);

        const daySelector = document.querySelector('.day-selector');
        if (daySelector) {
            daySelector.appendChild(logoutButton);
        }
    }
});