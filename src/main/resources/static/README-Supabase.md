# Supabase 身份验证配置指南

本应用使用 Supabase 进行用户身份验证。以下是配置步骤：

## 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 点击 "Sign Up" 创建账户或 "Sign In" 登录
3. 点击 "New Project" 创建新项目
4. 输入项目名称和数据库密码
5. 选择离您最近的区域
6. 等待项目创建完成

## 2. 获取项目配置

在 Supabase 项目的仪表板中：

1. 进入 **Settings** > **API**
2. 找到以下信息：
   - Project URL: `https://your-project-id.supabase.co`
   - anon public key: `your-anon-key`

## 3. 配置身份验证

1. 进入 **Authentication** > **Settings**
2. 在 **Site URL** 中设置您应用的 URL（开发时可用 `http://localhost:8080`）
3. 在 **Redirect URLs** 中添加以下 URL：
   - `http://localhost:8080/static/auth/reset-password.html`
   - `http://localhost:8080/static/MAP/index.html`
   - 您的生产环境 URL

## 4. 更新代码中的配置

在以下文件中替换 Supabase 配置：

### auth.js
```javascript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key';
```

### reset-password.js
```javascript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key';
```

### MAP/auth-check.js
```javascript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key';
```

## 5. 启用邮件确认

1. 进入 **Authentication** > **Settings**
2. 找到 **Enable email confirmations** 选项
3. 确保此选项已启用（默认情况下应该是启用的）

## 6. 配置邮件提供商

Supabase 默认使用其内置的邮件服务。您也可以配置自定义邮件提供商：

1. 进入 **Authentication** > **Settings**
2. 找到 **SMTP Settings**
3. 配置您的 SMTP 提供商

## 7. 测试身份验证

1. 启动您的应用程序
2. 访问 `http://localhost:8080/static/auth.html`
3. 尝试注册新用户
4. 检查邮箱中的确认链接
5. 尝试登录

## 8. 可选配置

### 用户元数据

在注册时，我们添加了用户名作为元数据：
```javascript
options: {
    data: {
        display_name: name
    }
}
```

您可以在 **Authentication** > **Users** 中查看用户的元数据。

### 自定义用户表

您可以在 Supabase 数据库中创建自定义的用户表，并将它们与 `auth.users` 表关联。

## 故障排除

### 密码重置不工作

1. 检查重定向 URL 配置是否正确
2. 确保在 Supabase 仪表板中配置了密码重置页面
3. 检查浏览器控制台是否有错误信息

### 无法发送确认邮件

1. 检查 Supabase 的邮件设置
2. 确认邮件没有被标记为垃圾邮件
3. 尝试使用不同的邮箱地址

### 跨域问题

如果遇到跨域问题，您可能需要在 Supabase 中配置 CORS 设置。

## 安全建议

1. 不要在前端代码中暴露您的服务角色密钥
2. 使用 Supabase 的 RLS (Row Level Security) 来保护数据
3. 定期轮换 API 密钥
4. 使用强密码策略
5. 启用双因素身份验证（如果需要）