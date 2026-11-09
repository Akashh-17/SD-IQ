import { randomUUID } from "node:crypto";
import { requestContext, safeId } from "../observability/context.js";

export function requestId(req, res, next) {

    const supplied = req.get("X-Request-Id");
    req.requestId = safeId(supplied) ? supplied : randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    requestContext.run({ requestId: req.requestId }, next);

}
