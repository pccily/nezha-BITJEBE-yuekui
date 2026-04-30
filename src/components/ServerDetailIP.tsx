import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { fetchLoginUser } from "@/lib/nezha-api"
import { cn, formatNezhaInfo } from "@/lib/utils"
import { NezhaServer, NezhaWebsocketResponse } from "@/types/nezha-api"
import { Copy, Globe2, Play, RefreshCw, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

type IpMetaRecord = {
  ip: string
  family?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  org?: string
  asn?: string
  company?: string
  network_type?: string
  timezone?: string
  risk_score?: number
  pollution_score?: number
  confidence_score?: number
  quality_summary?: string
  source?: string
  fetched_at?: string
  expires_at?: string
  cached?: boolean
  error?: string
}

type IpMetaResponse = {
  ok?: boolean
  records?: IpMetaRecord[]
  warning?: string
  error?: string
}

type UnlockResult = {
  key: string
  name?: string
  status?: string
  statusText?: string
  region?: string
  type?: string
  typeText?: string
  detail?: string
}

type UnlockApiResponse = {
  ok?: boolean
  uuid?: string
  family?: string
  cached?: boolean
  updatedAt?: string | null
  masked?: boolean
  results?: UnlockResult[]
  error?: string
}

type UnlockFamily = "4" | "6"

type UnlockCatalogItem = {
  key: string
  label: string
}

const UNLOCK_CATALOG: UnlockCatalogItem[] = [
  { key: "netflix", label: "Netflix" },
  { key: "disney", label: "Disney+" },
  { key: "youtube", label: "YouTube Premium" },
  { key: "spotify", label: "Spotify" },
  { key: "tiktok", label: "TikTok" },
  { key: "chatgpt", label: "ChatGPT" },
  { key: "claude", label: "Claude" },
  { key: "gemini", label: "Gemini" },
]

function readThemeString(key: string, fallback: string) {
  const value = (window as unknown as Record<string, unknown>)[key]
  return typeof value === "string" && value.trim() ? value.trim().replace(/\/$/, "") : fallback
}

function readThemeBool(key: string, fallback = true) {
  const value = (window as unknown as Record<string, unknown>)[key]
  return typeof value === "boolean" ? value : fallback
}

function isIpMetaResponse(value: unknown): value is IpMetaResponse {
  return typeof value === "object" && value !== null
}

function isUnlockApiResponse(value: unknown): value is UnlockApiResponse {
  return typeof value === "object" && value !== null
}

function formatDateTime(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function scoreTone(score?: number) {
  if (typeof score !== "number") return "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
  if (score >= 80) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
  if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
}

function statusTone(status?: string) {
  const normalized = (status || "").toLowerCase()
  if (["ok", "success", "unlocked", "available", "yes"].includes(normalized))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
  if (["blocked", "failed", "no", "error"].includes(normalized)) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
  return "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
}

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-stone-200/70 py-2 text-sm last:border-0 dark:border-stone-800/70">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-right font-medium">{String(value)}</span>
    </div>
  )
}

function IpAddressCard({ label, value, onCopy }: { label: string; value?: string; onCopy: (value: string) => void }) {
  return (
    <Card className="rounded-xl bg-white/70 dark:bg-stone-900/70">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Globe2 className="size-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {value ? (
          <div className="flex items-center justify-between gap-2">
            <code className="break-all rounded-md bg-stone-100 px-2 py-1 text-sm dark:bg-stone-800">{value}</code>
            <Button variant="ghost" size="icon" onClick={() => onCopy(value)} aria-label="copy">
              <Copy className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">--</p>
        )}
      </CardContent>
    </Card>
  )
}

