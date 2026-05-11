import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppButton, FormInput } from '../components/ui';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await resetPassword(token, password);
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Set New Password</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Your new password must be different from previous passwords.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in fade-in duration-500">
                <ShieldCheck size={20} className="shrink-0" />
                <div className="flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-tight">Password Reset Successful!</p>
                  <p className="text-[10px] opacity-80">Redirecting to login page...</p>
                </div>
              </div>
            )}

            {!success && (
              <>
                <FormInput 
                  label="New Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />

                <FormInput 
                  label="Confirm New Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  icon={Lock}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />

                <div className="pt-4">
                  <AppButton 
                    variant="primary" 
                    size="xl" 
                    className="w-full shadow-xl shadow-indigo-200"
                    loading={loading}
                    type="submit"
                  >
                    Reset Password
                  </AppButton>
                </div>
              </>
            )}
          </form>

          {success && (
            <div className="mt-8 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors font-bold text-xs uppercase tracking-widest">
                Go to Login Now
              </Link>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
          © 2024 RestoLedger POS • SaaS Platform
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
