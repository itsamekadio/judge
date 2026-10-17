import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { CourseUnit, Lesson } from '../types';

const LOCAL_COURSES_KEY = 'judge_mock_courses';
const LOCAL_LESSONS_KEY = 'judge_mock_lessons';

// Default initial units and lessons conforming to the prompt specification
export const INITIAL_SAMPLE_COURSES: CourseUnit[] = [
  {
    id: "unit-1",
    title: "الوحدة الأولى: النهايات والاتصال",
    order: 1,
    description: "دراسة شاملة لمفاهيم النهايات الجبرية، اتصال الدوال، والنهايات عند اللانهاية.",
    createdAt: new Date().toISOString()
  },
  {
    id: "unit-2",
    title: "الوحدة الثانية: قواعد الاشتقاق وتطبيقاته",
    order: 2,
    description: "قواعد التفاضل، مشتقات الدوال المثلثية، والتطبيقات الهندسية والفيزيائية للمشتقة.",
    createdAt: new Date().toISOString()
  },
  {
    id: "unit-3",
    title: "الوحدة الثالثة: التكامل وتطبيقات المساحات",
    order: 3,
    description: "التكامل غير المحدود والمحدود، التكامل بالتعويض، وحساب المساحات وحجوم الأجسام الدورانية.",
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_SAMPLE_LESSONS: Lesson[] = [
  {
    id: "lesson-1",
    courseId: "unit-1",
    title: "الدرس 1: مفهوم النهاية بيانياً وجبرياً",
    youtubeId: "dQw4w9WgXcQ",
    allowedGroups: ["الكل", "مجموعة 1", "مجموعة 2", "مجموعة 3"],
    order: 1,
    duration: "25 دقيقة",
    description: "مقدمة تأسيسية لفهم سلوك الدالة عند الاقتراب من نقطة معينة وتحديد النهاية من اليمين واليسار.",
    createdAt: new Date().toISOString()
  },
  {
    id: "lesson-2",
    courseId: "unit-1",
    title: "الدرس 2: نظريات النهايات وطرق التحليل",
    youtubeId: "dQw4w9WgXcQ",
    allowedGroups: ["مجموعة 1", "مجموعة 2"],
    order: 2,
    duration: "32 دقيقة",
    description: "حل النهايات غير المعينة (0/0) باستخدام التحليل، الضرب في المرافق، والقسمة التركيبية.",
    createdAt: new Date().toISOString()
  },
  {
    id: "lesson-3",
    courseId: "unit-1",
    title: "الدرس 3: اتصال الدوال عند نقطة وعلى فترة",
    youtubeId: "dQw4w9WgXcQ",
    allowedGroups: ["مجموعة 1"],
    order: 3,
    duration: "28 دقيقة",
    description: "شروط الاتصال الثلاثة وتطبيقها على الدوال متعددة التعريف والدوال الجذرية والكسرية.",
    createdAt: new Date().toISOString()
  },
  {
    id: "lesson-4",
    courseId: "unit-2",
    title: "الدرس 1: تعريف المشتقة وقواعد التفاضل الأساسية",
    youtubeId: "dQw4w9WgXcQ",
    allowedGroups: ["الكل", "مجموعة 1", "مجموعة 2", "مجموعة 3"],
    order: 1,
    duration: "35 دقيقة",
    description: "المعنى الهندسي للمشتقة كمعامل ميل المماس وقواعد اشتقاق القوى وحاصل الضرب والقسمة.",
    createdAt: new Date().toISOString()
  }
];

// Helper to extract clean 11-char YouTube ID from any format
export function extractYouTubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // If already an 11-character ID (standard YouTube alphanumeric with _ and -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Match standard youtube URLs: watch?v=, embed/, youtu.be/, shorts/
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  
  return trimmed;
}

// Local storage helpers
function getLocalCourses(): CourseUnit[] {
  const data = localStorage.getItem(LOCAL_COURSES_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(INITIAL_SAMPLE_COURSES));
    return INITIAL_SAMPLE_COURSES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SAMPLE_COURSES;
  }
}

function saveLocalCourses(courses: CourseUnit[]) {
  localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(courses));
}

function getLocalLessons(): Lesson[] {
  const data = localStorage.getItem(LOCAL_LESSONS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(INITIAL_SAMPLE_LESSONS));
    return INITIAL_SAMPLE_LESSONS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SAMPLE_LESSONS;
  }
}

function saveLocalLessons(lessons: Lesson[]) {
  localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(lessons));
}

