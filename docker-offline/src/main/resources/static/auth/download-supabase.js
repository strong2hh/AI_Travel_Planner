// 这个脚本用于下载Supabase库到本地
// 在浏览器控制台中运行此脚本

(async function downloadSupabase() {
    try {
        // 从CDN获取Supabase库
        const response = await fetch('https://unpkg.com/@supabase/supabase-js@2');
        if (!response.ok) {
            throw new Error('Failed to fetch Supabase library');
        }
        
        const content = await response.text();
        
        // 创建一个下载链接
        const blob = new Blob([content], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'supabase.min.js';
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Supabase库下载成功！');
        console.log('请将下载的文件替换 /static/auth/supabase.min.js');
    } catch (error) {
        console.error('下载失败:', error);
    }
})();