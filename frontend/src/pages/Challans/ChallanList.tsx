import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Challan, ChallanStatus } from '../../types/challan';
import { challanService } from '../../services/challan.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ChallanList() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const data = await challanService.getChallans({ search, status: statusFilter });
      setChallans(data?.challans || []);
    } catch (error) {
      toast.error('Failed to load sales challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const getStatusBadge = (status: ChallanStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold w-fit">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'DRAFT':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold w-fit">
            <Clock size={12} /> Draft
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold w-fit">
            <XCircle size={12} /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Challans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage sales orders, dispatch documents, and stock deductions.</p>
        </div>
        <button 
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium hover:bg-indigo-700 transition shadow-sm"
          onClick={() => navigate('/challans/new')}
        >
          <Plus size={20} />
          Create Sales Challan
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Challan # or Customer..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <select 
            className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none bg-white text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading sales challans...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Challan #</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Total Quantity</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-500" />
                    {c.challanNumber}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{c.customer?.name}</div>
                    <div className="text-xs text-slate-500">{c.customer?.businessName || c.customer?.mobile}</div>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {format(new Date(c.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4 font-semibold text-slate-700 text-sm">
                    {c.totalQuantity} items
                  </td>
                  <td className="p-4">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => navigate(`/challans/${c.id}`)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {challans.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No sales challans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
