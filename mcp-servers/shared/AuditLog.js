
const createAuditLogModel = (mongoose) => {
  const auditLogSchema = new mongoose.Schema(
    {
      actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      action: {
        type: String,
        required: true,
        trim: true,
      },

      resourceType: {
        type: String,
        required: true,
      },

      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      ipAddress: {
        type: String,
        default: null,
      },

      userAgent: {
        type: String,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

  auditLogSchema.index({
    resourceType: 1,
    resourceId: 1,
    createdAt: -1,
  });

  auditLogSchema.index({
    actorId: 1,
    createdAt: -1,
  });

  return (
    mongoose.models.AuditLog ||
    mongoose.model("AuditLog", auditLogSchema)
  );
};

export default createAuditLogModel;
