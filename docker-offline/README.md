# AI旅行规划系统 - 离线部署指南

## 概述
此目录包含AI旅行规划系统的完整离线部署文件，无需网络连接即可构建和运行。

## 文件结构
```
docker-offline/
├── src/                    # 源代码
├── pom.xml                # Maven配置文件
├── Dockerfile             # Docker构建文件
├── docker-compose.yml     # Docker Compose配置
├── build-offline.sh       # Linux/Mac构建脚本
├── build-offline.bat      # Windows构建脚本
├── save-docker-image.sh   # Docker镜像保存脚本
├── load-and-run.sh        # Linux/Mac加载运行脚本
├── load-and-run.bat       # Windows加载运行脚本
└── README.md              # 本说明文档
```

## 部署方式

### 方式一：离线构建（推荐）
1. 确保目标机器已安装Java 17+和Maven
2. 运行构建脚本：
   - Linux/Mac: `./build-offline.sh`
   - Windows: `build-offline.bat`
3. 构建Docker镜像：`docker build -t ai-travel-planner-offline:latest .`
4. 运行应用：`docker run -p 8080:8080 ai-travel-planner-offline:latest`

### 方式二：使用预构建的Docker镜像
1. 确保目标机器已安装Docker
2. 如果有预构建的镜像文件 `ai-travel-planner-offline.tar`：
   - 加载镜像：`docker load -i ai-travel-planner-offline.tar`
   - 运行应用：`docker run -p 8080:8080 ai-travel-planner-offline:latest`

### 方式三：直接运行JAR文件（无需Docker）
1. 构建应用后，直接运行：`java -jar target/*.jar`

## 系统要求
- Java 17或更高版本
- Maven 3.6+ 或使用项目自带的mvnw
- Docker（可选，用于容器化部署）

## 访问应用
应用启动后，访问：http://localhost:8080

## 故障排除
1. 端口冲突：如果8080端口被占用，修改docker run命令中的端口映射
2. 内存不足：修改Dockerfile中的JVM参数
3. 构建失败：检查Java和Maven版本兼容性
```
