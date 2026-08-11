import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import type { Customer, CustomerStatus } from '../../types/customer';
import { customerService } from '../../services/customer.service';
import toast from 'react-hot-toast';
import CustomerModal from './CustomerModal';

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers({ search, status: statusFilter });
      setCustomers(data?.customers || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (data: any) => {
    try {
      await customerService.createCustomer(data);
      toast.success('Customer created successfully');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>;
      case 'LEAD':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Lead</span>;
      case 'INACTIVE':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inactive</span>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-4 border border-slate-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <select 
            className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LEAD">Lead</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{c.name}</div>
                    <div className="text-sm text-slate-500">{c.businessName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-800">{c.mobile}</div>
                    <div className="text-sm text-slate-500">{c.email}</div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">
                    {c.customerType}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </div>
  );
}
