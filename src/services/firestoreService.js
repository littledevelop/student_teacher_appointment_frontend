/**
 * Firestore Database Service
 * Handles all database operations for appointments, messages, and users
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import logger from '../utils/logger';

class FirestoreService {
  /**
   * Add a new appointment
   */
  async addAppointment(appointmentData) {
    try {
      logger.logAction('ADD_APPOINTMENT', { studentId: appointmentData.studentId, teacherId: appointmentData.teacherId });
      
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointmentData,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      logger.info('APPOINTMENT_CREATED', { appointmentId: docRef.id });
      return { success: true, id: docRef.id };
    } catch (error) {
      logger.error('ADD_APPOINTMENT_FAILED', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get appointments for student
   */
  async getStudentAppointments(studentId) {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const appointments = [];
      querySnapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() });
      });

      logger.info('FETCH_STUDENT_APPOINTMENTS', { studentId, count: appointments.length });
      return { success: true, data: appointments };
    } catch (error) {
      logger.error('FETCH_STUDENT_APPOINTMENTS_FAILED', { studentId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get appointments for teacher
   */
  async getTeacherAppointments(teacherId) {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const appointments = [];
      querySnapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() });
      });

      logger.info('FETCH_TEACHER_APPOINTMENTS', { teacherId, count: appointments.length });
      return { success: true, data: appointments };
    } catch (error) {
      logger.error('FETCH_TEACHER_APPOINTMENTS_FAILED', { teacherId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId, updates) {
    try {
      logger.logAction('UPDATE_APPOINTMENT', { appointmentId, status: updates.status });
      
      await updateDoc(doc(db, 'appointments', appointmentId), {
        ...updates,
        updatedAt: Timestamp.now()
      });

      logger.info('APPOINTMENT_UPDATED', { appointmentId });
      return { success: true };
    } catch (error) {
      logger.error('UPDATE_APPOINTMENT_FAILED', { appointmentId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send message
   */
  async sendMessage(senderId, recipientId, content) {
    try {
      logger.logAction('SEND_MESSAGE', { senderId, recipientId });
      
      const docRef = await addDoc(collection(db, 'messages'), {
        senderId,
        recipientId,
        content,
        read: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      logger.info('MESSAGE_SENT', { messageId: docRef.id });
      return { success: true, id: docRef.id };
    } catch (error) {
      logger.error('SEND_MESSAGE_FAILED', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages for user
   */
  async getUserMessages(userId) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messages = [];
      querySnapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      logger.info('FETCH_MESSAGES', { userId, count: messages.length });
      return { success: true, data: messages };
    } catch (error) {
      logger.error('FETCH_MESSAGES_FAILED', { userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all teachers
   */
  async getAllTeachers() {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'teacher'),
        where('approved', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const teachers = [];
      querySnapshot.forEach(doc => {
        teachers.push({ id: doc.id, ...doc.data() });
      });

      logger.info('FETCH_ALL_TEACHERS', { count: teachers.length });
      return { success: true, data: teachers };
    } catch (error) {
      logger.error('FETCH_ALL_TEACHERS_FAILED', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Search teachers
   */
  async searchTeachers(filters = {}) {
    try {
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'teacher'),
        where('approved', '==', true)
      );

      // Apply filters if provided
      if (filters.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters.subject) {
        q = query(q, where('subject', '==', filters.subject));
      }

      const querySnapshot = await getDocs(q);
      const teachers = [];
      querySnapshot.forEach(doc => {
        teachers.push({ id: doc.id, ...doc.data() });
      });

      logger.info('SEARCH_TEACHERS', { filters, count: teachers.length });
      return { success: true, data: teachers };
    } catch (error) {
      logger.error('SEARCH_TEACHERS_FAILED', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all users by role
   */
  async getUsersByRole(role) {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role)
      );

      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      logger.info('FETCH_USERS_BY_ROLE', { role, count: users.length });
      return { success: true, data: users };
    } catch (error) {
      logger.error('FETCH_USERS_BY_ROLE_FAILED', { role, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId) {
    try {
      logger.logAction('DELETE_USER', { userId });
      
      await deleteDoc(doc(db, 'users', userId));
      
      logger.info('USER_DELETED', { userId });
      return { success: true };
    } catch (error) {
      logger.error('DELETE_USER_FAILED', { userId, error: error.message });
      return { success: false, error: error.message };
    }
  }
}

export default new FirestoreService();
