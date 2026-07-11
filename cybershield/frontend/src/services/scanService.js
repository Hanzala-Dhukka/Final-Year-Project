import API from "../api/api"

export const startScan = async (repoUrl) => {
  const response = await API.post("/security-scan/start", {
    repo_url: repoUrl,
  })
  return response.data
}

export const getScanStatus = async (scanId) => {
  const response = await API.get(`/security-scan/${scanId}/status`)
  return response.data
}

export const getScanResults = async (scanId, severity = null) => {
  const params = severity ? { params: { severity } } : {}
  const response = await API.get(`/security-scan/${scanId}/results`, params)
  return response.data
}

export const getScanHistory = async () => {
  const response = await API.get("/security-scan/history")
  return response.data
}

export const searchVulnerabilities = async (scanId, query) => {
  const response = await API.get("/security-scan/search", {
    params: { scan_id: scanId, q: query }
  })
  return response.data
}

export const getJsonReport = async (scanId) => {
  const response = await API.get(`/security-scan/report/${scanId}/json`)
  return response.data
}

export const compareScans = async (oldScanId, newScanId) => {
  const response = await API.post("/security-scan/compare", {
    old_scan: oldScanId,
    new_scan: newScanId,
  })
  return response.data
}

export const getAIRemediation = async (vulnerability, codeContext = "", language = "python") => {
  const response = await API.post("/security-scan/remediation", {
    vulnerability,
    code_context: codeContext,
    language,
  })
  return response.data
}

export const getScanFiles = async (scanId, extension = null) => {
  const params = extension ? { params: { extension } } : {}
  const response = await API.get(`/security-scan/files/${scanId}`, params)
  return response.data
}

// WebSocket connection for real-time progress
export const createWebSocketConnection = (scanId, onMessage, onError, onClose) => {
  const wsUrl = `ws://localhost:8000/api/v1/security-scan/ws/${scanId}`
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
