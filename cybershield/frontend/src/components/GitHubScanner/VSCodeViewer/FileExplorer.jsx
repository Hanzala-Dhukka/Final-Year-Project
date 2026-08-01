import "./FileExplorer.css";
import { FaFileCode } from "react-icons/fa";

export default function FileExplorer({
  files = [],
  selectedFile,
  onSelectFile
}) {
  return (
    <div className="vscode-sidebar">
      <div className="sidebar-header">
        EXPLORER
      </div>
      <div className="sidebar-files">
        {
          files.map((file, index) => (
            <div
              key={index}
              className={
                selectedFile === file.file
                  ? "sidebar-file active"
                  : "sidebar-file"
              }
              onClick={() => onSelectFile(file.file)}
            >
              <FaFileCode />
              <span>
                {file.file}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  )
}