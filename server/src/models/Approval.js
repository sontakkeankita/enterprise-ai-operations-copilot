import mongoose from "mongoose";

import createApprovalModel from "../../../mcp-servers/shared/Approval.js";

const Approval = createApprovalModel(mongoose);

export default Approval;