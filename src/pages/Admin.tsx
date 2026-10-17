import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CoursesService, extractYouTubeId } from '../lib/coursesService';
import { Curriculum, Chapter, Lesson, STUDENT_GROUPS } from '../types';
import { 
  ShieldCheck, 
  Plus, 
  Video, 
  BookOpen, 
  FolderPlus, 
  Trash2, 
  CheckCircle, 
  Users,
  Eye,
  Film
} from 'lucide-react';

const ALL_PERMISSION_GROUPS = ['الكل', ...STUDENT_GROUPS] as const;

export const Admin: React.FC = () => {
  const { currentUser } = useAuth();

  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // 1. New Curriculum Text State
  const [newCurriculumTitle, setNewCurriculumTitle] = useState('');
  const [curriculumSuccess, setCurriculumSuccess] = useState('');

  // 2. New Chapter State
  const [chapterCurriculumId, setChapterCurriculumId] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [chapterSuccess, setChapterSuccess] = useState('');

  // 3. New Video / Lesson State
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [videoDuration, setVideoDuration] = useState('30 دقيقة');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['الكل']);
  const [videoSuccess, setVideoSuccess] = useState('');

  useEffect(() => {
    const unsubCurrs = CoursesService.subscribeCurriculums((c) => {
      setCurriculums(c);
      if (c.length > 0) {
        if (!chapterCurriculumId) setChapterCurriculumId(c[0].id);
        if (!selectedCurriculumId) setSelectedCurriculumId(c[0].id);
      }
    });

    const unsubChaps = CoursesService.subscribeChapters((ch) => {
      setChapters(ch);
    });

    const unsubLess = CoursesService.subscribeLessons((l) => {
      setLessons(l);
    });

    return () => {
      unsubCurrs();
      unsubChaps();
      unsubLess();
    };
  }, []);

  // Update selectedChapterId when selectedCurriculumId or chapters change
  useEffect(() => {
    if (selectedCurriculumId) {
      const available = chapters.filter(ch => ch.curriculumId === selectedCurriculumId);
      if (available.length > 0) {
        setSelectedChapterId(available[0].id);
      } else {
        setSelectedChapterId('');
      }
    }
  }, [selectedCurriculumId, chapters]);

  // Add Curriculum Handler
  const handleAddCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurriculumTitle.trim()) return;
    await CoursesService.addCurriculum(newCurriculumTitle.trim(), curriculums.length + 1);
    setCurriculumSuccess('تمت إضافة المنهج بنجاح!');
    setNewCurriculumTitle('');
    setTimeout(() => setCurriculumSuccess(''), 3000);
  };

  // Add Chapter Handler
  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterCurriculumId || !newChapterTitle.trim()) {
      alert('يرجى اختيار المنهج وكتابة اسم الفصل');
      return;
    }
    const currChapters = chapters.filter(ch => ch.curriculumId === chapterCurriculumId);
    await CoursesService.addChapter(chapterCurriculumId, newChapterTitle.trim(), currChapters.length + 1);
    setChapterSuccess('تمت إضافة الفصل بنجاح!');
    setNewChapterTitle('');
    setTimeout(() => setChapterSuccess(''), 3000);
  };

  // Group toggle
  const handleGroupToggle = (grp: string) => {
    if (grp === 'الكل') {
      if (selectedGroups.includes('الكل')) {
        setSelectedGroups(['مجموعة 1']);
      } else {
        setSelectedGroups(['الكل', ...STUDENT_GROUPS]);
      }
      return;
    }

    let updated = [...selectedGroups];
    if (updated.includes(grp)) {
      updated = updated.filter(g => g !== grp && g !== 'الكل');
      if (updated.length === 0) updated = ['مجموعة 1'];
    } else {
      updated.push(grp);
      if (STUDENT_GROUPS.every(g => updated.includes(g)) && !updated.includes('الكل')) {
        updated.push('الكل');
      }
    }
    setSelectedGroups(updated);
  };

  // Add Video Handler
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurriculumId || !selectedChapterId) {
      alert('يرجى أولاً اختيار المنهج والفصل');
      return;
    }
    if (!videoTitle.trim() || !youtubeInput.trim()) {
      alert('يرجى كتابة عنوان الفيديو ورابط يوتيوب');
      return;
    }

    const cleanYt = extractYouTubeId(youtubeInput);
    if (!cleanYt) {
      alert('يرجى إدخال رابط أو معرّف يوتيوب صالح (11 حرف)');
      return;
    }

    const chapterLessons = lessons.filter(l => l.chapterId === selectedChapterId);
    await CoursesService.addLesson({
      curriculumId: selectedCurriculumId,
      chapterId: selectedChapterId,
      title: videoTitle.trim(),
      youtubeId: cleanYt,
      duration: videoDuration || '30 دقيقة',
      allowedGroups: selectedGroups,
      order: chapterLessons.length + 1
    });

    setVideoSuccess('تم نشر الفيديو بنجاح وربطه بالمنهج والفصل!');
    setVideoTitle('');
    setYoutubeInput('');
    setTimeout(() => setVideoSuccess(''), 4000);
  };

  const previewId = extractYouTubeId(youtubeInput);
  const filteredChaptersForVideo = chapters.filter(ch => ch.curriculumId === selectedCurriculumId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">لوحة تحكم المشرف (Admin)</h1>
            <p className="text-xs text-slate-400">المهندس عبد الرحمن القاضي • إدارة المناهج والفصول والفيديوهات والمجموعات</p>
          </div>
        </div>
        <div className="text-left text-xs text-slate-400">
          <span className="block font-bold text-amber-400">{lessons.length} فيديوهات</span>
          <span>{curriculums.length} مناهج • {chapters.length} فصول</span>
        </div>
      </div>

      {/* Row: Add Curriculum (Text) + Add Chapter (Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Add Curriculum by text */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sky-400">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">1. إضافة منهج / كورس (Curriculum)</h2>
          </div>
          <p className="text-xs text-slate-400">أدخل اسم المنهج كـ نص فقط (مثل: تفاضل وتكامل 3 ثانوي)</p>

          {curriculumSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{curriculumSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddCurriculum} className="flex gap-2">
            <input
              type="text"
              required
              value={newCurriculumTitle}
              onChange={(e) => setNewCurriculumTitle(e.target.value)}
              placeholder="اسم المنهج..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </form>

          {/* Quick list of curriculums */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 block mb-2">المناهج المتاحة حالياً ({curriculums.length}):</span>
            <div className="flex flex-wrap gap-2">
              {curriculums.map((curr) => (
                <div key={curr.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span>{curr.title}</span>
                  <button
                    onClick={() => CoursesService.deleteCurriculum(curr.id)}
                    className="text-slate-500 hover:text-rose-400"
                    title="حذف المنهج"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Add Chapter by text */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <FolderPlus className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">2. إضافة فصل / باب (Chapter)</h2>
          </div>
          <p className="text-xs text-slate-400">اختر المنهج واكتب اسم الفصل نصاً (مثل: الفصل الأول: النهايات)</p>

          {chapterSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{chapterSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddChapter} className="space-y-3">
            <select
              value={chapterCurriculumId}
              onChange={(e) => setChapterCurriculumId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {curriculums.map((c) => (
                <option key={c.id} value={c.id}>المنهج: {c.title}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="اسم الفصل الجديد..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </div>
          </form>

          {/* Chapters count */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 block mb-1">الفصول المتاحة حالياً ({chapters.length}):</span>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {chapters.map((ch) => (
                <span key={ch.id} className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1">
                  <span>{ch.title}</span>
                  <button onClick={() => CoursesService.deleteChapter(ch.id)} className="text-rose-400/80 hover:text-rose-300">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Add Video with Dropdowns */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/40 space-y-6">
        <div className="flex items-center gap-2 text-amber-400">
          <Video className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-bold text-white">3. إضافة ونشر فيديو جديد (Add Video)</h2>
            <p className="text-xs text-slate-400">اختر المنهج والفصل من القوائم المنسدلة، ثم اكتب عنوان الدرس وضع رابط يوتيوب وحدد المجموعة</p>
          </div>
        </div>

        {videoSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{videoSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAddVideo} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Dropdown 1: Curriculum */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اختر المنهج (Curriculum) <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedCurriculumId}
                onChange={(e) => setSelectedCurriculumId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {curriculums.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Dropdown 2: Chapter */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اختر الفصل (Chapter) <span className="text-rose-400">*</span>
              </label>
              {filteredChaptersForVideo.length > 0 ? (
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {filteredChaptersForVideo.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              ) : (
                <div className="p-2 text-xs text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  لا توجد فصول بعد لهذا المنهج. أضف فصلاً في الأعلى أولاً.
                </div>
              )}
            </div>

            {/* Lesson Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                عنوان الدرس / المحاضرة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="مثال: الدرس 1: مفهوم النهاية بيانياً"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* YouTube Link / ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رابط أو معرّف فيديو يوتيوب (YouTube ID/URL) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="مثال: dQw4w9WgXcQ أو رابط يوتيوب كامل"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-left dir-ltr"
                dir="ltr"
              />
            </div>

          </div>

          {/* Group Permissions (مجموعة الطالب) */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>تحديد مجموعة الطلاب المصرح لهم بالمشاهدة:</span>
              <span className="text-[11px] text-slate-400 font-normal">المجموعة خاصة بالطالب</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ALL_PERMISSION_GROUPS.map((grp) => {
                const checked = selectedGroups.includes(grp);
                return (
                  <label
                    key={grp}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleGroupToggle(grp)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs">{grp}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* YouTube Preview */}
          {previewId && previewId.length === 11 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <img
                src={`https://img.youtube.com/vi/${previewId}/default.jpg`}
                alt="معاينة"
                className="w-20 h-14 object-cover rounded-lg"
              />
              <span className="text-xs text-emerald-400 font-medium">
                معرّف يوتيوب صحيح: {previewId}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedCurriculumId || !selectedChapterId}
            className="w-full py-3.5 px-6 rounded-xl font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Video className="w-5 h-5" />
            <span>نشر الفيديو في المنهج والفصل فوراً</span>
          </button>
        </form>
      </div>

      {/* 4. Table of Published Videos */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">قائمة الفيديوهات المنشورة ({lessons.length})</h3>
          <span className="text-xs text-slate-400">تحديث لحظي مع Cloud Firestore</span>
        </div>

        {lessons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-2.5 px-3">الدرس</th>
                  <th className="py-2.5 px-3">المنهج</th>
                  <th className="py-2.5 px-3">الفصل</th>
                  <th className="py-2.5 px-3">معرّف YouTube</th>
                  <th className="py-2.5 px-3">المجموعات المسموح لها</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lessons.map((lesson) => {
                  const curr = curriculums.find(c => c.id === lesson.curriculumId);
                  const chap = chapters.find(ch => ch.id === lesson.chapterId);

                  return (
                    <tr key={lesson.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-bold text-slate-200">{lesson.title}</td>
                      <td className="py-3 px-3 text-sky-400">{curr?.title || 'عام'}</td>
                      <td className="py-3 px-3 text-indigo-300">{chap?.title || 'عام'}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 dir-ltr text-left">{lesson.youtubeId}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {lesson.allowedGroups?.map(g => (
                            <span key={g} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={`#/lesson/${lesson.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded"
                            title="مشاهدة الدرس"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(`حذف فيديو: ${lesson.title}؟`)) {
                                CoursesService.deleteLesson(lesson.id);
                              }
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">لا توجد فيديوهات منشورة حتى الآن.</p>
        )}
      </div>

    </div>
  );
};
