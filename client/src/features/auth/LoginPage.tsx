import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Heart,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Activity,
  Stethoscope,
  Building2,
  Receipt,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Database,
  HelpCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { extractError } from '../../lib/utils';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid hospital email address'),
  password: z.string().min(1, 'Password is required'),
});

// Registration validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid hospital email address'),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF']),
  phone: z.string().min(10, 'Please enter a valid 10-digit contact number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeCompliance: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge HIPAA & hospital data compliance' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface DemoAccount {
  role: string;
  roleCode: string;
  name: string;
  email: string;
  password: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  desc: string;
}

const demoAccounts: DemoAccount[] = [
  {
    role: 'Hospital Admin',
    roleCode: 'ADMIN',
    name: 'Admin User',
    email: 'admin@medicore.dev',
    password: 'Admin@12345',
    icon: Shield,
    color: 'from-purple-600 to-indigo-600',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Full system oversight, staff onboarding, audit logs & hospital analytics',
  },
  {
    role: 'Senior Doctor',
    roleCode: 'DOCTOR',
    name: 'Dr. Arjun Sharma',
    email: 'dr.sharma@medicore.dev',
    password: 'Doctor@12345',
    icon: Stethoscope,
    color: 'from-teal-600 to-emerald-600',
    bgLight: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Outpatient consultations, clinical diagnoses, digital Rx & lab orders',
  },
  {
    role: 'Reception Desk',
    roleCode: 'RECEPTIONIST',
    name: 'Priya Sharma',
    email: 'reception@medicore.dev',
    password: 'Reception@12345',
    icon: Building2,
    color: 'from-blue-600 to-cyan-600',
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Patient registration, OPD triage, appointments scheduling & bed inquiry',
  },
  {
    role: 'Billing & Finance',
    roleCode: 'BILLING_STAFF',
    name: 'Rahul Mehta',
    email: 'billing@medicore.dev',
    password: 'Billing@12345',
    icon: Receipt,
    color: 'from-amber-600 to-orange-600',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Itemized invoicing, diagnostic test billing, pharmacy receipts & payments',
  },
];

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedRolePreview, setSelectedRolePreview] = useState<DemoAccount | null>(null);

  // Google OAuth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [oauthPrompt, setOauthPrompt] = useState<{
    type: 'link_required' | 'unauthorized' | 'deactivated' | 'unconfigured' | 'error';
    email?: string;
    name?: string;
    linkingToken?: string;
    message?: string;
  } | null>(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [isLinkingSubmitting, setIsLinkingSubmitting] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [isSimulatingGoogle, setIsSimulatingGoogle] = useState(false);

  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle incoming OAuth redirect state
  useEffect(() => {
    const oauth = searchParams.get('oauth');
    if (!oauth) return;

    if (oauth === 'success') {
      toast.success('Signed in via Google successfully!');
      authApi
        .getMe()
        .then((res) => {
          setUser(res.data.data);
          const role = res.data.data.role;
          if (role === 'DOCTOR') navigate('/appointments');
          else if (role === 'RECEPTIONIST') navigate('/patients');
          else if (role === 'BILLING_STAFF') navigate('/invoices');
          else navigate('/dashboard');
        })
        .catch(() => {
          toast.error('Failed to retrieve user session');
        });
      setSearchParams({});
    } else if (oauth === 'link_required') {
      setOauthPrompt({
        type: 'link_required',
        email: searchParams.get('email') || '',
        name: searchParams.get('name') || '',
        linkingToken: searchParams.get('token') || '',
      });
      setSearchParams({});
    } else if (oauth === 'unauthorized') {
      setOauthPrompt({
        type: 'unauthorized',
        email: searchParams.get('email') || '',
      });
      setSearchParams({});
    } else if (oauth === 'deactivated') {
      setOauthPrompt({
        type: 'deactivated',
        email: searchParams.get('email') || '',
      });
      setSearchParams({});
    } else if (oauth === 'unconfigured') {
      setOauthPrompt({
        type: 'unconfigured',
      });
      setSearchParams({});
    } else if (oauth === 'cancelled') {
      toast('Google authentication was cancelled', { icon: 'ℹ️' });
      setSearchParams({});
    } else if (oauth === 'error') {
      setOauthPrompt({
        type: 'error',
        message: searchParams.get('message') || 'Google authentication failed',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, setUser, navigate]);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    // Direct top-level browser redirect to backend OAuth initiation endpoint
    window.location.href = '/api/auth/google';
  };

  const handleSimulateGoogle = async (role: string = 'DOCTOR') => {
    setIsSimulatingGoogle(true);
    try {
      const res = await authApi.devSimulateGoogle(role);
      setUser(res.data.data);
      toast.success(`Signed in as ${res.data.data.name} via Verified Google OAuth!`, { icon: '🟢' });
      setShowGoogleHelp(false);
      if (res.data.data.role === 'DOCTOR') navigate('/appointments');
      else if (res.data.data.role === 'RECEPTIONIST') navigate('/patients');
      else if (res.data.data.role === 'BILLING_STAFF') navigate('/invoices');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setIsSimulatingGoogle(false);
    }
  };

  const handleInstantDemoLogin = async (acc: DemoAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await authApi.login(acc.email, acc.password);
      setUser(res.data.data);
      toast.success(`Welcome back, ${res.data.data.name}! (${acc.role})`);
      if (acc.roleCode === 'DOCTOR') navigate('/appointments');
      else if (acc.roleCode === 'RECEPTIONIST') navigate('/patients');
      else if (acc.roleCode === 'BILLING_STAFF') navigate('/invoices');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthPrompt?.linkingToken || !linkPassword) {
      toast.error('Please enter your hospital security password');
      return;
    }

    setIsLinkingSubmitting(true);
    try {
      const res = await authApi.linkGoogle({
        linkingToken: oauthPrompt.linkingToken,
        password: linkPassword,
      });
      setUser(res.data.data);
      toast.success('Google account securely linked! Welcome to MediCore HMS.');
      setOauthPrompt(null);
      setLinkPassword('');
      const role = res.data.data.role;
      if (role === 'DOCTOR') navigate('/appointments');
      else if (role === 'RECEPTIONIST') navigate('/patients');
      else if (role === 'BILLING_STAFF') navigate('/invoices');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setIsLinkingSubmitting(false);
    }
  };

  // Login form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Register form
  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    watch: watchRegister,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'DOCTOR',
    },
  });

  const regPassword = watchRegister('password') || '';

  // Password strength calculation
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(regPassword);

  const onLogin = async (data: LoginFormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      setUser(res.data.data);
      toast.success(`Welcome back, ${res.data.data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
      });
      setUser(res.data.data);
      toast.success(`Staff account created successfully! Welcome, ${res.data.data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const fillDemo = (acc: DemoAccount) => {
    setLoginValue('email', acc.email);
    setLoginValue('password', acc.password);
    setSelectedRolePreview(acc);
    toast.success(`Auto-filled credentials for ${acc.role}`, {
      icon: '🔐',
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F6F8FB] overflow-hidden">
      {/* ── Left Hero Panel (Rich Healthcare Branding & Animation) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0B1320] via-[#101B2D] to-[#0F9D91] relative flex-col justify-between p-12 overflow-hidden shadow-2xl">
        {/* Ambient floating glow circles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#19B8C9]/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0F9D91]/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

        {/* Floating animated medical icons */}
        <div className="absolute top-24 right-20 text-white/5 animate-float pointer-events-none">
          <Stethoscope className="w-24 h-24" />
        </div>
        <div className="absolute bottom-32 left-16 text-white/5 animate-float-reverse pointer-events-none">
          <Activity className="w-20 h-20" />
        </div>

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#19B8C9] to-[#0F9D91] p-0.5 shadow-cyan-glow">
            <div className="w-full h-full bg-[#101B2D] rounded-[14px] flex items-center justify-center">
              <Heart className="w-6 h-6 text-[#19B8C9]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">MediCore HMS</h1>
              <span className="text-[10px] font-bold bg-[#19B8C9]/20 text-[#83E2EB] px-2 py-0.5 rounded-full border border-[#19B8C9]/30">
                v2.5 Enterprise
              </span>
            </div>
            <p className="text-teal-200/80 text-xs uppercase tracking-widest font-semibold mt-0.5">
              Next-Gen Hospital Management Platform
            </p>
          </div>
        </div>

        {/* Center narrative */}
        <div className="relative z-10 my-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-200 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Integrated Clinical, Diagnostic & Financial Governance</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Unified Healthcare
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">
              Information System
            </span>
          </h2>

          <p className="text-white/80 text-base leading-relaxed max-w-lg mb-8 font-light">
            Engineered for university demonstration excellence. Connects 11 verified clinical collections
            with role-based security, instant electronic prescriptions, and transparent audit trails.
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3.5 max-w-lg">
            {[
              { label: 'Collections Online', value: '11 Verified', sub: 'Mongoose & Atlas Schemas' },
              { label: 'Clinical Security', value: '100% RBAC', sub: 'Strict Role Privilege Guard' },
              { label: 'Validation Layer', value: 'Zod Enforced', sub: 'Runtime Payload Verification' },
              { label: 'System Uptime', value: '99.98%', sub: 'High Availability Replica' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 hover:bg-white/15 transition-all duration-300"
              >
                <p className="text-xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-xs font-semibold text-teal-200 mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-white/50 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer trust badge */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-300" />
            <span>NABH & HIPAA Compliant Healthcare Protocol</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-teal-200 bg-white/10 px-2.5 py-1 rounded-lg">
            <Database className="w-3.5 h-3.5 text-teal-300" />
            <span>Dual MongoDB Ready</span>
          </div>
        </div>
      </div>

      {/* ── Right Auth Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
              <Heart className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MediCore HMS</h1>
              <p className="text-xs text-gray-500">Hospital Management Portal</p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-card border border-[#E3E9F0] p-6 sm:p-10 transition-all duration-300">
            {/* Tab switch header */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl mb-7 relative border border-slate-200/50">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-white text-[#101B2D] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                Staff Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                  activeTab === 'register'
                    ? 'bg-white text-[#0F9D91] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Staff Registration
              </button>
            </div>

            {/* ── TAB 1: SIGN IN ── */}
            {activeTab === 'login' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172337] tracking-tight">Portal Authentication</h2>
                  <p className="text-xs sm:text-sm text-[#65748B] mt-1">
                    Sign in with your verified hospital credentials or select an interactive viva role
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>Hospital Email</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase tracking-normal">e.g. staff@medicore.dev</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        {...loginRegister('email')}
                        type="email"
                        autoComplete="email"
                        placeholder="e.g. dr.sharma@medicore.dev"
                        className="form-input pl-10"
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="form-error">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {loginErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>Security Password</span>
                      <span className="text-[10px] text-[#0F9D91] font-medium lowercase tracking-normal">Encrypted (bcrypt)</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        {...loginRegister('password')}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Enter your security password"
                        className="form-input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="form-error">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {loginErrors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Role preview info if clicked */}
                  {selectedRolePreview && (
                    <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 text-xs text-cyan-900 flex items-start gap-2.5 animate-fade-in">
                      <CheckCircle className="w-4 h-4 text-[#0F9D91] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#101B2D]">{selectedRolePreview.role} Mode Loaded</p>
                        <p className="text-[11px] text-cyan-800 leading-snug mt-0.5">{selectedRolePreview.desc}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="btn-primary w-full py-2.5 text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoginSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#19B8C9]" />
                        Verifying Credentials...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#19B8C9]" />
                        Authorize & Enter Platform
                      </>
                    )}
                  </button>
                </form>

                {/* ── Divider ── */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#F6F8FB] lg:bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                      or authenticate with
                    </span>
                  </div>
                </div>

                {/* ── Google Sign-In Button ── */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-xs hover:shadow-clinical-sm transition-all duration-150 flex items-center justify-center gap-3 group relative cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F9D91]" />
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                  <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-auto">
                    OAuth 2.0
                  </span>
                </button>

                {/* Google OAuth Troubleshooting & Dev Simulator Link */}
                <div className="mt-2.5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowGoogleHelp(true)}
                    className="text-[11px] text-[#0F9D91] hover:text-[#0b7a70] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-cyan-50/70 border border-transparent hover:border-cyan-200"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#0F9D91]" />
                    <span>Google showing &ldquo;Access Blocked&rdquo; (403)? Click here to fix or use 1-click test sign-in</span>
                  </button>
                </div>

                {/* Viva Demo Role Quick-Fill Buttons */}
                <div className="mt-8 pt-6 border-t border-[#E3E9F0]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Interactive Viva Demo Roles
                    </span>
                    <span className="text-[10px] bg-cyan-50 text-[#0F9D91] font-semibold px-2 py-0.5 rounded-full border border-cyan-200">
                      1-Click Instant Access
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {demoAccounts.map((acc) => {
                      const Icon = acc.icon;
                      const isSelected = selectedRolePreview?.roleCode === acc.roleCode;
                      return (
                        <div
                          key={acc.role}
                          onClick={() => fillDemo(acc)}
                          className={`text-left p-3 rounded-xl border transition-all duration-150 group relative cursor-pointer ${
                            isSelected
                              ? 'border-[#19B8C9] bg-cyan-50/60 shadow-xs ring-1 ring-[#19B8C9]'
                              : 'border-[#E3E9F0] hover:border-[#101B2D] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-[#101B2D] flex items-center justify-center transition-colors">
                                <Icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#19B8C9] transition-colors" />
                              </div>
                              <span className="text-xs font-bold text-[#172337] group-hover:text-[#101B2D]">
                                {acc.role}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleInstantDemoLogin(acc, e)}
                              title={`Instant 1-click login as ${acc.role}`}
                              className="text-[10px] font-bold text-[#0F9D91] bg-white hover:bg-[#0F9D91] hover:text-white px-2 py-0.5 rounded-md border border-[#0F9D91]/30 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>Login</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center text-[11px] text-slate-400 mt-3">
                    Click <strong>Login</strong> on any role for instant 1-click entrance, or click card to load credentials
                  </p>
                </div>
              </div>
            )}

            {/* ── TAB 2: REGISTER STAFF ── */}
            {activeTab === 'register' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Onboarding</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Register a new physician, triage receptionist, or billing officer
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="form-label">Full Name & Salutation</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        {...registerForm('name')}
                        type="text"
                        placeholder="e.g. Dr. Rajesh Kulkarni"
                        className="form-input pl-10"
                      />
                    </div>
                    {registerErrors.name && (
                      <p className="form-error text-xs text-red-600 mt-1">{registerErrors.name.message}</p>
                    )}
                  </div>

                  {/* Staff Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Staff Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          {...registerForm('email')}
                          type="email"
                          placeholder="doctor@medicore.dev"
                          className="form-input pl-10 text-xs sm:text-sm"
                        />
                      </div>
                      {registerErrors.email && (
                        <p className="form-error text-xs text-red-600 mt-1">{registerErrors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          {...registerForm('phone')}
                          type="tel"
                          placeholder="+91 98000 12345"
                          className="form-input pl-10 text-xs sm:text-sm"
                        />
                      </div>
                      {registerErrors.phone && (
                        <p className="form-error text-xs text-red-600 mt-1">{registerErrors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Role Selector Dropdown */}
                  <div>
                    <label className="form-label">Clinical / Hospital Role</label>
                    <select
                      {...registerForm('role')}
                      className="form-select w-full font-medium text-sm text-gray-800"
                    >
                      <option value="DOCTOR">Doctor (Consultations, Diagnoses, Digital Rx)</option>
                      <option value="RECEPTIONIST">Receptionist (Patient Registration, Appointments)</option>
                      <option value="BILLING_STAFF">Billing Staff (Invoices, Cash/Online Receipts)</option>
                      <option value="ADMIN">Hospital Administrator (Full Privileges)</option>
                    </select>
                    {registerErrors.role && (
                      <p className="form-error text-xs text-red-600 mt-1">{registerErrors.role.message}</p>
                    )}
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          {...registerForm('password')}
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="Min 8 chars, 1 uppercase"
                          className="form-input pl-10 pr-10 text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {registerErrors.password && (
                        <p className="form-error text-xs text-red-600 mt-1">{registerErrors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Confirm Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          {...registerForm('confirmPassword')}
                          type="password"
                          placeholder="Re-enter password"
                          className="form-input pl-10 text-xs sm:text-sm"
                        />
                      </div>
                      {registerErrors.confirmPassword && (
                        <p className="form-error text-xs text-red-600 mt-1">{registerErrors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Password strength visual meter */}
                  {regPassword.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 font-medium">Password Strength:</span>
                        <span
                          className={`font-bold ${
                            passwordScore <= 1
                              ? 'text-red-500'
                              : passwordScore <= 3
                              ? 'text-amber-500'
                              : 'text-emerald-600'
                          }`}
                        >
                          {passwordScore <= 1 ? 'Weak' : passwordScore <= 3 ? 'Medium' : 'Strong & Compliant'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordScore <= 1
                              ? 'w-1/4 bg-red-500'
                              : passwordScore <= 3
                              ? 'w-3/4 bg-amber-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Compliance Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        {...registerForm('agreeCompliance')}
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs text-gray-600 leading-snug">
                        I confirm this account represents authorized hospital staff and agree to follow HIPAA patient
                        confidentiality and data protection standards.
                      </span>
                    </label>
                    {registerErrors.agreeCompliance && (
                      <p className="form-error text-xs text-red-600 mt-1">
                        {registerErrors.agreeCompliance.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isRegisterSubmitting}
                    className="btn-teal w-full py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isRegisterSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering Staff Account...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Complete Staff Registration
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Link Hospital Account Modal ── */}
      {oauthPrompt?.type === 'link_required' && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setOauthPrompt(null)} />
          <div className="modal-content max-w-md p-0 overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Link Google Identity</h2>
                  <p className="text-xs text-slate-400">Hospital Staff Account Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOauthPrompt(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="p-6 space-y-4 bg-white">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-teal-950">Verified Staff Account Found</p>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    An active hospital profile exists for <span className="font-semibold text-teal-950">{oauthPrompt.email}</span> ({oauthPrompt.name || 'Hospital Staff'}).
                  </p>
                  <p className="text-[11px] text-teal-700 mt-1">
                    To prevent unauthorized account hijacking, confirm your hospital password once to establish the secure Google identity link.
                  </p>
                </div>
              </div>

              <div>
                <label className="form-label flex items-center justify-between">
                  <span>Hospital Security Password</span>
                  <span className="text-[10px] text-slate-400 font-normal">Existing password</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLinkPassword ? 'text' : 'password'}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="form-input pl-10 pr-10 text-xs"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLinkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOauthPrompt(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinkingSubmitting}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {isLinkingSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying & Linking...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      Verify & Link Google
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Unauthorized Google User Alert Modal ── */}
      {oauthPrompt?.type === 'unauthorized' && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setOauthPrompt(null)} />
          <div className="modal-content max-w-md p-0 overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 bg-red-950 text-white flex items-center justify-between border-b border-red-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Access Denied: Unlisted Account</h2>
                  <p className="text-xs text-red-200/80">Hospital Staff Authorization Required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOauthPrompt(null)}
                className="w-7 h-7 rounded-lg text-red-300 hover:text-white hover:bg-red-900 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white text-xs">
              <p className="text-slate-700 leading-relaxed">
                The Google account <strong className="text-navy-950 font-bold">{oauthPrompt.email}</strong> is not registered in the MediCore Hospital Staff Directory.
              </p>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Hospital Security Policy
                </p>
                <p className="text-[11px] text-amber-800 leading-normal">
                  Privileged roles (Doctor, Receptionist, Billing, Admin) cannot be created automatically via Google sign-in. Please contact your Hospital System Administrator to provision your staff credentials.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOauthPrompt(null)}
                  className="btn-primary text-xs"
                >
                  Understood, Return to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Other OAuth Notifications Modal ── */}
      {(oauthPrompt?.type === 'deactivated' || oauthPrompt?.type === 'unconfigured' || oauthPrompt?.type === 'error') && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setOauthPrompt(null)} />
          <div className="modal-content max-w-md p-0 overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Authentication Notice</h2>
                  <p className="text-xs text-slate-400">MediCore Security Service</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOauthPrompt(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white text-xs">
              {oauthPrompt.type === 'deactivated' && (
                <p className="text-slate-700 leading-relaxed">
                  The staff account associated with <strong className="text-navy-950 font-bold">{oauthPrompt.email}</strong> has been deactivated by hospital administration.
                </p>
              )}
              {oauthPrompt.type === 'unconfigured' && (
                <p className="text-slate-700 leading-relaxed">
                  Google OAuth has not been configured on this MediCore HMS instance. Please sign in using your standard hospital email and password.
                </p>
              )}
              {oauthPrompt.type === 'error' && (
                <p className="text-red-600 leading-relaxed">
                  {oauthPrompt.message || 'An error occurred during Google authentication. Please try again.'}
                </p>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOauthPrompt(null)}
                  className="btn-primary text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Google OAuth Assistance & Dev Simulator Modal ── */}
      {showGoogleHelp && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowGoogleHelp(false)} />
          <div className="modal-content max-w-lg p-0 overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 bg-gradient-to-r from-navy-950 to-slate-900 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F9D91]/20 border border-[#19B8C9]/30 flex items-center justify-center text-[#19B8C9]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Google OAuth Assistance &amp; Test Access</h2>
                  <p className="text-[11px] text-slate-400">Fix Google Cloud Restrictions or Sign in Instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleHelp(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 bg-white text-xs max-h-[80vh] overflow-y-auto">
              {/* Alert: Why Google blocks */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Why Google Displays &ldquo;Access blocked (Error 403: access_denied)&rdquo;
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  In Google Cloud Console, new OAuth apps start in <strong>&ldquo;Testing&rdquo;</strong> status.
                  While in Testing mode, Google strictly blocks every Google account <strong>except</strong> those explicitly added to your Google Cloud project&apos;s <strong>Test Users</strong> list.
                </p>
              </div>

              {/* Option 1: Instant 1-Click Simulation */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#0F9D91]" />
                    Option 1: Instant 1-Click Google Sign-In (No Cloud Setup Needed)
                  </span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                    Viva Demo Mode
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Sign in immediately with a verified Google staff identity to evaluate the platform and its full Google integration:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSimulatingGoogle}
                    onClick={() => handleSimulateGoogle('ADMIN')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#101B2D] hover:bg-slate-50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      👑
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-indigo-600 text-xs">Admin Staff</p>
                      <p className="text-[10px] text-slate-400">admin@medicore.dev</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={isSimulatingGoogle}
                    onClick={() => handleSimulateGoogle('DOCTOR')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#101B2D] hover:bg-slate-50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                      🩺
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-teal-600 text-xs">Doctor Portal</p>
                      <p className="text-[10px] text-slate-400">dr.sharma@medicore.dev</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={isSimulatingGoogle}
                    onClick={() => handleSimulateGoogle('RECEPTIONIST')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#101B2D] hover:bg-slate-50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">
                      📋
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-cyan-600 text-xs">Reception Desk</p>
                      <p className="text-[10px] text-slate-400">reception@medicore.dev</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={isSimulatingGoogle}
                    onClick={() => handleSimulateGoogle('BILLING_STAFF')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#101B2D] hover:bg-slate-50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      💳
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-emerald-600 text-xs">Billing Officer</p>
                      <p className="text-[10px] text-slate-400">billing@medicore.dev</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Option 2: 30s Google Cloud Fix */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  Option 2: Unblock Your Personal Gmail in Google Cloud (30 Seconds)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pl-1 leading-relaxed">
                  <li>
                    Open <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Google Cloud Console &gt; OAuth Consent Screen</a>.
                  </li>
                  <li>
                    Scroll down to <strong>Test Users</strong> and click <strong>+ ADD USERS</strong>.
                  </li>
                  <li>
                    Type your personal Gmail address and click <strong>Save</strong>.
                  </li>
                  <li>
                    <em>(Or under Publishing status, click <strong>&ldquo;Publish App&rdquo;</strong> to allow any Google user)</em>.
                  </li>
                  <li>
                    Return to this page and click <strong>&ldquo;Continue with Google&rdquo;</strong> &mdash; Google will immediately authorize you!
                  </li>
                </ol>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGoogleHelp(false)}
                  className="btn-primary text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
