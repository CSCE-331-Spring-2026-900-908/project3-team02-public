// src/app/manager/(protected)/product-usage/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface UsageRecord {
  ingredient: string;
  units: string;
  amount_used: string | number;
}

export default function ProductUsagePage() {
  const [usageData, setUsageData] = useState<UsageRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Default to the last 30 days
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const fetchUsage = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/usage?start=${startDate}&end=${endDate}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsageData(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  const filteredTableData = usageData.filter(item => 
    item.ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Only show top 15 for the chart to prevent cluttering
  const chartDisplayData = usageData.slice(0, 15).map(item => ({
    ...item,
    amount: Number(item.amount_used)
  }))

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none p-0 text-sm focus:ring-0" />
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none p-0 text-sm focus:ring-0" />
          </div>
          <button onClick={fetchUsage} className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
            Generate Report
          </button>
        </div>
        
        <input 
          type="text" 
          placeholder="Search Ingredients..." 
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Horizontal Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-6 text-center">Ingredient Usage Trends (Top 15)</h3>
          <div className="flex-1 w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartDisplayData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="ingredient" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#4b5563' }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value, name, props) => [`${value} ${props.payload.units}`, 'Amount Used']}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartDisplayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#4682B4" /> // SteelBlue from Java implementation
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ingredient</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Amount Used</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Units</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">Calculating usage...</td></tr>
                ) : filteredTableData.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No usage data found for this range.</td></tr>
                ) : (
                  filteredTableData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.ingredient}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right font-mono font-bold">
                        {Number(item.amount_used).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.units}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}