function IpMetaCard({ record }: { record: IpMetaRecord }) {
  const { t } = useTranslation()
  return (
    <Card className="rounded-xl bg-white/70 dark:bg-stone-900/70">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          <span>{record.ip}</span>
          {record.family && <Badge variant="secondary">{record.family}</Badge>}
          {record.cached && <Badge variant="outline">{t("serverIp.cached")}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {record.error ? <p className="mb-2 text-sm text-red-500">{record.error}</p> : null}
        <InfoRow label={t("serverIp.country")} value={[record.country, record.country_code].filter(Boolean).join(" ")} />
        <InfoRow label={t("serverIp.region")} value={[record.region, record.city].filter(Boolean).join(" / ")} />
        <InfoRow label={t("serverIp.asn")} value={record.asn} />
        <InfoRow label={t("serverIp.org")} value={record.org || record.company} />
        <InfoRow label={t("serverIp.networkType")} value={record.network_type} />
        <InfoRow label={t("serverIp.timezone")} value={record.timezone} />
        <InfoRow label={t("serverIp.source")} value={record.source} />
        <InfoRow label={t("serverIp.fetchedAt")} value={formatDateTime(record.fetched_at)} />
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Badge className={cn("justify-center border-0", scoreTone(record.risk_score))}>
            {t("serverIp.riskScore")}: {record.risk_score ?? "--"}
          </Badge>
          <Badge className={cn("justify-center border-0", scoreTone(record.pollution_score))}>
            {t("serverIp.pollutionScore")}: {record.pollution_score ?? "--"}
          </Badge>
          <Badge className="justify-center border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            {t("serverIp.confidenceScore")}: {record.confidence_score ?? "--"}
          </Badge>
        </div>
        {record.quality_summary && <p className="mt-3 text-sm text-muted-foreground">{record.quality_summary}</p>}
      </CardContent>
    </Card>
  )
}

function UnlockCards({ data, loading }: { data: UnlockApiResponse | null; loading: boolean }) {
  const { t } = useTranslation()
  const resultMap = new Map((data?.results || []).map((item) => [item.key, item]))
  const knownKeys = new Set(UNLOCK_CATALOG.map((item) => item.key))
  const unknownResults = (data?.results || []).filter((item) => !knownKeys.has(item.key))

  if (loading) return <p className="text-sm text-muted-foreground">{t("serverIp.loading")}</p>

  return (
    <div className="space-y-3">
      {data?.updatedAt && (
        <p className="text-xs text-muted-foreground">
          {t("serverIp.updatedAt")}: {formatDateTime(data.updatedAt)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {UNLOCK_CATALOG.map((catalog) => {
          const item = resultMap.get(catalog.key)
          return (
            <div key={catalog.key} className="rounded-lg border bg-stone-50/80 p-3 dark:bg-stone-900/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{catalog.label}</span>
                <Badge className={cn("border-0", statusTone(item?.status))}>{item?.statusText || item?.status || t("serverIp.noRecord")}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{[item?.region, item?.typeText || item?.type].filter(Boolean).join(" · ") || "--"}</p>
              {item?.detail && <p className="mt-1 break-all text-xs text-muted-foreground">{item.detail}</p>}
            </div>
          )
        })}
      </div>
      {unknownResults.length > 0 && (
        <div className="rounded-lg border border-dashed p-3">
          <p className="mb-2 text-sm font-medium">{t("serverIp.otherUnlockResults")}</p>
          <div className="flex flex-wrap gap-2">
            {unknownResults.map((item) => (
              <Badge key={item.key} variant="outline">
                {item.name || item.key}: {item.statusText || item.status || "--"}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UnlockFamilyPanel({
  family,
  title,
  uuid,
  enabled,
  online,
}: {
  family: UnlockFamily
  title: string
  uuid?: string
  enabled: boolean
  online: boolean
}) {
  const { t } = useTranslation()
  const [data, setData] = useState<UnlockApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const unlockBase = readThemeString("UnlockProbeApiBase", "/unlock-probe")

  const loadLatest = () => {
    if (!uuid || !enabled) return
    const controller = new AbortController()
    setLoading(true)
    setError("")
    fetch(`${unlockBase}/unlock/latest?uuid=${encodeURIComponent(uuid)}&family=${family}`, { credentials: "include", signal: controller.signal })
      .then((res) => res.json() as Promise<unknown>)
      .then((json) => {
        if (!isUnlockApiResponse(json) || json.ok === false)
          throw new Error(json && typeof json === "object" && "error" in json ? String(json.error) : t("serverIp.unlockUnavailable"))
        setData(json)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : t("serverIp.unlockUnavailable"))
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }

  useEffect(() => loadLatest(), [uuid, enabled, family, unlockBase])

  const runCheck = () => {
    if (!uuid || !enabled || !online) return
    setRunning(true)
    setError("")
    fetch(`${unlockBase}/unlock/run`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ uuid, family, useCache: false }),
    })
      .then((res) => res.json() as Promise<unknown>)
      .then((json) => {
        if (!isUnlockApiResponse(json) || json.ok === false)
          throw new Error(json && typeof json === "object" && "error" in json ? String(json.error) : t("serverIp.unlockRunFailed"))
        setData(json)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t("serverIp.unlockRunFailed")))
      .finally(() => setRunning(false))
  }

  return (
    <Card className="rounded-xl bg-white/70 dark:bg-stone-900/70">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLatest} disabled={loading || running || !enabled}>
            <RefreshCw className="size-4" />
            {t("serverIp.refresh")}
          </Button>
          <Button size="sm" onClick={runCheck} disabled={loading || running || !enabled || !online}>
            <Play className="size-4" />
            {running ? t("serverIp.running") : t("serverIp.runCheck")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {!online && <p className="mb-3 text-sm text-amber-600 dark:text-amber-300">{t("serverIp.offlineRunDisabled")}</p>}
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <UnlockCards data={data} loading={loading} />
      </CardContent>
    </Card>
  )
}

export default function ServerDetailIP({ server_id }: { server_id: string }) {
  const { t } = useTranslation()
  const { lastMessage } = useWebSocketContext()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [loginChecked, setLoginChecked] = useState(false)
  const [copied, setCopied] = useState("")
  const [metaRecords, setMetaRecords] = useState<IpMetaRecord[]>([])
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState("")

  const showStreamUnlock = readThemeBool("ShowStreamUnlock", true)
  const showIPv6Unlock = readThemeBool("StreamUnlockShowIPv6", true)
  const ipMetaBase = readThemeString("IpMetaApiBase", "/ip-meta")

  const server = useMemo<NezhaServer | null>(() => {
    if (!lastMessage?.data) return null
    try {
      const nezhaWsData: NezhaWebsocketResponse = JSON.parse(lastMessage.data)
      const matched = nezhaWsData.servers.find((item) => item.id === Number(server_id))
      return matched ? formatNezhaInfo(nezhaWsData.now, matched) : null
    } catch {
      return null
    }
  }, [lastMessage, server_id])

  const ips = useMemo(() => [server?.ipv4, server?.ipv6].filter((ip): ip is string => Boolean(ip && ip.trim())), [server?.ipv4, server?.ipv6])

  useEffect(() => {
    let mounted = true
    setCheckingLogin(true)
    fetchLoginUser()
      .then(() => {
        if (mounted) setIsAdmin(true)
      })
      .catch(() => {
        if (mounted) setIsAdmin(false)
      })
      .finally(() => {
        if (mounted) {
          setCheckingLogin(false)
          setLoginChecked(true)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!loginChecked || !isAdmin || ips.length === 0) {
      setMetaRecords([])
      setMetaError("")
      setMetaLoading(false)
      return
    }

    const controller = new AbortController()
    setMetaLoading(true)
    setMetaError("")
    fetch(`${ipMetaBase}/ip-meta?ips=${encodeURIComponent(ips.join(","))}`, { headers: { Accept: "application/json" }, signal: controller.signal })
      .then((res) => res.json() as Promise<unknown>)
      .then((json) => {
        if (!isIpMetaResponse(json) || json.ok === false)
          throw new Error(json && typeof json === "object" && "error" in json ? String(json.error) : t("serverIp.metaUnavailable"))
        setMetaRecords(Array.isArray(json.records) ? json.records : [])
        if (json.warning) setMetaError(json.warning)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setMetaError(err instanceof Error ? err.message : t("serverIp.metaUnavailable"))
      })
      .finally(() => setMetaLoading(false))

    return () => controller.abort()
  }, [ipMetaBase, isAdmin, loginChecked, ips.join(","), t])

  const copyText = (value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(value)
      window.setTimeout(() => setCopied(""), 1500)
    })
  }

  if (checkingLogin) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">{t("serverIp.checkingLogin")}</CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card className="rounded-xl border-amber-200 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold">{t("serverIp.loginRequiredTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("serverIp.loginRequiredDesc")}</p>
        </CardContent>
      </Card>
    )
  }

  if (!server) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">{t("serverIp.serverNotFound")}</CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <IpAddressCard label="IPv4" value={server.ipv4} onCopy={copyText} />
        <IpAddressCard label="IPv6" value={server.ipv6} onCopy={copyText} />
      </div>
      {copied && (
        <p className="text-sm text-emerald-600 dark:text-emerald-300">
          {t("serverIp.copied")}: {copied}
        </p>
      )}
      {ips.length === 0 && (
        <Card className="rounded-xl">
          <CardContent className="p-6 text-sm text-muted-foreground">{t("serverIp.noIp")}</CardContent>
        </Card>
      )}
      {ips.length > 0 && (
        <Card className="rounded-xl bg-white/60 dark:bg-stone-900/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t("serverIp.metaTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            {metaLoading && <p className="text-sm text-muted-foreground">{t("serverIp.loading")}</p>}
            {metaError && <p className="text-sm text-red-500">{metaError}</p>}
            {!metaLoading && metaRecords.length === 0 && !metaError && <p className="text-sm text-muted-foreground">{t("serverIp.noMeta")}</p>}
            {metaRecords.map((record) => (
              <IpMetaCard key={`${record.family || "ip"}-${record.ip}`} record={record} />
            ))}
          </CardContent>
        </Card>
      )}
      {showStreamUnlock && server.uuid && ips.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold">{t("serverIp.unlockTitle")}</h3>
          {server.ipv4 && <UnlockFamilyPanel family="4" title="IPv4" uuid={server.uuid} enabled={showStreamUnlock} online={server.online === true} />}
          {server.ipv6 && showIPv6Unlock && (
            <UnlockFamilyPanel family="6" title="IPv6" uuid={server.uuid} enabled={showStreamUnlock} online={server.online === true} />
          )}
        </section>
      )}
    </section>
  )
}
