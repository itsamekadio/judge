import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CoursesService, 
  extractYouTubeId, 
  getLocalCurriculums, 
  getLocalChapters, 
  getLocalLessons 
} from '../lib/coursesService';
import { Curriculum, Chapter, Lesson } from '../types';
import { 
  PlayCircle, 
  Clock, 
  BookOpen, 
  Folder, 
  ChevronLeft, 
  Search,
  CheckCircle2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, isAdmin, updateCurriculum } = useAuth();
  
  // Initialize synchronously with zero lag
  const [curriculums, setCurriculums] = useState<Curriculum[]>(getLocalCurriculums());
  const [chapters, setChapters] = useState<Chapter[]>(getLocalChapters());
  const [lessons, setLessons] = useState<Lesson[]>(getLocalLessons());
  
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>(() => {
    return currentUser?.curriculumId || (curriculums[0]?.id || '');
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubCurrs = CoursesService.subscribeCurriculums((c) => {
      setCurriculums(c);
      if (c.length > 0 && !selectedCurriculumId) {
        setSelectedCurriculumId(currentUser?.curriculumId || c[0].id);
      }
    });

    const unsubChaps = CoursesService.subscribeChapters((ch) => setChapters(ch));
    const unsubLess = CoursesService.subscribeLessons((l) => setLessons(l));

    return () => {
      unsubCurrs();
      unsubChaps();
      unsubLess();
    };
  }, []);

  // Update curriculum selection if student switches
  const handleSelectCurriculum = (curr: Curriculum) => {
    setSelectedCurriculumId(curr.id);
    if (!isAdmin) {
      updateCurriculum(curr.id, curr.title);
    }
  };

  // Active curriculum
  const activeCurriculum = curriculums.find(c => c.id === selectedCurriculumId) || curriculums[0];
  
  // Chapters of active curriculum
  const activeChapters = chapters.filter(ch => ch.curriculumId === (activeCurriculum?.id || ''));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Student Welcome & Selected Curriculum Bar */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold inline-block mb-2">
            منصة جادج التعليمية • Eng. Abdelrahman Elkady
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            مرحباً بك، {currentUser?.fullName || 'عزيزي الطالب'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            تابع فصول ومحاضرات المنهج المسجل به. اضغط على أي فيديو لبدء المشاهدة.
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

      {/* Curriculum Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>اختر المنهج الدراسي لتصفح فصوله:</span>
          </h2>

          {/* Quick Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن درس أو فيديو..."
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

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

      {/* Chapters & Lessons of Selected Curriculum */}
      <div className="space-y-8">
        {activeChapters.length > 0 ? (
          activeChapters.map((chapter) => {
            const chapterLessons = lessons.filter(l => {
              if (l.chapterId !== chapter.id) return false;
              if (searchTerm.trim()) {
                return l.title.toLowerCase().includes(searchTerm.toLowerCase());
              }
              return true;
            });

            return (
              <div key={chapter.id} className="glass-panel p-6 rounded-2xl border border-slate-800/90 space-y-4">
                
                {/* Chapter Title Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <Folder className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{chapter.title}</h3>
                  </div>

                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    {chapterLessons.length} فيديوهات
                  </span>
                </div>

                {/* Video Cards Grid */}
                {chapterLessons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chapterLessons.map((lesson) => {
                      const cleanId = extractYouTubeId(lesson.youtubeId);

                      return (
                        <Link
                          key={lesson.id}
                          to={`/lesson/${lesson.id}`}
                          className="group block bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800 hover:border-sky-500/50 transition-all hover:scale-[1.01]"
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
                            
                            {lesson.duration && (
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-sky-400" />
                                <span>{lesson.duration}</span>
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-3.5 space-y-2">
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2">
                              {lesson.title}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                              <span className="text-slate-500">{activeCurriculum?.title}</span>
                              <span className="text-sky-400 font-bold flex items-center gap-0.5">
                                <span>مشاهدة</span>
                                <ChevronLeft className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    لا توجد فيديوهات مضافة في هذا الفصل حتى الآن.
                  </p>
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
