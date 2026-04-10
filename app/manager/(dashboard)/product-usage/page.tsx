'use client'

import { useState } from 'react'

const USAGE_DATA = [
  { id: 1, ingredient: 'Black Tea Leaves', amount: 450, unit: 'oz' },
  { id: 2, ingredient: 'Boba Pearls', amount: 890, unit: 'lbs' },
  { id: 3, ingredient: 'Brown Sugar Syrup', amount: 320, unit: 'fl oz' },
  { id: 4, ingredient: 'Whole Milk', amount: 600, unit: 'gal' },
  { id: 5, ingredient: 'Ice', amount: 1200, unit: 'lbs' },
]

export default function ProductUsagePage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = USAGE_DATA.filter(item => 
    item.ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 h-full flex flex-col p-8">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Start:</label>
          <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">End:</label>
          <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500" />
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
          Generate
        </button>
        
        <div className="flex-1"></div> {/* Spacer */}

        <input 
          type="text" 
          placeholder="Search Ingredients..." 
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {/* Chart Area */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Ingredient Usage</h3>
          <div className="flex-1 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
             <p className="text-sm text-gray-500 text-center px-4">
              Horizontal Bar Chart implementation pending.
            </p>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ingredient</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Amount Used</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Units</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.ingredient}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}