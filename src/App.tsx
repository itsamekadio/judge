import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LessonView } from './pages/LessonView';
import { Admin } from './pages/Admin';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-arabic">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<Login />} />

              {/* Student & Instructor Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Lesson Viewer */}
              <Route
                path="/lesson/:lessonId"
                element={
                  <ProtectedRoute>
                    <LessonView />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal (Strictly role: admin) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Default Redirect to Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Persistent Footer */}
          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                منصة <strong className="text-slate-300">JUDGE</strong> التعليمية © {new Date().getFullYear()} — بإشراف المهندس عبد الرحمن القاضي
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                Zero-Cost Cloud Architecture • Powered by Firebase & GitHub Pages
              </p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
