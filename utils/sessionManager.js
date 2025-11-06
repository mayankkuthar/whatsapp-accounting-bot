/**
 * Session Manager - Handles user conversation sessions
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  }

  getSession(phoneNumber) {
    const session = this.sessions.get(phoneNumber);
    
    if (!session) {
      return this.createSession(phoneNumber);
    }

    // Check if session has expired
    if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
      return this.createSession(phoneNumber);
    }

    session.lastActivity = Date.now();
    return session;
  }

  createSession(phoneNumber) {
    const session = {
      phoneNumber,
      currentFlow: 'languageSelection',
      currentStep: 0,
      data: {},
      lastActivity: Date.now()
    };
    this.sessions.set(phoneNumber, session);
    return session;
  }

  updateSession(phoneNumber, updates) {
    const session = this.getSession(phoneNumber);
    Object.assign(session, updates);
    session.lastActivity = Date.now();
    this.sessions.set(phoneNumber, session);
    return session;
  }

  resetSession(phoneNumber) {
    return this.createSession(phoneNumber);
  }

  clearSession(phoneNumber) {
    this.sessions.delete(phoneNumber);
  }
}

module.exports = new SessionManager();
