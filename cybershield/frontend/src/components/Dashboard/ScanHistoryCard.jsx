import { motion } from "framer-motion";

/**
 * Module E4, Step 11 — Scan History Card.
 * Displays a table of recent security scans.
 */
export default function ScanHistoryCard({ scans }) {
  if (!scans || scans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Scans
        </h2>
        <p className="text-sm text-gray-400">No scans yet. Run a GitHub scan to get started.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Recent Scans
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Repository</th>
              <th className="pb-2 font-medium text-center">Score</th>
              <th className="pb-2 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => {
              const score = scan.security_score ?? 0;
              const scoreColor =
                score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";

              return (
                <tr key={scan.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-medium text-gray-800 truncate max-w-[160px]">
                    {scan.repository}
                  </td>
                  <td className={`py-2.5 text-center font-semibold ${scoreColor}`}>
                    {score}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      {scan.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
