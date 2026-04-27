// src/app/manager/(protected)/employees/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface Employee {
  employeeid: number;
  name: string;
  email: string | null;
  role: string;
  orders_processed: number;
  total_sales: string | number;
}

const ROLES = ["cashier", "barista", "manager"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Employee | null>(null)
  
  // Form States
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState(ROLES[0])

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const filteredData = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = '/api/employees'
    const method = editItem ? 'PUT' : 'POST'
    const body = {
      employeeId: editItem?.employeeid,
      name: formName,
      email: formEmail,
      role: formRole
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      closeModal()
      fetchEmployees()
    } else {
      const data = await res.json()
      alert(data.error || 'Operation failed')
    }
  }

  const handleDelete = async (employeeId: number) => {
    if (!confirm('Are you sure you want to remove this employee? Ensure they have no historical sales.')) return
    
    const res = await fetch(`/api/employees?id=${employeeId}`, { method: 'DELETE' })
    if (res.ok) {
      fetchEmployees()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete employee')
    }
  }

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditItem(emp)
      setFormName(emp.name)
      setFormEmail(emp.email || '')
      setFormRole(emp.role)
    } else {
      setEditItem(null)
      setFormName('')
      setFormEmail('')
      setFormRole(ROLES[0])
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
          placeholder="Search Name..." 
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
        >
          + Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Auth Email</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Orders Processed</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Loading employees...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No employees found.</td></tr>
              ) : (
                filteredData.map(emp => (
                  <tr 
                    key={emp.employeeid} 
                    onDoubleClick={() => openModal(emp)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {emp.name} <span className="text-gray-400 font-normal text-xs ml-2">#{emp.employeeid}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{emp.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email || <span className="italic text-gray-400">None Set</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.orders_processed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">${Number(emp.total_sales).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button onClick={() => handleDelete(emp.employeeid)} className="text-red-500 hover:text-red-700 font-medium px-2 cursor-pointer">Remove</button>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editItem ? 'Edit Employee' : 'Add Employee'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google/GitHub Email (For Login)</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none capitalize">
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer">{editItem ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}