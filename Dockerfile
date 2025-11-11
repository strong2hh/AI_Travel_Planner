# 使用官方OpenJDK 17镜像（与项目Java版本一致）
FROM openjdk:17-jre-slim

# 设置工作目录
WORKDIR /app

# 复制已构建的JAR文件（需要先在本地构建）
COPY target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# 运行应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]