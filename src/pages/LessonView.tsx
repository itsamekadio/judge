import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoursesService } from '../lib/coursesService';
import { VideoPlayer } from '../components/VideoPlayer';
import { CourseUnit, Lesson } from '../types';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  ShieldAlert,
  Share2,
  Bookmark
} from 'lucide-react';

export const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseUnit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCourses = CoursesService.subscribeCourses((c) => setCourses(c));
    const unsubLessons = CoursesService.subscribeLessons((l) => {
      setLessons(l);
      setLoading(false);
    });

    return () => {
      unsubCourses();
      unsubLessons();
    };
  }, []);

  const studentGroup = currentUser?.group || 'مجموعة 1';

  // Active lesson
  const currentLesson = lessons.find((l) => l.id === lessonId);
  // Active course unit
  const activeCourse = courses.find((c) => c.id === currentLesson?.courseId);

  // Other lessons in active unit
  const unitLessons = lessons
    .filter((l) => l.courseId === currentLesson?.courseId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Determine access permission
  const hasAccess = Boolean(
    isAdmin || 
    !currentLesson || 
    !currentLesson.allowedGroups || 
    currentLesson.allowedGroups.length === 0 ||
    currentLesson.allowedGroups.includes('الكل') ||
    currentLesson.allowedGroups.includes(studentGroup)
  );

  // Next / Prev lessons in current unit
  const currentIndex = unitLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? unitLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < unitLessons.length - 1 ? unitLessons[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <p className="animate-pulse">جاري تحميل المحاضرة...</p>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-200">الدرس المطلوب غير موجود</h2>
        <p className="text-sm text-slate-400">ربما تم نقل أو حذف هذا الدرس من قبل المشرف.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة الدروس</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Link to="/dashboard" className="hover:text-sky-400 transition-colors flex items-center gap-1">
            <span>الكورسات</span>
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-none">
            {activeCourse?.title || 'الوحدة الدراسية'}
          </span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-sky-400 font-semibold truncate max-w-[200px] sm:max-w-none">
            {currentLesson.title}
          </span>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>الرجوع</span>
        </Link>
      </div>

      {/* Main Content Layout: Player on Left/Center, Sidebar on Right (RTL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center Column (2 spans): Video Player & Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {hasAccess ? (
            <VideoPlayer
              youtubeId={currentLesson.youtubeId}
              title={currentLesson.title}
              autoPlay={false}
            />
          ) : (
            // Restricted Access Warning
            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-rose-500/30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">هذا الدرس غير متاح لمجموعتك</h3>
              <p className="text-sm text-slate-400 max-w-md">
                أنت مسجل في <span className="text-rose-400 font-bold">{studentGroup}</span>. هذا الدرس مخصص فقط للمجموعات التالية: {currentLesson.allowedGroups?.join('، ')}.
              </p>
              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  الرجوع للدروس المتاحة
                </Link>
              </div>
            </div>
          )}

          {/* Lesson Title & Details Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                    الدرس #{currentLesson.order}
                  </span>
                  {currentLesson.duration && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{currentLesson.duration}</span>
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {currentLesson.title}
                </h1>
              </div>

              {/* Group Badges */}
              <div className="flex flex-wrap gap-1.5">
                {currentLesson.allowedGroups?.map((grp) => (
                  <span
                    key={grp}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold"
                  >
                    {grp}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                محتوى المحاضرة وملاحظات المهندس
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {currentLesson.description || 'شرح تفصيلي للمفاهيم الأساسية، أمثلة توضيحية، وتمارين متنوعة للمراجعة والتدريب العملي.'}
              </p>
            </div>

            {/* Next / Prev Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {prevLesson ? (
                <button
                  onClick={() => navigate(`/lesson/${prevLesson.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-500">الدرس السابق</span>
                    <span className="truncate max-w-[130px] sm:max-w-[200px] block">{prevLesson.title}</span>
                  </div>
                </button>
              ) : (
                <div></div>
              )}

              {nextLesson ? (
                <button
                  onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-400 text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                >
                  <div className="text-left">
                    <span className="block text-[10px] text-sky-200">الدرس التالي</span>
                    <span className="truncate max-w-[130px] sm:max-w-[200px] block">{nextLesson.title}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>وصلت لآخر درس في هذه الوحدة</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Active Course Unit Lessons Playlist */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">دروس هذه الوحدة</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                {unitLessons.length} دروس
              </span>
            </div>

            <p className="text-xs text-slate-400 font-semibold">
              {activeCourse?.title || 'الوحدة الحالية'}
            </p>

            {/* Playlist list */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {unitLessons.map((lesson, idx) => {
                const isActive = lesson.id === lessonId;
                const canAccessItem = isAdmin || 
                  !lesson.allowedGroups || 
                  lesson.allowedGroups.length === 0 || 
                  lesson.allowedGroups.includes('الكل') || 
                  lesson.allowedGroups.includes(studentGroup);

                return (
                  <Link
                    key={lesson.id}
                    to={canAccessItem ? `/lesson/${lesson.id}` : '#'}
                    className={`block p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                        : canAccessItem
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isActive ? (
                          <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 fill-current" />
                          </div>
                        ) : canAccessItem ? (
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-slate-600 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-sky-300' : 'text-slate-200'}`}>
                          {lesson.title}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {lesson.duration && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.duration}</span>
                            </span>
                          )}
                          {!canAccessItem && (
                            <span className="text-[10px] text-rose-400/80">مغلق لمجموعتك</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>

          {/* Instructor Contact & Support Card */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-300 block">هل تواجه مشكلة في تشغيل الفيديو؟</span>
            <p>
              تواصل مباشرة مع المشرف أو المهندس عبد الرحمن القاضي لمساعدتك أو تعديل تصريح المجموعة الخاصة بك.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
