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
        return false;
    }
}

// 检查用户是否已登录
document.addEventListener('DOMContentLoaded', async () => {
    // 首先等待Supabase库加载完成
    const supabaseLoaded = await waitForSupabase();
    if (!supabaseLoaded) {
        console.error('Supabase库加载失败，重定向到登录页面');
        window.location.href = '/static/auth.html';
        return;
    }
    
    // 然后加载Supabase配置
    const configLoaded = await loadSupabaseConfig();
    if (!configLoaded) {
        // 配置加载失败，重定向到登录页面
        window.location.href = '/static/auth.html';
        return;
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            // 用户未登录，重定向到登录页面
            window.location.href = '/static/auth.html';
        } else {
            // 用户已登录，设置全局用户信息
            window.currentUser = session.user;
            
            // 添加退出登录按钮
            const schedulePanel = document.querySelector('.schedule-header');
            if (schedulePanel) {
                const logoutButton = document.createElement('button');
                logoutButton.textContent = '退出登录';
                logoutButton.style.marginLeft = 'auto';
                logoutButton.style.padding = '5px 10px';
                logoutButton.style.backgroundColor = '#f44336';
                logoutButton.style.color = 'white';
                logoutButton.style.border = 'none';
                logoutButton.style.borderRadius = '5px';
                logoutButton.style.cursor = 'pointer';
                
                logoutButton.addEventListener('click', async () => {
                    try {
                        await supabase.auth.signOut();
                        window.location.href = '/static/auth.html';
                    } catch (error) {
                        console.error('退出登录错误:', error);
                    }
                });
                
                const daySelector = document.querySelector('.day-selector');
                daySelector.appendChild(logoutButton);
            }
        }
    } catch (error) {
        console.error('检查登录状态错误:', error);
        // 发生错误时也重定向到登录页面
        window.location.href = '/static/auth.html';
    }
});