#!/bin/bash

echo "=========================================="
echo "AI旅行规划系统 - GitHub Release 创建脚本"
echo "=========================================="

# 配置变量
VERSION="1.0.0"
RELEASE_DIR="release-$VERSION"

# 创建发布目录
mkdir -p $RELEASE_DIR

echo "1. 构建项目..."

# 尝试构建项目
if mvn clean package -DskipTests; then
    echo "项目构建成功"
    
    # 复制构建产物
    cp target/*.jar $RELEASE_DIR/ 2>/dev/null || echo "JAR文件未生成，跳过"
else
    echo "项目构建失败，创建离线包替代方案"
fi

echo "2. 创建离线部署包..."

# 运行离线构建脚本
./build-offline.sh

# 复制离线包到发布目录
cp ai-travel-planner-offline.tar.gz $RELEASE_DIR/

# 如果存在Docker镜像，也保存一份
if docker images ai-travel-planner-offline:latest | grep -q "ai-travel-planner-offline"; then
    echo "3. 保存Docker镜像..."
    docker save ai-travel-planner-offline:latest -o $RELEASE_DIR/ai-travel-planner-offline.tar
fi

echo "4. 创建发布说明文件..."

cat > $RELEASE_DIR/RELEASE_NOTES.md << 'EOF'
# AI旅行规划系统 v1.0.0 发布说明

## 版本信息
- **版本号**: 1.0.0
- **发布日期**: $(date +%Y-%m-%d)
- **Java版本**: 17+
- **Spring Boot**: 3.5.7

## 包含文件

### 1. 离线部署包 (推荐)
- `ai-travel-planner-offline.tar.gz` - 完整的离线部署包
  - 包含源代码、构建脚本和说明文档
  - 支持Windows、Linux、macOS
  - 无需网络连接即可部署

### 2. Docker镜像 (可选)
- `ai-travel-planner-offline.tar` - 预构建的Docker镜像
  - 开箱即用，只需要Docker环境
  - 下载后直接加载运行

## 快速开始

### 方式一：使用离线包（推荐）
1. 下载 `ai-travel-planner-offline.tar.gz`
2. 解压后进入 `docker-offline` 目录
3. 运行相应平台的构建脚本

### 方式二：使用Docker镜像
1. 下载 `ai-travel-planner-offline.tar`
2. 运行: `docker load -i ai-travel-planner-offline.tar`
3. 运行: `docker run -p 8080:8080 ai-travel-planner-offline:latest`

## 系统要求
- Java 17或更高版本
- Docker (可选)
- 至少512MB可用内存

## 更新日志
- 初始版本发布
- 支持AI旅行规划功能
- 提供完整的离线部署方案

## 技术支持
如遇问题，请查看项目文档或提交Issue。
EOF

echo "5. 创建文件校验和..."

# 计算文件校验和
cd $RELEASE_DIR
sha256sum * > checksums.txt
cd ..

echo "6. 创建发布压缩包..."

# 创建最终的发布包
tar -czf AI_Travel_Planner-v$VERSION-release.tar.gz $RELEASE_DIR/

# 清理临时文件
# rm -rf $RELEASE_DIR

echo "=========================================="
echo "GitHub Release 包创建完成！"
echo "文件: AI_Travel_Planner-v$VERSION-release.tar.gz"
echo "大小: $(du -h AI_Travel_Planner-v$VERSION-release.tar.gz | cut -f1)"
echo "=========================================="

echo ""
echo "发布到GitHub的步骤："
echo "1. 在GitHub上创建新的Release"
echo "2. 版本号填写: v$VERSION"
echo "3. 上传文件: AI_Travel_Planner-v$VERSION-release.tar.gz"
echo "4. 发布说明可以参考: $RELEASE_DIR/RELEASE_NOTES.md"
echo ""

echo "文件列表:"
ls -la $RELEASE_DIR/

# 显示文件大小信息
echo ""
echo "各文件大小:"
du -h $RELEASE_DIR/*