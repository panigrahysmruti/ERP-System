import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import './services/api';
import { ensureAuthenticated } from './services/api';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import InventoryLayout from './pages/Inventory/InventoryLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import ChallanList from './pages/Challans/ChallanList';
import CreateChallan from './pages/Challans/CreateChallan';
import ChallanDetail from './pages/Challans/ChallanDetail';
import UserList from './pages/Users/UserList';
import { LayoutDashboard, Users, Package, LogOut, UserCheck, FileText, Shield } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Sales Challans', path: '/challans', icon: FileText },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Staff & Roles', path: '/users', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <UserCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Mini ERP</h1>
              <span className="text-xs text-slate-400">Operations Portal</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-slate-800 pt-4">
          {user && (
            <div className="px-2 mb-3">
              <div className="font-medium text-sm text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-400 flex items-center justify-between mt-0.5">
                <span>{user.email}</span>
                <span className="px-1.5 py-0.5 bg-indigo-950 text-indigo-300 rounded font-semibold text-[10px]">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [initAuth, setInitAuth] = useState(false);

  useEffect(() => {
    ensureAuthenticated().then(() => setInitAuth(true));
  }, []);

  if (!initAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Initializing System Access...
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/customers" element={<Layout><CustomerList /></Layout>} />
        <Route path="/customers/:id" element={<Layout><CustomerDetail /></Layout>} />
        <Route path="/inventory" element={<Layout><InventoryLayout /></Layout>} />
        <Route path="/challans" element={<Layout><ChallanList /></Layout>} />
        <Route path="/challans/new" element={<Layout><CreateChallan /></Layout>} />
        <Route path="/challans/:id" element={<Layout><ChallanDetail /></Layout>} />
        <Route path="/users" element={<Layout><UserList /></Layout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
