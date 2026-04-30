# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## 项目概述
基于 nezha-dash-v1 二次开发的 Komari Monitor 自定义前端主题。
纯前端项目，构建后上传至 Komari 后端作为主题使用。

## 包管理与构建
- 明确优先使用 npm：CI 用 Node 22 + `npm i`，本地不要改用 bun/yarn 更新锁文件；保留 `package-lock.json` 为准。
- 无测试框架与 test 脚本；变更后用 `npm run lint`，涉及类型/构建产物时跑 `npm run build`。
- 发布包必须包含 `dist/`、`komari-theme.json`、`preview.png`；GitHub Release 会用 tag 去掉前缀 `v` 后回写 `komari-theme.json.version`。

## 技术栈
- React 19 + TypeScript（禁止 `any` 类型，函数式组件 + Hooks）
- Vite 6（构建工具）
- Tailwind CSS 3（样式，优先工具类）
- TanStack React Query（数据请求/缓存）
- Recharts（图表）
- Framer Motion（动画）
- i18next（国际化，支持中文/英文，不硬编码中文字符串）

## 网络与 RPC
- Vite 开发代理只转发 `/api/rpc2` 与 `/favicon.ico`；开发后端目标来自 `.env.development` 的 `VITE_API_TARGET`，缺省 `http://127.0.0.1:8008`。
- Komari RPC 入口是 `src/hooks/use-rpc2.tsx` 的模块级单例 `SharedClient()`；普通调用走 `call()`，批量/逐节点大查询优先 `callViaHTTP()`，避免占用 WebSocket。
- `getKomariNodes()` 在 `src/lib/utils.ts` 内有 2 分钟 TTL 与 in-flight Promise 锁；不要绕过它重复调 `common:getNodes`。

## 数据与状态
- Komari UUID 映射为卡片 ID 通过 `uuidToNumber()` 哈希；标签/货币覆盖同时支持 UUID、名称、哈希 ID，避免用服务器名当唯一标识。
- `public_note` 会被 `handlePublicNote()` 缓存在 `sessionStorage`；节点字段会由 `buildPublicNoteFromNode()` 合并成 `billingDataMod`/`planDataMod` JSON。
- 在线状态优先使用 Komari 后端 `online` 字段；只有缺失时才回退 `last_active <= 30s`，不要重新引入纯本地时钟判断。

## 核心功能模块
- **流量进度条**：服务器卡片内嵌，支持 sum/max/min/up/down 模式，HSL 渐变色（绿→黄→红）。
- **标签系统**：tags 使用 `;` 分隔；`<颜色>` 会变成 `颜色:文本`，`<CNY>/<JPY>/...` 是隐藏货币元标签，不显示在 UI。
- **服务监控**：数据来自 `common:getRecords`；详情 ping 图保留 `-1` 丢包点并前端降采样；首页 30 天服务面板逐 UUID 用 HTTP 拉取 ping 记录。

## 样式规范
- Tailwind 动态颜色依赖 `src/lib/theme-colors.ts` 的完整 class 字面量与 `tailwind.config.js` safelist，新增动态色板必须同步两处。
- 主题配置通过 Komari 注入到 `window.*`；新增配置项必须同时改 `komari-theme.json` 与读取逻辑，管理端保存用 `updateThemeSetting()`。
- Prettier 使用双引号、无分号、150 列、Tailwind class 排序、导入分组 `@core/@server/@ui` 后相对路径；现有 `@` alias 不在排序分组里，格式化前注意差异。
- UI 组件配置遵循 `components.json`：shadcn/ui 使用 default 风格、非 RSC、TSX、Tailwind 配置文件为 `tailwind.config.js`、全局样式入口为 `src/index.css`、基础色为 stone、启用 CSS Variables、无 class 前缀。
- shadcn/ui 路径别名以 `components.json` 为准：`@/components`、`@/components/ui`、`@/lib/utils`、`@/lib`、`@/hooks`；新增或移动 UI 组件时保持别名一致。

## 发布与变更日志
- 变更日志分类遵循 `changelogithub.config.json`：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。
- 提交信息优先使用上述 conventional commits 类型，避免使用未配置类型，确保 GitHub Release 变更日志能正确归类。

## ESLint 说明
特意关闭了以下规则，不要按默认规则大规模机械重构：
- `react-hooks/exhaustive-deps`
- `@typescript-eslint/no-explicit-any`
- React Refresh 单组件导出限制

## AI 协作规范
- 始终用**中文**回答和写注释
- 修改代码前先说明思路，等确认再动手
- 每次只做一件事，完成后等确认再继续
- 不确定需求时主动询问，不自作主张
- 不引入新的外部脚本依赖，保持代码库干净

## 常用命令
```bash
npm run dev      # 启动开发服务器（需配置 .env.development）
npm run build    # 构建生产版本（产物在 dist/）
npm run lint     # ESLint 检查
```