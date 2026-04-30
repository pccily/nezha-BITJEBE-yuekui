## Context

当前主题是基于 React 19、Vite、Tailwind CSS 和 Komari RPC2 的纯前端主题。主机详情页入口位于 `src/pages/ServerDetail.tsx`，当前只提供 `Detail` 与 `Network` 两个页签：`Detail` 展示实时资源图表，`Network` 展示服务监控/延迟记录。

主题的数据来源分为两类：

- `common:getNodesLatestStatus`：由 `WebSocketProvider` 每 2 秒轮询，用于构造实时节点快照。
- `common:getNodes`：由 `getKomariNodes()` 统一拉取并缓存 2 分钟，用于静态节点信息、账单、流量和标签等字段。

Komari Next Pro 已提供可选后端接口：

- `/ip-meta/ip-meta?ips=...`：提供 IP 地理位置、ASN、网络类型、质量评分等信息。
- `/unlock-probe/unlock/latest`：读取流媒体解锁缓存结果。
- `/unlock-probe/unlock/run`：管理员登录后手动触发流媒体解锁检测。
- `/unlock-probe/unlock/capability`：管理员登录后确认节点 IPv4 / IPv6 能力。

本项目是公开主题前端，真实 IP 属于敏感信息。用户明确要求“管理员登录才能显示 IP 信息”，因此 UI 与数据展示必须以登录态作为边界：未登录访客不能看到真实 IP 和完整 IP 元数据。

## Goals / Non-Goals

**Goals:**

- 在主机详情页新增 `IP` 页签，位置在 `Detail`、`Network` 之后。
- 通过主题配置控制 IP 信息与流媒体解锁功能是否启用，并允许配置接口基础路径。
- 从 `common:getNodes` 透传节点 `ipv4` / `ipv6`，但仅管理员登录后展示真实 IP。
- 在管理员登录后调用 `/ip-meta/` 展示 IP 元数据与质量信息。
- 调用 `/unlock-probe/` 展示流媒体解锁缓存结果，并允许管理员在节点在线时手动触发检测。
- 支持 Netflix、Disney+、YouTube Premium、Spotify、TikTok、ChatGPT、Claude、Gemini 等流媒体/AI 服务的结果展示目录。
- 接口失败或未配置时优雅降级，不影响详情页已有 `Detail` / `Network` 页签。

**Non-Goals:**

- 不在当前主题内实现 `/ip-meta/` 或 `/unlock-probe/` 后端服务。
- 不新增 npm 依赖，不迁移到参考主题的 Next.js 架构。
- 不把 IP 信息写入 `public_note` 或主题公开备注。
- 不在首版实现完整的流媒体检测后台配置管理面板；只保留必要开关和基础路径配置。
- 不将流媒体结果纳入 2 秒实时轮询。

## Decisions

### 1. 将 IP 信息集成到详情页第三个页签

在 `ServerDetail` 中扩展 tabs 为 `Detail`、`Network`、`IP`，新增 `ServerDetailIP` 组件。

理由：

- 与用户提出的“在详情和网络后增加 IP 栏”一致。
- 不打扰现有资源图表和网络监控布局。
- IP 元数据和流媒体解锁接口属于低频查询，不应混入实时图表渲染。

备选方案：把 IP 信息加入顶部 `ServerDetailOverview`。放弃原因是顶部概览当前用于轻量状态字段，IP 元数据和解锁结果信息量大，会挤压移动端布局。

### 2. 透传 `ipv4` / `ipv6` 到内部节点模型，但不公开展示

在 `NezhaServer` 类型增加 `ipv4?: string`、`ipv6?: string`，并在 `komariToNezhaWebsocketResponse()` 映射 `common:getNodes` 返回值。

理由：

- 当前 `buildPublicNoteFromNode()` 已使用 `server.ipv4` / `server.ipv6` 判断有无 IP，但只生成 IPv4/IPv6 标签，丢失了真实值。
- 复用 `getKomariNodes()` 2 分钟缓存，避免页面组件重复请求 `common:getNodes`。
- 保持详情页按 `server_id` 从现有 WebSocket 快照查找节点，不引入额外全局状态。

