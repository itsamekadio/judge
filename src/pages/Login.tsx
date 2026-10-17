import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASS } from '../context/AuthContext';
import { CoursesService, getLocalCurriculums } from '../lib/coursesService';
import { Curriculum } from '../types';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  BookOpen, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';

export const Login: React.FC = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Curriculums available for student registration
  const [curriculums, setCurriculums] = useState<Curriculum[]>(getLocalCurriculums());
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = CoursesService.subscribeCurriculums((c) => {
      setCurriculums(c);
      if (c.length > 0 && !selectedCurriculumId) {
        setSelectedCurriculumId(c[0].id);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        if (!email || !password) throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        const profile = await login(email, password);
        if (profile.role === 'admin' || profile.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        if (!fullName.trim()) throw new Error('يرجى إدخال اسم الطالب');
        if (!email || !password) throw new Error('يرجى ملء جميع الحقول');
        if (password.length < 6) throw new Error('كلمة المرور يجب أن لا تقل عن 6 أحرف');
        
        const currObj = curriculums.find(c => c.id === selectedCurriculumId) || curriculums[0];
        const profile = await register(email, password, fullName, currObj?.id, currObj?.title);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/25 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            منصة <span className="text-sky-400">JUDGE</span> التعليمية
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            المهندس عبد الرحمن القاضي • Eng. Abdelrahman Elkady
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
          
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                isLoginTab ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                !isLoginTab ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              طالب جديد (اختيار المنهج)
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Student Full Name */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم الطالب الكامل <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسم الطالب ثلاثي..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                البريد الإلكتروني <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-left dir-ltr"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-left dir-ltr"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Student Curriculum Selection (From what admin created) */}
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>اختر المنهج الدراسي الذي تود دراسته: <span className="text-rose-400">*</span></span>
                  <span className="text-[11px] text-sky-400">محدد من المشرف</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                  <select
                    value={selectedCurriculumId}
                    onChange={(e) => setSelectedCurriculumId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    {curriculums.map((curr) => (
                      <option key={curr.id} value={curr.id}>
                        {curr.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
            >
              {loading ? (
                <span>جاري التحميل...</span>
              ) : isLoginTab ? (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>تسجيل الحساب والبدء في المنهج</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
