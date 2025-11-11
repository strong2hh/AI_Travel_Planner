@echo off
REM 配置变量
set REGISTRY_REGION="cn-hangzhou"
set REGISTRY_DOMAIN="crpi-ovqmcstndscfksyn.cn-hangzhou.personal.cr.aliyuncs.com"
set NAMESPACE="ai_travel_planner123"
set IMAGE_NAME="ai-travel-planner"
set IMAGE_TAG="latest"

REM 完整的镜像名称
set FULL_IMAGE_NAME="%REGISTRY_DOMAIN%/%NAMESPACE%/%IMAGE_NAME%:%IMAGE_TAG%"

echo ==========================================
echo AI旅行规划系统 Docker 部署脚本
echo =========================================

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：Docker 未安装，请先安装 Docker
    pause
    exit /b 1
)

REM 检查是否已登录阿里云容器镜像服务
echo 检查阿里云镜像仓库登录状态...
docker info | findstr "Username" >nul
if %errorlevel% neq 0 (
    echo 请先登录阿里云容器镜像服务：
    echo docker login %REGISTRY_DOMAIN% --username=^<您的阿里云账号^>
    pause
    exit /b 1
)

REM 构建Docker镜像
echo 构建Docker镜像...
docker build -t %IMAGE_NAME%:%IMAGE_TAG% .

REM 标记镜像用于推送到阿里云仓库
echo 标记镜像...
docker tag %IMAGE_NAME%:%IMAGE_TAG% %FULL_IMAGE_NAME%

REM 推送镜像到阿里云仓库
echo 推送镜像到阿里云仓库...
docker push %FULL_IMAGE_NAME%

echo ==========================================
echo 部署完成！
echo 镜像已推送到: %FULL_IMAGE_NAME%
echo ==========================================
echo.
echo 要在服务器上运行此镜像，请使用以下命令：
echo docker run -d -p 8080:8080 %FULL_IMAGE_NAME%
echo.
echo 或使用 docker-compose.yml:
echo version: '3'
echo services:
echo   app:
echo     image: %FULL_IMAGE_NAME%
echo     ports:
echo       - "8080:8080"
echo     environment:
echo       - spring.profiles.active=prod
echo ==========================================
pause