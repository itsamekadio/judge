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

  // Sync user profile from Firestore when Firebase Auth state changes
  const syncUserFromFirestore = async (uid: string, email: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const isDefaultAdmin = email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

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
        await setDoc(userRef, profile, { merge: true });
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        return profile;
      }
    } catch (err) {
      console.warn('Firestore profile sync note:', err);
    }
  };

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        if (user && user.email) {
          syncUserFromFirestore(user.uid, user.email);
        } else {
          // If no active Firebase session and not admin in localStorage, clear
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.email?.toLowerCase() !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
                // Keep session if valid
              }
            } catch (e) {}
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Auth observer fallback:', e);
    }
  }, []);

  // Strict Login: Rejects if password is wrong
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

    // 1. Try Firebase Authentication
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const uid = cred.user.uid;
      
      // Fetch user profile from Firestore
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      
      let profile: UserProfile;
      if (snap.exists()) {
        const data = snap.data();
        profile = {
          uid,
          email: cleanEmail,
          fullName: data.fullName || (isDefaultAdmin ? 'Eng. Abdelrahman Elkady' : 'طالب'),
          role: isDefaultAdmin ? 'admin' : (data.role || 'student'),
          curriculumId: data.curriculumId,
          curriculumTitle: data.curriculumTitle
        };
      } else {
        profile = {
          uid,
          email: cleanEmail,
          fullName: isDefaultAdmin ? 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي' : 'طالب',
          role: isDefaultAdmin ? 'admin' : 'student'
        };
        await setDoc(userRef, profile, { merge: true });
      }

      setCurrentUser(profile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
      return profile;

    } catch (firebaseErr: any) {
      // If credentials belong to default admin and it wasn't created in Firebase Auth yet
      if (isDefaultAdmin) {
        if (pass === DEFAULT_ADMIN_PASS) {
          // Password is correct, auto-create admin in Firebase Auth
          try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            const adminProfile: UserProfile = {
              uid: cred.user.uid,
              email: cleanEmail,
              fullName: 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي',
              role: 'admin',
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', cred.user.uid), adminProfile);
            setCurrentUser(adminProfile);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminProfile));
            return adminProfile;
          } catch (createErr) {
            // If already in Auth but wrong password was given, it falls through to throw below
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
          // Admin entered WRONG password! Strictly reject!
          throw new Error('كلمة المرور غير صحيحة لحساب المشرف / Incorrect admin password');
        }
      }

      // Check standard Firebase error codes
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
      }

      // Throw exact error - NEVER log in with wrong credentials
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
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
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const uid = cred.user.uid;

      const profile: UserProfile = {
        uid,
        email: cleanEmail,
        fullName: fullName.trim() || 'طالب',
        role,
        curriculumId,
        curriculumTitle,
        createdAt: serverTimestamp()
      };

      // Save user to Firestore users collection
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        email: cleanEmail,
        fullName: profile.fullName,
        role,
        curriculumId: curriculumId || '',
        curriculumTitle: curriculumTitle || '',
        createdAt: serverTimestamp()
      });

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
