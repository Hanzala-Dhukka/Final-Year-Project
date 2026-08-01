import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  FileCode,
  BarChart3,
  Loader2,
  Shield,
} from "lucide-react";
import {
  getFindings,
  getFindingsByFile,
  getFindingsSummary,
} from "../../api/findingsApi";
import FindingsTable from "./FindingsTable";
import FileTreeSidebar from "./FileTreeSidebar";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/40 rounded-xl border border-gray-700/30">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function ScanFindings({ scanId }) {
  const [findings, setFindings] = useState([]);
  const [files, setFiles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ severity: null, status: null });

  const loadData = useCallback(async () => {
    if (!scanId) return;
    setLoading(true);
    setError(null);
    try {
      const [findingsRes, filesRes, summaryRes] = await Promise.all([
        getFindings(scanId),
        getFindingsByFile(scanId),
        getFindingsSummary(scanId),
      ]);
      setFindings(findingsRes.findings || []);
      setFiles(filesRes.files || []);
      setSummary(summaryRes.summary || null);
    } catch (err) {
      console.error("Failed to load findings:", err);
      setError(err.response?.data?.detail || "Failed to load findings data");
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileSelect = useCallback((filePath) => {
    setSelectedFile((prev) => (prev === filePath ? null : filePath));
  }, []);

  const filteredFindings = useMemo(() => {
    if (!selectedFile) return findings;
    return findings.filter((f) => f.file === selectedFile);
  }, [findings, selectedFile]);

  const displayFindings = useMemo(() => {
    let result = filteredFindings;
    if (filters.severity) {
      result = result.filter((f) => f.severity === filters.severity);
    }
    if (filters.status) {
      result = result.filter((f) => (f.status || "Open") === filters.status);
    }
    return result;
  }, [filteredFindings, filters]);

  const avgConfidence = useMemo(() => {
    if (!findings.length) return 0;
    const sum = findings.reduce((acc, f) => acc + (f.confidence || 0), 0);
    return Math.round(sum / findings.length);
  }, [findings]);

  const criticalCount = useMemo(
    () => findings.filter((f) => f.severity === "Critical").length,
    [findings]
  );

  const affectedFilesCount = useMemo(() => {
    const fileSet = new Set();
    findings.forEach((f) => {
      if (f.file) fileSet.add(f.file);
    });
    return fileSet.size;
  }, [findings]);

  // Empty state: no scan ID
  if (!scanId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-4">
          <Shield size={32} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No scan selected</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Select a scan to view its security findings and vulnerability analysis.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading findings...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Error loading findings</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-4 flex-wrap"
      >
        <StatCard
          icon={BarChart3}
          label="Total Findings"
          value={findings.length}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={AlertCircle}
          label="Critical"
          value={criticalCount}
          color="bg-red-500/15 text-red-400"
        />
        <StatCard
          icon={FileCode}
          label="Files Affected"
          value={affectedFilesCount}
          color="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Avg Confidence"
          value={`${avgConfidence}%`}
          color="bg-green-500/15 text-green-400"
        />
      </motion.div>

      {/* Main content: sidebar + table */}
      <div className="flex flex-1 min-h-0 gap-0 rounded-xl border border-gray-800/50 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] shrink-0">
          <FileTreeSidebar
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Main area */}
        <motion.div
          className="flex-1 overflow-auto p-4"
          layout
          transition={{ duration: 0.2 }}
        >
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-3"
            >
              <span className="text-xs text-gray-500">Filtered by:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-xs font-mono">
                {selectedFile}
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-1 hover:text-white transition-colors"
                >
                  ×
                </button>
              </span>
              <span className="text-[10px] text-gray-600">
                ({filteredFindings.length} finding{filteredFindings.length !== 1 ? "s" : ""})
              </span>
            </motion.div>
          )}

          <FindingsTable
            findings={displayFindings}
            onFileClick={handleFileSelect}
            scanId={scanId}
          />
        </motion.div>
      </div>
    </div>
  );
}
