export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  group?: string; // e.g. "مجموعة 1", "مجموعة 2", "مجموعة 3"
  createdAt?: any;
}

// Curriculum / Course (المنهج / الكورس)
export interface Curriculum {
  id: string;
  title: string;
  order: number;
  createdAt?: any;
}

// Chapter / Unit (الفصل / الباب)
export interface Chapter {
  id: string;
  curriculumId: string;
  title: string;
  order: number;
  createdAt?: any;
}

// Lesson / Video (الدرس / المحاضرة)
export interface Lesson {
  id: string;
  curriculumId: string;
  chapterId: string;
  title: string;
  youtubeId: string;
  allowedGroups: string[]; // ["الكل", "مجموعة 1", "مجموعة 2", "مجموعة 3"]
  order: number;
  duration?: string;
  createdAt?: any;
}

export const STUDENT_GROUPS = [
  'مجموعة 1',
  'مجموعة 2',
  'مجموعة 3'
] as const;

export type StudentGroup = typeof STUDENT_GROUPS[number];
