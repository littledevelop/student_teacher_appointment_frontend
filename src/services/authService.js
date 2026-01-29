/**
 * Firebase Authentication Service
 * Handles user authentication and authorization
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import logger from '../utils/logger';

class AuthService {
  /**
   * Register new user
   */
  async register(email, password, userData) {
    try {
      logger.logAction('REGISTER_START', { email });
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        ...userData,
        approved: userData.role === 'admin' ? true : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      logger.logAuth('REGISTER_SUCCESS', user.uid, { email, role: userData.role });
      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          ...userData
        }
      };
    } catch (error) {
      logger.error('REGISTER_FAILED', { email, error: error.message });
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      logger.logAction('LOGIN_START', { email });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      logger.logAuth('LOGIN_SUCCESS', user.uid, { email, role: userData.role });

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          ...userData
        },
        token: await user.getIdToken()
      };
    } catch (error) {
      logger.error('LOGIN_FAILED', { email, error: error.message });
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      logger.logAction('LOGOUT_START');
      await signOut(auth);
      logger.logAuth('LOGOUT_SUCCESS');
      return { success: true };
    } catch (error) {
      logger.error('LOGOUT_FAILED', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      logger.logAction('PASSWORD_RESET_START', { email });
      await sendPasswordResetEmail(auth, email);
      logger.info('PASSWORD_RESET_EMAIL_SENT', { email });
      return { success: true };
    } catch (error) {
      logger.error('PASSWORD_RESET_FAILED', { email, error: error.message });
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get user data from Firestore
   */
  async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      logger.error('GET_USER_DATA_FAILED', { userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      logger.logAction('UPDATE_PROFILE_START', { userId });
      
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      logger.logAuth('UPDATE_PROFILE_SUCCESS', userId);
      return { success: true };
    } catch (error) {
      logger.error('UPDATE_PROFILE_FAILED', { userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get error message
   */
  getErrorMessage(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many login attempts. Try again later'
    };

    return errorMessages[error.code] || error.message || 'An error occurred';
  }
}

export default new AuthService();
