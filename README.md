# X-TV

<p align="center">
  <b>融合 LibreTV 与 LunaTV 优势的跨平台影视聚合平台</b>
</p>

<p align="center">
  基于 <b>Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS</b> 构建。<br/>
  播放内核采用 <b>ArtPlayer + hls.js + mpegts.js</b>，兼顾极致轻量与多端生态。
</p>

---

## ✨ 核心融合亮点

X-TV 结合了 **LibreTV**（轻量纯粹、媒体能力强大、无状态）与 **LunaTV**（TV 客户端生态、跨设备云漫游、广告跳过）的全部杀手级优势：

1. 📺 **全平台与电视端生态（来自 LunaTV）**
   - **客厅大屏遥控体验**：内置兼容 LunaTV/MoonTV OpenAPI 规范（`/api/server-config`, `/api/playrecords`, `/api/favorites`, `/api/skipconfigs`）。
   - **原生 TV 客户端即连即用**：
     - **Android TV / 电视盒子**：直接使用 [Selene-TV](https://github.com/MoonTechLab/Selene-TV)（Compose TV 原生遥控体验）。
     - **Apple TV / Android TV**：直接使用 [OrionTV](https://github.com/orion-lib/OrionTV)。
     - **移动端**：使用 [Selene](https://github.com/MoonTechLab/Selene) 或手机 PWA。

2. 💾 **混合存储双模式（架构创新）**
   - **模式 A（默认）：零配置本地模式**
     - 服务端完全无状态，零数据库依赖，开箱即用，资源消耗极低。
     - 观看历史、精确到秒的播放进度保存在浏览器 IndexedDB（Dexie.js）中，保护个人隐私。
   - **模式 B（云同步）：轻量持久化模式**
     - 内置高效 SQLite 存储引擎（无需额外启动 Redis 容器，数据保存在挂载的 `./data` 目录单文件），亦兼容外部存储。
     - 手机、电脑、客厅电视无论在哪看，播放进度与收藏夹自动双向云漫游。

3. ⏩ **智能切片跳过（片头片尾与广告）**
   - 播放器内置片头片尾跳过控制器（支持预设 30s/60s/90s/120s 或自定义打点）。
   - 播放时自动跃过片头片尾与视频切片广告，跳过配置与电视端云同步。

4. 📥 **离线视频下载（来自 LibreTV）**
   - 内置 `mux.js` 浏览器端混流器，在播放页可直接点击「下载本集」。
   - 自动并发拉取 M3U8 分片并无损封装为标准 `.mp4` 或 `.ts` 文件保存本地，断网或差旅途中畅看。

5. 📦 **TVBox 订阅全兼容（来自 LibreTV）**
   - 原生支持直接粘贴 **TVBox 单仓配置** 订阅链接。
   - 自动容错清洗注释，智能筛选提取 Apple CMS 采集接口和 M3U 直播源，跳过 Node 侧无法运行的 Spider 引擎。

6. ⚡ **换源测速与无缝切源（来自 LibreTV）**
   - 播放遇到卡顿或失效时，一键呼出跨源测速面板。
   - 实时探测全网同名资源延迟，一键平滑换源，**自动保留集数和精确播放时间戳**。

7. 🛡️ **采集源健康度梯级自动熔断（来自 LibreTV）**
   - 聚合搜索时自动评估每个源的健康状况。
   - 连续超时的失效源自动按梯级休眠（30 分钟 → 24 小时 → 长期停用），彻底杜绝慢源坏源拖慢日常搜索。

8. 🎯 **多源首页推荐（来自 LibreTV）**
   - 在设置中随时切换：**豆瓣分类推荐**、**Bangumi 新番周放送表**、**影视热搜榜**（豆瓣周榜 + 百度热搜，免 Key 免翻墙）。

---

## 🚀 部署指南

### Docker Compose（推荐）

1. 创建 `.env` 文件并填入访问密码：
   ```bash
   echo "PASSWORD=your_secure_password" > .env
   ```

2. 启动服务：
   ```bash
   docker compose up -d --build
   ```

3. 访问 `http://服务器IP:8080` 即可开始观影！

#### docker-compose.yml 示例：

```yaml
services:
  xtv:
    build: .
    container_name: xtv
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      # 持久化存储目录（保存云同步进度与配置）
      - ./data:/app/data
    environment:
      - PASSWORD=your_secure_password      # 必填：访问密码
      # - USERNAME=admin                   # 可选：站长用户名（默认 admin）
      # - DEFAULT_SOURCES=[{"name":"示例源","url":"https://example.com/api.php/provide/vod"}]
      # - DEFAULT_LIVE_SOURCES=[{"name":"示例直播源","url":"https://example.com/list.m3u"}]
      # - DEFAULT_SUBSCRIPTIONS=["https://example.com/tvbox.json"] # 支持 TVBox 配置与通用订阅
      # - LIVE_ALLOW_PRIVATE=1             # 允许自建内网局域网 IPTV 源
```

---

## 📺 客厅电视端（TV 盒子 / Apple TV）接入指南

X-TV 完美兼容 LunaTV / MoonTV 客户端生态：

1. **Android TV / 智能电视盒子**：
   - 安装 [Selene-TV APK](https://github.com/MoonTechLab/Selene-TV/releases)；
   - 打开设置，输入你的 X-TV 服务器地址（例如 `http://192.168.1.100:8080`）；
   - 输入你设置的用户名（默认 `admin`）与 `PASSWORD`，登录后即可用电视遥控器在大屏上畅享观影！

2. **Apple TV**：
   - 安装 [OrionTV](https://github.com/orion-lib/OrionTV)；
   - 服务器地址填入你的 X-TV 实例，实现全家大屏观影与进度漫游。

---

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 8080 端口）
PASSWORD=dev-password npm run dev

# 运行自动化单元测试
npm test

# 类型检查
npm run typecheck
```

---

## 📜 协议与致谢

- 基于 [LibreTV](https://github.com/LibreSpark/LibreTV)（AGPL-3.0）与 [LunaTV](https://github.com/MoonTechLab/LunaTV)（MIT）二次融合开发。
- 感谢 [ArtPlayer](https://github.com/zhw2590582/ArtPlayer)、[HLS.js](https://github.com/video-dev/hls.js)、[Dexie.js](https://dexie.org/) 等开源巨人的卓越工作。