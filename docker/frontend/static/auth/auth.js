// === 1. 配置后端接口地址 ===
const BASE_URL = '/api/admin/employee';
const LOGIN_API = `${BASE_URL}/login`;
const SIGNUP_API = `${BASE_URL}/signup`; // 注册接口

// === 2. 获取 DOM 元素 ===
const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast-container');
const toggleLink = document.getElementById('toggleLink');
const confirmGroup = document.getElementById('confirm-password-group');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const toggleText = document.getElementById('toggleText');
const confirmInput = document.getElementById('confirmPassword');

// 当前模式状态：true=登录, false=注册
let isLoginMode = true;

// === 3. Toast 提示工具函数 ===
function showToast(message, type = 'success') {
    if (!toast) return;
    toast.innerText = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// === 4. 切换 登录/注册 模式 ===
toggleLink.addEventListener('click', function(e) {
    e.preventDefault(); // 阻止链接跳转
    isLoginMode = !isLoginMode; // 切换状态

    if (isLoginMode) {
        // 切换回登录模式
        formTitle.innerText = '欢迎回来';
        formSubtitle.innerText = '请登录您的账号以继续';
        submitBtn.innerText = '立即登录';
        toggleText.innerText = '还没有账号？';
        toggleLink.innerText = '去注册';
        confirmGroup.style.display = 'none';
        confirmInput.required = false; // 登录时不验证此字段
    } else {
        // 切换为注册模式
        formTitle.innerText = '创建账号';
        formSubtitle.innerText = '注册成为新用户';
        submitBtn.innerText = '立即注册';
        toggleText.innerText = '已有账号？';
        toggleLink.innerText = '去登录';
        confirmGroup.style.display = 'block';
        confirmInput.required = true; // 注册时必须验证
    }

    // 清空输入框，避免混淆
    document.getElementById('password').value = '';
    confirmInput.value = '';
});

// === 5. 表单提交逻辑 ===
if (authForm) {
    authForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const usernameVal = document.getElementById('username').value;
        const passwordVal = document.getElementById('password').value;

        // --- 注册模式特有的校验 ---
        if (!isLoginMode) {
            const confirmVal = confirmInput.value;
            // 校验密码是否一致
            if (passwordVal !== confirmVal) {
                showToast("两次输入的密码不一致", 'error');
                return; // 阻止提交
            }
        }

        // 锁定按钮
        submitBtn.disabled = true;
        submitBtn.innerText = isLoginMode ? '登录中...' : '注册中...';

        const payload = {
            username: usernameVal,
            password: passwordVal
        };

        // 根据模式决定请求 URL
        const requestUrl = isLoginMode ? LOGIN_API : SIGNUP_API;

        try {
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // 检查 401
            if (response.status === 401) {
                showToast("认证失败：账号或密码错误", 'error');
                return;
            }

            const data = await response.json();

            // 检查业务 code
            if (data.code === 0) {
                // 后端返回错误 (如用户名已存在)
                showToast(data.msg || "操作失败", 'error');
                return;
            }

            // === 成功逻辑处理 ===
            if (data.code === 200) {
                if (isLoginMode) {
                    // --- 登录成功 ---
                    const token = data.data; // 假设 Token 在 data.data
                    if (token) {
                        localStorage.setItem('employee_token', token);
                        showToast('🎉 登录成功，正在跳转...', 'success');
                        setTimeout(() => {
                            window.location.href = '../MAP/index.html';
                        }, 1000);
                    }
                } else {
                    // --- 注册成功 ---
                    showToast('🎉 注册成功！请登录', 'success');

                    // 延迟 1.5秒后自动切换回登录界面
                    setTimeout(() => {
                        toggleLink.click(); // 触发切换回登录模式
                        // 自动填入刚才注册的用户名
                        document.getElementById('username').value = usernameVal;
                    }, 1500);
                }
            } else {
                showToast('未知的数据格式', 'error');
            }

        } catch (error) {
            console.error('请求出错:', error);
            showToast('网络连接失败，请检查服务', 'error');
        } finally {
            // 恢复按钮
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = isLoginMode ? '立即登录' : '立即注册';
            }, 500);
        }
    });
}