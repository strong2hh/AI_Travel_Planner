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
