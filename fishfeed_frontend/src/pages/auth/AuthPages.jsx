import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Phone, Waves, Wheat, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Alert, fadeUp } from '../../components/ui';
import Aurora from '../../components/ui/Aurora';
import toast from 'react-hot-toast';

function Brand() {
  return (
    <div className="text-center mb-8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2389B5] to-[#0E4561] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0E4561]/20">
        <Waves size={26} className="text-white" strokeWidth={2.25} />
      </div>
      <h1 className="text-[26px] font-bold text-[#14202B] dark:text-[#EEF3F6] font-display tracking-tight">AquaFeed</h1>
      <p className="text-[#5C7384] dark:text-[#93A4AF] mt-1 text-sm">Smart fish feed recommendations</p>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`);
      navigate(`/${user.role}`);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Aurora>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div {...fadeUp} className="w-full max-w-[420px]">
          <div className="glass rounded-[28px] shadow-2xl p-9 ring-1 ring-white/40">
            <Brand />

            {error && (
              <div className="mb-5">
                <Alert type="error" icon={AlertCircle}>{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address" type="email" icon={Mail}
                placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required
              />
              <Input
                label="Password" type="password" icon={Lock}
                placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required
              />
              <Button type="submit" variant="ocean" size="lg" loading={loading} className="w-full mt-1">
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-[#5C7384] dark:text-[#93A4AF] mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#0E4561] dark:text-[#6FB6D6] font-semibold hover:underline">Register</Link>
            </p>

            <div className="mt-6 p-4 bg-[#F1F8FB] dark:bg-[#123347] rounded-2xl border border-[#E3F1F7] dark:border-[#1A4A63]">
              <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide mb-2.5">Demo accounts</p>
              <div className="space-y-1.5">
                {[
                  { icon: Wheat, label: 'farmer@demo.com', sub: 'demo1234' },
                  { icon: Package, label: 'supplier@demo.com', sub: 'demo1234' },
                  { icon: UserIcon, label: 'admin@demo.com', sub: 'admin1234' },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-2 text-xs text-[#5C7384] dark:text-[#93A4AF]">
                    <d.icon size={13} className="text-[#9FB2BE] dark:text-[#5C7384]" />
                    <span className="font-mono">{d.label}</span>
                    <span className="text-[#9FB2BE] dark:text-[#5C7384]">/ {d.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Aurora>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    role: 'farmer', password: '', password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await register(form);
      toast.success('Account created! Welcome to AquaFeed.');
      navigate(`/${user.role}`);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.email?.[0] || d?.password?.[0] || d?.role?.[0] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Aurora>
      <div className="min-h-screen flex items-center justify-center p-4 py-10">
        <motion.div {...fadeUp} className="w-full max-w-[440px]">
          <div className="glass rounded-[28px] shadow-2xl p-9 ring-1 ring-white/40">
            <div className="text-center mb-7">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2389B5] to-[#0E4561] flex items-center justify-center mx-auto mb-3">
                <Waves size={22} className="text-white" strokeWidth={2.25} />
              </div>
              <h1 className="text-2xl font-bold text-[#14202B] dark:text-[#EEF3F6] font-display">Create account</h1>
              <p className="text-[#5C7384] dark:text-[#93A4AF] text-sm mt-1">Join AquaFeed today</p>
            </div>

            {error && (
              <div className="mb-5">
                <Alert type="error" icon={AlertCircle}>{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" icon={UserIcon} placeholder="Juan dela Cruz"
                value={form.full_name} onChange={set('full_name')} required />
              <Input label="Email address" type="email" icon={Mail} placeholder="you@example.com"
                value={form.email} onChange={set('email')} required />
              <Input label="Phone (optional)" type="tel" icon={Phone} placeholder="+63 912 345 6789"
                value={form.phone} onChange={set('phone')} />

              <div>
                <p className="text-[13px] font-semibold text-[#2B3D4D] dark:text-[#C7D3DA] mb-2">I am a…</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'farmer', icon: Wheat, label: 'Farmer', sub: 'Get feed recommendations' },
                    { value: 'supplier', icon: Package, label: 'Supplier', sub: 'List your feed products' },
                  ].map((opt) => (
                    <button
                      key={opt.value} type="button"
                      onClick={() => setForm({ ...form, role: opt.value })}
                      className={`p-3.5 rounded-2xl border-[1.5px] text-left transition-all ${
                        form.role === opt.value
                          ? 'border-[#0E4561] dark:border-[#3FA3CC] bg-[#E3F1F7] dark:bg-[#123347]'
                          : 'border-[#E6EDF1] dark:border-[#233340] hover:border-[#C7D6DD] dark:hover:border-[#3D5166]'
                      }`}
                    >
                      <opt.icon size={18} className={form.role === opt.value ? 'text-[#0E4561] dark:text-[#6FB6D6]' : 'text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF]'} strokeWidth={2} />
                      <p className="font-bold text-sm text-[#14202B] dark:text-[#EEF3F6] mt-2">{opt.label}</p>
                      <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] mt-0.5">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Password" type="password" icon={Lock} placeholder="Min. 8 characters"
                value={form.password} onChange={set('password')} required />
              <Input label="Confirm password" type="password" icon={Lock} placeholder="Repeat password"
                value={form.password_confirm} onChange={set('password_confirm')} required />

              <Button type="submit" variant="ocean" size="lg" loading={loading} className="w-full">
                Create account
              </Button>
            </form>

            <p className="text-center text-sm text-[#5C7384] dark:text-[#93A4AF] mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0E4561] dark:text-[#6FB6D6] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Aurora>
  );
}
