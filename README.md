# AI旅行规划系统

一个基于Spring Boot和前端的智能旅行规划系统，集成了地图服务、AI助手和用户认证功能。

## 功能特点

- 🗺️ 交互式地图界面（基于高德地图）
- 🤖 AI助手（基于阿里云大模型）
- 🗣️ 语音搜索功能
- 📅 多天行程规划
- 👤 用户认证系统（基于Supabase）
- 🎯 地点路线规划

## 技术栈

- 后端：Spring Boot
- 前端：HTML/CSS/JavaScript
- 数据库：Supabase（用户认证）
- 地图API：高德地图
- AI服务：阿里云DashScope
- 语音服务：科大讯飞

## 系统要求

- Java 11或更高版本
- Maven 3.6或更高版本
- 现代Web浏览器（Chrome、Firefox、Safari、Edge）

## 安装和配置

### 1. 克隆项目

```bash
git clone <项目仓库地址>
cd AI_Travel_Planner
```

### 2. 配置application.properties

打开 `src/main/resources/application.properties` 文件，配置以下参数：

#### 高德地图配置
```properties
# 前端地图api
amap.api-key=你的高德地图API密钥（JS API）
amap.security-js-code=你的高德地图安全密钥(JS API)
amap.center=116.397428,39.90923
amap.zoom=12
amap.style=normal
amap.enable-geolocation=true
```

#### 科大讯飞语音识别配置
```properties
iflytek.voice.app-id=你的讯飞应用ID
iflytek.voice.api-key=你的讯飞API密钥
iflytek.voice.api-secret=你的讯飞API密钥
```

#### 阿里云大模型配置
```properties
alibaba.api.key=你的阿里云API密钥
```

#### Supabase用户认证配置
```properties
supabase.url=https://你的项目ID.supabase.co
supabase.anon-key=你的Supabase匿名密钥
```

### 3. 获取必要的API密钥

#### 高德地图API密钥
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并创建应用
3. 获取API密钥和安全密钥

#### 科大讯飞语音识别密钥
1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 创建语音识别应用
3. 获取AppID、API Key和API Secret

#### 阿里云大模型API密钥
1. 访问 [阿里云DashScope](https://dashscope.console.aliyun.com/)
2. 开通DashScope服务
3. 获取API-KEY

#### Supabase配置
1. 访问 [Supabase官网](https://supabase.com/)
2. 创建新项目
3. 在项目设置中获取URL和API密钥

### 4. 构建和运行项目

```bash
# 使用Maven构建项目
mvn clean install

# 运行项目
mvn spring-boot:run
```

或者在IDE中直接运行 `AiTravelPlannerApplication.java`

### 5. 访问应用

应用启动后，可以通过以下URL访问：

- 登录页面：http://localhost:8080/static/auth.html
- 主应用页面：http://localhost:8080/static/MAP/index.html
- Supabase配置下载：http://localhost:8080/static/auth/download-supabase.html

## 项目结构

```
src/
├── main/
│   ├── java/com/ai_travel_planner/
│   │   ├── controller/          # 控制器类
│   │   ├── service/            # 服务接口
│   │   ├── service/Impl/       # 服务实现类
│   │   ├── utils/             # 工具类
│   │   └── AiTravelPlannerApplication.java
│   └── resources/
│       ├── static/              # 静态资源
│       │   ├── MAP/           # 地图相关文件
│       │   └── auth/          # 认证相关文件
│       ├── templates/           # 模板文件
│       └── application.properties # 配置文件
└── test/                     # 测试文件
```

## 使用指南

### 用户注册和登录

1. 访问 http://localhost:8080/static/auth.html
2. 点击"立即注册"创建新账户
3. 检查邮箱并点击确认链接
4. 使用注册的邮箱和密码登录

### 使用AI助手规划旅行

1. 登录后，在搜索框中输入旅行需求
2. 点击AI搜索按钮或使用语音搜索
3. 查看AI生成的旅行建议
4. 根据建议在地图上标记地点和规划路线

### 多天行程管理

1. 使用左侧面板的天数下拉菜单切换不同天的行程
2. 系统会根据AI生成的数据自动创建对应的天数
3. 每天的行程会显示相应的地点和活动

## 常见问题

### Q: Supabase库无法加载
A: 如果CDN连接超时，可以：
1. 访问 http://localhost:8080/static/auth/download-supabase.html 下载本地库
2. 将下载的文件保存为 `supabase.min.js`
3. 放置在 `src/main/resources/static/auth/` 目录下
4. 重启应用

### Q: 地图无法加载
A: 检查以下配置：
1. 确认application.properties中的高德地图API密钥有效
2. 确认网络可以访问 webapi.amap.com
3. 检查浏览器控制台的错误信息

### Q: AI助手无法响应
A: 检查以下配置：
1. 确认application.properties中的阿里云API密钥有效
2. 确认DashScope服务已开通且余额充足
3. 检查服务器日志中的错误信息

### Q: 语音搜索无法使用
A: 检查以下配置：
1. 确认application.properties中的讯飞API配置正确
2. 确认浏览器已授予麦克风权限
3. 检查浏览器是否支持Web Speech API

## 开发指南

### 添加新功能

1. 后端：在 `controller` 包中添加新的控制器
2. 前端：在 `static` 目录下添加新的页面和脚本
3. 更新 `application.properties` 添加必要的配置

### 自定义样式

1. 修改 `static/MAP/style.css` 中的样式
2. 添加响应式设计支持
3. 考虑不同浏览器兼容性

## 部署

### Docker部署

1. 创建Dockerfile
2. 构建Docker镜像
3. 运行容器

```bash
docker build -t ai-travel-planner .
docker run -p 8080:8080 ai-travel-planner
```

### 传统部署

1. 使用Maven打包：
   ```bash
   mvn clean package
   ```
2. 将生成的JAR文件部署到服务器
3. 使用Java运行：
   ```bash
   java -jar AI-Travel-Planner.jar
   ```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请联系项目维护者。

## 致谢

感谢以下开源项目和服务提供商：
- 高德地图API
- 阿里云DashScope
- 科大讯飞语音服务
- Supabase认证服务