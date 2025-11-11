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
