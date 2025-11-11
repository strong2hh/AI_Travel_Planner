// 初始化Supabase客户端
let supabase;
let supabaseConfigLoaded = false;

// 从后端加载Supabase配置
async function loadSupabaseConfig() {
    try {
        // 检查Supabase库是否已加载
        if (!window.supabase) {
            throw new Error('Supabase库未正确加载，请检查网络连接或刷新页面');
        }
        
        const response = await fetch('/api/auth/config');
        if (!response.ok) throw new Error('Supabase配置加载失败');
        
        const config = await response.json();
        
        // 检查配置是否有效
        if (!config.url || !config.anonKey) {
            throw new Error('Supabase配置无效，请检查后端配置');
        }
        
        supabase = window.supabase.createClient(config.url, config.anonKey);
        supabaseConfigLoaded = true;
        
        console.log('Supabase配置加载成功');
        return true;
    } catch (error) {
        console.error('Supabase配置加载失败:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; max-width: 500px; margin: 50px auto; text-align: center; font-family: Arial, sans-serif;">
                <h2>配置加载失败</h2>
                <p>无法加载认证配置，请检查服务器连接或联系管理员。</p>
                <p style="color: red;">错误详情: ${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
        return false;
    }
}

// DOM元素
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const resetForm = document.getElementById('reset-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const backToLoginLink = document.getElementById('back-to-login');

// 显示消息
function showMessage(elementId, message, type = 'info') {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    // 5秒后自动隐藏消息
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// 切换表单显示
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    resetForm.classList.add('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    resetForm.classList.add('hidden');
});

// 在登录表单中添加忘记密码链接
const loginFormElement = document.querySelector('#login-form form');
const forgotPasswordLink = document.createElement('p');
forgotPasswordLink.innerHTML = '<a href="#" id="forgot-password">忘记密码？</a>';
forgotPasswordLink.className = 'switch-form';
loginFormElement.appendChild(forgotPasswordLink);

document.getElementById('forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    resetForm.classList.remove('hidden');
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    resetForm.classList.add('hidden');
});

// 登录表单提交
document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 确保Supabase配置已加载
    if (!supabaseConfigLoaded) {
        const configLoaded = await loadSupabaseConfig();
        if (!configLoaded) return;
    }
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        // 登录成功，重定向到主页
        showMessage('login-message', '登录成功，正在跳转...', 'success');
        
        setTimeout(() => {
            window.location.href = '/static/MAP/index.html';
        }, 1500);
        
    } catch (error) {
        showMessage('login-message', `登录失败: ${error.message}`, 'error');
        console.error('登录错误:', error);
    }
});

// 注册表单提交
document.getElementById('register').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 确保Supabase配置已加载
    if (!supabaseConfigLoaded) {
        const configLoaded = await loadSupabaseConfig();
        if (!configLoaded) return;
    }
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // 验证密码匹配
    if (password !== confirmPassword) {
        showMessage('register-message', '两次输入的密码不匹配', 'error');
        return;
    }
    
    try {
        // 注册用户
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: name
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        showMessage('register-message', '注册成功！请检查您的邮箱并点击确认链接', 'success');
        
        // 清空表单
        document.getElementById('register').reset();
        
    } catch (error) {
        showMessage('register-message', `注册失败: ${error.message}`, 'error');
        console.error('注册错误:', error);
    }
});

// 密码重置表单提交
document.getElementById('reset').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 确保Supabase配置已加载
    if (!supabaseConfigLoaded) {
        const configLoaded = await loadSupabaseConfig();
        if (!configLoaded) return;
    }
    
    const email = document.getElementById('reset-email').value;
    
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/static/auth/reset-password.html`
        });
        
        if (error) {
            throw error;
        }
        
        showMessage('reset-message', '密码重置链接已发送到您的邮箱', 'success');
        
        // 清空表单
        document.getElementById('reset').reset();
        
    } catch (error) {
        showMessage('reset-message', `发送重置链接失败: ${error.message}`, 'error');
        console.error('密码重置错误:', error);
    }
});

// 等待Supabase库加载完成
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabase) {
            resolve(true);
            return;
        }
        
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.supabase) {
                clearInterval(checkInterval);
                resolve(true);
                return;
            }
            
            // 尝试加载备用CDN
            if (attempts === 20 && !window.supabase) {
                console.log('尝试加载备用Supabase CDN...');
                const script = document.createElement('script');
                script.src = 'https://cdn.skypack.dev/@supabase/supabase-js';
                document.head.appendChild(script);
            }
            
            // 尝试加载本地文件
            if (attempts === 40 && !window.supabase) {
                console.log('尝试加载本地Supabase文件...');
                const script = document.createElement('script');
                script.src = '/static/auth/supabase.min.js';
                document.head.appendChild(script);
            }
        }, 100);
        
        // 15秒超时
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
        }, 15000);
    });
}

// 检查用户是否已登录
document.addEventListener('DOMContentLoaded', async () => {
    // 等待Supabase库加载完成
    const supabaseLoaded = await waitForSupabase();
    if (!supabaseLoaded) {
        document.body.innerHTML = `
            <div style="padding: 20px; max-width: 500px; margin: 50px auto; text-align: center; font-family: Arial, sans-serif;">
                <h2>库加载失败</h2>
                <p>Supabase库加载超时，请检查网络连接或刷新页面。</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
        return;
    }
    
    // 然后加载Supabase配置
    const configLoaded = await loadSupabaseConfig();
    if (!configLoaded) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // 用户已登录，重定向到主页
            window.location.href = '/static/MAP/index.html';
        }
    } catch (error) {
        console.error('检查登录状态错误:', error);
    }
});