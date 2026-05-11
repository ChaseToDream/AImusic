# AI Music Generator

基于 Suno AI 和 Minimax 的 AI 音乐生成应用，支持 Web 和桌面端（Tauri）。通过自然语言描述音乐风格、情绪和乐器，即可生成独特的音乐作品。

## 功能特性

- **双引擎支持** — 可切换 Suno AI 和 Minimax 两个音乐生成引擎
  - Suno AI：支持 chirp-v3-0 / chirp-v3-5 / chirp-v4 模型
  - Minimax：支持 Music 2.6（高质量）和 Music 2.6 Free（免费版）模型
- **歌词生成** — 支持手动输入歌词或 AI 自动写歌词（Minimax），支持结构标签（Verse / Chorus）
- **纯音乐模式** — 可生成无人声的纯器乐作品
- **实时进度追踪** — 带退避策略的轮询机制，实时展示生成状态
- **音频播放器** — 内置播放/暂停、进度拖拽、快进快退、音量控制、键盘快捷键
- **音频可视化** — 基于 Web Audio API 的实时频谱可视化
- **音频下载** — 支持将生成的音乐下载为 MP3 文件
- **生成历史** — 自动保存历史记录，支持回放和重试
- **明暗主题** — 支持浅色/深色/跟随系统三种主题模式
- **跨平台** — Web 版（Next.js）+ 桌面版（Tauri）

## 项目结构

```
ai-music-generator/
├── apps/
│   ├── web/                  # Web 应用（Next.js）
│   │   ├── app/              # Next.js App Router 页面与 API
│   │   │   ├── api/generate/ # 音乐生成 API 路由
│   │   │   ├── page.tsx      # 首页
│   │   │   └── providers.tsx # 全局 Provider
│   │   ├── components/       # UI 组件
│   │   │   ├── ui/           # shadcn/ui 基础组件
│   │   │   ├── audio-player.tsx
│   │   │   ├── audio-visualizer.tsx
│   │   │   ├── generation-progress.tsx
│   │   │   ├── music-card.tsx
│   │   │   ├── music-history.tsx
│   │   │   ├── prompt-input.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── toast.tsx
│   │   ├── hooks/            # 自定义 Hooks
│   │   │   ├── use-audio-player.ts
│   │   │   ├── use-keyboard-shortcuts.ts
│   │   │   └── use-music-generation.ts
│   │   ├── lib/              # 工具库与 API 封装
│   │   │   ├── suno-api.ts
│   │   │   └── utils.ts
│   │   └── stores/           # Zustand 状态管理
│   │       └── music-store.ts
│   │
│   └── desktop/              # 桌面应用（Tauri + Vite + React）
│       ├── src/              # 前端源码（与 Web 版共享组件逻辑）
│       │   ├── lib/api.ts    # Tauri IPC API 封装
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── src-tauri/        # Tauri 后端（Rust）
│           ├── src/lib.rs    # 核心命令：音乐生成、状态查询
│           └── src/main.rs
│
└── packages/
    └── shared/               # 共享类型定义
        └── types/index.ts    # TypeScript 类型（请求/响应/状态等）
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 |
| Web 端 | Next.js 16 (App Router) |
| 桌面端 | Tauri 2 + Vite 6 |
| 后端（桌面） | Rust (reqwest, serde, chrono) |
| 状态管理 | Zustand (persist middleware) |
| 数据请求 | TanStack React Query |
| UI 组件 | shadcn/ui + Tailwind CSS 4 |
| 音频处理 | Web Audio API |
| 类型共享 | TypeScript workspace package |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）或 npm
- Rust toolchain（仅桌面端开发需要）
- Tauri CLI（仅桌面端开发需要）

### 安装依赖

```bash
# 在项目根目录
npm install
```

### 配置环境变量

在 `apps/web/` 目录下创建 `.env.local` 文件：

```env
# Suno AI 配置（二选一）
SUNO_API_BASE=https://api.suno.ai
SUNO_API_KEY=your_suno_api_key
SUNO_COOKIE=your_suno_cookie

# Minimax 配置
MINIMAX_API_BASE=https://api.minimaxi.com
MINIMAX_API_KEY=your_minimax_api_key
```

> 桌面端通过 Rust 后端读取环境变量，配置方式相同。

### Web 端开发

```bash
cd apps/web
npm run dev
```

访问 http://localhost:3000

### 桌面端开发

```bash
cd apps/desktop
npm run tauri dev
```

### 构建

```bash
# Web 端
cd apps/web
npm run build

# 桌面端
cd apps/desktop
npm run tauri build
```

## API 说明

### 生成音乐

```
POST /api/generate
```

请求体：

```json
{
  "prompt": "一首轻快的夏日流行曲",
  "provider": "suno",
  "makeInstrumental": false,
  "model": "chirp-v4"
}
```

Minimax 请求体：

```json
{
  "prompt": "独立民谣,忧郁,内省",
  "provider": "minimax",
  "lyrics": "[Verse]\n街灯微亮晚风轻抚",
  "isInstrumental": false,
  "lyricsOptimizer": false,
  "model": "music-2.6"
}
```

### 查询生成状态

```
GET /api/generate/:id
```

返回生成任务的当前状态、音频 URL、封面图等信息。

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Space | 播放/暂停 |
| ← | 后退 10 秒 |
| → | 前进 10 秒 |
| ↑ | 音量增大 |
| ↓ | 音量减小 |
| Ctrl/Cmd + Enter | 提交生成 |

## 许可证

[GPL-3.0](LICENSE)
