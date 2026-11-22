import mongoose from "mongoose";

import createAuditLogModel from "../../../mcp-servers/shared/AuditLog.js";

const AuditLog = createAuditLogModel(mongoose);

export default AuditLog;