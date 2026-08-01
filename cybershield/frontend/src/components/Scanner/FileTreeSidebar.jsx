import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

function buildFileTree(files) {
  const tree = {};
  for (const item of files) {
    const parts = item.file.split("/");
    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = { __children: {}, __meta: null };
      current = current[parts[i]].__children;
    }
    current[parts[parts.length - 1]] = { __children: null, __meta: item };
  }
  return tree;
}

function aggregateSeverityCounts(node) {
  const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

  if (node.__meta) {
    counts.total = node.__meta.count || 0;
    counts.critical = node.__meta.critical || 0;
    counts.high = node.__meta.high || 0;
    counts.medium = node.__meta.medium || 0;
    counts.low = node.__meta.low || 0;
    return counts;
  }

  if (node.__children) {
    for (const child of Object.values(node.__children)) {
      const childCounts = aggregateSeverityCounts(child);
      counts.total += childCounts.total;
      counts.critical += childCounts.critical;
      counts.high += childCounts.high;
      counts.medium += childCounts.medium;
      counts.low += childCounts.low;
    }
  }

  return counts;
}

function hasCritical(node) {
  if (node.__meta) return (node.__meta.critical || 0) > 0;
  if (node.__children) {
    return Object.values(node.__children).some(hasCritical);
  }
  return false;
}

function SeverityDots({ counts }) {
  const dots = [];
  if (counts.critical > 0) dots.push({ color: "bg-red-500", count: counts.critical });
  if (counts.high > 0) dots.push({ color: "bg-orange-500", count: counts.high });
  if (counts.medium > 0) dots.push({ color: "bg-yellow-500", count: counts.medium });
  if (counts.low > 0) dots.push({ color: "bg-green-500", count: counts.low });

  if (dots.length === 0) return null;

  return (
    <div className="flex items-center gap-1 ml-auto">
      {dots.map((dot, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
          <span className="text-[9px] text-gray-500">{dot.count}</span>
        </span>
      ))}
    </div>
  );
}

function TreeNode({ name, node, depth, selectedFile, onFileSelect, basePath }) {
  const isFile = node.__children === null;
  const currentPath = basePath ? `${basePath}/${name}` : name;
  const [expanded, setExpanded] = useState(() => {
    if (isFile) return false;
    return hasCritical(node);
  });

  const counts = useMemo(() => aggregateSeverityCounts(node), [node]);
  const isSelected = isFile && selectedFile === currentPath;

  const handleClick = useCallback(() => {
    if (isFile) {
      onFileSelect(currentPath);
    } else {
      setExpanded((prev) => !prev);
    }
  }, [isFile, currentPath, onFileSelect]);

  if (isFile) {
    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors group ${
          isSelected
            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
            : "text-gray-300 hover:bg-gray-800/50 border border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <FileCode
          size={14}
          className={`shrink-0 ${
            isSelected ? "text-blue-400" : "text-gray-500 group-hover:text-gray-400"
          }`}
        />
        <span className="text-xs font-mono truncate flex-1">{name}</span>
        {counts.total > 0 && (
          <span className="text-[10px] text-gray-500 shrink-0 mr-1">
            {counts.total}
          </span>
        )}
        <SeverityDots counts={counts} />
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-gray-300 hover:bg-gray-800/50 transition-colors group border border-transparent"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="text-gray-500 shrink-0">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {expanded ? (
          <FolderOpen size={14} className="text-blue-400/70 shrink-0" />
        ) : (
          <Folder size={14} className="text-gray-500 group-hover:text-gray-400 shrink-0" />
        )}
        <span className="text-xs font-medium truncate flex-1">{name}</span>
        <span className="text-[10px] text-gray-500 shrink-0 mr-1">
          {counts.total}
        </span>
        <SeverityDots counts={counts} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {Object.entries(node.__children)
              .sort(([aName, aNode], [bName, bNode]) => {
                const aIsFile = aNode.__children === null;
                const bIsFile = bNode.__children === null;
                if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
                return aName.localeCompare(bName);
              })
              .map(([childName, childNode]) => (
                <TreeNode
                  key={childName}
                  name={childName}
                  node={childNode}
                  depth={depth + 1}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                  basePath={currentPath}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FileTreeSidebar({ files = [], selectedFile, onFileSelect }) {
  const [allExpanded, setAllExpanded] = useState(true);

  const tree = useMemo(() => buildFileTree(files), [files]);

  const totalFiles = files.length;
  const totalFindings = useMemo(
    () => files.reduce((sum, f) => sum + (f.count || 0), 0),
    [files]
  );

  const directoryCount = useMemo(() => {
    const dirs = new Set();
    for (const f of files) {
      const parts = f.file.split("/");
      for (let i = 0; i < parts.length - 1; i++) {
        dirs.add(parts.slice(0, i + 1).join("/"));
      }
    }
    return dirs.size;
  }, [files]);

  return (
    <div className="flex flex-col h-full bg-gray-900/50 border-r border-gray-800/50">
      {/* Header */}
      <div className="p-3 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            File Browser
          </h3>
          <button
            onClick={() => setAllExpanded((prev) => !prev)}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <FileCode size={10} />
            {totalFiles} files
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle size={10} />
            {totalFindings} findings
          </span>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {Object.entries(tree)
          .sort(([aName, aNode], [bName, bNode]) => {
            const aIsFile = aNode.__children === null;
            const bIsFile = bNode.__children === null;
            if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
            return aName.localeCompare(bName);
          })
          .map(([name, node]) => (
            <TreeNode
              key={name}
              name={name}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              basePath=""
            />
          ))}
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileCode size={20} className="text-gray-700 mb-2" />
            <p className="text-xs text-gray-600">No files with findings</p>
          </div>
        )}
      </div>
    </div>
  );
}
