import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { Curriculum, Chapter, Lesson } from '../types';

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

export const CoursesService = {
  // ── Curriculums ──────────────────────────────────────────────────────────
  subscribeCurriculums: (callback: (curriculums: Curriculum[]) => void) => {
    try {
      const q = query(collection(db, 'curriculums'), orderBy('order', 'asc'));
      return onSnapshot(q, (snapshot) => {
        // Always call callback — even when empty (handles deletions)
        const list: Curriculum[] = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Curriculum, 'id'>)
        }));
        callback(list);
      }, (err) => {
        console.warn('Firestore curriculums error:', err.message);
        callback([]);
      });
    } catch (e) {
      console.warn(e);
      callback([]);
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

    await setDoc(doc(db, 'curriculums', id), {
      id,
      title: title.trim(),
      order,
      createdAt: serverTimestamp()
    });

    return newCurriculum;
  },

  deleteCurriculum: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'curriculums', id));
  },

  // ── Chapters ─────────────────────────────────────────────────────────────
  subscribeChapters: (callback: (chapters: Chapter[]) => void) => {
    try {
      const q = query(collection(db, 'chapters'), orderBy('order', 'asc'));
      return onSnapshot(q, (snapshot) => {
        const list: Chapter[] = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Chapter, 'id'>)
        }));
        callback(list);
      }, (err) => {
        console.warn('Firestore chapters error:', err.message);
        callback([]);
      });
    } catch (e) {
      console.warn(e);
      callback([]);
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

    await setDoc(doc(db, 'chapters', id), {
      id,
      curriculumId,
      title: title.trim(),
      order,
      createdAt: serverTimestamp()
    });

    return newChapter;
  },

  deleteChapter: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'chapters', id));
  },

  // ── Lessons ───────────────────────────────────────────────────────────────
  subscribeLessons: (callback: (lessons: Lesson[]) => void) => {
    try {
      const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
      return onSnapshot(q, (snapshot) => {
        const list: Lesson[] = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Lesson, 'id'>)
        }));
        callback(list);
      }, (err) => {
        console.warn('Firestore lessons error:', err.message);
        callback([]);
      });
    } catch (e) {
      console.warn(e);
      callback([]);
      return () => {};
    }
  },

  addLesson: async (data: Omit<Lesson, 'id'>): Promise<Lesson> => {
    const cleanYt = extractYouTubeId(data.youtubeId);

    const docRef = await addDoc(collection(db, 'lessons'), {
      curriculumId: data.curriculumId,
      chapterId: data.chapterId,
      title: data.title.trim(),
      youtubeId: cleanYt,
      order: Number(data.order) || 1,
      duration: data.duration || '',
      createdAt: serverTimestamp()
    });

    return {
      ...data,
      id: docRef.id,
      youtubeId: cleanYt,
      order: Number(data.order) || 1,
      createdAt: new Date().toISOString()
    };
  },

  deleteLesson: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'lessons', id));
  }
};
