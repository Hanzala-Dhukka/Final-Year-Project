import { FaFileCode } from "react-icons/fa";

export default function CurrentFile({ file, issue }) {
  return (
    <div className="current-file-card">
      <h3 className="current-file-title">
        <FaFileCode />
        Current File
      </h3>
      <h4 className="current-file-name">{file || "—"}</h4>
      <p className="current-file-issue">{issue || "Scanning..."}</p>
    </div>
  );
}
