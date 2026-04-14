'use client'

import { useState } from 'react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('hourly')
  const [reportData, setReportData] = useState<any[]>([])
  const [zResult, setZResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchXReport = async () => {
    setLoading(true); setZResult(null);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`)
      const data = await res.json()
      setReportData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const runZReport = async () => {
    if (!confirm('Finalize today\'s business? This will reset the X-Report views.')) return
    setLoading(true); setReportData([]);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeSignature: 'Manager' })
      })
      const result = await res.json()
      if (res.ok) setZResult(result)
      else alert(result.error)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 flex flex-col h-full bg-white">
      {/* Selection Bar */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="hourly">Hourly Activity (X-Report)</option>
            <option value="payments">Payment Methods (X-Report)</option>
            <option value="employees">Employee Performance (X-Report)</option>
          </select>
          <button 
            onClick={fetchXReport} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {loading ? 'Generating...' : 'Generate X-Report'}
          </button>
        </div>
        <button 
          onClick={runZReport} 
          className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
        >
          Finalize Z-Report
        </button>
      </div>

      {/* Main Report Display */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {zResult ? (
          <div className="p-12 max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center border-b pb-4 text-gray-800">End of Day Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Report ID:</span>
                <span className="font-mono text-gray-900 font-bold">#{zResult.reportId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transactions:</span>
                <span className="text-gray-900">{zResult.summary.tx_count}</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t pt-4 text-blue-600">
                <span>Net Sales:</span>
                <span>${Number(zResult.summary.sales).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 border-b pb-4">
                <span>Tax:</span>
                <span>${Number(zResult.summary.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 italic">Cash Total:</span>
                <span className="text-gray-700 font-medium">${Number(zResult.summary.cash).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 italic">Card Total:</span>
                <span className="text-gray-700 font-medium">${Number(zResult.summary.card).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Metric — Details</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-gray-400 italic">Select a report and click generate.</td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {row.label}
                        <span className="ml-3 text-[10px] text-gray-400 font-normal">({row.count} orders)</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">
                        ${Number(row.value).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}