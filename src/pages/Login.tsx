import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASS } from '../context/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  Users, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { STUDENT_GROUPS } from '../types';

export const Login: React.FC = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('مجموعة 1');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterAuth = (userRole: string, userEmail: string) => {
    // If admin, auto-redirect to /admin
    if (userRole === 'admin' || userEmail.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      navigate('/admin', { replace: true });
    } else {
      const origin = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        if (!email || !password) {
          throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        }
        const profile = await login(email, password);
        redirectAfterAuth(profile.role, profile.email);
      } else {
        if (!fullName.trim()) {
          throw new Error('يرجى إدخال اسم الطالب ثلاثي');
        }
        if (!email || !password) {
          throw new Error('يرجى ملء جميع الحقول المطلوبة');
        }
        if (password.length < 6) {
          throw new Error('كلمة المرور يجب أن لا تقل عن 6 أحرف');
        }
        if (!selectedGroup) {
          throw new Error('يرجى اختيار المجموعة الخاصة بك');
        }
        const profile = await register(email, password, fullName, selectedGroup);
        redirectAfterAuth(profile.role, profile.email);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'حدث خطأ أثناء تسجيل الدخول';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'كلمة المرور ضعيفة، يرجى كتابة كلمة مرور أقوى';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill admin credentials helper
  const handleQuickAdmin = () => {
    setIsLoginTab(true);
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASS);
    setError(null);
  };

  // Quick fill student credentials helper
  const handleQuickStudent = (group: string) => {
    setIsLoginTab(true);
    setEmail(`student.${group.replace(/\s+/g, '')}@judge.com`);
    setPassword('12345678');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/25 mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            منصة <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">JUDGE</span> التعليمية
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            بإشراف المهندس عبد الرحمن القاضي • Eng. Abdelrahman Elkady
          </p>
        </div>

        {/* Card Container */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Glow Header */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400"></div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isLoginTab
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isLoginTab
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              حساب طالب جديد
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Student Full Name (Only on Registration) */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الاسم الكامل للطالب <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-left dir-ltr"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة المرور <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-left dir-ltr"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Group Selection (Mandatory on Student Registration) */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>اختر المجموعة الخاصة بك <span className="text-rose-400">*</span></span>
                  <span className="text-[11px] text-sky-400 font-normal">لتحديد الفيديوهات المتاحة</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STUDENT_GROUPS.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedGroup(grp)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        selectedGroup === grp
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{grp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>جاري المعالجة...</span>
              ) : isLoginTab ? (
                <>
                  <span>تسجيل الدخول إلى المنصة</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>إنشاء حساب والبدء فوراً</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>بيانات تسجيل الدخول السريعة (للتجربة السريعة):</span>
            </p>
            
            <div className="space-y-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">المشرف العام (Eng. Abdelrahman Elkady)</span>
                </div>
                <span className="font-mono text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  admin@judge.com
                </span>
              </button>

              {/* Student Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {STUDENT_GROUPS.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => handleQuickStudent(grp)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    تجربة {grp}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