export const CoursesService = {
  // Subscribe to all course units
  subscribeCourses: (callback: (courses: CourseUnit[]) => void) => {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'courses'), orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            // If firestore is empty, callback with empty or fallback
            callback([]);
          } else {
            const courses: CourseUnit[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...(doc.data() as Omit<CourseUnit, 'id'>)
            }));
            callback(courses);
          }
        }, (error) => {
          console.warn("Firestore courses snapshot error, falling back to local:", error);
          callback(getLocalCourses());
        });
      } catch (err) {
        console.warn("Using local courses fallback:", err);
      }
    }
    callback(getLocalCourses());
    return () => {};
  },

  // Subscribe to all lessons
  subscribeLessons: (callback: (lessons: Lesson[]) => void) => {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            callback([]);
          } else {
            const lessons: Lesson[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...(doc.data() as Omit<Lesson, 'id'>)
            }));
            callback(lessons);
          }
        }, (error) => {
          console.warn("Firestore lessons snapshot error, falling back to local:", error);
          callback(getLocalLessons());
        });
      } catch (err) {
        console.warn("Using local lessons fallback:", err);
      }
    }
    callback(getLocalLessons());
    return () => {};
  },

  // Add course unit
  addCourse: async (data: Omit<CourseUnit, 'id'>, customId?: string): Promise<CourseUnit> => {
    const id = customId?.trim() || `unit-${Date.now()}`;
    const newCourse: CourseUnit = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'courses', id), {
          id,
          title: data.title,
          order: Number(data.order) || 1,
          description: data.description || '',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Error adding course to Firestore, saving locally:", err);
      }
    }

    // Always update local cache
    const current = getLocalCourses();
    const updated = [...current.filter(c => c.id !== id), newCourse].sort((a, b) => a.order - b.order);
    saveLocalCourses(updated);
    return newCourse;
  },

  // Update course unit
  updateCourse: async (id: string, data: Partial<CourseUnit>): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'courses', id), {
          ...data,
          ...(data.order ? { order: Number(data.order) } : {})
        });
      } catch (err) {
        console.warn("Error updating course in Firestore:", err);
      }
    }

    const current = getLocalCourses();
    const updated = current.map(c => c.id === id ? { ...c, ...data } : c);
    saveLocalCourses(updated);
  },

  // Delete course unit and its associated lessons
  deleteCourse: async (id: string): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'courses', id));
      } catch (err) {
        console.warn("Error deleting course from Firestore:", err);
      }
    }

    const current = getLocalCourses();
    saveLocalCourses(current.filter(c => c.id !== id));

    // Also delete associated lessons
    const lessons = getLocalLessons();
    const remainingLessons = lessons.filter(l => l.courseId !== id);
    saveLocalLessons(remainingLessons);
  },

  // Add lesson
  addLesson: async (data: Omit<Lesson, 'id'>): Promise<Lesson> => {
    const lessonData = {
      ...data,
      youtubeId: extractYouTubeId(data.youtubeId),
      order: Number(data.order) || 1,
      allowedGroups: Array.isArray(data.allowedGroups) && data.allowedGroups.length > 0 
        ? data.allowedGroups 
        : ['الكل']
    };

    let id = `lesson-${Date.now()}`;

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'lessons'), {
          ...lessonData,
          createdAt: serverTimestamp()
        });
        id = docRef.id;
      } catch (err) {
        console.warn("Error adding lesson to Firestore, saving locally:", err);
      }
    }

    const newLesson: Lesson = {
      ...lessonData,
      id,
      createdAt: new Date().toISOString()
    };

    const current = getLocalLessons();
    const updated = [...current, newLesson].sort((a, b) => a.order - b.order);
    saveLocalLessons(updated);
    return newLesson;
  },

  // Update lesson
  updateLesson: async (id: string, data: Partial<Lesson>): Promise<void> => {
    const updatePayload = {
      ...data,
      ...(data.youtubeId ? { youtubeId: extractYouTubeId(data.youtubeId) } : {}),
      ...(data.order ? { order: Number(data.order) } : {})
    };

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'lessons', id), updatePayload);
      } catch (err) {
        console.warn("Error updating lesson in Firestore:", err);
      }
    }

    const current = getLocalLessons();
    const updated = current.map(l => l.id === id ? { ...l, ...updatePayload } : l);
    saveLocalLessons(updated);
  },

  // Delete lesson
  deleteLesson: async (id: string): Promise<void> => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'lessons', id));
      } catch (err) {
        console.warn("Error deleting lesson from Firestore:", err);
      }
    }

    const current = getLocalLessons();
    saveLocalLessons(current.filter(l => l.id !== id));
  },

  // Seed default demonstration courses and lessons if empty
  seedInitialData: async (): Promise<void> => {
    for (const course of INITIAL_SAMPLE_COURSES) {
      await CoursesService.addCourse(course, course.id);
    }
    for (const lesson of INITIAL_SAMPLE_LESSONS) {
      await CoursesService.addLesson(lesson);
    }
  }
};
