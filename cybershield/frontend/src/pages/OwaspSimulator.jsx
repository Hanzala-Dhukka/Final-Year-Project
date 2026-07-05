import { useState } from "react"
import API from "../api/api"

const ATTACKS = {
  sqli: {
    name: "SQL Injection (SQLi)",
    endpoint: "owasp/simulate/sqli",
    description: "SQL Injection allows attackers to interfere with queries an application makes to its database.",
    placeholder: "Enter SQL payload... e.g. ' OR 1=1 --",
    examples: ["' OR 1=1 --", "'; DROP TABLE users; --", "admin' --", "1 UNION SELECT username, password FROM users"]
  },
  xss: {
    name: "Cross-Site Scripting (XSS)",
    endpoint: "owasp/simulate/xss",
    description: "XSS vulnerabilities allow attackers to inject client-side scripts into web pages viewed by other users.",
    placeholder: "Enter HTML/JS payload... e.g. <script>alert(1)</script>",
    examples: ["<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>", "javascript:alert(document.cookie)", "<iframe src='javascript:alert(1)'>"]
  },

  cmdi: {
    name: "Command Injection (CMDi)",
    endpoint: "owasp/simulate/cmdi",
    description: "Command Injection executes arbitrary commands on the host operating system via a vulnerable application.",
    placeholder: "Enter command payload... e.g. ; whoami",
    examples: ["; whoami", "&& ls -la", "|| cat /etc/passwd", "; ping -c 4 google.com"]
  },
  "path-traversal": {
    name: "Path Traversal (LFI)",
    endpoint: "owasp/simulate/path-traversal",
    description: "Path Traversal allows an attacker to read arbitrary files on the server running an application.",
    placeholder: "Enter path payload... e.g. ../../../etc/passwd",
    examples: ["../../../etc/passwd", "..\\..\\..\\windows\\win.ini", "/etc/passwd", "../../../../var/log/nginx/access.log"]
  },
  "broken-auth": {
    name: "Broken Authentication",
    endpoint: "owasp/simulate/broken-auth",
    description: "Broken Authentication allows attackers to bypass access controls or compromise passwords through brute force attacks.",
    placeholder: "Enter username... e.g. admin",
    examples: ["admin", "administrator", "root", "user123"]
  }
}

