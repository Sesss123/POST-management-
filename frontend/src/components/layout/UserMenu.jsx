import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Settings, ChevronDown, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';

const UserMenu = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-[20px] transition-all hover:bg-slate-50 border border-transparent",
                    isOpen && "bg-slate-50 border-slate-100 shadow-sm"
                )}
            >
                <div className="hidden md:block text-right">
                    <p className="text-xs font-black text-slate-900 leading-none">{user?.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.role}</p>
                </div>
                <div className="relative">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs lg:text-sm shadow-lg shadow-indigo-200">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                        <ChevronDown size={10} className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 bg-slate-900 text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black border border-white/10">
                                {(user?.name?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                                <p className="font-black text-sm tracking-tight">{user?.name}</p>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{user?.role}</p>
                            </div>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600 opacity-20 rounded-full blur-2xl" />
                    </div>

                    <div className="p-2">
                        <button 
                            onClick={() => { navigate('/settings'); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <User size={16} />
                            </div>
                            <span className="text-xs font-bold">My Profile</span>
                        </button>
                        
                        <button 
                            onClick={() => { navigate('/settings'); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <Settings size={16} />
                            </div>
                            <span className="text-xs font-bold">Settings</span>
                        </button>

                        <div className="h-px bg-slate-50 my-2 mx-4" />

                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <LogOut size={16} />
                            </div>
                            <span className="text-xs font-bold">Sign Out</span>
                        </button>
                    </div>

                    <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RestoLedger POS v1.0</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
