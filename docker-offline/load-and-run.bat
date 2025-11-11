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
