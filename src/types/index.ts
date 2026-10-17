export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  curriculumId?: string; // The curriculum chosen by the student
  curriculumTitle?: string;
  createdAt?: any;
}

// Curriculum / Course (المنهج)
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

// Lesson / Video (الدرس / الفيديو)
export interface Lesson {
  id: string;
  curriculumId: string;
  chapterId: string;
  title: string;
  youtubeId: string;
  order: number;
  duration?: string;
  createdAt?: any;
}
