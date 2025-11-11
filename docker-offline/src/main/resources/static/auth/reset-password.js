// 初始化Supabase客户端
let supabase;
let supabaseConfigLoaded = false;

// 等待Supabase库加载完成
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabase) {
            resolve(true);
            return;
        }
        
        const checkInterval = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkInterval);
                resolve(true);
            }
        }, 100);
        
        // 10秒超时
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
        }, 10000);
    });
}

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
        showMessage(`配置加载失败: ${error.message}`, 'error');
        return false;
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageElement = document.getElementById('reset-message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
}

// 检查用户是否已登录
document.addEventListener('DOMContentLoaded', async () => {
    // 等待Supabase库加载完成
    const supabaseLoaded = await waitForSupabase();
    if (!supabaseLoaded) {
        showMessage('Supabase库加载超时，请检查网络连接或刷新页面', 'error');
        return;
    }
    
    // 然后加载Supabase配置
    const configLoaded = await loadSupabaseConfig();
    if (!configLoaded) return;
});

// 重置密码表单提交
document.getElementById('reset-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 确保Supabase配置已加载
    if (!supabaseConfigLoaded) {
        const configLoaded = await loadSupabaseConfig();
        if (!configLoaded) return;
    }
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // 验证密码匹配
    if (newPassword !== confirmPassword) {
        showMessage('两次输入的密码不匹配', 'error');
        return;
    }
    
    try {
        // 从URL获取重置令牌
        const hash = window.location.hash;
        const query = new URLSearchParams(hash.substring(1));
        const accessToken = query.get('access_token');
        const refreshToken = query.get('refresh_token');
        
        if (!accessToken || !refreshToken) {
            showMessage('无效的密码重置链接', 'error');
            return;
        }
        
        // 使用令牌设置会话
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });
        
        if (error) {
            throw error;
        }
        
        // 更新密码
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) {
            throw updateError;
        }
        
        showMessage('密码重置成功，正在跳转到登录页面...', 'success');
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
            window.location.href = '/static/auth.html';
        }, 3000);
        
    } catch (error) {
        showMessage(`密码重置失败: ${error.message}`, 'error');
        console.error('密码重置错误:', error);
    }
});