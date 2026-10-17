import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CoursesService, extractYouTubeId } from '../lib/coursesService';
import { CourseUnit, Lesson, STUDENT_GROUPS } from '../types';
import { 
  ShieldCheck, 
  PlusCircle, 
  Layers, 
  Video, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  Users, 
  Check, 
  RefreshCw,
  Eye,
  Database,
  Film
} from 'lucide-react';

const ALL_PERMISSION_GROUPS = ['الكل', ...STUDENT_GROUPS] as const;

export const Admin: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();

  const [courses, setCourses] = useState<CourseUnit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<'publish' | 'units' | 'content'>('publish');

  // New Course Form state
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitOrder, setNewUnitOrder] = useState<number>(1);
  const [newUnitDescription, setNewUnitDescription] = useState('');
  const [unitSuccess, setUnitSuccess] = useState<string | null>(null);

  // New Lesson Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [lessonDuration, setLessonDuration] = useState('30 دقيقة');
  const [lessonDescription, setLessonDescription] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['الكل']);
  const [lessonSuccess, setLessonSuccess] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  useEffect(() => {
    const unsubCourses = CoursesService.subscribeCourses((c) => {
      setCourses(c);
      if (c.length > 0 && !selectedCourseId) {
        setSelectedCourseId(c[0].id);
        setNewUnitOrder(c.length + 1);
      }
    });

    const unsubLessons = CoursesService.subscribeLessons((l) => {
      setLessons(l);
    });

    return () => {
      unsubCourses();
      unsubLessons();
    };
  }, []);

  // Update default order when course selection changes
  useEffect(() => {
    if (selectedCourseId) {
      const unitLessons = lessons.filter(l => l.courseId === selectedCourseId);
      setLessonOrder(unitLessons.length + 1);
    }
  }, [selectedCourseId, lessons]);

  // Handle group checkbox toggles
  const handleGroupToggle = (groupName: string) => {
    if (groupName === 'الكل') {
      if (selectedGroups.includes('الكل')) {
        setSelectedGroups(['مجموعة 1']);
      } else {
        setSelectedGroups(['الكل', ...STUDENT_GROUPS]);
      }
      return;
    }

    let updated = [...selectedGroups];
    if (updated.includes(groupName)) {
      updated = updated.filter(g => g !== groupName && g !== 'الكل');
      if (updated.length === 0) {
        updated = ['مجموعة 1']; // keep at least one
      }
    } else {
      updated.push(groupName);
      // If all individual groups are selected, also add 'الكل'
      const hasAll = STUDENT_GROUPS.every(g => updated.includes(g));
      if (hasAll && !updated.includes('الكل')) {
        updated.push('الكل');
      }
    }
    setSelectedGroups(updated);
  };

  // Add Course Unit Handler
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    setIsSubmitting(true);
    setUnitSuccess(null);
    try {
      await CoursesService.addCourse({
        title: newUnitTitle.trim(),
        order: Number(newUnitOrder) || courses.length + 1,
        description: newUnitDescription.trim()
      });
      setUnitSuccess('تمت إضافة الوحدة الدراسية بنجاح إلى قاعدة البيانات!');
      setNewUnitTitle('');
      setNewUnitDescription('');
      setNewUnitOrder(courses.length + 2);
    } catch (err: any) {
      alert('حدث خطأ أثناء إضافة الوحدة: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add / Publish Lesson Handler
  const handlePublishLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !lessonTitle.trim() || !youtubeInput.trim()) {
      alert('يرجى اختيار الوحدة، إدخال عنوان الدرس، ومعرّف فيديو يوتيوب');
      return;
    }

    const cleanYoutubeId = extractYouTubeId(youtubeInput);
    if (!cleanYoutubeId) {
      alert('يرجى إدخال معرّف فيديو أو رابط يوتيوب صحيح');
      return;
    }

    setIsSubmitting(true);
    setLessonSuccess(null);
    try {
      if (editingLessonId) {
        await CoursesService.updateLesson(editingLessonId, {
          courseId: selectedCourseId,
          title: lessonTitle.trim(),
          youtubeId: cleanYoutubeId,
          order: Number(lessonOrder) || 1,
          duration: lessonDuration,
          description: lessonDescription.trim(),
          allowedGroups: selectedGroups
        });
        setLessonSuccess('تم تحديث بيانات الدرس وتصريحات المجموعات بنجاح!');
        setEditingLessonId(null);
      } else {
        await CoursesService.addLesson({
          courseId: selectedCourseId,
          title: lessonTitle.trim(),
          youtubeId: cleanYoutubeId,
          order: Number(lessonOrder) || 1,
          duration: lessonDuration,
          description: lessonDescription.trim(),
          allowedGroups: selectedGroups
        });
        setLessonSuccess('تم نشر الدرس بنجاح ومتاح للطلاب في الحال بدون إعادة بناء!');
      }

      setLessonTitle('');
      setYoutubeInput('');
      setLessonDescription('');
      const unitLessons = lessons.filter(l => l.courseId === selectedCourseId);
      setLessonOrder(unitLessons.length + 2);
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الدرس: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick edit lesson in modal/form
  const handleStartEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setSelectedCourseId(lesson.courseId);
    setLessonTitle(lesson.title);
    setYoutubeInput(lesson.youtubeId);
    setLessonOrder(lesson.order || 1);
    setLessonDuration(lesson.duration || '30 دقيقة');
    setLessonDescription(lesson.description || '');
    setSelectedGroups(lesson.allowedGroups || ['الكل']);
    setActiveTab('publish');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Inline toggle permission in table
  const handleToggleTablePermission = async (lesson: Lesson, group: string) => {
    let updated = [...(lesson.allowedGroups || [])];
    if (updated.includes(group)) {
      updated = updated.filter(g => g !== group);
    } else {
      updated.push(group);
    }
    await CoursesService.updateLesson(lesson.id, { allowedGroups: updated });
  };

  // Delete handlers
  const handleDeleteLesson = async (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف درس: "${title}"؟`)) {
      await CoursesService.deleteLesson(id);
    }
  };

  const handleDeleteUnit = async (id: string, title: string) => {
    if (window.confirm(`تحذير: هل أنت متأكد من حذف وحدة: "${title}" وجميع الدروس التابعة لها؟`)) {
      await CoursesService.deleteCourse(id);
    }
  };

  const handleSeedDefaults = async () => {
    if (window.confirm('هل تريد إعادة تعيين المحتوى الافتراضي للوحدات والدروس النموذجية؟')) {
      await CoursesService.seedInitialData();
      alert('تم تحميل البيانات النموذجية بنجاح!');
    }
  };

  const previewYoutubeId = extractYouTubeId(youtubeInput);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header Bar */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>لوحة التحكم المركزية • Admin Hub</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Firestore Live Sync</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة المنصة التعليمية — المهندس عبد الرحمن القاضي
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              إضافة وحدات المنهج، نشر دروس الفيديو عبر YouTube Unlisted، وتحديد أذونات الوصول المباشرة لكل مجموعة طلابية بنقرة واحدة بدون إعادة بناء الموقع.
            </p>
          </div>

          {/* Quick Stats Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
              <span className="text-2xl font-black text-amber-400 block">{courses.length}</span>
              <span className="text-xs text-slate-400">وحدات دراسية</span>
            </div>
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
              <span className="text-2xl font-black text-sky-400 block">{lessons.length}</span>
              <span className="text-xs text-slate-400">دروس منشورة</span>
            </div>
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="text-2xl font-black text-emerald-400 block">3</span>
              <span className="text-xs text-slate-400">مجموعات فعالة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'publish'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>نشر درس جديد (Lesson Publisher)</span>
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'units'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>إنشاء وحدة جديدة (Course Units)</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'content'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>جدول المحتوى والأذونات ({lessons.length})</span>
          </button>
        </div>

        <button
          onClick={handleSeedDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          title="إعادة تحميل المنهج الافتراضي التجريبي"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تحميل نموذج المنهج التجريبي</span>
        </button>
      </div>

      {/* TAB 1: PUBLISH / EDIT LESSON FORM */}
      {activeTab === 'publish' && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <span>{editingLessonId ? 'تعديل بيانات وتصريحات الدرس' : 'نموذج نشر درس فيديو جديد (Lesson Publisher)'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                الكتابة تتم مباشرة في Cloud Firestore وتظهر في ثوانٍ لجميع الطلاب المصرح لهم.
              </p>
            </div>

            {editingLessonId && (
              <button
                type="button"
                onClick={() => {
                  setEditingLessonId(null);
                  setLessonTitle('');
                  setYoutubeInput('');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          {lessonSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{lessonSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePublishLesson} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Unit Selector Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الوحدة الدراسية التابع لها الدرس <span className="text-rose-400">*</span>
                </label>
                {courses.length > 0 ? (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (#{c.order})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    يرجى أولاً إنشاء وحدة دراسية واحدة على الأقل من تبويب "إنشاء وحدة جديدة".
                  </div>
                )}
              </div>

              {/* Lesson Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان الدرس <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="مثال: الدرس 1: مفهوم النهاية وتطبيقاتها"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-500"
                />
              </div>

              {/* YouTube Video ID / URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>معرّف أو رابط فيديو يوتيوب (YouTube ID/URL) <span className="text-rose-400">*</span></span>
                  <span className="text-[11px] text-sky-400">يدعم الروابط المباشرة و11 حرف</span>
                </label>
                <input
                  type="text"
                  required
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder="مثال: dQw4w9WgXcQ أو https://youtu.be/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-500 font-mono text-left dir-ltr"
                  dir="ltr"
                />
              </div>

              {/* Lesson Order and Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ترتيب الدرس
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lessonOrder}
                    onChange={(e) => setLessonOrder(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    مدة الشرح المتوقعة
                  </label>
                  <input
                    type="text"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    placeholder="30 دقيقة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

            </div>

            {/* Target Group Permissions Checkboxes */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>تحديد المجموعات المستهدفة والمصرح لها بمشاهدة الفيديو:</span>
                <span className="text-xs text-slate-400">فقط المجموعات المحددة ستتمكن من فتح الفيديو</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ALL_PERMISSION_GROUPS.map((grp) => {
                  const isChecked = selectedGroups.includes(grp);
                  return (
                    <label
                      key={grp}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleGroupToggle(grp)}
                        className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400"
                      />
                      <span className="text-xs font-bold">{grp}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ملاحظات ومحتوى المحاضرة (اختياري)
              </label>
              <textarea
                rows={3}
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="تفاصيل عن محتوى الفيديو، المسائل التي تم حلها، أو الواجب المطلوب..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-500"
              />
            </div>

            {/* Live Video Preview if valid ID */}
            {previewYoutubeId && previewYoutubeId.length === 11 && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
                <img
                  src={`https://img.youtube.com/vi/${previewYoutubeId}/default.jpg`}
                  alt="معاينة"
                  className="w-24 h-18 object-cover rounded-lg border border-slate-700"
                />
                <div className="space-y-1">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>تم التحقق من معرّف يوتيوب: {previewYoutubeId}</span>
                  </span>
                  <p className="text-xs text-slate-400">سيتم تضمين الفيديو بنسبة 16:9 وبدون إعلانات خارجية غير مرغوبة.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || courses.length === 0}
              className="w-full py-3.5 px-6 rounded-xl font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Video className="w-5 h-5" />
              <span>{editingLessonId ? 'حفظ تعديلات الدرس الآن' : 'نشر الدرس فوراً في Cloud Firestore'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: COURSE UNITS CREATOR */}
      {activeTab === 'units' && (
        <div className="space-y-8">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>إضافة وحدة دراسية جديدة (Course Unit Creator)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                إنشاء وحدات المنهج وترتيبها (مثل: الوحدة الأولى: النهايات، الوحدة الثانية: التفاضل).
              </p>
            </div>

            {unitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{unitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    عنوان الوحدة الدراسية <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="مثال: الوحدة الرابعة: الهندسة الفراغية والمتجهات"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ترتيب الوحدة
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newUnitOrder}
                    onChange={(e) => setNewUnitOrder(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  وصف مختصر للوحدة (اختياري)
                </label>
                <input
                  type="text"
                  value={newUnitDescription}
                  onChange={(e) => setNewUnitDescription(e.target.value)}
                  placeholder="شرح المفاهيم العامة التي تغطيها هذه الوحدة..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>إضافة الوحدة إلى قائمة الكورسات</span>
              </button>
            </form>
          </div>

          {/* Current Units List */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">الوحدات الحالية المضافة ({courses.length})</h3>

            <div className="space-y-3">
              {courses.map((unit) => {
                const unitLessonsCount = lessons.filter(l => l.courseId === unit.id).length;
                return (
                  <div
                    key={unit.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                        #{unit.order}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{unit.title}</h4>
                        <p className="text-xs text-slate-400">{unit.description || 'لا يوجد وصف'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                        {unitLessonsCount} درس
                      </span>
                      <button
                        onClick={() => handleDeleteUnit(unit.id, unit.title)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف الوحدة وجميع دروسها"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT MANAGER TABLE */}
      {activeTab === 'content' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <span>جدول المحتوى وتعديل تصريحات المجموعات</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                يمكنك تبديل تصريح المجموعات مباشرة من الجدول أو تعديل أو حذف أي درس.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              إجمالي الدروس: {lessons.length}
            </span>
          </div>

          {lessons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">عنوان الدرس</th>
                    <th className="py-3 px-4">الوحدة التابع لها</th>
                    <th className="py-3 px-4">معرّف يوتيوب</th>
                    <th className="py-3 px-4">المجموعات المصرح لها (انقر للتعديل السريع)</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lessons.map((lesson) => {
                    const unit = courses.find(c => c.id === lesson.courseId);

                    return (
                      <tr key={lesson.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-amber-400">
                          {lesson.order || 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {lesson.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {unit?.title || lesson.courseId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sky-400 text-left dir-ltr">
                          {lesson.youtubeId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_PERMISSION_GROUPS.map((grp) => {
                              const hasGrp = lesson.allowedGroups?.includes(grp);
                              return (
                                <button
                                  key={grp}
                                  onClick={() => handleToggleTablePermission(lesson, grp)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                    hasGrp
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-700'
                                  }`}
                                  title="انقر لتبديل التصريح"
                                >
                                  {grp}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <a
                              href={`#/lesson/${lesson.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors"
                              title="معاينة الدرس كما يراه الطالب"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleStartEditLesson(lesson)}
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="تعديل الدرس"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="حذف الدرس"
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
            <div className="text-center py-12 text-slate-500 text-xs">
              لا توجد دروس مضافة حالياً. انتقل إلى تبويب "نشر درس جديد" لإضافة أول درس.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
