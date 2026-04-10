'use client'

import { useState } from 'react'

// --- Placeholder Data ---
const MENU_DATA = [
  { id: 1, name: 'Classic Milk Tea', ingredients: 'Black Tea, Milk, Boba, Sugar Syrup', category: 'Milk Tea', price: 5.50 },
  { id: 2, name: 'Taro Slush', ingredients: 'Taro Powder, Ice, Milk, Sugar Syrup', category: 'Slush', price: 6.25 },
  { id: 3, name: 'Passion Fruit Tea', ingredients: 'Green Tea, Passion Fruit Syrup, Ice', category: 'Fruit Tea', price: 5.75 },
  { id: 4, name: 'Tiger Sugar Latte', ingredients: 'Brown Sugar Syrup, Milk, Boba, Ice', category: 'Specialty', price: 7.00 },
  { id: 5, name: 'Matcha Milk Tea', ingredients: 'Matcha Powder, Milk, Ice, Sugar Syrup', category: 'Milk Tea', price: 6.50 },
]

export default function MenuEditPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = MENU_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <input 
          type="text" 
          placeholder="Search Menu Name..." 
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer">
            - Remove Item
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
            + Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Ingredients</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{item.ingredients}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.price.toFixed(2)}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No menu items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}