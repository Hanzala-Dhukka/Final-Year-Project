export default function ScanProgress({ loading, progress = 0, stage = "Initializing..." }) {
  if (!loading) return null

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Scanning Repository...</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-700">{stage}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-600 text-center">{progress}%</p>
      </div>
    </div>
  )
}