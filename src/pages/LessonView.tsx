import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CoursesService, 
  getLocalCurriculums, 
  getLocalChapters, 
  getLocalLessons 
} from '../lib/coursesService';
import { VideoPlayer } from '../components/VideoPlayer';
import { Curriculum, Chapter, Lesson } from '../types';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  Folder
} from 'lucide-react';

export const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Instant synchronous initialization
  const [curriculums, setCurriculums] = useState<Curriculum[]>(getLocalCurriculums());
  const [chapters, setChapters] = useState<Chapter[]>(getLocalChapters());
  const [lessons, setLessons] = useState<Lesson[]>(getLocalLessons());

  useEffect(() => {
    const unsubCurrs = CoursesService.subscribeCurriculums((c) => setCurriculums(c));
    const unsubChaps = CoursesService.subscribeChapters((ch) => setChapters(ch));
    const unsubLess = CoursesService.subscribeLessons((l) => setLessons(l));

    return () => {
      unsubCurrs();
      unsubChaps();
      unsubLess();
    };
  }, []);

  // Active lesson
  const currentLesson = lessons.find((l) => l.id === lessonId);
  const activeChapter = chapters.find((ch) => ch.id === currentLesson?.chapterId);
  const activeCurriculum = curriculums.find((c) => c.id === currentLesson?.curriculumId);

  // Other lessons in active chapter
  const chapterLessons = lessons
    .filter((l) => l.chapterId === currentLesson?.chapterId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Next / Prev lessons in current chapter
  const currentIndex = chapterLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? chapterLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < chapterLessons.length - 1 ? chapterLessons[currentIndex + 1] : null;

  if (!currentLesson) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-200">الفيديو غير موجود</h2>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="hover:text-sky-400">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300 font-medium">{activeCurriculum?.title || 'المنهج'}</span>
          <ChevronLeft className="w-3 h-3 text-slate-600" />
          <span className="text-indigo-300 font-medium">{activeChapter?.title || 'الفصل'}</span>
          <ChevronLeft className="w-3 h-3 text-slate-600" />
          <span className="text-sky-400 font-bold truncate max-w-[180px] sm:max-w-none">{currentLesson.title}</span>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع</span>
        </Link>
      </div>

      {/* Grid: Video on Left, Chapter Playlist on Right (RTL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Video Player Column */}
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer
            youtubeId={currentLesson.youtubeId}
            title={currentLesson.title}
            autoPlay={false}
          />

          {/* Video Title Details */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h1 className="text-xl font-bold text-white">{currentLesson.title}</h1>
              <div className="flex items-center gap-2">
                {currentLesson.duration && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentLesson.duration}</span>
                  </span>
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                  {activeChapter?.title}
                </span>
              </div>
            </div>

            {/* Next / Previous Buttons */}
            <div className="flex items-center justify-between pt-2">
              {prevLesson ? (
                <button
                  onClick={() => navigate(`/lesson/${prevLesson.id}`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الفيديو السابق</span>
                </button>
              ) : <div></div>}

              {nextLesson ? (
                <button
                  onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-400 text-xs font-bold shadow-md"
                >
                  <span>الفيديو التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>آخر فيديو في هذا الفصل</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapter Playlist Sidebar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">فيديوهات الفصل</h3>
            </div>
            <span className="text-xs text-slate-400">{chapterLessons.length} دروس</span>
          </div>

          <p className="text-xs text-slate-400 font-semibold">{activeChapter?.title}</p>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {chapterLessons.map((l, idx) => {
              const isActive = l.id === lessonId;

              return (
                <Link
                  key={l.id}
                  to={`/lesson/${l.id}`}
                  className={`block p-2.5 rounded-xl border text-xs transition-all ${
                    isActive
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isActive ? (
                      <PlayCircle className="w-4 h-4 text-sky-400 shrink-0 fill-current" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate flex-1">{l.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
