/**
 * Certificate card (spec Step 13/15). Shows a certificate and download button.
 */
export default function CertificateCard({ certificate, onDownload }) {
  if (!certificate) return null;
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
      <div className="text-xs text-gray-400">Certificate of Achievement</div>
      <div className="font-semibold text-gray-800">{certificate.course}</div>
      <div className="text-sm text-gray-500">Score: {certificate.score}%</div>
      <div className="text-xs text-gray-400">
        Issued: {new Date(certificate.issued_at).toLocaleDateString()}
      </div>
      <button
        onClick={() => onDownload && onDownload(certificate.certificate_id)}
        className="mt-3 w-full px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        ⬇ Download PDF
      </button>
    </div>
  );
}
