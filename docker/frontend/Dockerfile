# 文件 3：frontend/Dockerfile (精简版 - 适用于纯静态文件)

# 只需要 Nginx 来托管文件
FROM nginx:alpine
# 移除 Nginx 默认的 html 文件
RUN rm -rf /usr/share/nginx/html/*

# 复制你的静态资源和 Nginx 配置
# ⚠️ 注意：这里假设 static 目录下已经是浏览器可以直接运行的最终文件
COPY ./static /usr/share/nginx/html/static
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]