import AuditLog from '../models/auditLogModel.js';

export const logAction = async (clinicId, userId, action, details, req = null) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) : undefined;
    
    await AuditLog.create({
      clinic: clinicId,
      user: userId,
      action,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // We don't throw the error because audit logging shouldn't break the main transaction
  }
};
