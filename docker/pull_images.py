#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import sys
import os
import platform


def run_command(cmd, description=""):
    """运行命令并处理输出"""
    if description:
        print(f"\n🔧 {description}")
        print(f"执行: {cmd}")

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✓ 成功")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ 失败: {e.stderr}")
        return False


def main():
    """主函数"""
    print("=" * 50)
    print("阿里云ACR镜像拉取与部署脚本")
    print("=" * 50)

    # 检查Docker是否安装
    print("\n1. 检查Docker环境...")
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True)
        print("✓ Docker已安装")
    except:
        print("✗ Docker未安装或未启动")
        print("请先安装Docker: https://docs.docker.com/get-docker/")
        sys.exit(1)

    # 检查Docker Compose
    print("\n2. 检查Docker Compose...")
    try:
        subprocess.run(["docker-compose", "--version"], check=True, capture_output=True)
        print("✓ Docker Compose已安装")
    except:
        print("⚠️ Docker Compose未安装，尝试使用docker compose插件...")
        try:
            subprocess.run(["docker", "compose", "version"], check=True, capture_output=True)
            print("✓ Docker Compose插件已安装")
        except:
            print("✗ Docker Compose未安装")
            print("请安装: https://docs.docker.com/compose/install/")
            sys.exit(1)

    # 镜像列表
    images = [
        "crpi-ovqmcstndscfksyn.cn-hangzhou.personal.cr.aliyuncs.com/ai_travel_planner123/ai_travel_planner:1.0",
        "crpi-ovqmcstndscfksyn.cn-hangzhou.personal.cr.aliyuncs.com/ai_travel_planner123/ai_travel_plannrt_mysql:1.0",
        "crpi-ovqmcstndscfksyn.cn-hangzhou.personal.cr.aliyuncs.com/ai_travel_planner123/ai_travel_planner_frontand:1.0"
    ]

    # 拉取镜像
    print(f"\n3. 开始拉取{len(images)}个镜像...")
    for i, image in enumerate(images, 1):
        print(f"\n[{i}/{len(images)}] 拉取: {image}")
        if not run_command(f"docker pull {image}"):
            print(f"⚠️ 镜像拉取失败: {image}")
            choice = input("是否继续？(y/n): ").lower()
            if choice != 'y':
                print("操作已取消")
                sys.exit(1)

    print("\n" + "=" * 50)
    print("✅ 所有镜像拉取完成！")

    # 启动docker-compose
    print("\n4. 启动服务...")

    # 检查docker-compose文件
    compose_files = ["docker-compose.yml", "docker-compose.yaml"]
    compose_file = None

    for file in compose_files:
        if os.path.exists(file):
            compose_file = file
            break

    if compose_file:
        print(f"找到配置文件: {compose_file}")

        # 选择使用docker-compose还是docker compose
        use_docker_compose = True
        try:
            subprocess.run(["docker-compose", "--version"], check=True, capture_output=True)
        except:
            use_docker_compose = False

        if use_docker_compose:
            cmd = f"docker-compose -f {compose_file} up -d"
        else:
            cmd = f"docker compose -f {compose_file} up -d"

        if run_command(cmd, "启动容器服务"):
            print("\n✅ 服务启动成功！")

            # 显示容器状态
            print("\n📊 容器运行状态:")
            run_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")

            # 显示日志查看提示
            print("\n📋 常用命令:")
            print("  查看日志: docker-compose logs -f")
            print("  停止服务: docker-compose down")
            print("  重启服务: docker-compose restart")
            print("  查看所有容器: docker ps -a")
    else:
        print("⚠️ 未找到docker-compose配置文件")
        print("请在包含docker-compose.yml的目录中运行此脚本")


if __name__ == "__main__":
    main()