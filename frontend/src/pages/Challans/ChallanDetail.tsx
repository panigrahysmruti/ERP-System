import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, Building, Phone, Mail, MapPin, Printer } from 'lucide-react';
import type { Challan, ChallanStatus, ChallanItem } from '../../types/challan';
import { challanService } from '../../services/challan.service';
import ChallanPrintModal from './ChallanPrintModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchChallan = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await challanService.getChallanById(id);
      setChallan(data);
    } catch (error) {
      toast.error('Failed to load challan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleStatusChange = async (newStatus: ChallanStatus) => {
    if (!challan) return;
    try {
      setUpdating(true);
      const updated = await challanService.updateChallanStatus(challan.id, newStatus);
      setChallan(updated);
      toast.success(`Challan status updated to ${newStatus}`);
      fetchChallan();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update challan status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center text-slate-500">
        Loading sales challan...
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center text-slate-500">
        Challan not found.
      </div>
    );
  }

  const calculateGrandTotal = () => {
    return (challan.items || []).reduce((sum: number, item: ChallanItem) => {
      const price = item.snapshotData?.unitPrice || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/challans')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
      >
        <ArrowLeft size={16} /> Back to Sales Challans
      </button>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-slate-800">{challan.challanNumber}</h1>
              {challan.status === 'CONFIRMED' && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                  <CheckCircle2 size={14} /> Confirmed & Dispatched
                </span>
              )}
              {challan.status === 'DRAFT' && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  <Clock size={14} /> Draft
                </span>
              )}
              {challan.status === 'CANCELLED' && (
                <span className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                  <XCircle size={14} /> Cancelled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Created on {format(new Date(challan.createdAt), 'MMMM d, yyyy h:mm a')}</p>
          </div>
        </div>

        {/* Status Action Buttons & Export PDF */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Printer size={16} /> Export Tax Invoice / PDF
          </button>

          {challan.status === 'DRAFT' && (
            <button
              disabled={updating}
              onClick={() => handleStatusChange('CONFIRMED')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
            >
              <CheckCircle2 size={16} /> Confirm & Deduct Stock
            </button>
          )}
          {challan.status !== 'CANCELLED' && (
            <button
              disabled={updating}
              onClick={() => handleStatusChange('CANCELLED')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-medium transition"
            >
              <XCircle size={16} /> Cancel Challan
            </button>
          )}
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold text-slate-800 text-base">{challan.customer?.name}</div>
            {challan.customer?.businessName && (
              <div className="flex items-center gap-2 text-slate-600 mt-1">
                <Building size={16} className="text-slate-400" /> {challan.customer.businessName}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={14} className="text-slate-400" /> {challan.customer?.mobile}
            </div>
            {challan.customer?.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400" /> {challan.customer.email}
              </div>
            )}
            {challan.customer?.address && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} className="text-slate-400" /> {challan.customer.address}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">Dispatched Product Items</h2>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase">
            <tr>
              <th className="p-4">Item Details</th>
              <th className="p-4 font-mono">SKU</th>
              <th className="p-4">Snapshot Price</th>
              <th className="p-4">Quantity</th>
              <th className="p-4 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {(challan.items || []).map((item: ChallanItem) => {
              const snap = item.snapshotData;
              const subtotal = (snap?.unitPrice || 0) * item.quantity;
              return (
                <tr key={item.id}>
                  <td className="p-4 font-medium text-slate-800">
                    {snap?.name || item.product?.name || 'Product'}
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-xs">
                    {snap?.sku || item.product?.sku}
                  </td>
                  <td className="p-4 text-slate-700">
                    ₹{(snap?.unitPrice || 0).toFixed(2)}
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="p-4 text-right font-semibold text-slate-900">
                    ₹{subtotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Footer */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Quantity</span>
            <div className="text-xl font-bold text-slate-800">{challan.totalQuantity} items</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Grand Total Amount</span>
            <div className="text-2xl font-bold text-indigo-600">₹{calculateGrandTotal().toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      <ChallanPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        challan={challan}
      />
    </div>
  );
}
