import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Curriculum, Chapter, Lesson } from '../types';

const LOCAL_CURRICULUMS_KEY = 'judge_curriculums';
const LOCAL_CHAPTERS_KEY = 'judge_chapters';
const LOCAL_LESSONS_KEY = 'judge_lessons';

// Initial clean default data
export const INITIAL_CURRICULUMS: Curriculum[] = [
  {
    id: "curr-1",
    title: "رياضيات 3 ثانوي - تفاضل وتكامل",
    order: 1,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: "chap-1",
    curriculumId: "curr-1",
    title: "الفصل الأول: النهايات والاتصال",
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: "chap-2",
    curriculumId: "curr-1",
    title: "الفصل الثاني: قواعد الاشتقاق وتطبيقاته",
    order: 2,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "less-1",
    curriculumId: "curr-1",
    chapterId: "chap-1",
    title: "الدرس 1: مفهوم النهاية بيانياً وجبرياً",
    youtubeId: "dQw4w9WgXcQ",
    allowedGroups: ["الكل", "مجموعة 1", "مجموعة 2", "مجموعة 3"],
    order: 1,
    duration: "25 دقيقة",
    createdAt: new Date().toISOString()
  },
  {
    id: "less-2",
    curriculumId: "curr-1",
    chapterId: "chap-1",
    title: "الدرس 2: حل النهايات غير المعينة وطرق التحليل",
    youtubeId: "dQw4w9WgXcQ",
    allowedGroups: ["مجموعة 1", "مجموعة 2"],
    order: 2,
    duration: "30 دقيقة",
    createdAt: new Date().toISOString()
  }
];

// Helper to extract clean 11-char YouTube ID
export function extractYouTubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

// Local storage caches
function getLocalCurriculums(): Curriculum[] {
  const data = localStorage.getItem(LOCAL_CURRICULUMS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(INITIAL_CURRICULUMS));
    return INITIAL_CURRICULUMS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_CURRICULUMS; }
}

function getLocalChapters(): Chapter[] {
  const data = localStorage.getItem(LOCAL_CHAPTERS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(INITIAL_CHAPTERS));
    return INITIAL_CHAPTERS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_CHAPTERS; }
}

function getLocalLessons(): Lesson[] {
  const data = localStorage.getItem(LOCAL_LESSONS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(INITIAL_LESSONS));
    return INITIAL_LESSONS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_LESSONS; }
}

export const CoursesService = {
  // 1. Curriculums (المنهج)
  subscribeCurriculums: (callback: (curriculums: Curriculum[]) => void) => {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'curriculums'), orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const list: Curriculum[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...(doc.data() as Omit<Curriculum, 'id'>)
            }));
            localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(list));
            callback(list);
          } else {
            callback(getLocalCurriculums());
          }
        }, (error) => {
          console.warn("Curriculums snapshot error:", error);
          callback(getLocalCurriculums());
        });
      } catch (e) {
        console.warn(e);
      }
    }
    callback(getLocalCurriculums());
    return () => {};
  },

  addCurriculum: async (title: string, order: number = 1): Promise<Curriculum> => {
    const id = `curr-${Date.now()}`;
    const newCurriculum: Curriculum = {
      id,
      title: title.trim(),
      order,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'curriculums', id), {
          id,
          title: title.trim(),
          order,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Error saving curriculum to Firestore:', err);
      }
    }

    const current = getLocalCurriculums();
    const updated = [...current.filter(c => c.id !== id), newCurriculum].sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(updated));
    return newCurriculum;
  },

  deleteCurriculum: async (id: string): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'curriculums', id));
      } catch (err) {
        console.warn('Error deleting curriculum from Firestore:', err);
      }
    }
    const current = getLocalCurriculums();
    localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(current.filter(c => c.id !== id)));
  },

  // 2. Chapters (الفصل)
  subscribeChapters: (callback: (chapters: Chapter[]) => void) => {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'chapters'), orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const list: Chapter[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...(doc.data() as Omit<Chapter, 'id'>)
            }));
            localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(list));
            callback(list);
          } else {
            callback(getLocalChapters());
          }
        }, (error) => {
          console.warn("Chapters snapshot error:", error);
          callback(getLocalChapters());
        });
      } catch (e) {
        console.warn(e);
      }
    }
    callback(getLocalChapters());
    return () => {};
  },

  addChapter: async (curriculumId: string, title: string, order: number = 1): Promise<Chapter> => {
    const id = `chap-${Date.now()}`;
    const newChapter: Chapter = {
      id,
      curriculumId,
      title: title.trim(),
      order,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'chapters', id), {
          id,
          curriculumId,
          title: title.trim(),
          order,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Error saving chapter to Firestore:', err);
      }
    }

    const current = getLocalChapters();
    const updated = [...current.filter(c => c.id !== id), newChapter].sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(updated));
    return newChapter;
  },

  deleteChapter: async (id: string): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'chapters', id));
      } catch (err) {
        console.warn('Error deleting chapter from Firestore:', err);
      }
    }
    const current = getLocalChapters();
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(current.filter(c => c.id !== id)));
  },

  // 3. Lessons / Videos (الدرس / الفيديو)
  subscribeLessons: (callback: (lessons: Lesson[]) => void) => {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const list: Lesson[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...(doc.data() as Omit<Lesson, 'id'>)
            }));
            localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(list));
            callback(list);
          } else {
            callback(getLocalLessons());
          }
        }, (error) => {
          console.warn("Lessons snapshot error:", error);
          callback(getLocalLessons());
        });
      } catch (e)
      {
        console.warn(e);
      }
    }
    callback(getLocalLessons());
    return () => {};
  },

  addLesson: async (data: Omit<Lesson, 'id'>): Promise<Lesson> => {
    const cleanYt = extractYouTubeId(data.youtubeId);
    let id = `less-${Date.now()}`;

    const newLesson: Lesson = {
      ...data,
      id,
      youtubeId: cleanYt,
      allowedGroups: data.allowedGroups?.length ? data.allowedGroups : ['الكل'],
      order: Number(data.order) || 1,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'lessons'), {
          curriculumId: data.curriculumId,
          chapterId: data.chapterId,
          title: data.title.trim(),
          youtubeId: cleanYt,
          allowedGroups: newLesson.allowedGroups,
          order: newLesson.order,
          duration: data.duration || '30 دقيقة',
          createdAt: serverTimestamp()
        });
        id = docRef.id;
        newLesson.id = id;
      } catch (err) {
        console.warn('Error adding lesson to Firestore:', err);
      }
    }

    const current = getLocalLessons();
    const updated = [...current, newLesson].sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(updated));
    return newLesson;
  },

  updateLesson: async (id: string, data: Partial<Lesson>): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'lessons', id), data);
      } catch (err) {
        console.warn('Error updating lesson in Firestore:', err);
      }
    }
    const current = getLocalLessons();
    const updated = current.map(l => l.id === id ? { ...l, ...data } : l);
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(updated));
  },

  deleteLesson: async (id: string): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'lessons', id));
      } catch (err) {
        console.warn('Error deleting lesson from Firestore:', err);
      }
    }
    const current = getLocalLessons();
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(current.filter(l => l.id !== id)));
  }
};
