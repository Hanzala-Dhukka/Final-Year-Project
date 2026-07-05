"""
app/data/risky_packages.py
Educational rules for known-risky packages.
Not live CVE data — used for instructional purposes in a final-year project.
"""

RISKY_PACKAGES = {
    # Python
    "pickle":           {"severity": "High",     "reason": "Unsafe deserialization — can execute arbitrary code"},
    "pyyaml":           {"severity": "Medium",   "reason": "yaml.load() without Loader is unsafe; use safe_load()"},
    "yaml":             {"severity": "Medium",   "reason": "yaml.load() without Loader is unsafe; use safe_load()"},
    "marshal":          {"severity": "High",     "reason": "Unsafe serialization; do not deserialize untrusted data"},
    "shelve":           {"severity": "Medium",   "reason": "Built on pickle; unsafe with untrusted data"},
    "subprocess":       {"severity": "Medium",   "reason": "Can enable command injection if input is not sanitised"},
    "os":               {"severity": "Low",      "reason": "os.system() and popen() can introduce command injection"},
    "eval":             {"severity": "High",     "reason": "eval() on untrusted input enables arbitrary code execution"},
    "exec":             {"severity": "High",     "reason": "exec() on untrusted input enables arbitrary code execution"},
    "paramiko":         {"severity": "Low",      "reason": "Ensure host-key verification is enabled"},
    "cryptography":     {"severity": "Low",      "reason": "Older versions had known vulnerabilities; keep updated"},
    "pyopenssl":        {"severity": "Low",      "reason": "Keep updated; older versions had SSL vulnerabilities"},
    "jinja2":           {"severity": "Medium",   "reason": "Template injection risk if user input enters templates"},
    "markupsafe":       {"severity": "Low",      "reason": "Outdated versions had XSS risks"},
    "sqlalchemy":       {"severity": "Low",      "reason": "Use parameterised queries; avoid raw string SQL"},
    "pymysql":          {"severity": "Low",      "reason": "Use parameterised queries to prevent SQL injection"},
    "python-dotenv":    {"severity": "Low",      "reason": "Ensure .env files are excluded from version control"},

    # JavaScript / Node
    "lodash":           {"severity": "Medium",   "reason": "Historical prototype pollution vulnerabilities"},
    "log4j":            {"severity": "Critical", "reason": "Log4Shell — known remote code execution (CVE-2021-44228)"},
    "moment":           {"severity": "Low",      "reason": "Deprecated; switch to date-fns or Day.js"},
    "axios":            {"severity": "Low",      "reason": "Older versions had SSRF and redirect vulnerabilities"},
    "node-fetch":       {"severity": "Low",      "reason": "Older versions had redirect and SSRF issues"},
    "ejs":              {"severity": "High",     "reason": "Older versions vulnerable to template injection / RCE"},
    "express":          {"severity": "Low",      "reason": "Keep updated; use Helmet.js for security headers"},
    "jsonwebtoken":     {"severity": "Medium",   "reason": "Algorithm confusion attacks in older versions"},
    "webpack":          {"severity": "Low",      "reason": "Older versions had known XSS in DevServer"},
    "serialize-javascript": {"severity": "High", "reason": "Older versions had XSS via unsafe serialization"},
    "dot-prop":         {"severity": "High",     "reason": "Older versions vulnerable to prototype pollution"},
    "minimist":         {"severity": "High",     "reason": "Older versions vulnerable to prototype pollution"},
    "handlebars":       {"severity": "High",     "reason": "Template injection and prototype pollution in old versions"},
    "marked":           {"severity": "Medium",   "reason": "XSS risk if output is not sanitised before rendering"},
    "dompurify":        {"severity": "Low",      "reason": "Keep updated; older versions had bypass XSS vulnerabilities"},

    # Java
    "log4j-core":       {"severity": "Critical", "reason": "Log4Shell — critical RCE vulnerability (CVE-2021-44228)"},
    "commons-collections": {"severity": "High",  "reason": "Deserialization RCE in older versions"},
    "xstream":          {"severity": "Critical", "reason": "Multiple deserialization RCE vulnerabilities"},
    "fastjson":         {"severity": "High",     "reason": "Multiple deserialization RCE vulnerabilities"},
    "jackson-databind": {"severity": "Medium",   "reason": "Older versions had deserialization issues; keep updated"},

    # PHP
    "phpmailer":        {"severity": "High",     "reason": "Older versions had remote code execution vulnerabilities"},
    "guzzlehttp/guzzle":{"severity": "Low",      "reason": "Older versions had SSRF issues; keep updated"},
}
