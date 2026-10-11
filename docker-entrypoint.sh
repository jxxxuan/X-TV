#!/bin/sh
set -e

# 确保 SQLite 与数据目录存在并拥有正确读写权限（防止宿主机卷挂载权限问题）
mkdir -p /app/data
chown -R nextjs:nodejs /app/data 2>/dev/null || true
chmod 775 /app/data 2>/dev/null || true

# 若以 root 启动，平滑降权至 nextjs 用户执行服务；若已有特定用户上下文则直接执行
if [ "$(id -u)" = '0' ]; then
  exec su-exec nextjs "$@"
else
  exec "$@"
fi
