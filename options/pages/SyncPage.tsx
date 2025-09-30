import { useState } from "react"

import { PlaceholderCard } from "../../components/PlaceholderCard"
import { sendBackgroundMessage } from "../../lib/messaging/client"
import { useOptionsStore } from "../../store/options"

export const SyncPage = () => {
  const config = useOptionsStore((state) => state.config)
  const update = useOptionsStore((state) => state.update)
  const [status, setStatus] = useState<string | null>(null)
  const [isRunning, setRunning] = useState(false)

  const handleProviderChange = (value: "none" | "gist" | "webdav") => {
    update((current) => ({
      ...current,
      sync: {
        ...current.sync,
        provider: value
      }
    }))
  }

  const handleInputChange = (field: "gist" | "webdav", key: string, value: string) => {
    update((current) => ({
      ...current,
      sync: {
        ...current.sync,
        [field]: {
          ...current.sync[field],
          [key]: value
        }
      }
    }))
  }

  const toggleSaveOnChange = () => {
    update((current) => ({
      ...current,
      sync: {
        ...current.sync,
        saveOnChange: !current.sync.saveOnChange
      }
    }))
  }

  const runSync = async () => {
    setRunning(true)
    setStatus(null)

    try {
      const response = await sendBackgroundMessage({
        type: "sync:run",
        payload: undefined
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Sync failed")
      }

      const completed = new Date(response.data.completedAt).toLocaleString()
      setStatus(`Last synced at ${completed}`)
    } catch (error) {
      setStatus(`Sync failed: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <PlaceholderCard title="Provider">
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              checked={config.sync.provider === "none"}
              onChange={() => handleProviderChange("none")}
              type="radio"
            />
            Disabled
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={config.sync.provider === "gist"}
              onChange={() => handleProviderChange("gist")}
              type="radio"
            />
            GitHub Gist
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={config.sync.provider === "webdav"}
              onChange={() => handleProviderChange("webdav")}
              type="radio"
            />
            WebDAV
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input
            checked={config.sync.saveOnChange}
            onChange={toggleSaveOnChange}
            type="checkbox"
          />
          Sync automatically after saving settings
        </label>
      </PlaceholderCard>

      {config.sync.provider === "gist" ? (
        <PlaceholderCard title="GitHub Gist credentials">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium">Gist ID</span>
              <input
                className="border rounded px-2 py-1"
                onChange={(event) =>
                  handleInputChange("gist", "gistId", event.target.value)
                }
                value={config.sync.gist.gistId ?? ""}
              />
            </label>
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium">Token</span>
              <input
                className="border rounded px-2 py-1"
                onChange={(event) =>
                  handleInputChange("gist", "token", event.target.value)
                }
                type="password"
                value={config.sync.gist.token ?? ""}
              />
            </label>
          </div>
        </PlaceholderCard>
      ) : null}

      {config.sync.provider === "webdav" ? (
        <PlaceholderCard title="WebDAV server">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium">Endpoint</span>
              <input
                className="border rounded px-2 py-1"
                onChange={(event) =>
                  handleInputChange("webdav", "url", event.target.value)
                }
                placeholder="https://dav.example.com/thinkbot.json"
                value={config.sync.webdav.url ?? ""}
              />
            </label>
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium">Username</span>
              <input
                className="border rounded px-2 py-1"
                onChange={(event) =>
                  handleInputChange("webdav", "username", event.target.value)
                }
                value={config.sync.webdav.username ?? ""}
              />
            </label>
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium">Password</span>
              <input
                className="border rounded px-2 py-1"
                onChange={(event) =>
                  handleInputChange("webdav", "password", event.target.value)
                }
                type="password"
                value={config.sync.webdav.password ?? ""}
              />
            </label>
          </div>
        </PlaceholderCard>
      ) : null}

      <PlaceholderCard title="Manual sync">
        <p className="text-xs text-slate-500 mb-3">
          Trigger a manual sync to upload your configuration and conversations
          immediately.
        </p>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 border rounded text-sm"
            disabled={isRunning || config.sync.provider === "none"}
            onClick={runSync}
            type="button"
          >
            {isRunning ? "Syncing…" : "Run sync"}
          </button>
          <span className="text-xs text-slate-500">
            {status ??
              (config.sync.lastSyncedAt
                ? `Last synced ${new Date(config.sync.lastSyncedAt).toLocaleString()}`
                : "Not synced yet")}
          </span>
        </div>
      </PlaceholderCard>
    </div>
  )
}
