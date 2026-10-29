import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CoursesService, 
  extractYouTubeId
} from '../lib/coursesService';
import { Curriculum, Chapter, Topic, Lesson } from '../types';
import { 
  PlayCircle, 
  BookOpen, 
  Folder, 
  Layers,
  ChevronLeft, 
  Search,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, isAdmin, updateCurriculum } = useAuth();
  
  // State filled by Firestore real-time subscriptions
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('');
  
  // Cascading Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');

  useEffect(() => {
    const unsubCurrs = CoursesService.subscribeCurriculums((c) => {
      setCurriculums(c);
      if (c.length > 0 && !selectedCurriculumId) {
        setSelectedCurriculumId(currentUser?.curriculumId || c[0].id);
      }
    });

    const unsubChaps = CoursesService.subscribeChapters((ch) => setChapters(ch));
    const unsubTops = CoursesService.subscribeTopics((t) => setTopics(t));
    const unsubLess = CoursesService.subscribeLessons((l) => setLessons(l));

    return () => {
      unsubCurrs();
      unsubChaps();
      unsubTops();
      unsubLess();
    };
  }, []);

  // Update curriculum selection if student switches
  const handleSelectCurriculum = (curr: Curriculum) => {
    setSelectedCurriculumId(curr.id);
    setFilterChapterId('');
    setFilterTopicId('');
    if (!isAdmin) {
      updateCurriculum(curr.id, curr.title);
    }
  };

  // Active curriculum
  const activeCurriculum = curriculums.find(c => c.id === selectedCurriculumId) || curriculums[0];
  
  // Chapters of active curriculum
  const activeChapters = chapters.filter(ch => ch.curriculumId === (activeCurriculum?.id || ''));

  // Filter topics for the cascading dropdown
  const availableFilterTopics = filterChapterId
    ? topics.filter(t => t.chapterId === filterChapterId)
    : [];

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterChapterId('');
    setFilterTopicId('');
  };

  const hasActiveFilters = !!(searchTerm || filterChapterId || filterTopicId);

  // Completed lessons set
  const completedSet = new Set(currentUser?.completedLessons || []);

  // Last watched lesson
  const lastWatched = currentUser?.lastWatchedLesson;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* 1. Student Welcome Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold inline-block mb-2">
            منصة جادج التعليمية • Eng. Abdelrahman Elkady
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            مرحباً بك، {currentUser?.fullName || 'عزيزي الطالب'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            تابع فصول وموضوعات ومحاضرات المنهج المسجل به. يتم تسجيل إنجازك تلقائياً عند المشاهدة.
          </p>
        </div>

        {/* Current Enrolled Curriculum Badge */}
        {activeCurriculum && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 p-4 rounded-2xl shrink-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">المنهج الحالي</span>
              <span className="text-sm font-bold text-sky-300">{activeCurriculum.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Feature 1: "Continue Watching" Hero Banner (استكمال المشاهدة) */}
      {lastWatched && (
        <div className="relative overflow-hidden rounded-3xl p-6 border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 shadow-xl shadow-sky-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              {/* Thumbnail with pulsing play icon */}
              <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700">
                <img
                  src={`https://img.youtube.com/vi/${extractYouTubeId(lastWatched.youtubeId)}/mqdefault.jpg`}
                  alt={lastWatched.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                    <PlayCircle className="w-5 h-5 fill-current" />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>متابعة من حيث توقفت</span>
                </span>
                <h3 className="text-base font-bold text-white line-clamp-1">{lastWatched.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lastWatched.chapterTitle} {lastWatched.topicTitle ? `• ${lastWatched.topicTitle}` : ''}
                </p>
              </div>
            </div>

            <Link
              to={`/lesson/${lastWatched.lessonId}`}
              className="px-6 py-3 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-white transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 shrink-0"
            >
              <span>متابعة المشاهدة الآن</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Curriculum Selector Tabs */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>اختر المنهج الدراسي:</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {curriculums.map((curr) => {
            const isSelected = (activeCurriculum?.id === curr.id);
            return (
              <button
                key={curr.id}
                onClick={() => handleSelectCurriculum(curr)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.02]'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{curr.title}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Feature 5: Smart Cascading Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>البحث والتصفية الذكية:</span>
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط التصفية</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الدرس..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Cascading Filter: Select Chapter */}
          <div>
            <select
              value={filterChapterId}
              onChange={(e) => {
                setFilterChapterId(e.target.value);
                setFilterTopicId(''); // Reset topic when chapter changes
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">جميع الفصول ({activeChapters.length})</option>
              {activeChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.title}</option>
              ))}
            </select>
          </div>

          {/* Cascading Filter: Select Topic (populated based on selected chapter) */}
          <div>
            <select
              value={filterTopicId}
              disabled={!filterChapterId}
              onChange={(e) => setFilterTopicId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-40"
            >
              <option value="">
                {filterChapterId ? `جميع موضوعات الفصل (${availableFilterTopics.length})` : 'اختر فصلاً لتصفية موضوعاته'}
              </option>
              {availableFilterTopics.map((top) => (
                <option key={top.id} value={top.id}>{top.title}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 5. Chapters & Topics & Lessons Hierarchy */}
      <div className="space-y-8">
        {activeChapters.length > 0 ? (
          activeChapters
            .filter(ch => !filterChapterId || ch.id === filterChapterId)
            .map((chapter) => {
              // Filter lessons belonging to this chapter
              const chapterLessons = lessons.filter(l => {
                if (l.chapterId !== chapter.id) return false;
                if (filterTopicId && l.topicId !== filterTopicId) return false;
                if (searchTerm.trim() && !l.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                  return false;
                }
                return true;
              });

              // Chapter progress calculation
              const allChapterLessons = lessons.filter(l => l.chapterId === chapter.id);
              const completedInChapter = allChapterLessons.filter(l => completedSet.has(l.id)).length;
              const chapterProgressPct = allChapterLessons.length > 0
                ? Math.round((completedInChapter / allChapterLessons.length) * 100)
                : 0;

              const chapterTopics = topics.filter(t => {
                if (t.chapterId !== chapter.id) return false;
                if (filterTopicId && t.id !== filterTopicId) return false;
                return true;
              });

              const unassignedLessons = chapterLessons.filter(l => !l.topicId);

              return (
                <div key={chapter.id} className="glass-panel p-6 rounded-2xl border border-slate-800/90 space-y-6">
                  
                  {/* Chapter Title Bar with Progress Bar */}
                  <div className="pb-4 border-b border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                          <Folder className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{chapter.title}</h3>
                      </div>

                      {/* Progress summary badge */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                          {chapterLessons.length} فيديوهات
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{chapterProgressPct}% مكتمل</span>
                        </div>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-sky-400 h-1.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${chapterProgressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Topic Sections */}
                  {chapterTopics.length > 0 ? (
                    <div className="space-y-6">
                      {chapterTopics.map((topic) => {
                        const topicLessons = chapterLessons.filter(l => l.topicId === topic.id);

                        return (
                          <div key={topic.id} className="bg-slate-950/50 rounded-2xl p-4 sm:p-5 border border-slate-800/70 space-y-4">
                            
                            {/* Topic Subheader */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                                  <Layers className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="text-sm font-bold text-emerald-300">
                                  {topic.title}
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {topicLessons.length} فيديوهات
                              </span>
                            </div>

                            {/* Topic Video Grid */}
                            {topicLessons.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topicLessons.map((lesson) => (
                                  <VideoCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    curriculumTitle={activeCurriculum?.title}
                                    topicTitle={topic.title}
                                    isDone={completedSet.has(lesson.id)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 py-3 text-center">
                                لا توجد فيديوهات مطابقة في هذا الموضوع.
                              </p>
                            )}

                          </div>
                        );
                      })}

                      {/* Unassigned lessons in chapter */}
                      {unassignedLessons.length > 0 && (
                        <div className="bg-slate-950/40 rounded-2xl p-4 sm:p-5 border border-slate-800/50 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-400">دروس عامة</h4>
                            <span className="text-[11px] text-slate-500">{unassignedLessons.length} فيديوهات</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedLessons.map((lesson) => (
                              <VideoCard
                                key={lesson.id}
                                lesson={lesson}
                                curriculumTitle={activeCurriculum?.title}
                                isDone={completedSet.has(lesson.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback: render lessons directly if no topics */
                    chapterLessons.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {chapterLessons.map((lesson) => (
                          <VideoCard
                            key={lesson.id}
                            lesson={lesson}
                            curriculumTitle={activeCurriculum?.title}
                            isDone={completedSet.has(lesson.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        لا توجد فيديوهات مطابقة في هذا الفصل.
                      </p>
                    )
                  )}

                </div>
              );
            })
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm glass-panel rounded-2xl border border-slate-800">
            لا توجد فصول مضافة في هذا المنهج حتى الآن.
          </div>
        )}
      </div>

    </div>
  );
};

// Reusable Video Card Component (Clean duration removal + Completed badge)
const VideoCard: React.FC<{ 
  lesson: Lesson; 
  curriculumTitle?: string; 
  topicTitle?: string;
  isDone?: boolean;
}> = ({ 
  lesson, 
  curriculumTitle,
  topicTitle,
  isDone = false
}) => {
  const cleanId = extractYouTubeId(lesson.youtubeId);

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className="group block bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800 hover:border-sky-500/50 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-sky-500/10"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-950">
        <img
          src={`https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`}
          alt={lesson.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
          }}
        />
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <PlayCircle className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Completed Badge */}
        {isDone && (
          <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مكتمل</span>
          </span>
        )}

        {/* PDF Badge if attached */}
        {lesson.pdfUrl && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-rose-500/90 text-white text-[10px] font-bold">
            PDF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2">
          {lesson.title}
        </h4>

        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
          <span className="text-slate-500 truncate max-w-[130px]">
            {topicTitle || curriculumTitle || ''}
          </span>
          <span className="text-sky-400 font-bold flex items-center gap-0.5 shrink-0">
            <span>مشاهدة</span>
            <ChevronLeft className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};
