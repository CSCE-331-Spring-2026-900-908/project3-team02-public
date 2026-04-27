// src/app/manager/(protected)/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OrderRecord {
  saleid: number;
  saledate: string;
  itemcount: number;
  total: string | number;
  cashier: string;
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [chartData, setChartData] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = async () => {
    setIsLoading(true)
    const query = (startDate && endDate) ? `?start=${startDate}&end=${endDate}` : ''
    try {
      const res = await fetch(`/api/orders/history${query}`)
      const data = await res.json()
      setOrders(data.orders)
      setChartData(data.chartData)
    } catch (error) {
      console.error('Failed to fetch history', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      {/* Header & Date Filters */}
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
          <button onClick={fetchHistory} className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Table - 2/3 Width */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-700">Recent Transactions</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Cashier</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Loading history...</td></tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.saleid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">#{order.saleid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.saledate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.itemcount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.cashier || 'System'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">${Number(order.total).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart - 1/3 Width */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-6">Revenue Trend (12mo)</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb'}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}