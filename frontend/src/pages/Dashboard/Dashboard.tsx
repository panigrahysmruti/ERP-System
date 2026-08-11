import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, AlertTriangle, ArrowRight, UserPlus, PackagePlus, FileCheck } from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import type { Customer } from '../../types/customer';
import type { Product } from '../../types/product';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    leadCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      if (data?.stats) setStats(data.stats);
      if (data?.recentCustomers) setRecentCustomers(data.recentCustomers);
      if (data?.lowStockProducts) setLowStockProducts(data.lowStockProducts);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center text-slate-500">
        Loading ERP Overview...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operational Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your operations, CRM metrics, and stock alerts.</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
            <span>Role Permissions:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Customers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Total Customers</span>
            <div className="text-3xl font-bold text-slate-800 mt-2">{stats.totalCustomers}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{stats.activeCustomers} Active</span> • {stats.leadCustomers} Leads
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Product Catalog</span>
            <div className="text-3xl font-bold text-slate-800 mt-2">{stats.totalProducts}</div>
            <div className="text-xs text-slate-500 mt-1">Items registered in system</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={24} />
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between ${stats.lowStockCount > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div>
            <span className="text-sm font-medium text-slate-600">Low Stock Warnings</span>
            <div className={`text-3xl font-bold mt-2 ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {stats.lowStockCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.lowStockCount > 0 ? 'Items below alert threshold' : 'All stock levels healthy'}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Quick Operational Actions</h2>
          <p className="text-slate-300 text-sm mt-0.5">Jump directly into customer management, inventory, or sales challans.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <UserPlus size={18} /> Manage Customers
          </button>
          <button 
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition border border-slate-700"
          >
            <PackagePlus size={18} /> Inventory
          </button>
          <button 
            onClick={() => navigate('/challans/new')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <FileCheck size={18} /> New Sales Challan
          </button>
        </div>
      </div>

      {/* Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Customers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Recent Customers</h2>
            <button 
              onClick={() => navigate('/customers')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={16} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{customer.name}</div>
                  <div className="text-xs text-slate-500">{customer.businessName || customer.mobile}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    customer.status === 'LEAD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status}
                  </span>
                  <button 
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="text-slate-400 hover:text-indigo-600 text-sm"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            {recentCustomers.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">No recent customers.</div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} /> Low Stock Restock Needed
            </h2>
            <button 
              onClick={() => navigate('/inventory')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
              Inventory <ArrowRight size={16} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{product.name}</div>
                  <div className="text-xs text-slate-500 font-mono">SKU: {product.sku}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-600">{product.currentStock} units left</span>
                  <div className="text-xs text-slate-400">Min Alert: {product.minStockAlert}</div>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">No items currently low in stock! 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
