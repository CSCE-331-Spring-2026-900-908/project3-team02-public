// src/app/manager/(protected)/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface InventoryItem {
  ingredientid: number;
  ingredient: string;
  units: string;
  current_stock: number;
  estimated_used: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  
  // Form States
  const [formName, setFormName] = useState('')
  const [formQty, setFormQty] = useState('')

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      setInventory(data)
    } catch (error) {
      console.error('Failed to fetch inventory', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  // Calculate Statistics
  let lowestStock = { name: '--', stock: Infinity }
  let mostUsed = { name: '--', used: -1 }
  let leastUsed = { name: '--', used: Infinity }

  inventory.forEach(item => {
    if (item.current_stock < lowestStock.stock) lowestStock = { name: item.ingredient, stock: item.current_stock }
    if (item.estimated_used > mostUsed.used) mostUsed = { name: item.ingredient, used: item.estimated_used }
    if (item.estimated_used < leastUsed.used) leastUsed = { name: item.ingredient, used: item.estimated_used }
  })

  const filteredData = inventory.filter(item => 
    item.ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName: formName, quantity: parseInt(formQty) })
    })
    
    if (res.ok) {
      setIsAddModalOpen(false)
      setFormName(''); setFormQty('')
      fetchInventory()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to add item')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return

    const res = await fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientId: editItem.ingredientid, itemName: formName, quantity: parseInt(formQty) })
    })
    
    if (res.ok) {
      setEditItem(null)
      fetchInventory()
    } else {
      alert('Failed to update item')
    }
  }

  const openEditModal = (item: InventoryItem) => {
    setEditItem(item)
    setFormName(item.ingredient)
    setFormQty(item.current_stock.toString())
  }

  return (
    <div className="space-y-6 p-8 h-full flex flex-col relative">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard 
          title="Low Stock" 
          main={lowestStock.stock === Infinity ? '--' : lowestStock.name} 
          sub={lowestStock.stock === Infinity ? '--' : `${lowestStock.stock} units left`} 
          alert={lowestStock.stock < 20} 
        />
        <StatCard 
          title="Most Used Ingredient" 
          main={mostUsed.used === -1 ? '--' : mostUsed.name} 
          sub={mostUsed.used === -1 ? '--' : `${mostUsed.used} units used`} 
        />
        <StatCard 
          title="Least Used Ingredient" 
          main={leastUsed.used === Infinity ? '--' : leastUsed.name} 
          sub={leastUsed.used === Infinity ? '--' : `${leastUsed.used} units used`} 
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search Items..." 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setFormName(''); setFormQty(''); setIsAddModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
        >
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
              {isLoading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">Loading inventory...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No ingredients found.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr 
                    key={item.ingredientid} 
                    onDoubleClick={() => openEditModal(item)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    title="Double click to edit"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.ingredient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.current_stock < 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.estimated_used}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Modal Component for Add/Edit */}
      {(isAddModalOpen || editItem) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editItem ? 'Edit Inventory' : 'Add Inventory Item'}</h2>
            <form onSubmit={editItem ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input required type="number" value={formQty} onChange={e => setFormQty(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditItem(null); }} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer">{editItem ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
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