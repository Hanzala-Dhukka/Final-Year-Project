import API from "../api/api"

// ── GitHub Scan with Progress Tracking (G4.2) ────────────────────────────────

export const githubStartScan = async (repo_url) => {
  const response = await API.post("/github/scan-repository", { repo_url })
  return response.data
}

export const githubGetProgress = async (scan_id) => {
  const response = await API.get(`/github/scan-progress/${scan_id}`)
  return response.data
}

export const githubGetResults = async (scan_id) => {
  const response = await API.get(`/github/scan-results/${scan_id}`)
  return response.data
}

// ── Existing scan service (backward compatible) ─────────────────────────────

export const startScan = async (repoUrl) => {
  const response = await API.post("/scan/security-scan/start", {
    repo_url: repoUrl,
  })
  return response.data
}

export const getScanStatus = async (scanId) => {
  const response = await API.get(`/scan/security-scan/${scanId}/status`)
  return response.data
}

export const getScanResults = async (scanId, severity = null) => {
  const params = severity ? { params: { severity } } : {}
  const response = await API.get(`/scan/security-scan/${scanId}/results`, params)
  return response.data
}

export const getScanHistory = async () => {
  const response = await API.get("/scan/security-scan/history")
  return response.data
}

export const searchVulnerabilities = async (scanId, query) => {
  const response = await API.get("/scan/security-scan/search", {
    params: { scan_id: scanId, q: query }
  })
  return response.data
}

export const getJsonReport = async (scanId) => {
  const response = await API.get(`/scan/security-scan/report/${scanId}/json`)
  return response.data
}

export const compareScans = async (oldScanId, newScanId) => {
  const response = await API.post("/scan/security-scan/compare", {
    old_scan: oldScanId,
    new_scan: newScanId,
  })
  return response.data
}

export const getAIRemediation = async (vulnerability, codeContext = "", language = "python") => {
  const response = await API.post("/scan/security-scan/remediation", {
    vulnerability,
    code_context: codeContext,
    language,
  })
  return response.data
}

export const getScanFiles = async (scanId, extension = null) => {
  const params = extension ? { params: { extension } } : {}
  const response = await API.get(`/scan/security-scan/files/${scanId}`, params)
  return response.data
}

// ── WebSocket for real-time progress ─────────────────────────────────────────

export const createWebSocketConnection = (scanId, onMessage, onError, onClose) => {
  const wsUrl = `ws://localhost:8000/api/v1/scan/security-scan/ws/${scanId}`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (onMessage) onMessage(data)
  }

  ws.onerror = (error) => {
    if (onError) onError(error)
  }

  ws.onclose = () => {
    if (onClose) onClose()
  }

  return ws
}

// ── Scanner WebSocket (Module D3) ───────────────────────────────────────────

export const createScannerWebSocket = (onMessage, onError, onClose) => {
  const wsUrl = `ws://localhost:8000/ws/scanner`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (onMessage) onMessage(data)
  }

  ws.onerror = (error) => {
    if (onError) onError(error)
  }

  ws.onclose = () => {
    if (onClose) onClose()
  }

  return ws
}

// ── Scanner Engine API (Module D3) ──────────────────────────────────────────

export const scannerStartScan = async (repoUrl, branch = "main", scanConfig = {}) => {
  const response = await API.post("/scanner/start", {
    repo_url: repoUrl,
    branch,
    scan_config: scanConfig,
  })
  return response.data
}

export const scannerGetStatus = async (scanId) => {
  const response = await API.get(`/scanner/${scanId}/status`)
  return response.data
}

export const scannerGetResults = async (scanId) => {
  const response = await API.get(`/scanner/${scanId}/results`)
  return response.data
}

export const scannerCancelScan = async (scanId) => {
  const response = await API.post(`/scanner/${scanId}/cancel`)
  return response.data
}

export const scannerGetLogs = async (scanId) => {
  const response = await API.get(`/scanner/${scanId}/logs`)
  return response.data
}

export const scannerGetTimeline = async (scanId) => {
  const response = await API.get(`/scanner/${scanId}/timeline`)
  return response.data
}

export const scannerGetMyScans = async () => {
  const response = await API.get("/scanner/my-scans")
  return response.data
}