const sanitizeHTML = (str) => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function OwaspSimulator() {
  const [selectedAttack, setSelectedAttack] = useState("sqli")
  const [payload, setPayload] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)


  const handleSimulate = async (e) => {
    e.preventDefault()
    if (!payload.trim()) return

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const attackInfo = ATTACKS[selectedAttack]
      
      const res = await API.post(attackInfo.endpoint, null, {
        params: { payload }
      })
      
      setResult(res.data)
      setLoading(false)
    } catch (err) {
      console.error("Simulation failed:", err)
      setError("Failed to run simulation. Please try again.")
      setLoading(false)
    }
  }

  const currentAttack = ATTACKS[selectedAttack]

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-center">OWASP Vulnerability Simulator</h1>
        <p className="text-gray-600 text-center text-lg mb-10">
          Learn how vulnerabilities are detected. Input payloads to simulate common OWASP attacks and see analysis reports.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.keys(ATTACKS).map((key) => (
            <button
              key={key}
              onClick={() => {
                setSelectedAttack(key)
                setPayload("")
                setResult(null)
                setError(null)
              }}
              className={`p-4 rounded-xl font-bold text-center border shadow transition transform hover:-translate-y-1 ${
                selectedAttack === key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {ATTACKS[key].name}
            </button>
          ))}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">{currentAttack.name}</h2>
          <p className="text-gray-600 mb-6">{currentAttack.description}</p>

          <form onSubmit={handleSimulate} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Simulate Attack Payload</label>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={currentAttack.placeholder}
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none font-mono text-base"
                  required
                />
              </div>

              <div>
                <span className="block text-gray-500 font-semibold mb-2">Quick Examples (click to load):</span>
                <div className="flex flex-wrap gap-2">
                  {currentAttack.examples.map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPayload(example)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-mono px-3 py-1.5 rounded border border-gray-200 transition"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition transform hover:-translate-y-1 disabled:bg-blue-400"
              >
                {loading ? "Simulating Attack..." : "Execute Simulation"}
              </button>
            </form>

          {error && <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
        </div>

        {result && (
          <div className={`p-8 rounded-2xl shadow-lg border-l-8 ${result.success !== false ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
            <h3 className="text-3xl font-bold mb-6 text-gray-800 font-extrabold border-b pb-2">Simulation Report</h3>

            {/* SQL Injection Flow Visualization */}
            {selectedAttack === "sqli" && (
              <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-3 uppercase tracking-wide">SQL Injection Simulator Flow</h4>
                
                <div className="flex flex-col items-center space-y-4">
                  {/* Step 1: User Input */}
                  <div className="w-full max-w-lg p-4 bg-gray-50 rounded-lg border text-center shadow-inner">
                    <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wider mb-1">User Input</span>
                    <code className="text-lg font-mono text-blue-700 font-bold break-all">{result.payload_received}</code>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-400">↓</div>
                  
                  {/* Step 2: Unsafe Query */}
                  <div className="w-full max-w-lg p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-2">Unsafe Query</span>
                    <pre className="text-sm font-mono text-red-900 bg-red-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`SELECT * FROM users
WHERE username='${result.payload_received}'
AND password='123'`}
                    </pre>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-400">↓</div>
                  
                  {/* Step 3: Show Attack Result */}
                  <div className="w-full max-w-lg p-4 bg-red-100 rounded-lg border border-red-300 text-center shadow">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-1">Show Attack Result</span>
                    <span className="text-2xl font-extrabold text-red-700 block mt-1">
                      {result.success !== false ? "❌ Login Bypassed" : "✅ Secure / Login Failed"}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-400">↓</div>
                  
                  {/* Step 4: Show Secure Query */}
                  <div className="w-full max-w-lg p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                    <span className="font-semibold text-green-800 block text-xs uppercase tracking-wider mb-2">Show Secure Query</span>
                    <div className="mb-2">
                      <span className="inline-block bg-green-600 text-white font-bold px-3 py-1 rounded text-sm mb-2">
                        ✅ Parameterized Query
                      </span>
                    </div>
                    <pre className="text-sm font-mono text-green-900 bg-green-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`SELECT * FROM users
WHERE username = ?
AND password = ?`}
                    </pre>
                    <p className="text-xs text-green-800 mt-2 italic font-medium">
                      Parameters are bound separately. The database treats the input literally as a value, not executable SQL command.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* XSS Flow Visualization */}
            {selectedAttack === "xss" && (
              <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-3 uppercase tracking-wide">XSS Simulator Flow</h4>
                
                <div className="flex flex-col items-center space-y-4">
                  {/* Step 1: User Input */}
                  <div className="w-full max-w-lg p-4 bg-gray-50 rounded-lg border text-center shadow-inner">
                    <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wider mb-1">User Input</span>
                    <code className="text-lg font-mono text-blue-700 font-bold break-all">{result.payload_received}</code>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-400">↓</div>
                  
                  {/* Step 2: Show Attack Result */}
                  <div className="w-full max-w-lg p-4 bg-red-100 rounded-lg border border-red-300 text-center shadow">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-1">Show Attack Result</span>
                    <span className="text-2xl font-extrabold text-red-700 block mt-1">
                      {result.status === "Vulnerable Detected" ? "❌ Script Executed" : "✅ Safe / No Execution"}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-400">↓</div>
                  
                  {/* Step 3: Sanitized Output */}
                  <div className="w-full max-w-lg p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                    <span className="font-semibold text-green-800 block text-xs uppercase tracking-wider mb-2">Sanitized Output</span>
                    <pre className="text-sm font-mono text-green-900 bg-green-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {sanitizeHTML(result.payload_received)}
                    </pre>
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 4: Prevention Methods */}
                  <div className="w-full max-w-lg p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                    <span className="font-semibold text-blue-800 block text-xs uppercase tracking-wider mb-2">Prevention Methods</span>
                    <div className="text-sm text-blue-900 font-semibold leading-relaxed">
                      {result.prevention || "Use modern templating engines with auto-escaping, implement context-aware output encoding, and set a robust Content Security Policy (CSP)."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Command Injection Flow Visualization */}
            {selectedAttack === "cmdi" && (
              <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-3 uppercase tracking-wide">Command Injection Simulator Flow</h4>

                <div className="flex flex-col items-center space-y-4">
                  {/* Step 1: User Input */}
                  <div className="w-full max-w-lg p-4 bg-gray-50 rounded-lg border text-center shadow-inner">
                    <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wider mb-1">User Input</span>
                    <code className="text-lg font-mono text-blue-700 font-bold break-all">{result.payload_received}</code>
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 2: Unsafe os.system() */}
                  <div className="w-full max-w-lg p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-2">Unsafe Code — os.system()</span>
                    <pre className="text-sm font-mono text-red-900 bg-red-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`import os

user_input = "${result.payload_received}"

# ⚠️ Dangerous: directly passes user input to shell
os.system("ping " + user_input)
# Executes: ping 127.0.0.1 && whoami`}
                    </pre>
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 3: Output */}
                  <div className="w-full max-w-lg p-4 bg-red-100 rounded-lg border border-red-300 text-center shadow">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-1">Output</span>
                    <span className="text-2xl font-extrabold text-red-700 block mt-1">
                      {result.status === "Vulnerable Detected" ? "❌ Command Executed" : "✅ Blocked / Secure"}
                    </span>
                    {result.status === "Vulnerable Detected" && (
                      <p className="text-sm text-red-700 mt-2 italic">
                        The shell ran both <code className="font-mono bg-red-200 px-1 rounded">ping 127.0.0.1</code> <strong>and</strong> <code className="font-mono bg-red-200 px-1 rounded">whoami</code> due to the <code className="font-mono bg-red-200 px-1 rounded">&amp;&amp;</code> delimiter!
                      </p>
                    )}
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 4: Safe subprocess.run() */}
                  <div className="w-full max-w-lg p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                    <span className="font-semibold text-green-800 block text-xs uppercase tracking-wider mb-2">Safe Code — subprocess.run()</span>
                    <div className="mb-2">
                      <span className="inline-block bg-green-600 text-white font-bold px-3 py-1 rounded text-sm mb-3">
                        ✅ Argument List — No Shell
                      </span>
                    </div>
                    <pre className="text-sm font-mono text-green-900 bg-green-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`import subprocess

user_input = "${result.payload_received}"

# ✅ Safe: arguments passed as a list, no shell=True
subprocess.run(["ping", user_input], shell=False)
# && whoami is treated as a literal string, NOT a command`}
                    </pre>
                    <p className="text-xs text-green-800 mt-2 italic font-medium">
                      Passing arguments as a list prevents the shell from interpreting metacharacters like <code className="font-mono bg-green-200 px-1 rounded">&amp;&amp;</code>, <code className="font-mono bg-green-200 px-1 rounded">;</code>, or <code className="font-mono bg-green-200 px-1 rounded">||</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Path Traversal Flow Visualization */}
            {selectedAttack === "path-traversal" && (
              <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-3 uppercase tracking-wide">Path Traversal Simulator Flow</h4>

                <div className="flex flex-col items-center space-y-4">
                  {/* Step 1: User Input */}
                  <div className="w-full max-w-lg p-4 bg-gray-50 rounded-lg border text-center shadow-inner">
                    <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wider mb-1">Input</span>
                    <code className="text-lg font-mono text-blue-700 font-bold break-all">{result.payload_received}</code>
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 2: Unsafe File Access */}
                  <div className="w-full max-w-lg p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-2">Unsafe File Access Attempt</span>
                    <pre className="text-sm font-mono text-red-900 bg-red-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`// Vulnerable code:
const filePath = "/var/www/uploads/" + userInput;
fs.readFile(filePath);

// Resolves to:
/var/www/uploads/../../../etc/passwd
→ /etc/passwd  ⚠️`}
                    </pre>
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 3: Output */}
                  <div className="w-full max-w-lg p-4 bg-red-100 rounded-lg border border-red-300 text-center shadow">
                    <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-1">Output</span>
                    <span className="text-2xl font-extrabold text-red-700 block mt-1">
                      {result.status === "Vulnerable Detected" ? "❌ Unauthorized File Access" : "✅ Access Denied / Secure"}
                    </span>
                    {result.status === "Vulnerable Detected" && (
                      <p className="text-sm text-red-700 mt-2 italic">
                        Sensitive system files (e.g. /etc/passwd) exposed to the attacker!
                      </p>
                    )}
                  </div>

                  <div className="text-2xl font-bold text-gray-400">↓</div>

                  {/* Step 4: Protection */}
                  <div className="w-full max-w-lg p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                    <span className="font-semibold text-green-800 block text-xs uppercase tracking-wider mb-2">Protection</span>
                    <div className="mb-2">
                      <span className="inline-block bg-green-600 text-white font-bold px-3 py-1 rounded text-sm mb-3">
                        ✅ Whitelist Allowed Files
                      </span>
                    </div>
                    <pre className="text-sm font-mono text-green-900 bg-green-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`const ALLOWED_FILES = ["report.pdf", "data.csv"];

function getFile(userInput) {
  // Reject any path traversal sequences
  if (userInput.includes("..") || userInput.startsWith("/")) {
    return "Access Denied";
  }
  // Only serve whitelisted filenames
  if (!ALLOWED_FILES.includes(userInput)) {
    return "File Not Found";
  }
  return fs.readFile("/safe/dir/" + userInput);
}`}
                    </pre>
                    <p className="text-xs text-green-800 mt-2 italic font-medium">
                      Always validate and normalize file paths. Never concatenate raw user input directly into file system operations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-white rounded-xl shadow border">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Status</span>
                <span className={`text-xl font-bold ${result.success !== false ? 'text-red-600' : 'text-green-600'}`}>
                  {result.status}
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl shadow border">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Risk Score</span>
                <span className="text-xl font-bold text-gray-800">
                  {result.risk_score !== undefined ? `${result.risk_score} / 10` : '0.0 / 10'}
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl shadow border">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Attack Category</span>
                <span className="text-xl font-bold text-gray-800">
                  {result.attack || currentAttack.name}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl shadow border">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1 font-semibold">Payload Evaluated</span>
                <code className="text-sm font-mono text-gray-900 break-all">{result.payload_received}</code>
              </div>

              <div className="p-4 bg-white rounded-xl shadow border">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1 font-semibold">Security Analysis</span>
                <p className="text-gray-700 leading-relaxed">{result.analysis}</p>
              </div>

              {result.impact && (
                <div className="p-4 bg-white rounded-xl shadow border">
                  <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1 font-semibold">Potential Impact</span>
                  <p className="text-red-700 font-bold">{result.impact}</p>
                </div>
              )}

              {result.prevention && (
                <div className="p-4 bg-blue-50 rounded-xl shadow border border-blue-200">
                  <span className="text-blue-800 block text-xs uppercase tracking-wider mb-1 font-semibold">Remediation & Prevention Guidance</span>
                  <p className="text-blue-900 leading-relaxed font-semibold">{result.prevention}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Broken Authentication Flow Visualization */}
        {result && selectedAttack === "broken-auth" && (
          <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-3 uppercase tracking-wide">Brute Force Attack Simulator Flow</h4>

            <div className="flex flex-col items-center space-y-4">
              {/* Step 1: User Input */}
              <div className="w-full max-w-lg p-4 bg-gray-50 rounded-lg border text-center shadow-inner">
                <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wider mb-1">Input (Username)</span>
                <code className="text-lg font-mono text-blue-700 font-bold break-all">{result.payload_received}</code>
              </div>

              <div className="text-2xl font-bold text-gray-400">↓</div>

              {/* Step 2: Brute Force Simulation */}
              <div className="w-full max-w-lg p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-2">Brute Force Attack Simulation</span>
                <pre className="text-sm font-mono text-red-900 bg-red-100/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`// Vulnerable: No rate limiting or account lockout
// Attacker tries common passwords:
for password in ["password", "123456", "admin123", "qwerty"]:
    login("${result.payload_received}", password)
# SUCCESS after 4 attempts! `}
                </pre>
              </div>

              <div className="text-2xl font-bold text-gray-400">↓</div>

              {/* Step 3: Output */}
              <div className="w-full max-w-lg p-4 bg-red-100 rounded-lg border border-red-300 text-center shadow">
                <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-1">Output</span>
                <span className="text-2xl font-extrabold text-red-700 block mt-1">
                  {result.status === "Vulnerable Detected" ? "❌ Account Compromised" : "✅ Attack Blocked"}
                </span>
                {result.status === "Vulnerable Detected" && (
                  <p className="text-sm text-red-700 mt-2 italic">
                    Password found: <code className="font-mono bg-red-200 px-1 rounded">{result.password_found}</code>
                  </p>
                )}
              </div>

              <div className="text-2xl font-bold text-gray-400">↓</div>

              {/* Step 4: Protection */}
              <div className="w-full max-w-lg p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                <span className="font-semibold text-green-800 block text-xs uppercase tracking-wider mb-2">Protection Layer</span>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border border-green-200">
                    <span className="inline-block bg-green-600 text-white font-bold px-2 py-1 rounded text-xs mb-1">✅ MFA</span>
                    <p className="text-sm text-green-800">Multi-Factor Authentication requires additional verification beyond password.</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-green-200">
                    <span className="inline-block bg-green-600 text-white font-bold px-2 py-1 rounded text-xs mb-1">✅ Rate Limiting</span>
                    <p className="text-sm text-green-800">Limits login attempts to prevent rapid guessing.</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-green-200">
                    <span className="inline-block bg-green-600 text-white font-bold px-2 py-1 rounded text-xs mb-1">✅ Account Lockout</span>
                    <p className="text-sm text-green-800">Locks account after multiple failed attempts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default OwaspSimulator
