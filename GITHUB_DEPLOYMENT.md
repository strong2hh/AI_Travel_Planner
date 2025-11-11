# AI旅行规划系统 - GitHub部署指南

## 🚀 快速开始

本项目提供了多种部署方式，让您能够在不同环境下快速运行AI旅行规划系统。

### 方式一：离线部署（推荐）

**下载离线包：**
- 从GitHub Releases下载 `ai-travel-planner-offline.tar.gz`
- 解压后进入 `docker-offline` 目录

**Linux/Mac:**
```bash
# 解压
tar -xzf ai-travel-planner-offline.tar.gz
cd docker-offline

# 构建并运行
./build-offline.sh
```

**Windows:**
```cmd
# 使用7-Zip或其他工具解压
# 进入docker-offline目录
build-offline.bat
```

### 方式二：使用预构建的Docker镜像

**下载预构建镜像：**
- 从GitHub Releases下载 `ai-travel-planner-offline.tar`

**运行命令：**
```bash
# 加载镜像
docker load -i ai-travel-planner-offline.tar

# 运行应用
docker run -p 8080:8080 ai-travel-planner-offline:latest
```

### 方式三：从源码构建

**克隆项目：**
```bash
git clone <您的GitHub仓库地址>
cd AI_Travel_Planner
```

**构建并运行：**
```bash
# 方式A：使用Docker（推荐）
docker build -t ai-travel-planner:latest .
docker run -p 8080:8080 ai-travel-planner:latest

# 方式B：直接运行Java应用
mvn clean package -DskipTests
java -jar target/*.jar
```

## 📋 系统要求

### 最低要求
- **Java**: 17或更高版本
- **内存**: 至少512MB可用内存
- **磁盘空间**: 至少200MB可用空间

### 推荐配置
- **Java**: OpenJDK 17+
- **内存**: 1GB或更多
- **操作系统**: Linux, Windows 10+, macOS 10.14+
- **Docker**: 20.10+（可选，用于容器化部署）

## 🔧 配置说明

### 环境变量（可选）
```bash
# 设置JVM内存参数（如需要）
export JAVA_OPTS="-Xmx512m -Xms256m"

# 设置Spring Profile
export SPRING_PROFILES_ACTIVE=prod
```

### 端口配置
- **默认端口**: 8080
- **如需修改端口**:
  ```bash
  # Docker方式
  docker run -p 9090:8080 ai-travel-planner:latest
  
  # Java方式
  java -jar target/*.jar --server.port=9090
  ```

## 🐳 Docker部署说明

### 使用Docker Compose
```yaml
# docker-compose.yml
version: '3'
services:
  ai-travel-planner:
    image: ai-travel-planner:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    restart: unless-stopped
```

**运行命令：**
```bash
docker-compose up -d
```

### 生产环境部署
```bash
# 后台运行
docker run -d --name ai-travel-planner -p 8080:8080 ai-travel-planner:latest

# 查看日志
docker logs -f ai-travel-planner

# 停止服务
docker stop ai-travel-planner
```

## 🛠️ 故障排除

### 常见问题

**1. 端口冲突**
```bash
# 错误信息：Address already in use
# 解决方案：使用其他端口
docker run -p 8081:8080 ai-travel-planner:latest
```

**2. 内存不足**
```bash
# 错误信息：Java heap space
# 解决方案：增加JVM内存
java -Xmx1g -jar target/*.jar
```

**3. Docker镜像加载失败**
```bash
# 错误信息：no such file or directory
# 解决方案：检查文件路径和权限
chmod +x *.sh
docker load -i ai-travel-planner-offline.tar
```

**4. 依赖下载失败**
```bash
# 错误信息：Connection timeout
# 解决方案：使用离线包或配置镜像源
```

### 日志查看
```bash
# Docker容器日志
docker logs ai-travel-planner

# 实时查看日志
docker logs -f ai-travel-planner

# Java应用日志
java -jar target/*.jar
```

## 🔍 验证部署

### 健康检查
访问以下端点验证应用状态：
- **健康检查**: `http://localhost:8080/actuator/health`
- **应用信息**: `http://localhost:8080/actuator/info`

### 功能测试
- **API测试**: 访问 `http://localhost:8080/api/map/config`
- **前端界面**: 访问 `http://localhost:8080`

## 📞 技术支持

如果遇到问题，请：
1. 查看本README文档
2. 检查GitHub Issues是否有类似问题
3. 提交新的Issue并提供详细错误信息

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。

---

**注意**: 确保您的系统满足最低要求，并按照指导步骤操作。如果遇到网络问题，强烈推荐使用离线部署方式。