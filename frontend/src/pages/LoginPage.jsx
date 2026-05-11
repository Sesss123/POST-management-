import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Utensils, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import { AppButton, FormInput } from '../components/ui';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [tempId, setTempId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, verify2FA, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.require2FA) {
          setShow2FA(true);
          setTempId(result.tempId);
          setMaskedEmail(result.email);
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Connection failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verify2FA(tempId, otp);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px] -ml-64 -mb-64" />

      <div className="max-w-5xl w-full bg-white rounded-[48px] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col md:flex-row relative z-10 border border-white">
        {/* Left Side: Branding */}
        <div className="md:w-5/12 bg-slate-900 p-12 text-white flex flex-col relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-16">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/50">
                        <Utensils size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase">RestoLedger</h1>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Restaurant POS & Credit Ledger</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black leading-tight tracking-tight">Streamline your <span className="text-indigo-400">restaurant operations.</span></h2>
                        <p className="text-slate-400 font-medium leading-relaxed">The ultimate POS solution for Sri Lankan restaurants with integrated table billing and customer credit management.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            'Real-time Table Status',
                            'Automated Naya Ledger',
                            'Professional A4 & Thermal Invoices',
                            'Admin & Cashier Roles'
                        ].map(feature => (
                            <div key={feature} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">
                                    <ChevronRight size={14} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto relative z-10 pt-12">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Super Admin</p>
                            <p className="text-[10px] text-white font-bold">superadmin@restopos.com</p>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Shop Admin</p>
                            <p className="text-[10px] text-white font-bold">admin@restopos.com</p>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-600/20 p-2 px-3 rounded-xl border border-indigo-500/20">
                            <p className="text-[10px] text-indigo-300 font-black uppercase">Password</p>
                            <p className="text-[10px] text-white font-bold">superadmin123 / admin123</p>
                        </div>
                    </div>
            </div>

            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600 opacity-10 rounded-full blur-[80px]" />
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-7/12 p-12 lg:p-20 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
                <div className="mb-10 text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign In</h3>
                    <p className="text-slate-500 font-medium italic">Enter your credentials to access the POS dashboard.</p>
                </div>

                {!show2FA ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                                <ShieldCheck size={20} className="shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <FormInput 
                            label="Email Address"
                            type="email"
                            required
                            placeholder="cashier@restopos.com"
                            icon={Mail}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />

                        <div className="space-y-1">
                            <FormInput 
                                label="Password"
                                type="password"
                                required
                                placeholder="••••••••"
                                icon={Lock}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Link to="/forgot-password" size="xs" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">Forgot Password?</Link>
                            </div>
                        </div>

                        <div className="pt-4">
                            <AppButton 
                                variant="primary" 
                                size="xl" 
                                className="w-full" 
                                type="submit"
                                loading={loading}
                                icon={ArrowRight}
                            >
                                Log into System
                            </AppButton>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handle2FAVerify} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {error && (
                            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                                <ShieldCheck size={20} className="shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
                            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Verification Required</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    We sent a 6-digit code to <span className="text-indigo-600 font-bold">{maskedEmail}</span>. Please enter it below.
                                </p>
                            </div>
                        </div>

                        <FormInput 
                            label="6-Digit Verification Code"
                            type="text"
                            maxLength={6}
                            required
                            placeholder="000000"
                            icon={ShieldCheck}
                            value={otp}
                            className="text-center text-2xl tracking-[0.5em] font-black"
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        />

                        <div className="space-y-4">
                            <AppButton 
                                variant="primary" 
                                size="xl" 
                                className="w-full" 
                                type="submit"
                                loading={loading}
                            >
                                Verify & Continue
                            </AppButton>
                            
                            <button 
                                type="button"
                                onClick={() => setShow2FA(false)}
                                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                            >
                                Go back to login
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by RestoLedger v1.0</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