隐私边界：字段可存在于前端内存，但 UI 层必须在登录态确认前隐藏真实 IP；若安全要求进一步提高，后续可改为只在登录后通过管理员接口查询。

### 3. 登录态作为展示与操作边界

新增 IP 页签进入后先检查登录态，优先使用 `/api/me` 或现有登录接口能力判断管理员状态。

策略：

- 未登录：显示“管理员登录后可查看 IP 信息与流媒体解锁结果”，不请求 `/ip-meta/`，不展示真实 IP。
- 已登录：展示 IPv4 / IPv6、允许复制、请求 `/ip-meta/` 和 `/unlock-probe/`。
- 已登录但节点离线：可展示缓存结果，禁用手动检测按钮。

理由：满足“管理员登录才能显示 IP 信息”的明确要求，同时减少对外部接口的无效请求。

备选方案：未登录展示脱敏 IP 和 masked 解锁结果。放弃原因是用户强调管理员登录才能显示 IP 信息，首版应更严格。

### 4. 外部接口路径通过主题配置控制

在 `komari-theme.json` 增加配置项，建议包括：

- `ShowServerIpInfo`：是否启用 IP 页签/区域。
- `ShowStreamUnlock`：是否启用流媒体解锁区域。
- `IpMetaApiBase`：默认 `/ip-meta`。
- `UnlockProbeApiBase`：默认 `/unlock-probe`。
- `StreamUnlockShowIPv6`：是否展示/检测 IPv6 解锁结果。

理由：

- `/ip-meta/` 与 `/unlock-probe/` 是可选后端模块，不是所有部署都有。
- 不同部署可能有不同反代路径。
- 管理员可以按站点隐私策略关闭功能。

备选方案：硬编码路径。放弃原因是部署灵活性差，且功能不可用时会造成固定错误提示。

### 5. 使用前端轻量请求与本地组件状态，不接入 React Query

IP 页签组件通过 `useEffect` + `AbortController` 请求接口，并在组件内维护 loading/error/data 状态。

理由：

- 当前详情页实时数据并未使用 React Query。
- 请求只在进入 IP 页签、节点变化或手动触发时发生，状态范围局部。
- 避免为少量接口引入额外缓存层复杂度。

备选方案：封装 React Query hooks。可作为后续优化，但首版没有必要。

### 6. 流媒体服务目录前端常量维护

新增常量目录维护支持服务：Netflix、Disney+、YouTube Premium、Spotify、TikTok、ChatGPT、Claude、Gemini。接口返回未覆盖的服务可以忽略或在“其他结果”中展示。

理由：

- 参考 `/unlock-probe/` 返回结果以 `key` 匹配服务。
- 前端目录便于控制排序、图标、颜色和文案。
- 后续新增服务只需扩展目录和静态图标/文案。

## Risks / Trade-offs

- **真实 IP 出现在前端节点快照中** → UI 层严格要求登录后展示；若后续安全策略要求“未登录前端不可接收真实 IP”，需要改为登录后单独请求管理员接口而不是从公开快照读取。
- **外部服务未部署或反代路径不同** → 增加主题配置项，并在请求失败时显示“接口未配置或不可用”，不影响其它页签。
- **接口响应结构变化** → 使用宽松类型和字段兜底，未知字段不阻塞基础展示。
- **流媒体检测耗时较长** → 手动检测按钮显示 loading，避免重复点击；首屏只读 `/unlock/latest` 缓存，不自动触发检测。
- **多语言维护成本增加** → 新增文案统一放入 i18next 资源，至少同步现有语言文件的英文 fallback，避免硬编码中文。
- **移动端信息量过多** → IP 页签内部使用卡片/分区布局，IPv4、IPv6、IP 质量、解锁结果分块展示。
