## 1. 数据模型与配置

- [x] 1.1 在 `NezhaServer` 类型中增加 `ipv4` / `ipv6` 可选字段
- [x] 1.2 在 Komari 节点映射逻辑中从 `common:getNodes` 透传 `ipv4` / `ipv6`
- [x] 1.3 在 `komari-theme.json` 增加 IP 信息与流媒体解锁相关配置项
- [x] 1.4 在主题配置读取类型中接入新增配置项并提供默认值

## 2. 详情页入口与国际化

- [x] 2.1 在主机详情页增加可配置的 `IP` 页签，顺序为 `Detail`、`Network`、`IP`
- [x] 2.2 新增 `ServerDetailIP` 组件并接入详情页渲染逻辑
- [x] 2.3 为 `IP` 页签、登录提示、空状态、接口错误、IP 字段和流媒体结果补充 i18next 文案

## 3. 管理员登录边界

- [x] 3.1 实现详情页 IP 区域的管理员登录态检测
- [x] 3.2 未登录时显示登录要求提示，并禁止展示真实 IP 与 IP 元数据
- [x] 3.3 未登录时禁止请求 `/ip-meta/` 元数据接口和手动流媒体检测接口

## 4. IP 信息展示

- [x] 4.1 实现 IP 基础卡片，登录后展示 IPv4 / IPv6 与复制能力
- [x] 4.2 实现 `/ip-meta/ip-meta?ips=...` 请求逻辑，支持自定义 API base、取消请求和错误兜底
- [x] 4.3 展示国家/地区、城市、ASN、组织/运营商、网络类型、时区、缓存状态和质量评分
- [x] 4.4 处理节点无 IP、接口不可用、返回空记录等降级状态

## 5. 流媒体解锁展示与查询

- [x] 5.1 定义流媒体服务目录，覆盖 Netflix、Disney+、YouTube Premium、Spotify、TikTok、ChatGPT、Claude、Gemini
- [x] 5.2 实现 `/unlock-probe/unlock/latest` 缓存结果读取，分别支持 IPv4 和 IPv6
- [x] 5.3 实现管理员手动触发 `/unlock-probe/unlock/run`，节点离线或未登录时禁用
- [x] 5.4 展示结果状态、地区、类型和失败原因，并处理未知服务 key 的兜底
- [x] 5.5 支持主题配置关闭流媒体区域或关闭 IPv6 解锁展示

## 6. 验证

- [x] 6.1 运行 `npm run lint`
- [ ] 6.2 用户明确要求时再运行 `npm run build`（TypeScript 类型检查 + Vite 生产构建）
- [ ] 6.3 手动验证未登录、已登录、节点离线、无 IP、接口失败和接口正常等场景
