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
import { db } from './firebase';
import { Curriculum, Chapter, Lesson } from '../types';

const LOCAL_CURRICULUMS_KEY = 'judge_curriculums';
const LOCAL_CHAPTERS_KEY = 'judge_chapters';
const LOCAL_LESSONS_KEY = 'judge_lessons';

// Initial default curriculum laid down by admin
export const INITIAL_CURRICULUMS: Curriculum[] = [
  {
    id: "curr-1",
    title: "رياضيات 3 ثانوي - تفاضل وتكامل",
    order: 1,
    description: "المنهج الكامل للتفاضل والتكامل للثانوية العامة",
    createdAt: new Date().toISOString()
  },
  {
    id: "curr-2",
    title: "فيزياء الصف الثالث الثانوي",
    order: 2,
    description: "الفيزياء الكهربية والفيزياء الحديثة",
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
  },
  {
    id: "chap-3",
    curriculumId: "curr-2",
    title: "الفصل الأول: التيار الكهربائي وقانون أوم",
    order: 1,
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
    order: 1,
    duration: "25 دقيقة",
    createdAt: new Date().toISOString()
  },
  {
    id: "less-2",
    curriculumId: "curr-1",
    chapterId: "chap-1",
    title: "الدرس 2: حل النهايات غير المعينة بالتحليل والمرافق",
    youtubeId: "dQw4w9WgXcQ",
    order: 2,
    duration: "30 دقيقة",
    createdAt: new Date().toISOString()
  },
  {
    id: "less-3",
    curriculumId: "curr-2",
    chapterId: "chap-3",
    title: "الدرس 1: شدة التيار وفرق الجهد والمقاومة النوعية",
    youtubeId: "dQw4w9WgXcQ",
    order: 1,
    duration: "35 دقيقة",
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

// Local cache functions
export function getLocalCurriculums(): Curriculum[] {
  const data = localStorage.getItem(LOCAL_CURRICULUMS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(INITIAL_CURRICULUMS));
    return INITIAL_CURRICULUMS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_CURRICULUMS; }
}

export function getLocalChapters(): Chapter[] {
  const data = localStorage.getItem(LOCAL_CHAPTERS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(INITIAL_CHAPTERS));
    return INITIAL_CHAPTERS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_CHAPTERS; }
}

export function getLocalLessons(): Lesson[] {
  const data = localStorage.getItem(LOCAL_LESSONS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(INITIAL_LESSONS));
    return INITIAL_LESSONS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_LESSONS; }
}

export const CoursesService = {
  // Curriculums
  subscribeCurriculums: (callback: (curriculums: Curriculum[]) => void) => {
    // 1. Immediately provide cached data for instantaneous rendering
    callback(getLocalCurriculums());

    // 2. Listen to Firestore in background
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
        }
      }, (err) => {
        console.warn('Firestore curriculums onSnapshot notice:', err.message);
      });
    } catch (e) {
      console.warn(e);
      return () => {};
    }
  },

  addCurriculum: async (title: string, order: number = 1): Promise<Curriculum> => {
    const id = `curr-${Date.now()}`;
    const newCurriculum: Curriculum = {
      id,
      title: title.trim(),
      order,
      createdAt: new Date().toISOString()
    };

    // Update local immediately
    const current = getLocalCurriculums();
    const updated = [...current.filter(c => c.id !== id), newCurriculum].sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(updated));

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'curriculums', id), {
        id,
        title: title.trim(),
        order,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore addCurriculum fallback:', err);
    }

    return newCurriculum;
  },

  deleteCurriculum: async (id: string): Promise<void> => {
    const current = getLocalCurriculums();
    localStorage.setItem(LOCAL_CURRICULUMS_KEY, JSON.stringify(current.filter(c => c.id !== id)));

    try {
      await deleteDoc(doc(db, 'curriculums', id));
    } catch (err) {
      console.warn('Firestore deleteCurriculum fallback:', err);
    }
  },

  // Chapters
  subscribeChapters: (callback: (chapters: Chapter[]) => void) => {
    callback(getLocalChapters());

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
        }
      }, (err) => {
        console.warn('Firestore chapters onSnapshot notice:', err.message);
      });
    } catch (e) {
      console.warn(e);
      return () => {};
    }
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

    const current = getLocalChapters();
    const updated = [...current.filter(c => c.id !== id), newChapter].sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'chapters', id), {
        id,
        curriculumId,
        title: title.trim(),
        order,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore addChapter fallback:', err);
    }

    return newChapter;
  },

  deleteChapter: async (id: string): Promise<void> => {
    const current = getLocalChapters();
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(current.filter(c => c.id !== id)));

    try {
      await deleteDoc(doc(db, 'chapters', id));
    } catch (err) {
      console.warn('Firestore deleteChapter fallback:', err);
    }
  },

  // Lessons
  subscribeLessons: (callback: (lessons: Lesson[]) => void) => {
    callback(getLocalLessons());

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
        }
      }, (err) => {
        console.warn('Firestore lessons onSnapshot notice:', err.message);
      });
    } catch (e) {
      console.warn(e);
      return () => {};
    }
  },

  addLesson: async (data: Omit<Lesson, 'id'>): Promise<Lesson> => {
    const cleanYt = extractYouTubeId(data.youtubeId);
    let id = `less-${Date.now()}`;

    const newLesson: Lesson = {
      ...data,
      id,
      youtubeId: cleanYt,
      order: Number(data.order) || 1,
      createdAt: new Date().toISOString()
    };

    const current = getLocalLessons();
    const updated = [...current, newLesson].sort((a, b) => a.order - b.order);
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(updated));

    try {
      const docRef = await addDoc(collection(db, 'lessons'), {
        curriculumId: data.curriculumId,
        chapterId: data.chapterId,
        title: data.title.trim(),
        youtubeId: cleanYt,
        order: newLesson.order,
        duration: data.duration || '30 دقيقة',
        createdAt: serverTimestamp()
      });
      newLesson.id = docRef.id;
    } catch (err) {
      console.warn('Firestore addLesson fallback:', err);
    }

    return newLesson;
  },

  deleteLesson: async (id: string): Promise<void> => {
    const current = getLocalLessons();
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(current.filter(l => l.id !== id)));

    try {
      await deleteDoc(doc(db, 'lessons', id));
    } catch (err) {
      console.warn('Firestore deleteLesson fallback:', err);
    }
  }
};
