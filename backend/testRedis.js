import "dotenv/config";

import { SessionService } from "./src/services/interview/session.service.js";
import { GraphService } from "./src/services/graph/graph.service.js";

const interviewId = "abc123";

await SessionService.create(interviewId);

await SessionService.appendTranscript(interviewId, {

    role: "user",

    content: "I'll use Redis."

});

await GraphService.update(interviewId, {

    nodes: [

        {

            id: "1",

            label: "Redis"

        }

    ],

    edges: []

});
