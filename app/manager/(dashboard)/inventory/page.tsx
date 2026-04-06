'use client'

import { useState } from 'react'

// --- Placeholder Data ---
const INVENTORY_DATA = [
  { id: 1, name: 'Black Tea Leaves', stock: 120, used: 450 },
  { id: 2, name: 'Boba Pearls', stock: 15, used: 890 }, // Low stock example
  { id: 3, name: 'Brown Sugar Syrup', stock: 45, used: 320 },
  { id: 4, name: 'Whole Milk', stock: 8, used: 600 },
  { id: 5, name: 'Taro Powder', stock: 55, used: 210 },
  { id: 6, name: 'Passion Fruit Syrup', stock: 30, used: 150 },
  { id: 7, name: 'Ice', stock: 500, used: 2500 },
]

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = INVENTORY_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Low Stock" main="Whole Milk" sub="8 units left" alert />
        <StatCard title="Most Used Ingredient" main="Ice" sub="2,500 units used" />
        <StatCard title="Least Used Ingredient" main="Passion Fruit Syrup" sub="150 units used" />
      </div>

      {/* Controls */}
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
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
          + Add Item
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ingredient</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Used</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.stock < 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.used}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No ingredients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, main, sub, alert = false }: { title: string, main: string, sub: string, alert?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <span className="text-sm font-medium text-gray-500 mb-2">{title}</span>
      <h3 className={`text-2xl font-bold truncate ${alert ? 'text-red-600' : 'text-gray-900'}`}>{main}</h3>
      <span className="text-sm text-gray-500 mt-1">{sub}</span>
    </div>
  )
}