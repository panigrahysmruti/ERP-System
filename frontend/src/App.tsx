import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import InventoryLayout from './pages/Inventory/InventoryLayout';
import Dashboard from './pages/Dashboard/Dashboard';

// Placeholder components until we build them
const Login = () => <div className="p-8">Login Page</div>;

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-slate-50">
    <aside className="w-64 bg-slate-900 text-white p-4">
      <h1 className="text-xl font-bold mb-8">Mini ERP</h1>
      <nav className="flex flex-col gap-2">
        <a href="/" className="px-4 py-2 hover:bg-slate-800 rounded">Dashboard</a>
        <a href="/customers" className="px-4 py-2 hover:bg-slate-800 rounded">Customers</a>
        <a href="/inventory" className="px-4 py-2 hover:bg-slate-800 rounded">Inventory</a>
      </nav>
    </aside>
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  </div>
);

function App() {
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
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
