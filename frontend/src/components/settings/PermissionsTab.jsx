import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Users, 
    Lock, 
    ChevronRight, 
    Check, 
    X, 
    Info, 
    Save,
    Search
} from 'lucide-react';
import { 
    AppButton, 
    AppCard, 
    Badge, 
    Skeleton, 
    useToast,
    FormSelect 
} from '../ui';
import { cn } from '../../utils/cn';
import axios from 'axios';

const PermissionsTab = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [rolePerms, setRolePerms] = useState({});
    const [selectedRole, setSelectedRole] = useState('cashier');
    const [roles] = useState(['admin', 'manager', 'cashier', 'waiter', 'kitchen']);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [permsRes, rolePermsRes] = await Promise.all([
                axios.get('/api/permissions', { headers }),
                axios.get('/api/permissions/roles', { headers })
            ]);

            setPermissions(permsRes.data.data);
            setRolePerms(rolePermsRes.data.data);
        } catch (error) {
            toast.error('Failed to load permissions data');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (permKey) => {
        const currentPerms = rolePerms[selectedRole] || [];
        let newPerms;
        if (currentPerms.includes(permKey)) {
            newPerms = currentPerms.filter(k => k !== permKey);
        } else {
            newPerms = [...currentPerms, permKey];
        }

        setRolePerms({
            ...rolePerms,
            [selectedRole]: newPerms
        });
    };

    const handleSaveRole = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            await axios.post('/api/permissions/roles', {
                role: selectedRole,
                permissionKeys: rolePerms[selectedRole] || []
            }, { headers });

            toast.success(`Permissions updated for ${selectedRole}`);
        } catch (error) {
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    const categories = [...new Set(permissions.map(p => p.category))];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 px-2">
                    <Users size={18} className="text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Select Role to Configure</span>
                </div>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto custom-scrollbar-hide max-w-full">
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                selectedRole === role ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {categories.map((cat) => (
                    <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <Badge variant="primary">{cat}</Badge>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {permissions.filter(p => p.category === cat).map((perm) => {
                                const isEnabled = (rolePerms[selectedRole] || []).includes(perm.perm_key);
                                return (
                                    <div 
                                        key={perm.perm_key}
                                        onClick={() => handleTogglePermission(perm.perm_key)}
                                        className={cn(
                                            "p-5 rounded-3xl border-2 transition-all cursor-pointer group flex items-start justify-between gap-4",
                                            isEnabled 
                                                ? "bg-white border-indigo-600 shadow-lg shadow-indigo-100" 
                                                : "bg-slate-50 border-transparent hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={cn("text-sm font-black tracking-tight", isEnabled ? "text-indigo-900" : "text-slate-700")}>
                                                    {perm.name}
                                                </h4>
                                                {isEnabled && <Check size={14} className="text-indigo-600" />}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                                {perm.description}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-6 rounded-full p-1 transition-all duration-300 shrink-0 mt-1",
                                            isEnabled ? "bg-indigo-600" : "bg-slate-300"
                                        )}>
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                                                isEnabled ? "translate-x-4" : "translate-x-0"
                                            )} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <AppButton 
                    variant="primary" 
                    icon={Save} 
                    onClick={handleSaveRole}
                    loading={saving}
                    className="w-full sm:w-auto px-12"
                >
                    Save {selectedRole.toUpperCase()} Permissions
                </AppButton>
            </div>

            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Info size={20} />
                </div>
                <div>
                    <h5 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">Permission Hierarchy Note</h5>
                    <p className="text-xs font-bold text-amber-700/80 leading-relaxed">
                        These settings define the **default** permissions for all users assigned to this role. You can further customize specific user overrides via the **Employee Management** section. **Super Admins** always have full access.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PermissionsTab;
