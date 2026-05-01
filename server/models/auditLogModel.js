import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_QUEUE',
        'UPDATE_QUEUE',
        'DELETE_QUEUE',
        'RESET_QUEUE',
        'CREATE_STAFF',
        'DELETE_STAFF',
        'RESET_PASSWORD',
        'UPDATE_SETTINGS',
        'CALL_TICKET',
        'COMPLETE_TICKET',
        'SYSTEM_UPDATE'
      ],
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
