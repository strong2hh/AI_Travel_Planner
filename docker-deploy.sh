#!/bin/bash

# 配置变量
REGISTRY_REGION="cn-hangzhou"  # 根据您的阿里云区域修改
REGISTRY_DOMAIN="crpi-ovqmcstndscfksyn.cn-hangzhou.personal.cr.aliyuncs.com"  # 个人版阿里云容器镜像服务
NAMESPACE="ai_travel_planner123"  # 替换为您的命名空间
IMAGE_NAME="ai-travel-planner"
IMAGE_TAG="latest"

# 完整的镜像名称
FULL_IMAGE_NAME="${REGISTRY_DOMAIN}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=========================================="
echo "AI旅行规划系统 Docker 部署脚本"
echo "=========================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误：Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查是否已登录阿里云容器镜像服务
echo "检查阿里云镜像仓库登录状态..."
if ! docker info | grep -q "Username"; then
    echo "请先登录阿里云容器镜像服务："
    echo "docker login ${REGISTRY_DOMAIN} --username=<您的阿里云账号>"
    exit 1
fi

# 构建Docker镜像
echo "构建Docker镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 标记镜像用于推送到阿里云仓库
echo "标记镜像..."
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${FULL_IMAGE_NAME}

# 推送镜像到阿里云仓库
echo "推送镜像到阿里云仓库..."
docker push ${FULL_IMAGE_NAME}

echo "=========================================="
echo "部署完成！"
echo "镜像已推送到: ${FULL_IMAGE_NAME}"
echo "=========================================="
echo ""
echo "要在服务器上运行此镜像，请使用以下命令："
echo "docker run -d -p 8080:8080 ${FULL_IMAGE_NAME}"
echo ""
echo "或使用 docker-compose.yml:"
echo "version: '3'"
echo "services:"
echo "  app:"
echo "    image: ${FULL_IMAGE_NAME}"
echo "    ports:"
echo "      - \"8080:8080\""
echo "    environment:"
echo "      - spring.profiles.active=prod"
echo "=========================================="