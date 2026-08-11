import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building, Calendar, MessageSquare, Clock } from 'lucide-react';
import type { Customer } from '../../types/customer';
import { customerService } from '../../services/customer.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import CustomerModal from './CustomerModal';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const fetchCustomer = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await customerService.getCustomerById(id);
      setCustomer(data);
    } catch (error) {
      toast.error('Failed to load customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleUpdateCustomer = async (data: any) => {
    if (!id) return;
    try {
      await customerService.updateCustomer(id, data);
      toast.success('Customer updated successfully');
      setIsEditModalOpen(false);
      fetchCustomer();
    } catch (error) {
      toast.error('Failed to update customer');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;
    
    try {
      setNoteLoading(true);
      await customerService.addFollowUp(id, newNote);
      toast.success('Note added successfully');
      setNewNote('');
      fetchCustomer(); // Refresh to show new note
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-red-500">Customer not found.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button 
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back to Customers
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{customer.name}</h2>
                <div className="text-slate-500">{customer.businessName || 'No business name'}</div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-slate-400 hover:text-indigo-600 transition"
                title="Edit Customer"
              >
                <Edit size={20} />
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                {customer.customerType}
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                {customer.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={18} className="text-slate-400" />
                <span>{customer.mobile}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={18} className="text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3 text-slate-600">
                  <MapPin size={18} className="text-slate-400 mt-1 flex-shrink-0" />
                  <span className="text-sm">{customer.address}</span>
                </div>
              )}
              {customer.gstNumber && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Building size={18} className="text-slate-400" />
                  <span className="text-sm">GST: <span className="font-medium text-slate-800">{customer.gstNumber}</span></span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm">Added {format(new Date(customer.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">Next Follow-up</h3>
            <p className="text-indigo-800 text-sm">
              {customer.followUpDate ? format(new Date(customer.followUpDate), 'PPP') : 'No follow-up scheduled'}
            </p>
          </div>
        </div>

        {/* Right Column: Timeline and Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-500" />
              Activity & Notes
            </h3>
            
            <form onSubmit={handleAddNote} className="mb-8">
              <textarea 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition"
                rows={3}
                placeholder="Add a new note or log a call..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              ></textarea>
              <div className="mt-3 flex justify-end">
                <button 
                  type="submit"
                  disabled={noteLoading || !newNote.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {noteLoading ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>

            <div className="space-y-6">
              {customer.followUps && customer.followUps.length > 0 ? (
                customer.followUps.map(note => (
                  <div key={note.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-slate-800 text-sm">Follow-up Note</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{note.note}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No activity notes yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CustomerModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateCustomer}
        initialData={customer}
      />
    </div>
  );
}
