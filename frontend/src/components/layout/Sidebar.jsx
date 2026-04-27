import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  BookOpen, 
  FileText, 
  Menu, 
  Table, 
  BarChart3, 
  UserCog, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
  <Link 
    to={path}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'Cash Sale', path: '/cash-sale' },
    { icon: Table, label: 'Table Billing', path: '/table-billing' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: BookOpen, label: 'Naya Book', path: '/naya-book' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: Menu, label: 'Menu/Items', path: '/items' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: UserCog, label: 'Users', path: '/users' });
  }

  return (
    <div className="w-72 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShoppingCart className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900 leading-tight">RestoLedger</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">POS System</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.path}
              {...item}
              active={location.pathname === item.path}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
            {user?.name?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group font-medium"
        >
          <LogOut size={20} className="group-hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
