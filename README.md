# Supabase 用户认证管理系统

基于 Supabase 构建的完整用户认证和管理系统，支持用户注册、登录、密码修改和账户管理功能。

## 功能特性

- ✅ 用户注册和登录
- ✅ 邮箱验证
- ✅ 密码修改
- ✅ 用户信息展示
- ✅ 账户删除
- ✅ 响应式设计
- ✅ 实时认证状态监听

## 快速开始

### 1. 设置 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 获取项目 URL 和匿名密钥
3. 在 `app.js` 中替换配置：

```javascript
const SUPABASE_URL = '您的项目URL';
const SUPABASE_ANON_KEY = '您的匿名密钥';
```

### 2. 配置 Supabase 认证

在 Supabase 控制台中：

1. 进入 **Authentication** → **Settings**
2. 配置网站 URL：`http://localhost:3000`（开发环境）
3. 启用邮箱验证（推荐）
4. 配置重定向 URL

### 3. 运行项目

使用本地服务器运行项目：

```bash
# 使用 Python（如果已安装）
python -m http.server 3000

# 或使用 Node.js 的 http-server
npx http-server -p 3000

# 或使用 PHP
php -S localhost:3000
```

然后在浏览器中访问 `http://localhost:3000`

## 文件结构

```
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js             # 主要逻辑
└── README.md          # 说明文档
```

## API 接口

### 认证方法

- `supabase.auth.signUp()` - 用户注册
- `supabase.auth.signInWithPassword()` - 密码登录
- `supabase.auth.signOut()` - 退出登录
- `supabase.auth.updateUser()` - 更新用户信息
- `supabase.auth.getSession()` - 获取当前会话

### 事件监听

- `onAuthStateChange` - 认证状态变化监听

## 安全注意事项

1. **保护 Supabase 密钥**：不要将密钥提交到公开仓库
2. **启用邮箱验证**：防止虚假注册
3. **设置密码策略**：要求强密码
4. **配置 CORS**：在生产环境中正确配置

## 自定义配置

### 修改样式

编辑 `styles.css` 文件来自定义界面外观：

```css
/* 修改主题颜色 */
:root {
    --primary-color: #您的颜色;
    --secondary-color: #您的颜色;
}
```

### 添加新功能

在 `app.js` 中添加新的认证方法或用户管理功能。

## 故障排除

### 常见问题

1. **CORS 错误**：检查 Supabase 项目配置中的允许域名
2. **认证失败**：验证邮箱和密码格式
3. **网络错误**：检查网络连接和 Supabase 项目状态

### 调试模式

在浏览器控制台中查看详细错误信息：

```javascript
// 启用详细日志
localStorage.setItem('debug', 'true');
```

## 生产部署

1. 配置生产环境的 Supabase 项目
2. 更新网站 URL 和重定向设置
3. 使用 HTTPS
4. 配置域名和 SSL 证书

## 技术支持

如有问题，请参考：
- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)

## 许可证

MIT License