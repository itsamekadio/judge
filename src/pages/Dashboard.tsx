import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoursesService, extractYouTubeId } from '../lib/coursesService';
import { CourseUnit, Lesson } from '../types';
import { 
  BookOpen, 
  PlayCircle, 
  Clock, 
  Users, 
  Search, 
  Sparkles, 
  ChevronLeft, 
  Layers, 
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseUnit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time updates for courses and lessons
    const unsubCourses = CoursesService.subscribeCourses((c) => {
      setCourses(c);
      setLoading(false);
    });

    const unsubLessons = CoursesService.subscribeLessons((l) => {
      setLessons(l);
    });

    return () => {
      unsubCourses();
      unsubLessons();
    };
  }, []);

  const studentGroup = currentUser?.group || 'مجموعة 1';

  // Filter lessons based on student group permission:
  // Admin sees all lessons.
  // Student sees lessons where allowedGroups contains 'الكل' or studentGroup.
  const isLessonAccessible = (lesson: Lesson): boolean => {
    if (isAdmin) return true;
    if (!lesson.allowedGroups || lesson.allowedGroups.length === 0) return true;
    return lesson.allowedGroups.includes('الكل') || lesson.allowedGroups.includes(studentGroup);
  };

  const filteredLessons = lessons.filter((lesson) => {
    // 1. Group access check
    if (!isLessonAccessible(lesson)) return false;

    // 2. Unit filter
    if (selectedUnitFilter !== 'all' && lesson.courseId !== selectedUnitFilter) return false;

    // 3. Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = lesson.title.toLowerCase().includes(q);
      const matchDesc = lesson.description?.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }

    return true;
  });

  // Calculate stats
  const accessibleCount = lessons.filter(isLessonAccessible).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome & Group Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>العام الأكاديمي 2026/2027</span>
              </span>
              {isAdmin && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  لوحة المشرف
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              مرحباً بك، {currentUser?.fullName || 'عزيزي الطالب'}
            </h1>
            
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              منصة جادج التعليمية تحت إشراف <span className="text-sky-300 font-bold">المهندس عبد الرحمن القاضي</span>. يمكنك هنا متابعة جميع المحاضرات والوحدات المخصصة لك بجودة عالية وفيديوهات مشفرة.
            </p>
          </div>

          {/* Group and Stats Pill */}
          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            {!isAdmin ? (
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">مجموعتك الدراسية</span>
                  <span className="text-sm font-bold text-indigo-300">{studentGroup}</span>
                </div>
              </div>
            ) : (
              <Link
                to="/admin"
                className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-500/20 transition-all text-amber-300"
              >
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                <div>
                  <span className="text-xs font-bold block">إدارة المحتوى والدروس</span>
                  <span className="text-[11px] text-amber-400/80">فتح لوحة التحكم</span>
                </div>
              </Link>
            )}

            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">الدروس المتاحة لك</span>
                <span className="text-sm font-bold text-sky-300">{accessibleCount} درس</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن درس أو وحدة..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Unit Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">جميع الوحدات الدراسية ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Units & Lessons List */}
      <div className="space-y-10">
        {courses.length === 0 && !loading && (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-8">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">لا توجد وحدات دراسية مضافة حتى الآن</h3>
            <p className="text-sm text-slate-500 mt-1">
              سيقوم المهندس عبد الرحمن القاضي بإضافة الوحدات والمحاضرات قريباً.
            </p>
          </div>
        )}

        {courses
          .filter(c => selectedUnitFilter === 'all' || c.id === selectedUnitFilter)
          .map((unit) => {
            const unitLessons = filteredLessons.filter((l) => l.courseId === unit.id);

            return (
              <div key={unit.id} className="space-y-4">
                
                {/* Unit Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                      {unit.order || '1'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {unit.title}
                      </h2>
                      {unit.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{unit.description}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 self-start sm:self-auto">
                    {unitLessons.length} درس متاح
                  </span>
                </div>

                {/* Lessons Grid */}
                {unitLessons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {unitLessons.map((lesson) => {
                      const cleanId = extractYouTubeId(lesson.youtubeId);

                      return (
                        <div
                          key={lesson.id}
                          className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border border-slate-800/90 flex flex-col group"
                        >
                          {/* Video Thumbnail Preview */}
                          <div className="relative aspect-video bg-slate-950 overflow-hidden">
                            <img
                              src={`https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`}
                              alt={lesson.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
                              }}
                            />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                            {/* Play Button Icon */}
                            <Link
                              to={`/lesson/${lesson.id}`}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className="w-12 h-12 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <PlayCircle className="w-6 h-6 fill-current" />
                              </div>
                            </Link>

                            {/* Duration or Order Pill */}
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700/60 text-[10px] text-slate-300 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-400" />
                              <span>{lesson.duration || 'فيديو'}</span>
                            </div>

                            {/* Allowed Groups Pill */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {lesson.allowedGroups?.map((grp) => (
                                <span
                                  key={grp}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    grp === 'الكل'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  }`}
                                >
                                  {grp}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Lesson Card Body */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2 text-sm leading-snug">
                                {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                                  {lesson.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500">
                                ترتيب الدرس: #{lesson.order || '1'}
                              </span>

                              <Link
                                to={`/lesson/${lesson.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                              >
                                <span>مشاهدة الآن</span>
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/60 text-center">
                    <p className="text-xs text-slate-400">
                      لا توجد محاضرات متاحة لمجموعتك ({studentGroup}) في هذه الوحدة حالياً.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
      </div>

    </div>
  );
};
