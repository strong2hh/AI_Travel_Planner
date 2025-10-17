// Supabase配置
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // 替换为您的Supabase项目URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 替换为您的Supabase匿名密钥

// 初始化Supabase客户端
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM元素
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const messageDiv = document.getElementById('message');
const tabButtons = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const passwordModal = document.getElementById('password-modal');
const updatePasswordForm = document.getElementById('updatePasswordForm');
const deleteAccountBtn = document.getElementById('delete-account-btn');

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    checkAuthState();
});

// 初始化事件监听器
function initEventListeners() {
    // 标签页切换
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 表单提交
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    updatePasswordForm.addEventListener('submit', handleUpdatePassword);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);

    // 模态框关闭
    document.querySelector('.close').addEventListener('click', () => {
        passwordModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.style.display = 'none';
        }
    });

    // 修改密码按钮
    document.getElementById('update-password-btn').addEventListener('click', () => {
        passwordModal.style.display = 'block';
    });
}

// 检查认证状态
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        showUserSection(session.user);
    } else {
        showAuthSection();
    }
}

// 显示认证界面
function showAuthSection() {
    authSection.style.display = 'block';
    userSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    userEmail.textContent = '';
}

// 显示用户管理界面
function showUserSection(user) {
    authSection.style.display = 'none';
    userSection.style.display = 'block';
    logoutBtn.style.display = 'block';
    userEmail.textContent = user.email;

    // 更新用户信息
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-id').textContent = user.id;
    document.getElementById('profile-created').textContent = new Date(user.created_at).toLocaleDateString('zh-CN');
}

// 标签页切换
function switchTab(tabName) {
    // 更新激活的标签按钮
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 显示对应的表单
    authForms.forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}-form`);
    });
}

// 处理用户登录
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showMessage('正在登录...', 'info');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showMessage(`登录失败: ${error.message}`, 'error');
    } else {
        showMessage('登录成功！', 'success');
        showUserSection(data.user);
        loginForm.reset();
    }
}

// 处理用户注册
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 验证密码匹配
    if (password !== confirmPassword) {
        showMessage('密码不匹配', 'error');
        return;
    }

    // 验证密码强度
    if (password.length < 6) {
        showMessage('密码长度至少6位', 'error');
        return;
    }

    showMessage('正在注册...', 'info');

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: window.location.origin
        }
    });

    if (error) {
        showMessage(`注册失败: ${error.message}`, 'error');
    } else {
        showMessage('注册成功！请检查邮箱验证邮件。', 'success');
        registerForm.reset();
        switchTab('login');
    }
}

// 处理用户退出登录
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        showMessage(`退出失败: ${error.message}`, 'error');
    } else {
        showMessage('已成功退出登录', 'success');
        showAuthSection();
    }
}

// 处理密码修改
async function handleUpdatePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    // 验证新密码匹配
    if (newPassword !== confirmNewPassword) {
        showMessage('新密码不匹配', 'error');
        return;
    }

    // 验证新密码强度
    if (newPassword.length < 6) {
        showMessage('新密码长度至少6位', 'error');
        return;
    }

    showMessage('正在更新密码...', 'info');

    // 首先重新认证用户
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
    });

    if (reauthError) {
        showMessage(`当前密码错误: ${reauthError.message}`, 'error');
        return;
    }

    // 更新密码
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        showMessage(`密码更新失败: ${error.message}`, 'error');
    } else {
        showMessage('密码更新成功！', 'success');
        passwordModal.style.display = 'none';
        updatePasswordForm.reset();
    }
}

// 处理账户删除
async function handleDeleteAccount() {
    if (!confirm('确定要删除账户吗？此操作不可撤销！')) {
        return;
    }

    showMessage('正在删除账户...', 'info');

    const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user.id
    );

    if (error) {
        showMessage(`账户删除失败: ${error.message}`, 'error');
    } else {
        showMessage('账户已成功删除', 'success');
        showAuthSection();
    }
}

// 显示消息提示
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        showUserSection(session.user);
    } else if (event === 'SIGNED_OUT') {
        showAuthSection();
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
    showMessage('发生未知错误，请刷新页面重试', 'error');
});