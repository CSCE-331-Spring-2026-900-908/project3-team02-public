'use client'

import { useState } from 'react'

const ORDERS_DATA = [
  { id: 1, name: 'Classic Milk Tea', ordered: 1240, revenue: 6820.00 },
  { id: 2, name: 'Taro Slush', ordered: 890, revenue: 5562.50 },
  { id: 3, name: 'Brown Sugar Milk Tea', ordered: 845, revenue: 5703.75 },
  { id: 4, name: 'Passion Fruit Tea', ordered: 620, revenue: 3565.00 },
]

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [chartMode, setChartMode] = useState<'all' | 'item'>('all')

  const filteredData = ORDERS_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 h-full flex flex-col p-8">
      {/* Stats Panel */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="#1 Most Popular" main="Classic Milk Tea" sub="1,240 orders" />
        <StatCard title="#2 Most Popular" main="Taro Slush" sub="890 orders" />
        <StatCard title="#3 Most Popular" main="Brown Sugar Milk Tea" sub="845 orders" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
            Date Range
          </button>
          <input 
            type="text" 
            placeholder="Search Items..." 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area: Table and Chart */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Times Ordered</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.ordered}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="w-1/3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="chartMode" checked={chartMode === 'all'} onChange={() => setChartMode('all')} className="accent-blue-600" />
              All Orders
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="chartMode" checked={chartMode === 'item'} onChange={() => setChartMode('item')} className="accent-blue-600" />
              By Item
            </label>
          </div>
          <div className="flex-1 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <p className="text-sm text-gray-500 text-center px-4">
              Line Chart implementation pending.<br/>(Use Recharts or Chart.js here)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, main, sub }: { title: string, main: string, sub: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <span className="text-sm font-medium text-gray-500 mb-2 block">{title}</span>
      <h3 className="text-2xl font-bold text-gray-900 truncate">{main}</h3>
      <span className="text-sm text-gray-500 mt-1 block">{sub}</span>
    </div>
  )
}