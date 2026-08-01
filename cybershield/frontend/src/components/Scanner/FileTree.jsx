import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiList } from "react-icons/fi";

function FileNode({ name, path, children, depth }) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = children && children.length > 0;

  return (
    <div className="ft-node">
      <div
        className="ft-node-row"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isDir && setOpen(!open)}
      >
        {isDir ? (
          open ? <FiChevronDown /> : <FiChevronRight />
        ) : (
          <span className="ft-spacer" />
        )}
        <span className={`ft-icon ${isDir ? "dir" : "file"}`}>
          {isDir ? <FiFolder /> : <FiFile />}
        </span>
        <span className="ft-name">{name}</span>
      </div>
      <AnimatePresence>
        {open && isDir && (
          <motion.div
            className="ft-children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children.map((child) => (
              <FileNode key={child.path} {...child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function buildTree(filePaths, maxDepth = 3) {
  const root = { name: "/", children: {}, type: "dir" };

  for (const fp of filePaths) {
    const parts = fp.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: {},
          type: i < parts.length - 1 ? "dir" : "file",
        };
      }
      if (i < parts.length - 1) {
        current = current.children[part];
      }
    }
  }

  function toNodes(node) {
    const dirs = [];
    const files = [];
    for (const child of Object.values(node.children)) {
      if (child.type === "dir") {
        dirs.push({
          ...child,
          children: toNodes(child),
        });
      } else {
        files.push({ ...child, children: [] });
      }
    }
    return [...dirs, ...files];
  }

  return toNodes(root);
}

export default function FileTree({ files = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const tree = useMemo(() => buildTree(files), [files]);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return tree;
    const term = searchTerm.toLowerCase();
    const filtered = files.filter((f) => f.toLowerCase().includes(term));
    return filtered.map((f) => ({
      name: f.split("/").pop(),
      path: f,
      children: [],
      type: "file",
    }));
  }, [tree, files, searchTerm]);

  const displayed = expanded ? filteredTree : filteredTree.slice(0, 20);

  return (
    <div className="widget-card file-tree-card">
      <div className="widget-header">
        <FiList />
        <h2>File Tree</h2>
        <span className="file-tree-count">{files.length} files</span>
      </div>

      <div className="file-tree-search">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="file-tree-list">
        {displayed.map((node) => (
          <FileNode key={node.path} {...node} depth={0} />
        ))}
        {displayed.length === 0 && (
          <div className="file-tree-empty">No files found</div>
        )}
      </div>

      {!searchTerm && filteredTree.length > 20 && (
        <button
          className="file-tree-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show Less" : `Show All (${filteredTree.length})`}
        </button>
      )}
    </div>
  );
}
