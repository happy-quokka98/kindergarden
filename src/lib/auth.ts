"use client";

/**
 * Clears all authentication and session data stored in localStorage.
 */
export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('login');
    localStorage.removeItem('studentId');
    localStorage.removeItem('classId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('seen_incoming_messages_count');
    localStorage.removeItem('seen_notices_count');
    localStorage.removeItem('seen_incoming_messages_count_teacher');
    localStorage.removeItem('seen_notices_count_teacher');
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}

/**
 * Validates if the current stored session in localStorage is valid and complete.
 * @param requiredRole Optional role to check against ('student' | 'teacher' | 'methodist' | 'admin' | 'superadmin' | 'resource_center')
 */
export function validateSession(requiredRole?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const loginDataStr = localStorage.getItem('login');
    if (!loginDataStr) return false;

    const loginData = JSON.parse(loginDataStr);
    if (!loginData || typeof loginData !== 'object' || !loginData.role) {
      return false;
    }

    if (requiredRole) {
      if (requiredRole === 'admin') {
        if (
          loginData.role !== 'admin' &&
          loginData.role !== 'superadmin' &&
          loginData.role !== 'resource_center'
        ) {
          return false;
        }
      } else if (requiredRole === 'teacher') {
        if (loginData.role !== 'teacher' && loginData.role !== 'methodist') {
          return false;
        }
      } else if (loginData.role !== requiredRole) {
        return false;
      }
    }

    if (loginData.role === 'student') {
      const studentId = localStorage.getItem('studentId');
      const classId = localStorage.getItem('classId');
      if (!studentId || !classId) return false;
    } else if (
      loginData.role === 'teacher' ||
      loginData.role === 'methodist' ||
      loginData.role === 'admin' ||
      loginData.role === 'superadmin' ||
      loginData.role === 'resource_center'
    ) {
      if (!loginData.user_ID) return false;
    } else {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Asynchronously verifies current stored session against server (/api/auth/me).
 * If invalid or expired, clears session and returns { authenticated: false }.
 */
export async function verifyAuthMe(requiredRole?: string): Promise<{ authenticated: boolean; user?: any }> {
  if (typeof window === 'undefined') return { authenticated: false };

  try {
    const loginDataStr = localStorage.getItem('login');
    if (!loginDataStr) return { authenticated: false };

    const loginData = JSON.parse(loginDataStr);
    const userId = loginData.user_ID || localStorage.getItem('studentId') || '';
    const role = loginData.role || '';

    if (!userId || !role) {
      clearAuthSession();
      return { authenticated: false };
    }

    const res = await fetch(`/api/auth/me?user_ID=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`);
    if (!res.ok) {
      clearAuthSession();
      return { authenticated: false };
    }

    const data = await res.json();
    if (!data.authenticated || !data.user) {
      clearAuthSession();
      return { authenticated: false };
    }

    const verifiedUser = data.user;

    // Check role match if specified
    if (requiredRole) {
      if (requiredRole === 'admin') {
        if (
          verifiedUser.role !== 'admin' &&
          verifiedUser.role !== 'superadmin' &&
          verifiedUser.role !== 'resource_center'
        ) {
          return { authenticated: false };
        }
      } else if (requiredRole === 'teacher') {
        if (verifiedUser.role !== 'teacher' && verifiedUser.role !== 'methodist') {
          return { authenticated: false };
        }
      } else if (verifiedUser.role !== requiredRole) {
        return { authenticated: false };
      }
    }

    // Sync localStorage with verified user info from server
    localStorage.setItem('login', JSON.stringify({
      role: verifiedUser.role,
      user_ID: verifiedUser.user_ID,
      name: verifiedUser.name,
      surname: verifiedUser.surname,
      loginTime: loginData.loginTime || Date.now()
    }));

    if (verifiedUser.class_id) {
      localStorage.setItem('classId', verifiedUser.class_id);
    }

    return { authenticated: true, user: verifiedUser };
  } catch (err) {
    console.error('verifyAuthMe error:', err);
    return { authenticated: false };
  }
}
