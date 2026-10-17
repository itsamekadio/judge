import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Menu, 
  X, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { STUDENT_GROUPS } from '../types';

export const Navbar: React.FC = () => {
  const { currentUser, isAdmin, logout, updateGroup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingGroup, setIsChangingGroup] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Instructor Details */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-sky-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                    JUDGE
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                    منصة جادج
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <span>المهندس عبد الرحمن القاضي</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Eng. Abdelrahman Elkady</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation & Actions */}
          <nav className="hidden md:flex items-center gap-3">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/dashboard')
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>الكورسات والدروس</span>
            </Link>

            {/* Dedicated Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive('/admin')
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>لوحة التحكم / Admin Panel</span>
              </Link>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-slate-800 mx-1"></div>

            {/* Student Group Badge / Selector */}
            {currentUser && !isAdmin && (
              <div className="relative">
                <div 
                  onClick={() => setIsChangingGroup(!isChangingGroup)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                  title="المجموعة الدراسية الحالية - انقر للتعديل"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold">
                    {currentUser.group || 'مجموعة 1'}
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    تغيير
                  </span>
                </div>

                {/* Quick group switcher dropdown */}
                {isChangingGroup && (
                  <div className="absolute left-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                    <p className="text-[11px] text-slate-400 px-2 py-1 font-medium">اختر مجموعتك:</p>
                    {STUDENT_GROUPS.map((grp) => (
                      <button
                        key={grp}
                        onClick={() => {
                          updateGroup(grp);
                          setIsChangingGroup(false);
                        }}
                        className={`w-full text-right px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                          currentUser.group === grp
                            ? 'bg-sky-500/20 text-sky-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{grp}</span>
                        {currentUser.group === grp && <span className="w-2 h-2 rounded-full bg-sky-400"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Badge */}
            {currentUser && isAdmin && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>المشرف (Admin)</span>
              </div>
            )}

            {/* User Info & Logout */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentUser.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="تسجيل الخروج / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 transition-colors text-sm"
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && !isAdmin && (
              <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                {currentUser.group || 'مجموعة 1'}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-3">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>الكورسات والدروس</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-300 bg-amber-500/10 border border-amber-500/20"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>لوحة التحكم / Admin Panel</span>
              </Link>
            )}

            {currentUser && !isAdmin && (
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 block font-medium">تغيير المجموعة:</span>
                <div className="grid grid-cols-3 gap-1">
                  {STUDENT_GROUPS.map((grp) => (
                    <button
                      key={grp}
                      onClick={() => {
                        updateGroup(grp);
                        setMobileMenuOpen(false);
                      }}
                      className={`py-1 text-xs rounded ${
                        currentUser.group === grp
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentUser && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-3">
                <div>
                  <p className="text-sm font-bold text-slate-200">{currentUser.fullName}</p>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 bg-rose-500/10 text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
