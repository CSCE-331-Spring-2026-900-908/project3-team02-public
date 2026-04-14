// src/app/manager/(protected)/menu-edit/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface Ingredient {
  id: number;
  name: string;
}

interface MenuItem {
  itemid: number;
  itemname: string;
  category: string;
  price: string | number;
  ingredients: Ingredient[];
}

interface InventoryItem {
  ingredientid: number;
  ingredient: string;
}

const CATEGORIES = ["milk tea", "fruit tea", "specialty", "slush", "refresher", "snack"];

export default function MenuEditPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  
  // Form States
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formPrice, setFormPrice] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch both APIs simultaneously
      const [menuRes, invRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/inventory')
      ])
      const menuData = await menuRes.json()
      const invData = await invRes.json()
      
      setMenuItems(menuData)
      setInventory(invData)
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = menuItems.filter(item => 
    item.itemname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleIngredient = (id: number) => {
    setSelectedIngredients(prev => 
      prev.includes(id) ? prev.filter(ingId => ingId !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = '/api/menu'
    const method = editItem ? 'PUT' : 'POST'
    const body = {
      itemId: editItem?.itemid,
      itemName: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      ingredientIds: selectedIngredients
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      closeModal()
      fetchData()
    } else {
      alert('Operation failed')
    }
  }

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    
    const res = await fetch(`/api/menu?id=${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      fetchData()
    } else {
      alert('Failed to delete item')
    }
  }

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditItem(item)
      setFormName(item.itemname)
      setFormCategory(item.category)
      setFormPrice(item.price.toString())
      setSelectedIngredients(item.ingredients.map(ing => ing.id))
    } else {
      setEditItem(null)
      setFormName('')
      setFormCategory(CATEGORIES[0])
      setFormPrice('')
      setSelectedIngredients([])
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditItem(null)
  }

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <input 
          type="text" 
          placeholder="Search Menu Items..." 
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => openModal()}
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
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Ingredients</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Loading menu...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No items found.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr 
                    key={item.itemid} 
                    onDoubleClick={() => openModal(item)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.itemname}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {item.ingredients.length > 0 
                        ? item.ingredients.map(i => i.name).join(', ') 
                        : <span className="italic text-gray-400">None</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">${Number(item.price).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button onClick={() => handleDelete(item.itemid)} className="text-red-500 hover:text-red-700 font-medium px-2 cursor-pointer">Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Modal Component for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none capitalize">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input required type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Ingredient Checklist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients (Check to associate)</label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                    {inventory.map(inv => (
                      <label key={inv.ingredientid} className="flex items-center gap-3 p-1 cursor-pointer hover:bg-gray-100 rounded">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          checked={selectedIngredients.includes(inv.ingredientid)}
                          onChange={() => toggleIngredient(inv.ingredientid)}
                        />
                        <span className="text-sm text-gray-800">{inv.ingredient}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-auto border-t border-gray-100">
                <button type="button" onClick={closeModal} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer">{editItem ? 'Save Changes' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}