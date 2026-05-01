# Komari Next Pro Unlock Probe

本目录包含 Komari Next Pro 可选后端模块，用于流媒体解锁检测、IP 元数据查询和节点卡片配置支持。

## 功能特性

- 执行流媒体解锁检测
- 存储并提供缓存的检测结果
- 分离 IPv4 / IPv6 结果
- 提供 IP 元数据查询（国家、ASN、风险评分等）
- 提供节点卡片字段可见性配置端点
- 支持定时批量执行

## API 接口

| 接口                          | 方法     | 需认证 | 说明               |
| ----------------------------- | -------- | ------ | ------------------ |
| `/healthz`                    | GET      | 否     | 健康检查           |
| `/status`                     | GET      | 否     | 服务状态           |
| `/ip-meta?ips=...`            | GET      | 是     | IP 元数据查询      |
| `/unlock/latest?uuid=...`     | GET      | 可选   | 获取缓存的解锁结果 |
| `/unlock/run`                 | POST     | 是     | 执行解锁检测       |
| `/unlock/capability?uuid=...` | GET      | 是     | 获取节点 IP 能力   |
| `/run-all`                    | POST     | 是     | 批量检测所有节点   |
| `/config`                     | GET/POST | 是     | 检测配置管理       |
| `/theme-config`               | GET/POST | 可选   | 主题配置管理       |

## 部署模式

推荐部署方式：

- 在可信内网中靠近 Komari 运行服务
- 保持 `KOMARI_BASE` 指向本地 Komari 实例，通常为 `http://127.0.0.1:25774`
- 通过反向代理暴露服务，如 `/unlock-probe/`
- 通过环境变量注入凭据

## 环境变量

| 变量                   | 默认值                   | 说明                         |
| ---------------------- | ------------------------ | ---------------------------- |
| `KOMARI_BASE`          | `http://127.0.0.1:25774` | Komari 后端地址              |
| `KOMARI_USER`          | `admin`                  | Komari 管理员用户名          |
| `KOMARI_PASS`          | `change-me`              | Komari 管理员密码            |
| `PORT`                 | `19116`                  | 服务端口                     |
| `IP_META_CACHE_TTL_MS` | `86400000`               | IP 元数据缓存时间（24 小时） |
| `CACHE_TTL_MS`         | `432000000`              | 解锁结果缓存时间（5 天）     |
| `COOLDOWN_MS`          | `300000`                 | 检测冷却期（5 分钟）         |

## 启动示例

```bash
cd unlock-probe
PORT=19116 \
KOMARI_BASE=http://127.0.0.1:25774 \
KOMARI_USER=admin \
KOMARI_PASS=change-me \
node server.mjs
```

## IP 元数据查询

`/ip-meta` 接口从 ip-api.com 查询 IP 信息（免费接口，每分钟 45 次请求限制）。

**请求示例：**

```
GET /ip-meta?ips=1.2.3.4,2001:db8::1
Cookie: session_token=xxx
```

**响应示例：**

```json
{
  "ok": true,
  "records": [
    {
      "ip": "1.2.3.4",
      "family": "ipv4",
      "masked": "***.***.3.4",
      "country": "美国",
      "country_code": "US",
      "region": "加利福尼亚",
      "city": "洛杉矶",
      "org": "Example Inc.",
      "asn": "AS12345",
      "network_type": "hosting",
      "risk_score": 55,
      "pollution_score": 35,
      "confidence_score": 78,
      "quality_summary": "数据中心 / 机房网络",
      "source": "ip-api.com",
      "fetched_at": "2024-01-01T00:00:00.000Z",
      "cached": false
    }
  ]
}
```

**网络类型与评分：**

| 类型    | 判断条件        | 风险评分 | 污染评分 | 置信度 |
| ------- | --------------- | -------- | -------- | ------ |
| proxy   | `proxy: true`   | 85       | 70       | 78     |
| hosting | `hosting: true` | 55       | 35       | 78     |
| isp     | 默认            | 15       | 10       | 88     |

## 安全注意事项

- 不要硬编码生产环境密码
- 不要在未认证情况下暴露特权写入接口
- 优先使用固定脚本执行而非任意命令传递
- 在暴露到公网前审查公开结果脱敏行为
- IP 元数据接口需要管理员认证
