'use client'

import { useState } from 'react'

// --- Placeholder Data ---
const EMPLOYEE_DATA = [
  { empId: 10123, name: 'Alice Smith', role: 'manager', sales: 1250.50 },
  { empId: 10124, name: 'Bob Johnson', role: 'cashier', sales: 840.00 },
  { empId: 10125, name: 'Charlie Brown', role: 'barista', sales: 620.25 },
  { empId: 10126, name: 'Diana Prince', role: 'cashier', sales: 915.00 },
  { empId: 10127, name: 'Evan Wright', role: 'barista', sales: 430.80 },
]

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = EMPLOYEE_DATA.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
            Date Range
          </button>
          <input 
            type="text" 
            placeholder="Search Name..." 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer">
            - Remove Employee
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
            + Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map(emp => (
                <tr key={emp.empId} className="hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      emp.role === 'manager' ? 'bg-purple-100 text-purple-700' : 
                      emp.role === 'barista' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${emp.sales.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{emp.empId}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}