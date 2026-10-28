import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { Curriculum, Chapter, Topic, Lesson } from '../types';

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

  // ── Topics ───────────────────────────────────────────────────────────────
  subscribeTopics: (callback: (topics: Topic[]) => void) => {
    try {
      const q = query(collection(db, 'topics'), orderBy('order', 'asc'));
      return onSnapshot(q, (snapshot) => {
        const list: Topic[] = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Topic, 'id'>)
        }));
        callback(list);
      }, (err) => {
        console.warn('Firestore topics error:', err.message);
        callback([]);
      });
    } catch (e) {
      console.warn(e);
      callback([]);
      return () => {};
    }
  },

  addTopic: async (curriculumId: string, chapterId: string, title: string, order: number = 1): Promise<Topic> => {
    const id = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id,
      curriculumId,
      chapterId,
      title: title.trim(),
      order,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'topics', id), {
      id,
      curriculumId,
      chapterId,
      title: title.trim(),
      order,
      createdAt: serverTimestamp()
    });

    return newTopic;
  },

  deleteTopic: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'topics', id));
  },

  // ── Lessons / Videos ─────────────────────────────────────────────────────
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

  // Upload PDF sheet to Firebase Storage and get download URL
  uploadPdfSheet: async (file: File): Promise<{ url: string; name: string }> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `sheets/${Date.now()}_${safeName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, name: file.name };
  },

  addLesson: async (data: Omit<Lesson, 'id'>): Promise<Lesson> => {
    const cleanYt = extractYouTubeId(data.youtubeId);
    const docRef = await addDoc(collection(db, 'lessons'), {
      curriculumId: data.curriculumId,
      chapterId: data.chapterId,
      topicId: data.topicId || '',
      title: data.title.trim(),
      youtubeId: cleanYt,
      order: Number(data.order) || 1,
      duration: data.duration || '',
      pdfUrl: data.pdfUrl || '',
      pdfName: data.pdfName || '',
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

  updateLessonPdf: async (lessonId: string, pdfUrl: string, pdfName: string): Promise<void> => {
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      pdfUrl,
      pdfName
    });
  },

  removeLessonPdf: async (lessonId: string): Promise<void> => {
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      pdfUrl: '',
      pdfName: ''
    });
  },

  deleteLesson: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'lessons', id));
  }
};
