'use client'

import { useState } from 'react'

type ReportType = 'Hourly Sales Activity' | 'Payment Methods' | 'Employee Sales'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('Hourly Sales Activity')
  const [reportData, setReportData] = useState<any[]>([])

  const handleGenerateXReport = () => {
    // Placeholder logic for generating a report
    if (reportType === 'Hourly Sales Activity') {
      setReportData([
        { col1: '12:00 PM', col2: 45, col3: '$250.50' },
        { col1: '1:00 PM', col2: 32, col3: '$180.25' },
      ])
    } else {
      setReportData([
        { col1: 'Data', col2: 'for', col3: reportType }
      ])
    }
  }

  const handleGenerateZReport = () => {
    const confirm = window.confirm("Generate Z-Report?\n\nThis will finalize all unprocessed sales, zero out the register, and can only run ONCE per day.")
    if (confirm) {
      alert("Z-Report Generated Successfully!")
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col p-8 max-w-5xl mx-auto">
      
      {/* Top Panel: X-Reports */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select X-Report Type:</label>
        <select 
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
        >
          <option>Hourly Sales Activity (X-Report)</option>
          <option>Payment Methods (X-Report)</option>
          <option>Employee Sales (X-Report)</option>
        </select>
        <button 
          onClick={handleGenerateXReport}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Generate X-Report
        </button>
      </div>

      {/* Center Panel: Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto p-4 h-full">
          {reportData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Select a report type and click generate to view data.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Column 1</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Column 2</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Column 3</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{row.col1}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.col2}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{row.col3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Panel: Z-Report */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">End of Day Procedures</h3>
          <p className="text-sm text-gray-500 mt-1">Finalize daily sales and zero out the register.</p>
        </div>
        <button 
          onClick={handleGenerateZReport}
          className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
        >
          Generate Z-Report
        </button>
      </div>

    </div>
  )
}