export function mapScanResult(data) {
  const repo = data.repository_info || {};
  const summary = data.scan_summary || {};
  const ai = data.ai_report || {};
  const dependency = data.dependency_report || {};
  const dependencyFindings = data.dependency_findings || [];
  const findings = data.findings || [];
  const fileReport = data.file_report || [];

  return {
    /* -------------------------------- */
    repository: {
      name: repo.repository || "",
      owner: repo.owner || "",
      description: repo.description || "",
      defaultBranch: repo.default_branch || "",
      language: repo.language || "",
      visibility: repo.visibility || "",
      license: repo.license || "",
      stars: repo.stars || 0,
      forks: repo.forks || 0,
      issues: repo.open_issues || 0,
      topics: repo.topics || [],
      createdAt: repo.created_at || "",
      updatedAt: repo.updated_at || "",
      lastCommit: repo.last_commit || "",
    },
    /* -------------------------------- */
    technologies: {
      languages: data.technologies?.language || [],
      backend: data.technologies?.backend || [],
      frontend: data.technologies?.frontend || [],
      database: data.technologies?.database || [],
      devops: data.technologies?.devops || [],
    },
    /* -------------------------------- */
    dependency: {
      totalPackages: dependency.total_packages || 0,
      outdated: dependency.outdated || 0,
      risky: dependency.risky || 0,
      unpinned: dependency.unpinned || 0,
      files: dependency.files_scanned || [],
      findings: dependencyFindings,
    },
    /* -------------------------------- */
    scan: {
      summary: summary.summary || "",
      filesWithIssues: summary.total_files_with_issues || 0,
      severity: summary.severity_counts || {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
      },
      riskLevel: summary.risk_level || "",
      recommendation: summary.recommendation || "",
      recommendations: summary.recommendations || [],
    },
    /* -------------------------------- */
    findings: findings.map((item) => ({
      ...item,
      line: item.line || 1,
      column: item.column || item.column_start || 1,
      file: item.file || "",
      message: item.message || "",
      recommendation: item.recommendation || "",
      intelligence: item.intelligence || null,
    })),
    fileReport,
    /* -------------------------------- */
    ai: {
      summary: ai.summary || "",
      riskLevel: ai.risk_level || "",
      businessImpact: ai.business_impact || [],
      recommendations: ai.recommendations || [],
      dependencyAnalysis: ai.dependency_analysis || "",
    },
    /* -------------------------------- */
    riskDashboard: data.risk_dashboard || null,
  };
}