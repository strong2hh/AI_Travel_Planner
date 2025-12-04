# 🌍 AI Travel Planner (智能旅行规划助手)

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-green)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![Vue/JS](https://img.shields.io/badge/Frontend-HTML%2FJS-yellow)

**AI Travel Planner** 是一个基于 Spring Boot 和人工智能大模型的全栈旅行规划应用。它集成了**高德地图 (AMap)**、**阿里云通义千问/DeepSeek大模型**以及**科大讯飞语音识别**，为用户提供智能化的行程制定、路线规划和语音交互体验。

## ✨ 核心功能

* **🤖 AI 智能规划**：基于 LLM（通义千问/DeepSeek）根据用户需求自动生成结构化的多日旅行行程（包含景点、时间安排、描述）。
* **🗺️ 地图交互可视化**：
    * 集成高德地图 API，在地图上自动标记行程景点。
    * 提供景点间的路线规划（驾车/导航视图）。
    * 支持点击标记查看详细信息。
* **🎤 语音搜索**：支持实时语音输入（WebM -> PCM 转写），通过科大讯飞接口解析语音指令进行目的地搜索。
* **📅 行程管理**：
    * 自动保存生成的行程到 MySQL 数据库。
    * 支持按天切换查看不同日期的具体安排。
* **🔐 用户认证**：包含基于 JWT 的用户注册与登录系统。

## 🛠 技术栈

### 后端 (Backend)
* **开发语言**: Java 17
* **框架**: Spring Boot 3.5.7
* **ORM**: MyBatis 3.0.3 + MySQL 8.0
* **AI SDK**: Spring AI Alibaba (DashScope)
* **工具库**:
    * `JavaCV/FFmpeg`: 音频格式转换
    * `JJWT`: Token 认证
    * `Gson`: JSON 解析
    * `Lombok`: 简化代码

### 前端 (Frontend)
* **基础**: HTML5, CSS3, Native JavaScript (ES6+)
* **地图**: 高德地图 JS API (v2.0)
* **部署**: Nginx (Docker 环境下)

### 运维 & 部署
* **Docker & Docker Compose**: 容器化编排 (MySQL + Backend + Frontend)

## 📂 项目结构

```text
AI_Travel_Planner/
├── docker/                 # Docker 部署相关文件
│   ├── docker-compose.yml  # 容器编排配置
│   ├── init.sql            # 数据库初始化脚本
│   ├── frontend/           # 前端 Docker 构建目录
│   └── nginx/              # Nginx 配置文件
├── src/
│   ├── main/
│   │   ├── java/com/ai_travel_planner/
│   │   │   ├── controller/ # 控制器 (AI, Map, Schedule, User...)
│   │   │   ├── service/    # 业务逻辑 (LLM调用, 语音处理...)
│   │   │   ├── entity/     # 数据库实体
│   │   │   ├── config/     # 配置类 (AI, Web, Gson...)
│   │   │   └── utils/      # 工具类 (JWT, 音频转换...)
│   │   └── resources/
│   │       ├── mapper/     # MyBatis XML 映射文件
│   │       ├── static/     # 静态资源 (HTML/JS/CSS)
│   │       └── application.yml # 项目主配置文件
└── pom.xml                 # Maven 依赖管理