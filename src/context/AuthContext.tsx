import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (email: string, pass: string, fullName: string, curriculumId?: string, curriculumTitle?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateCurriculum: (curriculumId: string, curriculumTitle: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_ADMIN_EMAIL = 'admin@judge.com';
export const DEFAULT_ADMIN_PASS = '00000000';

const LOCAL_STORAGE_KEY = 'judge_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous initialization from localStorage for instantaneous page rendering
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync user profile from Firestore in background
  const syncUserFromFirestore = async (uid: string, email: string) => {
    const isDefaultAdmin = email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const profile: UserProfile = {
          uid,
          email,
          fullName: data.fullName || (isDefaultAdmin ? 'Eng. Abdelrahman Elkady' : 'طالب'),
          role: isDefaultAdmin ? 'admin' : (data.role || 'student'),
          curriculumId: data.curriculumId,
          curriculumTitle: data.curriculumTitle,
          createdAt: data.createdAt
        };
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        return profile;
      } else {
        const profile: UserProfile = {
          uid,
          email,
          fullName: isDefaultAdmin ? 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي' : 'طالب',
          role: isDefaultAdmin ? 'admin' : 'student',
          createdAt: serverTimestamp()
        };
        setDoc(userRef, profile, { merge: true }).catch(() => {});
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        return profile;
      }
    } catch (err) {
      console.warn('Firestore user profile sync warning (rules notice):', err);
    }
  };

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        if (user && user.email) {
          syncUserFromFirestore(user.uid, user.email);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Auth observer fallback:', e);
    }
  }, []);

  // Strict Login
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

    // 1. Authenticate with Firebase Authentication
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const uid = cred.user.uid;
      
      // Default initial profile from auth
      let profile: UserProfile = {
        uid,
        email: cleanEmail,
        fullName: isDefaultAdmin ? 'Eng. Abdelrahman Elkady' : cleanEmail.split('@')[0],
        role: isDefaultAdmin ? 'admin' : 'student'
      };

      // Try fetching extra profile fields from Firestore without letting permission errors crash login
      try {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          profile = {
            ...profile,
            fullName: data.fullName || profile.fullName,
            role: isDefaultAdmin ? 'admin' : (data.role || 'student'),
            curriculumId: data.curriculumId,
            curriculumTitle: data.curriculumTitle
          };
        }
      } catch (firestoreErr) {
        console.warn('Firestore profile read permission notice:', firestoreErr);
      }

      setCurrentUser(profile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
      return profile;

    } catch (firebaseErr: any) {
      // If credentials belong to default admin and it wasn't registered in Firebase Auth yet
      if (isDefaultAdmin) {
        if (pass === DEFAULT_ADMIN_PASS) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            const adminProfile: UserProfile = {
              uid: cred.user.uid,
              email: cleanEmail,
              fullName: 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي',
              role: 'admin',
              createdAt: serverTimestamp()
            };
            setDoc(doc(db, 'users', cred.user.uid), adminProfile).catch(() => {});
            setCurrentUser(adminProfile);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminProfile));
            return adminProfile;
          } catch (createErr) {
            const adminProfile: UserProfile = {
              uid: 'admin-elkady',
              email: cleanEmail,
              fullName: 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي',
              role: 'admin'
            };
            setCurrentUser(adminProfile);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminProfile));
            return adminProfile;
          }
        } else {
          // Admin typed the wrong password!
          throw new Error('كلمة المرور غير صحيحة لحساب المشرف / Incorrect admin password');
        }
      }

      // Check standard Firebase Auth errors - strictly report them!
      if (
        firebaseErr.code === 'auth/wrong-password' || 
        firebaseErr.code === 'auth/invalid-credential' ||
        firebaseErr.code === 'auth/invalid-password'
      ) {
        throw new Error('كلمة المرور غير صحيحة / Incorrect password');
      } else if (firebaseErr.code === 'auth/user-not-found') {
        throw new Error('البريد الإلكتروني غير مسجل. يرجى إنشاء حساب جديد أولاً.');
      } else if (firebaseErr.code === 'auth/invalid-email') {
        throw new Error('صيغة البريد الإلكتروني غير صالحة');
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        throw new Error('تم حظر المحاولات مؤقتاً بسبب تكرار المحاولات الخاطئة. انتظر لحظات وحاول ثانية.');
      }

      throw new Error(firebaseErr.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  // Strict Registration
  const register = async (
    email: string, 
    pass: string, 
    fullName: string, 
    curriculumId?: string, 
    curriculumTitle?: string
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isDefaultAdmin ? 'admin' : 'student';

    try {
      // 1. Create account in Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const uid = cred.user.uid;

      const profile: UserProfile = {
        uid,
        email: cleanEmail,
        fullName: fullName.trim() || 'طالب',
        role,
        curriculumId,
        curriculumTitle,
        createdAt: new Date().toISOString()
      };

      // 2. Save profile in Firestore users collection (safely caught if rules are still locked)
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
          email: cleanEmail,
          fullName: profile.fullName,
          role,
          curriculumId: curriculumId || '',
          curriculumTitle: curriculumTitle || '',
          createdAt: serverTimestamp()
        });
      } catch (firestoreErr) {
        console.warn('Firestore profile write permission notice (update Firestore rules):', firestoreErr);
      }

      setCurrentUser(profile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
      return profile;

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('صيغة البريد الإلكتروني غير صالحة.');
      }
      throw new Error(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  const logout = async () => {
    try { await firebaseSignOut(auth); } catch (e) {}
    setCurrentUser(null);
    setFirebaseUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const updateCurriculum = async (curriculumId: string, curriculumTitle: string) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, curriculumId, curriculumTitle };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    if (currentUser.uid) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { curriculumId, curriculumTitle }, { merge: true });
      } catch (e) {}
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isAdmin,
        login,
        register,
        logout,
        updateCurriculum
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
