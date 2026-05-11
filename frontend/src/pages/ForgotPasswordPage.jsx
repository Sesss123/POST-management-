import React, { useState } from 'react';
import { Mail, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppButton, FormInput } from '../components/ui';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data } = await forgotPassword(email);
      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 animate-in fade-in zoom-in duration-500">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Login</span>
          </Link>

          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Forgot Password?</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in fade-in duration-500">
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{message}</p>
              </div>
            )}

            {!message && (
              <>
                <FormInput 
                  label="Email Address"
                  type="email"
                  required
                  placeholder="name@restaurant.com"
                  icon={Mail}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />

                <div className="pt-4">
                  <AppButton 
                    variant="primary" 
                    size="xl" 
                    className="w-full shadow-xl shadow-indigo-200"
                    loading={loading}
                    type="submit"
                  >
                    Send Reset Link
                  </AppButton>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
          © 2024 RestoLedger POS • SaaS Platform
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
