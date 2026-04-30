## Why

当前主题的主机详情页只提供资源详情与网络监控，缺少面向管理员的真实 IP 信息、IP 质量信息和流媒体解锁结果查看能力。Komari Next Pro 已通过可选后端服务提供 `/ip-meta/` 与 `/unlock-probe/` 接口，本变更将把这些能力以管理员可见的方式集成到当前主题。

## What Changes

- 在主机详情页的 `Detail` 与 `Network` 后增加 `IP` 页签，用于展示当前节点的 IP 信息与流媒体解锁信息。
- 增加主题配置项，允许控制 IP 信息与流媒体解锁区域是否启用，以及可选的接口基础路径。
- 从 `common:getNodes` 透传节点 `ipv4` / `ipv6` 字段到主题内部节点模型，但真实 IP 仅在管理员登录后展示。
- 通过 `/ip-meta/ip-meta?ips=...` 查询 IP 地理位置、ASN、组织、网络类型、时区与质量评分等信息。
- 通过 `/unlock-probe/unlock/latest` 展示流媒体解锁缓存结果，通过 `/unlock-probe/unlock/run` 支持管理员手动发起检测。
- 流媒体解锁结果支持 Netflix、Disney+、YouTube Premium、Spotify、TikTok、ChatGPT、Claude、Gemini 等参考服务，并以可扩展目录维护。
- 接口不可用、未配置、节点离线或节点无 IP 时，页面应优雅降级，不影响主机详情页其它功能。

## Capabilities

### New Capabilities

- `server-ip-intelligence`: 主机详情页管理员可见的 IP 信息、IP 质量信息与流媒体解锁查询能力。

### Modified Capabilities

无。

## Impact

- 受影响页面与组件：`src/pages/ServerDetail.tsx`、`src/components/TabSwitch.tsx`、新增主机详情 IP 信息相关组件。
- 受影响数据模型：`src/types/nezha-api.ts`、`src/lib/utils.ts`，需要透传 `ipv4` / `ipv6` 等节点字段。
- 受影响配置：`komari-theme.json` 与主题配置读取逻辑，需要新增 IP 信息与流媒体解锁开关/接口路径配置。
- 受影响国际化：`src/locales/*/translation.json`，新增 `IP` 页签和相关提示文案。
- 外部接口依赖：同源反代的 `/ip-meta/` 与 `/unlock-probe/` 服务；前端不新增 npm 依赖。
