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
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (email: string, pass: string, fullName: string, group?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateGroup: (group: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Admin Profile Constants
export const DEFAULT_ADMIN_EMAIL = 'admin@judge.com';
export const DEFAULT_ADMIN_PASS = '00000000';

const LOCAL_STORAGE_KEY = 'judge_auth_user';
const LOCAL_USERS_KEY = 'judge_mock_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isFirebaseConfigured);

  // Helper to fetch or create user in Firestore
  const syncFirestoreUser = async (uid: string, email: string, fallbackName?: string, roleOverride?: UserRole, group?: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      const isDefaultAdmin = email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();
      const role: UserRole = roleOverride || (isDefaultAdmin ? 'admin' : 'student');

      if (userSnap.exists()) {
        const data = userSnap.data();
        const profile: UserProfile = {
          uid,
          email,
          fullName: data.fullName || fallbackName || (isDefaultAdmin ? 'Eng. Abdelrahman Elkady' : 'طالب'),
          role: data.role || role,
          group: data.group || group || (role === 'student' ? 'مجموعة 1' : undefined),
          createdAt: data.createdAt
        };
        // Ensure admin role is always maintained for default admin
        if (isDefaultAdmin && profile.role !== 'admin') {
          profile.role = 'admin';
          await setDoc(userRef, { role: 'admin' }, { merge: true });
        }
        return profile;
      } else {
        const newProfile: UserProfile = {
          uid,
          email,
          fullName: fallbackName || (isDefaultAdmin ? 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي' : 'طالب جديد'),
          role,
          group: role === 'student' ? (group || 'مجموعة 1') : undefined,
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore user fetch failed, operating in resilient local mode:', err);
      setIsDemoMode(true);
      return null;
    }
  };

  useEffect(() => {
    // If Firebase is configured, listen to auth state changes
    if (isFirebaseConfigured) {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setFirebaseUser(user);
          if (user && user.email) {
            const profile = await syncFirestoreUser(user.uid, user.email, user.displayName || undefined);
            if (profile) {
              setCurrentUser(profile);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
            } else {
              // Read from local storage if firestore was unreachable
              const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (saved) {
                try { setCurrentUser(JSON.parse(saved)); } catch (e) {}
              }
            }
          } else {
            setCurrentUser(null);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
          setLoading(false);
        }, (error) => {
          console.warn("Auth state observer error, switching to demo mode:", error);
          setIsDemoMode(true);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.warn("Firebase auth initialization failed:", err);
        setIsDemoMode(true);
        setLoading(false);
      }
    } else {
      // Local fallback mode: check localStorage for saved session
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminCreds = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() && pass === DEFAULT_ADMIN_PASS;

    if (isFirebaseConfigured && !isDemoMode) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const user = userCredential.user;
        const profile = await syncFirestoreUser(user.uid, cleanEmail);
        const finalProfile = profile || {
          uid: user.uid,
          email: cleanEmail,
          fullName: isAdminCreds ? 'Eng. Abdelrahman Elkady' : 'طالب',
          role: isAdminCreds ? 'admin' : 'student',
          group: isAdminCreds ? undefined : 'مجموعة 1'
        };
        setCurrentUser(finalProfile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalProfile));
        return finalProfile;
      } catch (err: any) {
        // If credentials are the default admin and Firebase project doesn't have it created yet, create it or fallback gracefully
        if (isAdminCreds) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            const user = userCredential.user;
            const profile = await syncFirestoreUser(user.uid, cleanEmail, 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي', 'admin');
            const adminProfile: UserProfile = profile || {
              uid: user.uid,
              email: cleanEmail,
              fullName: 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي',
              role: 'admin'
            };
            setCurrentUser(adminProfile);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminProfile));
            return adminProfile;
          } catch (createErr) {
            console.warn("Could not auto-register admin in Firebase Auth, using local fallback", createErr);
          }
        }
        throw err;
      }
    }

    // Demo/Offline Fallback Authentication
    if (isAdminCreds) {
      const adminProfile: UserProfile = {
        uid: 'admin-elkady-id',
        email: DEFAULT_ADMIN_EMAIL,
        fullName: 'Eng. Abdelrahman Elkady / المهندس عبد الرحمن القاضي',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(adminProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminProfile));
      return adminProfile;
    }

    // Check mock registered users
    const mockUsersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
    const mockUsers = JSON.parse(mockUsersStr);
    const existing = mockUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.password === pass) {
        const { password, ...profile } = existing;
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        return profile;
      } else {
        throw new Error('كلمة المرور غير صحيحة / Incorrect password');
      }
    } else {
      // Allow instant student test login if not found
      const studentProfile: UserProfile = {
        uid: 'student-' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role: 'student',
        group: 'مجموعة 1',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(studentProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(studentProfile));
      return studentProfile;
    }
  };

  const register = async (email: string, pass: string, fullName: string, group: string = 'مجموعة 1'): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isDefaultAdmin ? 'admin' : 'student';

    if (isFirebaseConfigured && !isDemoMode) {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;
      const profile = await syncFirestoreUser(user.uid, cleanEmail, fullName, role, group);
      const finalProfile = profile || {
        uid: user.uid,
        email: cleanEmail,
        fullName,
        role,
        group: role === 'student' ? group : undefined
      };
      setCurrentUser(finalProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalProfile));
      return finalProfile;
    }

    // Demo / Offline fallback registration
    const newProfile: UserProfile = {
      uid: 'user-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      fullName: fullName.trim() || 'طالب',
      role,
      group: role === 'student' ? group : undefined,
      createdAt: new Date().toISOString()
    };

    const mockUsersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
    const mockUsers = JSON.parse(mockUsersStr);
    mockUsers.push({ ...newProfile, password: pass });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(mockUsers));

    setCurrentUser(newProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProfile));
    return newProfile;
  };

  const logout = async () => {
    if (isFirebaseConfigured && !isDemoMode) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn("SignOut error:", err);
      }
    }
    setCurrentUser(null);
    setFirebaseUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const updateGroup = async (newGroup: string) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, group: newGroup };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    if (isFirebaseConfigured && !isDemoMode && currentUser.uid) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { group: newGroup }, { merge: true });
      } catch (err) {
        console.warn('Failed to update group in Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isAdmin: currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase(),
        isDemoMode,
        login,
        register,
        logout,
        updateGroup
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
