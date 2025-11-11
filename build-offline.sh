#!/bin/bash

echo "=========================================="
echo "AI旅行规划系统 - 离线Docker镜像构建脚本"
echo "=========================================="

# 配置变量
IMAGE_NAME="ai-travel-planner-offline"
IMAGE_TAG="latest"
OFFLINE_DIR="docker-offline"

# 创建离线目录
mkdir -p $OFFLINE_DIR

echo "1. 清理旧文件..."
rm -rf $OFFLINE_DIR/*

# 复制项目文件
cp -r src $OFFLINE_DIR/
cp pom.xml $OFFLINE_DIR/
cp .mvn $OFFLINE_DIR/ -r 2>/dev/null || true
cp mvnw $OFFLINE_DIR/
cp Dockerfile $OFFLINE_DIR/
cp docker-compose.yml $OFFLINE_DIR/
cp README.md $OFFLINE_DIR/

# 创建构建脚本
echo "2. 创建离线构建脚本..."
cat > $OFFLINE_DIR/build-offline.sh << 'EOF'
#!/bin/bash

echo "离线构建AI旅行规划系统..."

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "错误：Java未安装，请先安装Java 17或更高版本"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "错误：Maven未安装，请先安装Maven"
    echo "或者使用：./mvnw clean package -DskipTests"
    exit 1
fi

# 构建JAR文件
echo "构建应用..."
mvn clean package -DskipTests

if [ ! -f "target/*.jar" ]; then
    echo "错误：构建失败，JAR文件未生成"
    exit 1
fi

echo "应用构建成功！"
EOF

# 创建Docker镜像保存脚本
echo "3. 创建Docker镜像保存脚本..."
cat > $OFFLINE_DIR/save-docker-image.sh << 'EOF'
#!/bin/bash

echo "保存Docker镜像为离线文件..."

# 构建Docker镜像
docker build -t ai-travel-planner-offline:latest .

# 保存镜像为tar文件
docker save ai-travel-planner-offline:latest -o ai-travel-planner-offline.tar

# 计算文件大小
FILE_SIZE=$(du -h ai-travel-planner-offline.tar | cut -f1)

echo "=========================================="
echo "Docker镜像保存完成！"
echo "文件: ai-travel-planner-offline.tar"
echo "大小: $FILE_SIZE"
echo "=========================================="

echo ""
echo "使用说明："
echo "1. 将此文件复制到目标机器"
echo "2. 运行: docker load -i ai-travel-planner-offline.tar"
echo "3. 运行: docker run -p 8080:8080 ai-travel-planner-offline:latest"
echo ""
EOF

# 创建加载脚本
echo "4. 创建Docker镜像加载脚本..."
cat > $OFFLINE_DIR/load-and-run.sh << 'EOF'
#!/bin/bash

echo "加载并运行AI旅行规划系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误：Docker未安装，请先安装Docker"
    exit 1
fi

# 加载镜像
if [ -f "ai-travel-planner-offline.tar" ]; then
    echo "加载Docker镜像..."
    docker load -i ai-travel-planner-offline.tar
else
    echo "错误：ai-travel-planner-offline.tar 文件不存在"
    echo "请先运行 save-docker-image.sh 生成镜像文件"
    exit 1
fi

# 运行容器
echo "启动AI旅行规划系统..."
docker run -d -p 8080:8080 --name ai-travel-planner ai-travel-planner-offline:latest

echo "=========================================="
echo "应用已启动！"
echo "访问地址: http://localhost:8080"
echo "查看日志: docker logs ai-travel-planner"
echo "停止应用: docker stop ai-travel-planner"
echo "=========================================="
EOF

# 创建Windows批处理文件
echo "5. 创建Windows批处理文件..."
cat > $OFFLINE_DIR/build-offline.bat << 'EOF'
@echo off
chcp 65001 >nul
echo ==========================================
echo AI旅行规划系统 - 离线构建脚本(Windows)
echo ==========================================

echo 检查Java环境...
java -version >nul 2>&1
if errorlevel 1 (
    echo 错误：Java未安装，请先安装Java 17或更高版本
    pause
    exit /b 1
)

echo 检查Maven环境...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo 警告：Maven未安装，尝试使用mvnw...
    if not exist "mvnw" (
        echo 错误：mvnw也不存在，请安装Maven
        pause
        exit /b 1
    )
)

echo 构建应用...
if exist "mvnw" (
    call mvnw clean package -DskipTests
) else (
    mvn clean package -DskipTests
)

if not exist "target\*.jar" (
    echo 错误：构建失败，JAR文件未生成
    pause
    exit /b 1
)

echo 应用构建成功！
pause
EOF

# 创建Windows Docker镜像加载脚本
echo "6. 创建Windows Docker镜像加载脚本..."
cat > $OFFLINE_DIR/load-and-run.bat << 'EOF'
@echo off
chcp 65001 >nul
echo ==========================================
echo AI旅行规划系统 - Docker镜像加载脚本
echo ==========================================

echo 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误：Docker未安装，请先安装Docker Desktop
    pause
    exit /b 1
)

echo 加载Docker镜像...
if exist "ai-travel-planner-offline.tar" (
    docker load -i ai-travel-planner-offline.tar
) else (
    echo 错误：ai-travel-planner-offline.tar 文件不存在
    echo 请先运行 save-docker-image.sh 生成镜像文件
    pause
    exit /b 1
)

echo 启动AI旅行规划系统...
docker run -d -p 8080:8080 --name ai-travel-planner ai-travel-planner-offline:latest

echo ==========================================
echo 应用已启动！
echo 访问地址: http://localhost:8080
echo 查看日志: docker logs ai-travel-planner
echo 停止应用: docker stop ai-travel-planner
echo ==========================================
pause
EOF

# 创建说明文档
echo "7. 创建离线部署说明..."
cat > $OFFLINE_DIR/README.md << 'EOF'
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
EOF

# 设置执行权限
chmod +x $OFFLINE_DIR/*.sh

echo "=========================================="
echo "离线构建包创建完成！"
echo "目录: $OFFLINE_DIR"
echo "=========================================="

echo ""
echo "下一步操作："
echo "1. 将 $OFFLINE_DIR 目录打包"
echo "2. 上传到GitHub Releases"
echo "3. 用户下载后即可离线部署"
echo ""

# 创建压缩包
echo "创建压缩包..."
tar -czf ai-travel-planner-offline.tar.gz $OFFLINE_DIR/

echo "完成！文件: ai-travel-planner-offline.tar.gz"