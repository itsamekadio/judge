import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoursesService } from '../lib/coursesService';
import { VideoPlayer } from '../components/VideoPlayer';
import { Curriculum, Chapter, Topic, Lesson } from '../types';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  Folder,
  Layers,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';

export const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // State filled by Firestore real-time subscriptions
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Accordion state: map of topicId -> boolean (true = expanded)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubCurrs = CoursesService.subscribeCurriculums((c) => setCurriculums(c));
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

  // Active lesson & context
  const currentLesson = lessons.find((l) => l.id === lessonId);
  const activeChapter = chapters.find((ch) => ch.id === currentLesson?.chapterId);
  const activeCurriculum = curriculums.find((c) => c.id === currentLesson?.curriculumId);
  const activeTopic = topics.find((t) => t.id === currentLesson?.topicId);

  // Automatically expand the active topic when lesson loads
  useEffect(() => {
    if (currentLesson) {
      const topicKey = currentLesson.topicId || 'general';
      setExpandedTopics(prev => ({
        ...prev,
        [topicKey]: true
      }));
    }
  }, [currentLesson?.id, currentLesson?.topicId]);

  const toggleTopic = (topicKey: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Other lessons in active chapter
  const chapterLessons = lessons
    .filter((l) => l.chapterId === currentLesson?.chapterId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Topics belonging to this chapter
  const chapterTopics = topics
    .filter((t) => t.chapterId === currentLesson?.chapterId)
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

  // Group lessons by topic for sidebar
  const unassignedLessons = chapterLessons.filter(l => !l.topicId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/dashboard" className="hover:text-sky-400">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300 font-medium">{activeCurriculum?.title || 'المنهج'}</span>
          <ChevronLeft className="w-3 h-3 text-slate-600" />
          <span className="text-indigo-300 font-medium">{activeChapter?.title || 'الفصل'}</span>
          {activeTopic && (
            <>
              <ChevronLeft className="w-3 h-3 text-slate-600" />
              <span className="text-emerald-300 font-medium">{activeTopic.title}</span>
            </>
          )}
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

      {/* Grid: Video on Left, Topic Playlist Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Video Player Column */}
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer
            youtubeId={currentLesson.youtubeId}
            title={currentLesson.title}
            autoPlay={false}
          />

          {/* Video Title Details & PDF Sheet Download Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h1 className="text-xl font-bold text-white">{currentLesson.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {currentLesson.duration && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentLesson.duration}</span>
                  </span>
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                  {activeChapter?.title}
                </span>
                {activeTopic && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{activeTopic.title}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Attached PDF Sheet Card (only rendered if pdfUrl exists) */}
            {currentLesson.pdfUrl ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>شيت الدرس والواجب (ملف PDF)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-normal">جاهز للتحميل</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {currentLesson.pdfName || 'حمل الشيت للمتابعة وحل التمارين'}
                    </p>
                  </div>
                </div>

                <a
                  href={currentLesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={currentLesson.pdfName || 'sheet.pdf'}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل أو عرض الشيت</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            ) : null}

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

        {/* Chapter Playlist Sidebar with Collapsible Topics */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">فهرس فصول وموضوعات الدرس</h3>
            </div>
            <span className="text-xs text-slate-400">{chapterLessons.length} دروس</span>
          </div>

          <p className="text-xs text-slate-400 font-semibold">{activeChapter?.title}</p>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-0.5">
            {chapterTopics.length > 0 ? (
              <>
                {/* List each Topic as an Accordion */}
                {chapterTopics.map((topic) => {
                  const topicLessons = chapterLessons.filter(l => l.topicId === topic.id);
                  const isExpanded = !!expandedTopics[topic.id];
                  const hasActiveLesson = topicLessons.some(l => l.id === lessonId);

                  return (
                    <div key={topic.id} className="rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">
                      {/* Topic Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className={`w-full p-2.5 flex items-center justify-between text-xs font-bold transition-colors ${
                          hasActiveLesson 
                            ? 'bg-emerald-500/10 text-emerald-300' 
                            : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{topic.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({topicLessons.length})</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {/* Topic Videos (collapsible) */}
                      {isExpanded && (
                        <div className="p-1.5 space-y-1 bg-slate-900/40 border-t border-slate-800/60">
                          {topicLessons.length > 0 ? (
                            topicLessons.map((l, idx) => {
                              const isActive = l.id === lessonId;

                              return (
                                <Link
                                  key={l.id}
                                  to={`/lesson/${l.id}`}
                                  className={`block p-2 rounded-lg border text-xs transition-all ${
                                    isActive
                                      ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isActive ? (
                                      <PlayCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 fill-current" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-400 text-[9px] flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                    )}
                                    <span className="truncate flex-1">{l.title}</span>
                                    {l.pdfUrl && (
                                      <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 shrink-0">
                                        PDF
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-slate-500 py-1.5 text-center">لا توجد دروس في هذا الموضوع</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned lessons in chapter */}
                {unassignedLessons.length > 0 && (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleTopic('general')}
                      className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-slate-400 hover:bg-slate-900"
                    >
                      <span>دروس عامة ({unassignedLessons.length})</span>
                      {expandedTopics['general'] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {expandedTopics['general'] && (
                      <div className="p-1.5 space-y-1 bg-slate-900/40 border-t border-slate-800/60">
                        {unassignedLessons.map((l, idx) => {
                          const isActive = l.id === lessonId;
                          return (
                            <Link
                              key={l.id}
                              to={`/lesson/${l.id}`}
                              className={`block p-2 rounded-lg border text-xs transition-all ${
                                isActive
                                  ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isActive ? (
                                  <PlayCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 fill-current" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-400 text-[9px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                )}
                                <span className="truncate flex-1">{l.title}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Fallback when no topics exist in the chapter */
              chapterLessons.map((l, idx) => {
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
                      {l.pdfUrl && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                          PDF
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
