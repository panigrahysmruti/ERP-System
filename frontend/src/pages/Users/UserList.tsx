import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserCheck, Shield, Mail, Calendar, KeyRound } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
  createdAt: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users');
        setUsers(response.data?.users || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load staff list (Admin access required)');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Shield size={12} /> Admin</span>;
      case 'SALES':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><KeyRound size={12} /> Sales</span>;
      case 'WAREHOUSE':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><KeyRound size={12} /> Warehouse</span>;
      case 'ACCOUNTS':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><KeyRound size={12} /> Accounts</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCheck size={28} className="text-indigo-600" /> Staff & Role Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage system accounts and access control levels across operations.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading staff directory...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Staff Member</th>
                <th className="p-4 font-medium">Email Address</th>
                <th className="p-4 font-medium">Role Level</th>
                <th className="p-4 font-medium text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-semibold text-slate-800">
                    {u.name}
                  </td>
                  <td className="p-4 text-slate-600 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    {u.email}
                  </td>
                  <td className="p-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="p-4 text-right text-slate-400 text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <Calendar size={12} />
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
