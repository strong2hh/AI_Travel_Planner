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
