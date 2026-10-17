export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  group?: string; // e.g. "مجموعة 1", "مجموعة 2", "مجموعة 3"
  createdAt?: any;
}

export interface CourseUnit {
  id: string;
  title: string;
  order: number;
  description?: string;
  createdAt?: any;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  youtubeId: string;
  allowedGroups: string[];
  order: number;
  duration?: string;
  description?: string;
  createdAt?: any;
}

export const STUDENT_GROUPS = [
  'مجموعة 1',
  'مجموعة 2',
  'مجموعة 3'
] as const;

export type StudentGroup = typeof STUDENT_GROUPS[number];
