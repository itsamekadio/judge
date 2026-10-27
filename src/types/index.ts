// src/types/index.ts - Unified type definitions for JUDGE platform (Curriculum → Chapter → Topic → Video hierarchy)

export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  curriculumId?: string;
  curriculumTitle?: string;
  createdAt?: any;
}

// Curriculum (المنهج)
export interface Curriculum {
  id: string;
  title: string;
  order: number;
  description?: string;
  createdAt?: any;
}

// Chapter (الفصل / الباب)
export interface Chapter {
  id: string;
  curriculumId: string;
  title: string;
  order: number;
  createdAt?: any;
}

// Topic (الموضوع) – under Chapter
export interface Topic {
  id: string;
  curriculumId: string;
  chapterId: string;
  title: string;
  order: number;
  createdAt?: any;
}

// Video / Lesson (الدرس / الفيديو) – belongs to Topic
export interface Lesson {
  id: string;
  curriculumId: string;
  chapterId: string;
  topicId?: string;
  title: string;
  youtubeId: string;
  order: number;
  duration?: string;
  createdAt?: any;
}

export const STUDENT_GROUPS = ['مجموعة 1', 'مجموعة 2', 'مجموعة 3'] as const;
export type StudentGroup = typeof STUDENT_GROUPS[number];
