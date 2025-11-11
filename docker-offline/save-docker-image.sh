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
