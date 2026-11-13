# Module 0 — Orientation

SystemIQ lets a candidate choose a system design problem, discuss a solution by typing or recording a spoken answer, and sketch an architecture on a whiteboard. The app turns relevant drawing elements into a list of components and connections, uses that information to guide follow-up questions, and shows feedback and scores after the session. You can trace these features through the start handler (`backend/src/routes/interview.routes.js:23–96`), answer form (`frontend/src/components/ChatPanel.tsx:69–99`), speech endpoint (`backend/src/routes/voice.routes.js:54–60`), drawing conversion (`frontend/src/components/excalidraw/converter.ts:29–87`), interview workflow (`backend/agent.js:43–90`) and report creation (`backend/src/services/report/report.service.js:141–179`).

**Today’s goal.** Be able to point at each part of the backend and explain what happens between running the startup command and receiving the first interview question. Read the concepts in order. The lettered lab at the end lets you reproduce the observations without accounts or keys. Later modules trace the individual features in depth.

### Client–server model

1. **What it is.** A client asks for an operation or information and a server responds. Think of a library patron asking a librarian to find a book.
2. **The problem it solves.** If each browser stores its own authoritative interview, opening another tab or device can create a second, conflicting version of the same session.
3. **General approaches.** Run everything locally in the browser, put page rendering and application logic on one server, or let the browser render the interface and call a separate backend.
4. **How SystemIQ implements it.** `frontend/src/config.ts:1–2` selects the backend address with `import.meta.env.VITE_API_URL || "http://localhost:5000"`. The browser's `startInterview` calls `fetch` at `frontend/src/services/interview.service.ts:4–35`. `backend/server.js:37` mounts the interview handlers with `app.use("/api/interview", interviewRoutes)`. The browser displays the returned interview identifier.
5. **Why it is needed HERE.** The server owns interview creation and controls access to stored data and paid or restricted provider services.
6. **Why this approach, and the alternatives.** Separate browser and backend code lets the browser focus on interaction. A single application that also renders pages could simplify deployment to one address. A browser-only app would need a different design for shared history, access control and provider credentials.
7. **Limits and edge cases.** A browser can load its own page while the backend is stopped or points to the wrong address. Other clients can call the server too, so hiding a button cannot enforce access.
8. **See it live.** Lab A calls the backend directly and receives `200`. Lab C gets a newly created interview identifier from the same server the browser would use.
9. **Interview answer.** “I split SystemIQ into a browser client and an Express backend. The browser handles the interview interface and drawing interactions. It asks the backend to create sessions, run the interviewer and load saved results.”
   - **Does the browser contain the authoritative session?** The backend creates and stores it. See `backend/src/routes/interview.routes.js:40–89`.
   - **Can another client use the backend?** Yes. A terminal can make the same requests, subject to the server's checks.
   - **What happens if the backend is down?** The page can still load, but calls requiring the backend fail.

### HTTP methods, status codes and JSON

1. **What it is.** HTTP is the agreement for how a client sends a request and a server replies. A method tells the server the kind of operation, a path locates it, headers carry extra information, a body carries data, and a status code summarizes the result. Think of a parcel with an address, delivery instructions and a receipt. JSON is a text format for data such as `{"status":"ok"}`.
2. **The problem it solves.** A caller needs to distinguish “the request worked,” “fix your input,” and “the server cannot handle this now” without guessing from prose.
3. **General approaches.** HTTP APIs commonly use `GET` to read, `POST` to submit or create, `PUT` to replace, `PATCH` to change part of a resource and `DELETE` to remove it. `2xx` generally indicates success, `4xx` a problem with the request or access, and `5xx` a server or dependency problem.
4. **How SystemIQ implements it.** `backend/src/routes/health.routes.js:69–95` handles a `GET` and uses `res.status(ok ? 200 : 503).json(...)`. `backend/src/routes/interview.routes.js:23–27,94–97` handles `POST /start` and responds with `res.json({ interviewId })`, which gives `200` here. `backend/server.js:32` installs `express.json({ limit: "1mb" })` to turn incoming JSON into JavaScript values and bound the size it reads.
5. **Why it is needed HERE.** The browser needs to know whether to open a new interview or display a failure. Hosting software can check the health status without knowing the shape of interview data.
6. **Why this approach, and the alternatives.** Returning an HTTP status plus JSON is easy to inspect with a browser or terminal. A binary data format can be more compact, at the cost of harder manual inspection. Sending `200` for every outcome would force every caller to learn a second status protocol.
7. **Limits and edge cases.** This app uses `200` for successful interview creation. `201 Created` would also be a conventional choice. `401` here covers missing or invalid credentials, `404` covers a missing or inaccessible interview, `429` means too many requests and `503` indicates a service is unavailable. A successful health response is evidence about the checks it ran.
8. **See it live.** Lab A gives `200`. Lab B sends incomplete JSON and gets `400`. Lab C shows `200` for start and `404` when another account reads the interview.
9. **Interview answer.** “My browser talks to Express over HTTP. I use GET for reads such as health and POST for operations such as starting an interview. The status tells the caller what happened, and the JSON body carries the result or an error message.”
   - **What distinguishes a header from the body?** A header carries information about the request or response. The body carries its content.
   - **Why does start return 200?** The handler calls `res.json` without setting a different success status.
   - **What happens before route code if JSON is malformed?** The global JSON reader raises an error, and the application error handler responds.

### REST-style API

1. **What it is.** REST is a way to design network interfaces around resources such as problems and interviews, using a common interface such as HTTP. A request carries the information required to handle it, even when a server stores resource data. Think of a library catalogue with stable book identifiers that any desk can look up.
2. **The problem it solves.** If every operation uses a private message format and an undocumented address, callers have to learn a separate protocol for each feature.
3. **General approaches.** A resource-oriented API exposes collections and individual items. An action-oriented API exposes operations such as `startInterview`. GraphQL lets callers describe the data they want through a query schema. Real projects sometimes mix resource reads and named actions.
4. **How SystemIQ implements it.** `backend/server.js:37–39` mounts separate interview, history and problem paths. `backend/src/routes/problem.routes.js:39–49` implements `router.get("/")` and `router.get("/:problemId")`. The interviews interface includes action paths such as `POST /start` and `POST /initialize` (`backend/src/routes/interview.routes.js:23–27,129–135`).
5. **Why it is needed HERE.** The user interface can list problems, select a specific one and then start a new session through predictable paths.
6. **Why this approach, and the alternatives.** Straightforward HTTP paths fit a browser client and simple inspection tools. A single query interface could help a client choose nested data, but would add another layer and still need access checks. An action-oriented design can describe the interview operations naturally.
7. **Limits and edge cases.** Describe this as a REST-style HTTP API with action endpoints. The repository contains no reason to claim strict adherence to every REST constraint. The application keeps interview data between requests.
8. **See it live.** Lab B lists the catalogue and requests `/api/problems/url_shortener`. The detail URL identifies one problem.
9. **Interview answer.** “I expose a REST-style HTTP API. Problems are resources with list and detail reads, and interview operations such as starting or initializing a session use named POST endpoints.”
   - **Why not put every action behind one path?** Separate paths make intent and route-level policy easy to see.
   - **Does storing interview state contradict carrying information in each request?** No. The request supplies the interview identifier and access credentials. The server can then read stored resource state.
   - **Can a public problem listing expose private custom problems?** The listing passes an optional user ID to the problem service. The custom rows are selected for that user (`backend/src/routes/problem.routes.js:38–49`, `backend/src/services/problem/problem.service.js:14–76`).

### Node.js, ES modules and Express startup

1. **What it is.** Node.js runs JavaScript outside the browser. An ES module uses `import` and `export` to share code. Express gives the running Node program an HTTP application. Think of Node as the kitchen, imported modules as prepared stations, and Express as the counter that accepts orders.
2. **The problem it solves.** Taking requests before required components are ready can leave the first visitor with an error even though the server appears to have started.
3. **General approaches.** Initialize everything before accepting requests, initialize some connections on demand, or accept connections early and return an unavailable response until preparation is complete.
4. **How SystemIQ implements it.** `backend/package.json:5–10` marks ES modules and maps `dev` to `nodemon server.js`. Nodemon restarts the development process on changes. `backend/server.js:16` constructs `app`. At `backend/server.js:52–58`, `await initializeAgent()` runs before `app.listen(PORT, ...)`. A port is the numbered address at which a machine accepts connections. The entry-point check at `backend/server.js:65–67` starts the listener for direct execution and for the mock launcher.
5. **Why it is needed HERE.** The interview service imports the initialized workflow (`backend/src/services/interview/interview.service.js:5,58–74`). That workflow must exist before an interview call can use it.
6. **Why this approach, and the alternatives.** Waiting before listening simplifies the normal request path. An early listener with a separate readiness flag can provide more startup diagnostics, but every relevant caller must respect the flag. Delaying preparation until the first interview would put setup latency on the first candidate.
7. **Limits and edge cases.** Failure while evaluating an imported module occurs before `startServer()` enters its `try` block. The startup catch handles a rejected `initializeAgent()`, while listener errors emitted later, such as a port conflict, do not have a separate listener error handler here (`backend/server.js:52–67`).
8. **See it live.** Lab A shows initialization before “Server started.” `backend/test/startup.test.js:17–31` launches a separate mock process and checks the HTTP response.
9. **Interview answer.** “Node runs the backend as ES modules, and Express handles incoming HTTP. I export the Express app separately from the listener so tests can use it. The executable entry point awaits interviewer initialization before it starts accepting requests.”
   - **Does importing `app` start the server?** The guarded entry-point check prevents ordinary imports from calling `startServer`.
   - **Where does the port come from?** `process.env.PORT || 5000` at `backend/server.js:50`.
   - **Does listening prove that all providers are available?** No. Some clients are constructed during imports and some dependencies are only exercised when called.

### Environment variables and secrets

1. **What it is.** Environment variables are named settings the running process receives from its surroundings. A secret is a setting that grants access, such as an API key. Think of an office door code delivered privately to staff rather than printed in a public handbook.
2. **The problem it solves.** A key in source code can be copied by anyone with repository access. Baking a local address into code also makes it harder to run the same program in another environment.
3. **General approaches.** Inject settings from the shell or hosting platform, load local settings files for development, or retrieve secrets through a managed store. Validate all required values in one place or let individual integrations validate the values they use.
4. **How SystemIQ implements it.** `backend/server.js:1` imports configuration first. `backend/src/config/env.js:7–8` calls `dotenv.config` for `.env.local` and then `.env`. Existing process values win. `backend/src/config/paths.js:8–14` derives the folder from the module file, so it does not depend on the terminal's current directory. `backend/src/services/llm.js:21–23` checks for the OpenRouter key in real mode and `backend/src/services/memory.js:14–16` checks `DATABASE_URL` when preparing workflow storage.
5. **Why it is needed HERE.** The same backend can run against live providers or local stand-ins. The service-role key used by `backend/src/config/supabase.js:5–8` belongs on the server. The browser uses a public project key (`frontend/src/lib/supabase.ts:4–5`).
6. **Why this approach, and the alternatives.** File-based local settings are quick to use, and host-injected settings can take precedence in deployment. A single startup schema could report every missing variable at once. This repository has distributed checks and client construction, so the first error may hide a second configuration issue.
7. **Limits and edge cases.** A present key may be expired or point to the wrong project. Boot does not prove access to all providers. The Redis setup line is client construction, not evidence of a successful request (`backend/src/config/redis.js:8–16`).
8. **See it live.** In Lab A set `PORT=5017` for the process and observe port 5017. The startup test starts a copy without local environment files (`backend/test/startup.test.js:17–30`). Avoid printing environment values.
9. **Interview answer.** “I keep runtime configuration outside the code. Shell or hosting values take precedence, then the app reads .env.local and .env. The backend checks some required settings at startup and keeps privileged keys on the server.”
   - **Does `.env.local` beat an injected setting?** No. Dotenv does not overwrite the setting already in the process.
   - **Is there one full environment validator?** No. Startup checks are distributed across the integrations.
   - **Does changing a local file update a running process automatically?** The loading shown here happens when the module is evaluated. Restart the process to load fresh values.

### Mocking and MOCK_MODE

1. **What it is.** A mock or test double is a controlled substitute for a real dependency. Mock mode tells the app to use substitutes while running its own code. Think of practicing in a flight simulator with predictable weather.
2. **The problem it solves.** A demo or test that requires live accounts, provider access and a working network can fail even when your code is correct.
3. **General approaches.** Replace individual functions in a test, use fake services with the same interface, use local real services, or test against a dedicated hosted environment.
4. **How SystemIQ implements it.** `backend/src/services/mock/dev.js:1–3` sets `process.env.MOCK_MODE = "true"` before importing `server.js`. `backend/src/services/mock/mode.js:3–10` reads the exact flag and throws if `NODE_ENV` is `production`. The selected substitutes include `new MemoryRedis()` (`backend/src/config/redis.js:8`), `new MemorySupabase()` (`backend/src/config/supabase.js:5`), `new MockLLM()` (`backend/src/services/llm.js:25–26`) and `new MemorySaver()` (`backend/src/services/memory.js:9–12`). The voice service returns a fixture (`backend/src/services/transcriber.js:10–12`).
5. **Why it is needed HERE.** You can study the actual HTTP handlers, branching logic and stored results without any external credentials. The browser has its own explicit mock setting, used by its `dev:mock` script (`frontend/package.json:13`, `frontend/.env.mock:1`, `frontend/src/lib/supabase.ts:3,29–48`).
6. **Why this approach, and the alternatives.** An application-wide offline mode exercises multiple layers together. A local real database would test its actual constraints and behavior but needs setup. Hosted tests can prove real integration and add network dependence, cost and data-management work.
7. **Limits and edge cases.** These substitutes store data in one running process. Restarting it loses that data. A fixture response cannot prove live output quality or actual provider reliability. The backend's production guard and the frontend's separate explicit switch have different responsibilities.
8. **See it live.** Lab A starts without real provider requests. Lab C accepts the documented fake identity. Lab D handles synthetic file bytes and returns fixture text. The test starting at `backend/test/mock.test.js:61` verifies the backend rejects the production/mock combination.
9. **Interview answer.** “I can run the same backend routes and interviewer workflow offline by selecting in-memory service substitutes. It lets me demonstrate request handling and data flow. To validate provider behavior, I would run separate tests with real services.”
   - **Will a mock interview survive restart?** No. The in-memory stores are recreated.
   - **Are fake tokens accepted by the real backend?** Real mode uses the Supabase client, rather than the mock identity lookup.
   - **Why set the flag before importing the server?** Client modules choose their implementation during evaluation.

### Routing, controllers and services

1. **What it is.** Routing matches a method and path to code. A controller translates the request into an application operation and sends a response. A service implements the operation in terms of application rules and dependencies. Think of a hospital reception desk directing a patient to a department, where a clinician carries out the work.
2. **The problem it solves.** If every action mixes parsing, status codes, database calls and interviewer logic in one place, it becomes hard to reuse the operation or test it independently of HTTP.
3. **General approaches.** Keep route and business logic together for small features, layer them into routes/controllers/services, or organize each feature into its own module with those roles close together.
4. **How SystemIQ implements it.** `backend/server.js:37` mounts `interviewRoutes`. `backend/src/routes/interview.routes.js:129–135` maps `POST /initialize` to `initializeInterview` after its checks. `backend/src/controllers/initializeInterview.controller.js:8–18` calls `InterviewService.initialize(interviewId, { interviewId })` and sends `res.json({ reply })`. `backend/src/services/interview/interview.service.js:47–99` retrieves saved state or prepares and runs the interviewer.
5. **Why it is needed HERE.** The same interview operation can handle stored interview data without knowing the details of Express response objects.
6. **Why this approach, and the alternatives.** Layers help separate changes to HTTP from changes to the interviewer. A direct handler is fine for a short operation. Many extra classes would add indirection without helping a small team.
7. **Limits and edge cases.** The separation is pragmatic. The start handler creates the session and writes an interview row directly in `backend/src/routes/interview.routes.js:23–96`. `interview.controller.js` also owns initialization of the workflow rather than only request handlers.
8. **See it live.** Lab C uses the full mounted paths. `/api/interview/initialize` returns a reply field. The code before that call creates the interview and returns an ID.
9. **Interview answer.** “I mount feature routes in server.js. For initialization, the route checks the request, the controller asks InterviewService for a result, and the service loads context and calls the interviewer. A few smaller operations, including interview creation, are implemented directly in the route.”
   - **Where does the HTTP response get written?** In the controller for initialize, at `backend/src/controllers/initializeInterview.controller.js:14–18`.
   - **Where do session reads live?** `SessionService`, called by `InterviewService`.
   - **Why have routes in separate files?** Each feature's paths and checks are easier to review together.

### Express middleware and order

1. **What it is.** Middleware is a function that handles part of a request before the final handler. It can add information to the request, respond immediately, or pass control using `next()`. Think of a series of airport checks before boarding.
2. **The problem it solves.** If the handler needs a user identity but the identity check runs afterward, it may fail or operate without knowing whose data it can use.
3. **General approaches.** Apply common steps to every request, apply feature-specific steps on a group of routes, or attach checks only to an individual route. The order must match each step's prerequisites.
4. **How SystemIQ implements it.** `backend/server.js:16–39` registers `requestId`, `observeHttp`, browser-origin handling and JSON reading before the feature routes. `backend/src/routes/interview.routes.js:129–135` places the identity check before checking the input and finding the owner. The message route at `backend/src/routes/interview.routes.js:137–144` also applies a request budget after identity is known.
5. **Why it is needed HERE.** The app can reject unauthorized or excessive requests before running the interviewer. Early request metadata also covers rejected calls.
6. **Why this approach, and the alternatives.** Express's ordered functions make each guard visible beside the route. Central policies can reduce repetition but need careful matching. Repeating checks inside every handler increases the chance one path misses a guard.
7. **Limits and edge cases.** A function that neither responds nor calls `next()` can leave the request waiting. Since JSON reading is global, malformed JSON can be rejected before route-level identity checks run. Since the budget check precedes schema validation on some routes, a structurally invalid request can still consume budget.
8. **See it live.** Lab B sends broken JSON and receives `400`. Lab C's other user reaches the ownership guard and gets `404` without a greeting run for that call.
9. **Interview answer.** “I arrange Express middleware in dependency order. The app attaches a request ID and reads JSON before feature code. Protected interview routes check identity, enforce their budget where applicable, validate data and check ownership before doing expensive work.”
   - **What does `next()` do?** Hands control to the next matching step.
   - **Why check identity before the user budget?** The budget uses the authenticated user ID when present.
   - **Does every route use the same chain?** No. Initialize and state lack the route budget guard, while health has no interview ownership guard.

### Request IDs

1. **What it is.** A request ID is a short identifier that lets you connect events from a single call. Think of a parcel tracking number appearing on its receipt and every transfer record.
2. **The problem it solves.** Two interview turns can overlap. Without a shared identifier on their records, you may associate one candidate's slow request with another candidate's model step.
3. **General approaches.** Generate an ID at the first server, accept an ID from an upstream component, or propagate a tracing identifier across several services. Pass it as a function parameter or keep it in a context attached to the ongoing operation.
4. **How SystemIQ implements it.** `backend/src/middleware/requestId.js:6–9` reads `X-Request-Id`, uses it if `safeId` accepts it, otherwise uses `randomUUID()`, and sends it back as a header. `requestContext.run({ requestId: req.requestId }, next)` uses Node's `AsyncLocalStorage`, which makes a value available to the asynchronous work started inside that context (`backend/src/observability/context.js:1–8`). The logger retrieves it at `backend/src/utils/logger.js:53–65`.
5. **Why it is needed HERE.** One greeting involves both the interviewer workflow and an HTTP response. The same ID lets you find both events.
6. **Why this approach, and the alternatives.** The context avoids manually passing the identifier to every nested function. Explicit parameters are easier to see in a function signature but can add repetition. A full tracing system would help when requests cross several services.
7. **Limits and edge cases.** A valid client-supplied value can be reused. It is not proof of identity or uniqueness. Logging outside a request falls back to `background`. The code does not forward a cross-provider tracing header from this middleware.
8. **See it live.** Lab A returns `X-Request-Id: orientation-health`. Lab C shows two workflow steps and the request completion sharing `orientation-greeting`.
9. **Interview answer.** “I give each HTTP request an ID, validate any supplied ID, and return it as a header. I use async context to attach it to internal logs, so a single interview turn can be followed through its steps.”
   - **Why reject arbitrary header values?** To bound size and keep suspicious values out of logs (`backend/src/observability/context.js:6–8`).
   - **Is it the interview ID?** No. An interview spans many requests, each with its own request ID.
   - **Why register it first?** Even JSON and access failures should have a request ID.

### Observability, structured logs and metrics

1. **What it is.** Observability is the ability to infer what a system is doing from signals it emits. A structured log describes one event with named fields, while a metric is a measured quantity that can be counted or summarized across events. Think of an air traffic log for individual flights and a dashboard showing the day's average delays.
2. **The problem it solves.** If a candidate reports a slow interview, a single unstructured “something failed” line does not tell you which operation was slow or whether it affected other users.
3. **General approaches.** Keep event records, expose aggregated measurements, and trace the path of an individual request across components. For a small application, logs and metrics often answer the first questions.
4. **How SystemIQ implements it.** `backend/server.js:17–18,33` installs request context, HTTP timing and `/metrics`. `backend/src/observability/http.js:15–26` records once at finish or close, then observes elapsed seconds and logs `event: "http.request"`. `backend/src/utils/logger.js:53–65` uses Pino and a safe-field filter. `backend/agent.js:23–37` wraps workflow steps with `timeNode`. `backend/src/observability/http.js:30–43` exposes measurements and checks an access key when `METRICS_TOKEN` is set.
5. **Why it is needed HERE.** You can distinguish a slow HTTP call from a slow interviewer step and follow rejected requests by ID.
6. **Why this approach, and the alternatives.** Structured fields are easier to query than free-text messages. Aggregated measurements are cheaper to inspect for trends than all raw logs. Managed tracing would help with cross-service timing at the cost of more setup and data handling.
7. **Limits and edge cases.** The measurements describe the server process that records them. They need collection and aggregation for a multi-server view. The code can label an early connection close as `499` in logs and measurements (`backend/src/observability/http.js:19`). That number is a measurement label here, not a response already delivered to the client.
8. **See it live.** Lab A shows a completion record. Lab C shows workflow-step timing. If `METRICS_TOKEN` is unset, `curl.exe -i http://127.0.0.1:5017/metrics` should return text measurements. The optional access check is covered by `backend/test/observability.test.js:95–98`.
9. **Interview answer.** “I record request durations and individual interviewer step durations. Logs have request IDs, while the metrics endpoint exposes numeric measurements that can be collected to look for slow or failing operations.”
   - **What would you use first for one user report?** The request ID and associated event logs.
   - **What would you use for a broad slowdown?** Aggregated request and workflow duration measurements.
   - **Are interview answers part of request logs?** The request completion code logs method, route, status and duration, and the logger filters metadata. I would avoid logging candidate text (`backend/src/observability/http.js:22–23`, `backend/src/utils/logger.js:26–65`).

### CORS

1. **What it is.** Cross-Origin Resource Sharing is a browser rule that uses response headers to decide whether JavaScript from one origin can read a response from another. An origin is the combination of scheme, host and port. Think of a reading room that lends records only to people from an approved building.
2. **The problem it solves.** A web page on an unrelated site should not be able to read responses from another site through a visitor's browser without that site's permission.
3. **General approaches.** Host browser and backend at the same origin, allow specific origins, or allow all origins for a truly public endpoint. For some cross-origin requests the browser sends an `OPTIONS` check first.
4. **How SystemIQ implements it.** `backend/server.js:21–24` splits `CORS_ORIGINS` on commas and removes blanks. `backend/server.js:26–30` passes `origin: corsOrigins`, `credentials: true` and `exposedHeaders: ["X-Request-Id"]` to `cors`. The default allowed browser origin is `http://localhost:5173`.
5. **Why it is needed HERE.** During development, the browser site is normally on 5173 and the backend on 5000. Even on the same machine, those ports give different origins.
6. **Why this approach, and the alternatives.** A list works for local and deployed frontends. Serving both through one origin can avoid this cross-origin setup. A broad policy can simplify public reads but is a poor fit for a private interview interface.
7. **Limits and edge cases.** It is a browser policy. The server can still return an HTTP response to a command-line client with an unlisted origin. `localhost` and `127.0.0.1` are different host strings, and a development server on another port needs a matching allowed origin.
8. **See it live.** Lab A sends two origins. Both requests returned `200` in the terminal. Only the allowed origin received `Access-Control-Allow-Origin`.
9. **Interview answer.** “The browser and backend run on different origins during development, so I allow the frontend's origin explicitly. I also expose the request ID header to browser code. Separate server-side checks protect the interview itself.”
   - **Why can curl still read the disallowed-origin response?** Curl does not enforce browser rules.
   - **Does `credentials: true` verify the user?** It configures browser cross-origin behavior. The identity check is a separate function.
   - **Why can Vite moving from 5173 to 5174 break requests?** The port is part of the origin.

### Express error-handling middleware

1. **What it is.** Error-handling middleware converts failures from the request pipeline into a controlled response. Express recognizes the four-argument signature `(error, req, res, next)`. Think of a service desk that handles exceptions the ordinary queue cannot resolve.
2. **The problem it solves.** Invalid input can otherwise trigger a generic server error or expose details about the application. Failures after a response starts require different handling from failures before anything is sent.
3. **General approaches.** Catch expected failures beside the operation, map shared errors centrally, and use a final handler for unexpected failures. Keep user messages separate from operational diagnostics.
4. **How SystemIQ implements it.** `backend/server.js:43–48` registers the handler after the routes. It accepts a numeric error status in `400–599` and uses `500` otherwise. It records the error using the logger, then runs `if (res.headersSent) return res.destroy()` or sends a short JSON message. A `400` gets `"Invalid request"`.
5. **Why it is needed HERE.** The global JSON reader can fail before an interview controller runs. The app still sends a readable status and response for that case.
6. **Why this approach, and the alternatives.** A last-resort handler keeps framework errors consistent. Local catches can give more useful domain-specific messages. A shared error class and formatter would make those messages more consistent as the app grows.
7. **Limits and edge cases.** This handler only sees failures that reach it. For example, `backend/src/controllers/initializeInterview.controller.js:22–29` catches an error and returns `err.message` itself. Some other paths return their own messages. An import-time failure is outside an HTTP request and cannot be handled here.
8. **See it live.** Lab B sends `{` as an HTTP body marked as JSON. The response is `400 {"message":"Invalid request"}`, and a request error record is followed by a completion record.
9. **Interview answer.** “I place a final Express error handler after all routes. It preserves valid error statuses, sends a short response and closes the connection if headers are already sent. Some controllers handle errors locally, so I review those separately.”
   - **Why after routes?** It can receive errors from earlier matching steps.
   - **Why not send a new status after headers are sent?** The client has already received the original response metadata.
   - **Does every failure use this handler?** No. A controller that catches and replies handles that failure itself.

### Input validation and Zod

1. **What it is.** Validation checks whether incoming values satisfy the application's rules. A schema is a specification of fields and allowed values. Zod lets JavaScript check a value against that specification. Think of a form checker verifying the fields before accepting an application.
2. **The problem it solves.** Correctly formatted JSON can still carry an unknown difficulty, a malformed identifier or an extremely long answer.
3. **General approaches.** Write checks manually, use a runtime schema library such as Zod, or generate validation from a shared API schema. Database constraints can protect stored data after the request checks.
4. **How SystemIQ implements it.** `backend/src/middleware/validate.js:9–39` calls `safeParse` on supplied route parameters or the body and responds on failure. It replaces `req.body` with the parsed result and leaves `req.params` as it was. `backend/src/middleware/validate.js:92–104` defines start and message fields, including `z.enum(["SDE1", "SDE2", "Senior"])` and `z.string().trim().min(1).max(4000)`. The start route calls `validate({ body: Schemas.start })` (`backend/src/routes/interview.routes.js:23–27`).
5. **Why it is needed HERE.** The interviewer expects a supported interview level and a non-empty, bounded answer.
6. **Why this approach, and the alternatives.** A schema puts field rules in a reusable place and can normalize data, such as trimming an answer. Handwritten checks are quick for one field but easy to apply inconsistently. Static TypeScript types alone cannot check values received over the network.
7. **Limits and edge cases.** A valid identifier may still refer to someone else's interview. A well-formed topic may still be unsuitable or malicious. Schema checks complement identity and ownership checks.
8. **See it live.** In Lab C, valid JSON with `difficulty: "beginner"` returned `400`. Compare with Lab B, which never reaches schema validation because the JSON itself cannot be read.
9. **Interview answer.** “I validate runtime inputs with Zod before applying business logic. For example, interview start accepts a known difficulty and an allowed problem identifier. The parsed values are used by the handler, while ownership is checked separately.”
   - **Does valid JSON imply valid input?** No. Format and application rules are separate.
   - **Does a valid UUID prove ownership?** No. The owner check reads the associated record.
   - **Why limit message length?** It bounds incoming work and context sent for each turn.

### Authentication, authorization and ownership

1. **What it is.** Authentication establishes who is making a request. Authorization decides what that identity may do. Ownership is one authorization rule. Think of a hotel checking your identity at reception and giving you a key for your assigned room.
2. **The problem it solves.** A signed-in user could replace their interview ID with someone else's and read or change private data if the server checked only that the user was signed in. That is an insecure direct object reference, or IDOR.
3. **General approaches.** Verify identity with a server-side login session or a signed credential. Check resource access through ownership, roles, capabilities or policies enforced by the database.
4. **How SystemIQ implements it.** `backend/src/middleware/auth.js:8–46` reads the `Authorization` header, removes the `Bearer ` prefix and calls `supabase.auth.getUser(token)`. A bearer credential is a value presented as proof of access. On success the middleware sets `req.user = data.user`. `backend/src/middleware/ownsInterview.js:34–74` looks for the owner of the live interview, falls back to the stored interview row if there is no live session and compares `ownerId !== req.user.id`.
5. **Why it is needed HERE.** Reports and diagrams belong to the user who created the interview. Knowing its identifier is insufficient.
6. **Why this approach, and the alternatives.** One ownership guard is easy to apply on multiple interview paths. Database policies could add protection for database access. More elaborate permission rules would be useful if the product added shared interviews or reviewer roles.
7. **Limits and edge cases.** Each protected path needs the right check. Another user and a missing interview both get `404` through this guard. That reduces what a caller learns from the response. It does not replace correct ownership checks elsewhere.
8. **See it live.** Lab B calls history with no identity and gets `401`. Lab C reads the same interview as its owner and as another authenticated mock user. The results are `200` and `404`.
9. **Interview answer.** “I first establish who the caller is through Supabase Auth. Then I check that the user owns the requested interview. A valid login credential lets someone use the API, and ownership lets them use their own interview.”
   - **Why 404 for a different owner?** It gives the same response as a missing interview, so the caller cannot confirm existence from that response.
   - **Is the interview ID a credential?** No. It identifies a resource and is checked against an authenticated user.
   - **Why check a stored row after a live session disappears?** Completed interviews can still have saved reports.

### Rate limiting

1. **What it is.** Rate limiting sets a budget for how many requests a caller can make over time. Think of a cafeteria allowing a limited number of reservations per student per hour.
2. **The problem it solves.** One user can repeatedly start interviews or submit messages, consuming enough shared processing and model capacity to slow down everyone else's work.
3. **General approaches.** A fixed window counts requests in discrete time buckets. A sliding window looks back from the current moment. A token bucket refills a budget over time and allows short bursts.
4. **How SystemIQ implements it.** `backend/src/middleware/rateLimit.js:10–26` uses `req.user?.id ?? req.ip` and `Math.floor(Date.now() / 1000 / windowSeconds)` for its bucket. It increments `ratelimit:<name>:<who>:<window>` in the shared store and sets an expiry on the first increment. At `backend/src/middleware/rateLimit.js:30–45` it returns budget headers and `429` when the count is over the limit. Start uses a budget of 10 per default 60-second bucket (`backend/src/routes/interview.routes.js:23–27`).
5. **Why it is needed HERE.** Provider calls take time and may consume provider quota. A user-specific budget protects the shared service from one account's burst.
6. **Why this approach, and the alternatives.** Counting in a shared store is straightforward and works across servers using the same store. Sliding windows smooth boundary bursts but require more work. Per-process counters are cheap but separate on each server.
7. **Limits and edge cases.** A caller can use much of one bucket just before its boundary and another just after it. A failure in the store lets the middleware proceed (`backend/src/middleware/rateLimit.js:51–58`). Other request steps may still fail if they require that store. Increment and expiry are separate calls.
8. **See it live.** Lab C shows `X-RateLimit-Limit: 10` on start. `backend/test/api.test.js:35–38` exercises exceeding a request budget. Module 6 will inspect the counter and expiry behavior in detail.
9. **Interview answer.** “I apply a fixed-window request budget per user and operation. The shared counter is incremented for each call, and the middleware returns 429 when the limit is exceeded. It's simple, but it allows bursts at bucket boundaries and falls open if the counter store is unavailable.”
   - **Where do counters live?** In Redis, under keys prefixed with `ratelimit:`.
   - **Why not just use IP?** Several users can share an IP. The protected routes already know the account identity.
   - **What happens across two backend instances?** With one shared Redis, they increment the same counter for the same user, operation and bucket.

### Redis, in-memory storage and the Upstash REST client

1. **What it is.** Redis provides named entries, called keys, with operations on values such as strings, numbers and lists. In-memory means working data is held in RAM for fast access. Think of a clerk's desk drawer with a labelled folder for each active case. Redis can be configured with disk persistence, and this app's mock store lives only in its own process.
2. **The problem it solves.** If active conversation data lives only in a JavaScript object, another server process cannot read it. Writing the entire interview for every new message also makes separate operations interfere with each other.
3. **General approaches.** Keep local process memory, use a shared Redis store, or use the main database for live state. A Redis client can speak Redis's native network protocol or call a managed HTTP interface.
4. **How SystemIQ implements it.** `backend/src/config/redis.js:8–14` chooses `new MemoryRedis()` or `new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })`. `backend/src/services/interview/session.service.js:35–49,143–157` separates metadata, transcript, graph, analysis and full scene. `redis.lrange(keys.transcript, 0, -1)` reads the transcript list. `backend/src/services/interview/session.service.js:243–256` appends entries with `redis.rpush` instead of replacing the entire list. `backend/src/middleware/rateLimit.js:18–26` uses a separate numeric counter.
5. **Why it is needed HERE.** A turn needs recent conversation context, the current drawing-derived graph and session metadata. The backend updates these at different times and reads them together.
6. **Why this approach, and the alternatives.** Shared Redis fits quickly changing, short-lived data and has useful list and counter operations. Upstash's HTTP client uses a URL and token instead of an application-managed native Redis connection. A single relational database would reduce the number of services to operate, at the cost of moving these frequent operations into that database.
7. **Limits and edge cases.** A remote Redis call still crosses the network. Clearing it can lose the active data shown in the key layout, and the stored database records do not automatically rebuild that live session. The mock shows app behavior and makes no claims about remote latency or persistence. Module 5 examines expiry and recovery.
8. **See it live.** Lab C starts a session and reads it from a separate request. Lab A shows the in-memory store's `ping()` check. `backend/src/services/mock/redis.js:49` returns `"PONG"`. Restarting the isolated mock server clears the prior session.
9. **Interview answer.** “I put live interview metadata, the transcript list, diagram data and request counters in Redis. Upstash gives the backend a shared store through its HTTP client. Each kind of interview data has its own key, so appending a message does not rewrite the rest of the session.”
   - **Why use a Redis list?** The service can append messages in order and read the list without rewriting it for every append.
   - **Is Upstash Redis the same as process memory?** The real client reaches a shared service. The offline substitute stays inside a single process.
   - **Why not put history in Redis too?** Completed records need durable history and relationships between saved interviews and reports.

### Time to live (TTL)

1. **What it is.** A TTL tells a store how long a value should remain usable. Expiring a key makes it disappear when its lifetime runs out. Think of a reserved seat released when its reservation expires.
2. **The problem it solves.** An abandoned interview and obsolete request counters would otherwise continue occupying the store.
3. **General approaches.** Give each record a fixed deadline, extend its lifetime on activity, or have a separate process periodically remove old records.
4. **How SystemIQ implements it.** `SESSION_TTL_SECONDS = 24 * 60 * 60` sets 24 hours (`backend/src/services/interview/session.service.js:7`). `redis.set(keys.meta, meta, { ex: SESSION_TTL_SECONDS })` sets the value with an expiry in seconds (line 119). `touch` calls `redis.expire` on session keys at lines 262–269. The mock computes an absolute deadline and discards expired entries when accessed (`backend/src/services/mock/redis.js:5–20,37–41`).
5. **Why it is needed HERE.** A candidate may close a tab without finishing. Active data needs a bounded lifetime while durable history remains available.
6. **Why this approach, and the alternatives.** Store-native expiry avoids maintaining a cleanup task for each session key. A cleanup process can express more complex retention rules, with additional scheduling and failure cases. Refreshing on activity supports resumed sessions within the retention period.
7. **Limits and edge cases.** Each key has its own deadline. TTL cannot restore a key removed earlier, and it is separate from the time limit shown in the interview interface. The mock removes expired entries lazily, when a lookup encounters them.
8. **See it live.** Run `npm test -- test/mock.test.js -t "Redis implements list"`. `backend/test/mock.test.js:20–29` sets a mock value, expires it immediately with `expire("obj", 0)` and verifies the next read returns `null`. The full backend suite passed this test during this lab.
9. **Interview answer.** “I give live Redis session keys a 24-hour lifetime and refresh it when appropriate. This bounds abandoned session storage. Persisted history lives separately, so its availability does not depend on the live key's lifetime.”
   - **Is TTL measured from first creation forever?** A later write with expiry or a call to `expire` can reset the deadline.
   - **Can expiring one key delete all session keys?** Each key expires separately. The service explicitly applies expiry to multiple keys.
   - **Is TTL a backup?** It controls how long live data remains usable. Recovery requires a separately saved copy or a recovery path.

### PostgreSQL and relational tables

1. **What it is.** PostgreSQL stores data in tables of rows and columns. A primary key identifies one row. A foreign key links a row to a row in another table, and a constraint is a rule the database enforces. Think of an academic registrar with separate course and enrollment lists linked by IDs.
2. **The problem it solves.** If report and interview files are stored separately without a link the database enforces, a report can end up attached to a nonexistent interview. History also needs durable reads across restarts.
3. **General approaches.** Store related rows in a relational database, put related data together in a document database, or persist flat files. Relational tables are useful when records have identifiable relationships and lookup rules.
4. **How SystemIQ implements it.** The setup SQL in `README.md:179–215` shows `id uuid primary key` on `interviews` and `interview_id uuid references interviews(id)` on its child tables. `backend/src/routes/interview.routes.js:65–89` inserts an interview row when a session starts. `backend/src/routes/history.routes.js:29–60` reads interview and report data for history.
5. **Why it is needed HERE.** The user can return to prior practice attempts after the active session ends. The persisted report belongs to a specific interview row. A separate PostgreSQL connection also stores interviewer workflow progress, as described below.
6. **Why this approach, and the alternatives.** A relational store lets the app enforce identifiers and relationships while using JSON fields for flexible details. A document store could keep an interview and report together, with a different access pattern and fewer database-enforced relations. One PostgreSQL service can support both product records and workflow storage.
7. **Limits and edge cases.** The README describes intended tables. The repo alone cannot prove the current schema of a live deployment. The product tables and workflow storage are accessed through separate configured interfaces. Putting records in PostgreSQL does not make writes to another store atomic with them.
8. **See it live.** Lab C calls history after start and sees one row in the memory stand-in. It demonstrates the application's reads and writes. A real database is needed to demonstrate the SQL constraints.
9. **Interview answer.** “I keep durable interview history, reports and saved diagrams in PostgreSQL through Supabase. The table relationships tie reports to interviews. The active session uses Redis, while the interviewer workflow has its own PostgreSQL-backed save mechanism.”
   - **What is the difference between the row ID and interview ID?** The SQL has a primary row ID and a unique application interview ID. The report's foreign key references the row ID (`README.md:179–207`).
   - **Does the mock prove the foreign key works?** No. The README specifies the foreign key, and an actual database test would verify its enforcement.
   - **Is there only one source of truth for everything?** Durable product history, live session data and workflow progress serve separate purposes.

### Upserts and conflict targets

1. **What it is.** An upsert inserts a record when no matching row exists, or updates the matching row when it does. A conflict target specifies which unique key determines the match. Think of a registrar adding a new student's record or updating their existing record by student number.
2. **The problem it solves.** An unconditional insert at interview completion would conflict with the history row created at start. A read followed by a separate insert can also race with another writer.
3. **General approaches.** Use a database upsert, update a known existing row, or combine checks and writes in a database transaction. A transaction groups database operations so they can succeed or fail together.
4. **How SystemIQ implements it.** `README.md:179–181` declares `interview_id text unique not null`. `backend/src/services/interview/persistence.service.js:34–67` calls `.upsert({ interview_id: session.interview.interviewId, ... }, { onConflict: "interview_id" })`. The Supabase option names the SQL `ON CONFLICT` target. The returned interview row supplies its database ID for the dependent report and diagram records (`backend/src/services/interview/persistence.service.js:65–77`).
5. **Why it is needed HERE.** The start flow registers an active row. The completion flow writes the completed status and score for the same interview.
6. **Why this approach, and the alternatives.** The database resolves the unique-key conflict within the write. A plain update can be enough if the row always exists, while an upsert also handles a missing row. A multi-table transaction would address a broader consistency problem and would need a different write path here.
7. **Limits and edge cases.** The unique constraint protects the interview row. It cannot prevent two expensive model calls or make separate writes to child tables succeed together. Module 4 covers the separate protection around report work.
8. **See it live.** `npm test -- test/mock.test.js -t "Supabase supports"` exercises the stand-in's update-on-conflict behavior. `backend/test/mock.test.js:32–38` writes the same interview key twice and checks that one row remains with the changed title.
9. **Interview answer.** “I register an interview row at start and use an upsert to persist completion against the unique interview_id. This updates the original row when present. The database row identity links the saved report and diagram.”
   - **Why specify interview_id?** It is the stable application identifier available during both start and completion.
   - **What must exist in real PostgreSQL?** A suitable unique constraint for the conflict target.
   - **Does this deduplicate report generation itself?** It resolves a conflict when writing one table. Report generation needs its own coordination.

### Supabase as managed database access and Auth

1. **What it is.** Supabase provides managed PostgreSQL and services to access it and sign users in. The database holds records. Auth handles identities and login credentials. Think of a managed office building with both a records room and a staffed reception desk.
2. **The problem it solves.** Building password handling, login sessions, database access and their deployment from scratch adds security and maintenance work to a small project.
3. **General approaches.** Use managed database and Auth services together, combine a separate identity provider with a hosted database, or operate both services yourself.
4. **How SystemIQ implements it.** The browser calls `supabase.auth.signInWithPassword({ email, password })` at `frontend/src/services/auth.service.ts:21–35`. This is a browser-to-Supabase path. When the browser calls the Express API, `frontend/src/services/interview.service.ts:8–28` attaches the login session's access token. Express asks `supabase.auth.getUser(token)` to resolve the caller (`backend/src/middleware/auth.js:28–46`). For stored data the backend calls `supabase.from(...)` using a backend client created with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (`backend/src/config/supabase.js:5–8`).
5. **Why it is needed HERE.** One identity connects a user's browser session to their saved interview records.
6. **Why this approach, and the alternatives.** The managed service covers Auth and database access with little setup. A separate provider and direct database driver give more control over the individual layers but add integration work. Using a privileged backend client makes the app's ownership guards especially important.
7. **Limits and edge cases.** Supabase reachability and correct project settings matter in real mode. `frontend/src/lib/supabase.ts:7–28,43–48` handles missing browser configuration by returning an unavailable client. The mock identity lookup accepts a synthetic token (`backend/src/services/mock/supabase.js:7–11`). It exercises the application contract without checking a real signed credential. Module 6 covers token structure and verification.
8. **See it live.** Lab C uses the synthetic Auth lookup and then calls history through the memory table substitute. Compare the two Supabase call sites, `auth.getUser` in the guard and `from("interviews")` in history.
9. **Interview answer.** “I use Supabase Auth for sign-in and managed PostgreSQL for saved data. The browser signs in with Supabase and attaches its access token to Express requests. Express asks Supabase to resolve that token and then enforces ownership in the application.”
   - **Does Express receive passwords in a dedicated sign-in route?** This frontend signs in directly through the Supabase client. The mounts at `backend/server.js:34–39` have no application sign-in route.
   - **Can the frontend use the service-role key?** The frontend uses the public key. The service-role key grants privileged access and stays server-side.
   - **Does the service-role client make every row automatically safe to return?** Route logic still has to filter or check the authenticated owner.

### LLM API calls and prompts

1. **What it is.** A large language model predicts and generates text from context. An LLM API call sends that context to a provider. A prompt is the input that asks for a task, and a system prompt supplies higher-level instructions about the model's role and response. Think of giving a consultant a job description plus the details of the current case.
2. **The problem it solves.** A fixed script cannot easily ask a useful follow-up about arbitrary trade-offs a candidate mentions.
3. **General approaches.** Ask a model for prose, request data in a specific format, combine a model with rules, or use templates for predictable responses. Send a request to a hosted model or run a model locally.
4. **How SystemIQ implements it.** `backend/src/services/llm.js:7–14,25–46` creates `ChatOpenAI` clients with an OpenRouter base URL, a model ID and output limits. `backend/src/agents/interviewer/agent.js:1–13` imports `interviewerPrompt`, combines it with interviewer context and calls `llm.invoke(input, config)` to get text. Report prose is requested in `backend/src/services/report/reportGenerator.js:37–99`. The default ID at `backend/src/services/llm.js:7` ends in `:free` and may be overridden.
5. **Why it is needed HERE.** The interviewer can use the problem, candidate's current progress and architecture context to choose natural wording for a relevant follow-up.
6. **Why this approach, and the alternatives.** A hosted API avoids operating model infrastructure. A local model gives more control of hosting and data but requires suitable compute and maintenance. Rule-based behavior remains useful for deterministic steps such as calculating aggregate scores.
7. **Limits and edge cases.** Model output is probabilistic in real mode and can be wrong, slow or unavailable. The source configures a free model ID and still requires a key. Its current availability, external quotas and the quality of a live answer require separate evidence. Mock mode does not call it.
8. **See it live.** Lab C runs the interviewer step and receives a reply. `backend/src/services/llm.js:25–26` tells you that the observed result came from `MockLLM`.
9. **Interview answer.** “I send the problem and selected interview context to a configurable OpenRouter model through a LangChain client. The prompt describes how the interviewer should respond. Code controls the workflow around the model and computes report aggregates.”
   - **Is OpenRouter the model?** It is the endpoint used to reach the selected model. The model ID is configured separately.
   - **Do you call OpenRouter at startup?** Client construction occurs during imports. The first interviewer invocation shown here happens when an interview is initialized.
   - **Can you claim good scoring from the mock run?** The mock demonstrates the path and output handling. Scoring quality requires an evaluation with a real model.

### Structured model output and Zod

1. **What it is.** Structured output is a model result requested as data with named fields and allowed values. A schema check verifies that the result is shaped as expected. Think of asking for a completed checklist instead of a free-form letter.
2. **The problem it solves.** If a workflow expects a label but receives a paragraph, string comparisons can send the interview down the wrong path or cause an error.
3. **General approaches.** Ask for JSON and parse it, request a tool call with typed arguments, use provider-side schema support, or validate and retry in application code. Shape checks and factual checks are separate.
4. **How SystemIQ implements it.** `backend/src/agents/intent/agent.js:6–13` calls `llmFast.withStructuredOutput(IntentSchema)` and invokes the resulting client. The allowed labels come from `backend/src/agents/intent/schema.js:1–6` and `backend/src/models/InterviewEnums.js:29–37`. `backend/src/agents/problemGenerator/agent.js:38–59` requests a function-call-shaped result for a knowledge bundle, then calls `KnowledgeBundleSchema.parse(...)`. `backend/src/services/mock/llm.js:27–59` supplies fixtures for supported schemas.
5. **Why it is needed HERE.** The interviewer needs a reliable data shape to decide whether the candidate answered a question, asked something or wants to end.
6. **Why this approach, and the alternatives.** A typed shape is easier for code to use than text heuristics. A hand-built classifier could handle predictable phrases quickly, but would need rules or training for ambiguous answers.
7. **Limits and edge cases.** A well-formed label can still be the wrong label. A provider can fail to follow the schema. Report generation uses `JSON.parse` and, when computed stage scores exist, overwrites the generated aggregate scores (`backend/src/services/report/reportGenerator.js:99–126,136–163`). Module 7 compares the exact paths.
8. **See it live.** Run `npm test -- test/mock.test.js` from `backend/`. The checks around `backend/test/mock.test.js:46–51` exercise both mock model clients against their supported schemas.
9. **Interview answer.** “I use structured output for model steps that feed program decisions. Zod defines or checks the expected data. I still treat a valid result as a model prediction, so I separate shape validation from accuracy testing.”
   - **Does the same mechanism produce every response?** No. The interviewer emits text, and classification and custom generation request structured data.
   - **Can a schema prove a score is fair?** It can constrain the output shape or range. It cannot establish scoring quality.
   - **Where do the intent labels come from?** `IntentType` at `backend/src/models/InterviewEnums.js:29–37`.

### LangChain, LangGraph and the interview workflow

1. **What it is.** LangChain gives this app an interface for calling a model. LangGraph runs a workflow made of steps, or nodes, with connections, or edges. State is the data carried between steps, and a conditional edge chooses a next step using that data. Think of a service checklist with instructions to skip an inspection when it is unnecessary.
2. **The problem it solves.** An interview needs more than one model call. It should classify a turn, sometimes evaluate it, and choose a reply using the result. A loose series of calls can make branching and stored progress hard to understand.
3. **General approaches.** Use a simple function with branches, represent the conversation as an explicit state machine, or use a workflow library. A state machine lists allowed stages and how work moves between them.
4. **How SystemIQ implements it.** `backend/agent.js:14–37` creates `new StateGraph(State)` and registers named functions. `backend/agent.js:43–52` starts at `greeting`, and `backend/src/nodes/greetingNode.js:3–13` selects `interviewer` or `input` using `state.interview.started`. `backend/agent.js:59–90` connects the regular turn and conditionally includes `evaluator`. `workflow.compile({ checkpointer })` at lines 92–94 prepares it for execution.
5. **Why it is needed HERE.** The initial greeting and later answers follow different paths. Some turns should skip scoring. Separate functions make each responsibility visible.
6. **Why this approach, and the alternatives.** A simple function would be sufficient for a short, linear chat flow. A graph makes this project's branches explicit and integrates with saved execution state. It adds abstractions that a developer needs to understand.
7. **Limits and edge cases.** These are specialized steps in one controlled workflow. Some steps call a model and some are regular code. Describing every step as an autonomous AI agent would overstate the implementation. The whiteboard component graph is a separate data structure from the workflow graph.
8. **See it live.** Lab C's first initialize call logs `greeting` followed by `interviewer`. Use that observation to explain why an evaluation does not occur before a candidate gives an answer.
9. **Interview answer.** “I use LangChain to access the model and LangGraph to organize the interview. The graph starts with a greeting check, then either asks the first question or processes a candidate turn. Routing rules decide when the evaluator runs.”
   - **Why use two libraries?** The model client and the workflow scheduler solve different problems.
   - **Are all nodes LLM calls?** No. The greeting step shown above is a conditional function.
   - **What decides whether evaluation runs?** The orchestrator sets the next node, and the conditional edge reads it (`backend/agent.js:75–86`).

### Checkpointing and thread IDs

1. **What it is.** A checkpoint is a saved snapshot of workflow state at an execution boundary. A thread ID tells the workflow which conversation's saved state to read or update. Think of saving progress in a game under a particular save slot.
2. **The problem it solves.** If the workflow starts from an empty state on every request, it can greet the same candidate repeatedly and forget their stage.
3. **General approaches.** Pass all state back in every request, reconstruct it from a history of events, or store snapshots under an interview identifier. Snapshots can live in memory or persistent storage.
4. **How SystemIQ implements it.** `backend/src/services/memory.js:9–26` returns `new MemorySaver()` in mock mode. Real mode creates `PostgresSaver.fromConnString(process.env.DATABASE_URL)` and awaits `checkpointer.setup()`. `backend/agent.js:92–94` compiles with that saver. `backend/src/services/interview/interview.service.js:47–62` supplies `configurable: { thread_id: interviewId }`, calls `agent.getState(config)` and returns saved values if the interview has already started.
5. **Why it is needed HERE.** A browser refresh may try to initialize an interview again. The existing state lets it reuse the saved greeting instead of treating the refresh as a new turn.
6. **Why this approach, and the alternatives.** Built-in checkpointing integrates state with workflow execution. Saving a few fields manually could be simpler for a basic chat. Replaying all events gives richer history but requires deliberate replay rules and handling of external calls.
7. **Limits and edge cases.** A checkpoint is separate from the live session and durable report data. A crash can occur between actions in those stores. Snapshots do not prove end-to-end recovery of every write. The memory saver disappears on process restart.
8. **See it live.** Lab C calls initialize twice for the same ID. The second response carries the same reply, and the lab showed no new workflow-step logs for the second call.
9. **Interview answer.** “I attach a checkpointer to the LangGraph workflow and use the interview ID as thread_id. It gives later calls access to the saved workflow state. In mock mode it stays in memory, and in real mode I prepare the PostgreSQL saver before listening.”
   - **Does thread_id mean an operating-system thread?** Here it is a lookup key for a workflow conversation.
   - **Is the saved state the entire Excalidraw drawing?** The interview service passes the derived graph to the workflow. The full scene has a separate session key (`backend/src/services/interview/interview.service.js:68–78`, `backend/src/services/interview/session.service.js:35–49`).
   - **Can a database checkpoint recreate every missing live Redis value?** The service still reads the live session. Its normal request path does not rebuild it from checkpoint data.

### Audio file uploads and speech-to-text

1. **What it is.** An upload sends file bytes to a server. A multipart form wraps those bytes with a field name and file details. Speech-to-text turns audio into written words. Think of giving a recorder's file to a transcription clerk and receiving a typed draft to review.
2. **The problem it solves.** Some candidates explain designs more naturally by speaking. Sending unbounded files or passing raw audio to a text interviewer would make the backend slower and harder to control.
3. **General approaches.** Capture and transcribe speech in the browser, upload audio to a backend that calls a speech service, or stream audio to a live transcription service. A temporary file can be held on disk, in memory or in object storage.
4. **How SystemIQ implements it.** `backend/server.js:35` mounts `/api/voice`. `backend/src/routes/voice.routes.js:15–38,42–59` applies identity and request-budget checks, then `upload.single("audio")` via Multer. It writes one audio file, accepts a reported `audio/` type and limits the file to 10 MiB. `backend/src/controllers/transcribe.controller.js:15–28` calls `transcribeAudio(req.file.path)`, removes the file and returns `{ success: true, transcript }`. `backend/src/services/transcriber.js:10–20` uses `groq.audio.transcriptions.create` with `model: "whisper-large-v3-turbo"` in real mode.
5. **Why it is needed HERE.** The chat can offer speech input while keeping the interviewer conversation text-based. The transcription request returns text that the UI can place in the answer field (`frontend/src/components/ChatPanel.tsx:38–40,112–118`).
6. **Why this approach, and the alternatives.** A single recorded file and one transcription request are straightforward to implement and debug. Live speech streaming could reduce perceived delay and add connection complexity. Browser-side speech recognition would depend on browser support and behavior.
7. **Limits and edge cases.** The file filter checks the supplied media type. It does not deeply inspect the audio bytes. A process crash could leave a temporary file. Mock output is a fixture and says nothing about audio quality. The code constructs the Groq client at import time outside mock mode, and the installed SDK throws on an undefined key (`backend/src/services/transcriber.js:6–8`, `backend/node_modules/groq-sdk/client.mjs:46–58`).
8. **See it live.** Lab D sends a tiny synthetic file in mock mode and receives `200` with a transcript field. The service logs only file and character counts for this operation.
9. **Interview answer.** “I record audio in the browser and upload one bounded file to an Express route. Multer handles the file, and Groq runs Whisper transcription. The backend deletes the temporary file and returns text to the chat interface.”
   - **Is this real-time audio streaming?** This route receives a recorded file and returns a transcription result.
   - **Does it send the candidate's answer to the interviewer automatically?** The voice endpoint only returns the transcription. The chat's send operation is separate.
   - **Why run identity and rate checks before upload?** The app can reject unwanted requests before processing file bytes.

### Health checks, timeouts and retries

1. **What it is.** A health check tests a small set of conditions needed for service operation. A timeout is a bound on how long a caller waits. A retry repeats a failed operation under some policy. Think of calling a colleague before a meeting, waiting a fixed time for an answer and trying again only when it makes sense.
2. **The problem it solves.** A process can be alive while a dependency is broken. A health endpoint that waits indefinitely on that dependency gives an operator little information when it is needed most.
3. **General approaches.** Use a lightweight process check, check essential dependencies for readiness, and probe complete user journeys separately. Retry brief failures with limits and increasing delays where safe. Avoid repeating side effects when a request may have already succeeded.
4. **How SystemIQ implements it.** `backend/src/routes/health.routes.js:27–39` races the operation against a 3-second timer using `Promise.race`. `backend/src/routes/health.routes.js:69–95` runs `redis.ping()` and a PostgreSQL `SELECT 1` in parallel and returns `200` when both pass or `503` otherwise. In mock mode `Promise.resolve()` stands in for the SQL query. `backend/src/services/llm.js:18–19,31–32` configures a default 30-second model request timeout and up to two library retries. The health check itself makes one attempt per dependency.
5. **Why it is needed HERE.** A hosting health probe needs a quick signal when the live data store or workflow database is unreachable. The model client needs a separate bound appropriate to longer generation requests.
6. **Why this approach, and the alternatives.** Two small probes are cheaper than running a whole paid interview turn. A simple uptime probe is fast and would miss broken dependencies. A complete synthetic interview could catch more failures but would consume service capacity and require safe test data.
7. **Limits and edge cases.** The race ends the caller's wait. The code does not cancel the losing Redis or SQL operation. The probe does not verify OpenRouter, Groq or Supabase Auth. The reported Postgres check uses a separately initialized pool (`backend/src/routes/health.routes.js:8–21`). Model-call timeout configuration alone does not set a total request deadline for a whole interview turn.
8. **See it live.** Lab A returned `200` and `ok: true` for both checks. The mock “postgres” result came from the resolved placeholder. `backend/test/startup.test.js:24–31` verifies that behavior without environment files.
9. **Interview answer.** “My health endpoint checks Redis and the configured PostgreSQL database in parallel. Each check has a three-second wait limit. It returns 503 if either fails. The result tells me about those two probes, and I would check the provider paths separately.”
   - **If /health is green, can a real interview fail?** Yes. A model, Auth or transcription call can still fail.
   - **Does Promise.race abort SQL?** No. It settles the result the handler waits on. The source has no cancellation hook for the underlying query.
   - **Why not retry every failure?** Repeated calls add load and latency. Repeating an operation that already took effect can create duplicates if the operation is not designed for it.

## Backend folder map

| Location | First file to open | Responsibility |
| --- | --- | --- |
| `backend/` | `backend/server.js:16–67` | Build the HTTP app, register routes and start the listener. `backend/agent.js:14–95` builds the interview workflow. |
| `src/config/` | `backend/src/config/env.js:5–8` | Read settings and construct dependency clients. `backend/src/config/paths.js:8–20` defines directories for data and files. |
| `src/routes/` | `backend/src/routes/interview.routes.js:129–181` | Match HTTP methods and paths and select per-route checks and handlers. |
| `src/middleware/` | `backend/src/middleware/auth.js:4–48` | Check identity, ownership, input and request budgets, and add request context. |
| `src/controllers/` | `backend/src/controllers/initializeInterview.controller.js:4–18` | Connect HTTP data to a service operation. `backend/src/controllers/interview.controller.js:5–11` initializes the shared workflow. |
| `src/services/` | `backend/src/services/interview/interview.service.js:45–99` | Application operations, including interviews, saved state, report generation and model calls. |
| `src/nodes/` | `backend/src/nodes/greetingNode.js:1–15` | One function per named workflow step. |
| `src/agents/` | `backend/src/agents/interviewer/agent.js:1–25` | Prompts, output schemas and wrappers around model calls. |
| `src/state.js` and `src/models/` | `backend/src/state.js:1`, `backend/src/models/InterviewEnums.js:1` | Data shared by workflow steps and named interview decisions or intents. |
| `src/knowledge/` | `backend/src/knowledge/url_shortener/problem.json:1`, `backend/src/services/knowledgeLoader.js:1` | Built-in problem descriptions, stage guidance, evaluation criteria and reference designs. |
| `src/observability/` and `src/utils/` | `backend/src/observability/http.js:11–27`, `backend/src/utils/logger.js:53–65` | Timing, log context, measurements and shared helpers. |
| `src/services/mock/` | `backend/src/services/mock/dev.js:1–3` | Select offline substitutes for the dependencies. |
| `test/` | `backend/test/startup.test.js:17–31` | Automated checks for startup and other behavior. |
| `scripts/` and `evals/` | `backend/package.json:14–15` | Commands to check the built-in problem files and assess model behavior. We will examine those commands later. |

## How the backend boots

1. **Choose how to run.** `backend/package.json:8–10` uses `nodemon server.js` for development or `node src/services/mock/dev.js` offline. The mock launcher sets the flag before importing the server.
2. **Load settings and evaluate imports.** `backend/server.js:1–14` loads `env.js` and the route dependencies. Several clients are built during evaluation. Redis creates a client, Supabase creates its client, the LLM checks for an API key in real mode, and the Groq SDK constructs its client. `backend/src/config/redis.js:8–16`, `backend/src/config/supabase.js:5–8`, `backend/src/services/llm.js:21–39`, `backend/src/services/transcriber.js:6–8`.
3. **Assemble the HTTP application.** Express gets request IDs, timing, CORS and its JSON reader in that order. Then it mounts `/metrics`, `/health`, voice, report, interview, history and problem routes. The final handler receives request errors that reach it. `backend/server.js:16–48`.
4. **Prepare saved workflow state and compile the interviewer.** The entry point calls `startServer`, which awaits `initializeAgent`. That function prepares the checkpointer and calls `buildAgent`. In real mode, `checkpointer.setup()` runs here. In mock mode, the saver is in memory. `backend/server.js:52–67`, `backend/src/controllers/interview.controller.js:7–11`, `backend/src/services/memory.js:9–26`, `backend/agent.js:92–94`.
5. **Start accepting HTTP.** `app.listen` binds the configured port after the agent is ready. A failure during the awaited startup step is logged and exits with code 1. `backend/server.js:50–62`.
6. **Check live dependencies separately.** `/health` probes Redis and the configured PostgreSQL connection. Startup itself does not explicitly ping Redis or verify live model responses. `backend/src/routes/health.routes.js:69–95`.

**Interview distinction.** “Client initialized” means the app constructed the object it will use to talk to a service. “Dependency checked” means a request to that service succeeded. “User journey verified” means the steps from the browser through the required services actually worked.

## Architecture in ASCII

```text
Browser
  |-- sign in ---------------------------------------> Supabase Auth
  |-- choose problem / text / diagram / report reads
  v
Express HTTP app
  |-- resolve access credential ---------------------> Supabase Auth
  |-- voice route -> Multer -> transcriber ----------> Groq Whisper
  |-- session and graph services --------------------> Upstash Redis
  |-- history and report storage --------------------> Supabase / PostgreSQL
  |
  +-- InterviewService
        |
        v
      LangGraph workflow
        |-- role-specific model calls via LangChain -> OpenRouter -> model
        +-- checkpointer ---------------------------> PostgreSQL
```

The sign-in path is `frontend/src/services/auth.service.ts:21–35`. Mounts and dispatch are in `backend/server.js:33–39` and `backend/src/controllers/initializeInterview.controller.js:8–18`. Provider calls and storage paths are in `backend/src/middleware/auth.js:28–46`, `backend/src/services/transcriber.js:10–20`, `backend/src/services/interview/session.service.js:143–157`, `backend/src/services/interview/persistence.service.js:34–67,211–246`, `backend/src/services/llm.js:25–46` and `backend/src/services/memory.js:18–26`.

Before graph sync, the browser converts the Excalidraw drawing into components and connections (`frontend/src/components/excalidraw/converter.ts:29–87`). The service stores the full drawing separately (`backend/src/services/interview/session.service.js:35–49,317–364`). The interviewer gets the derived graph through `backend/src/services/interview/interview.service.js:68–78,122–154`. Voice transcription is a separate Express branch, which supplies text for the candidate's answer. It does not run inside the LangGraph workflow.

## Mock lab

These commands assume PowerShell and installed dependencies. Use a separate terminal to keep the mock server running. `5017` is an isolated port used for this lesson. If it is occupied, use another port and change the URLs below. In the second terminal, set `$base = 'http://127.0.0.1:5017'` once.

### Lab A — Startup, health, request ID and CORS

```powershell
# Terminal 1, from the repository root
Set-Location backend
$env:PORT = '5017'
$env:CORS_ORIGINS = 'http://localhost:5173'
$env:NODE_ENV = 'test'
npm run dev:mock
```

```powershell
# Terminal 2
$base = 'http://127.0.0.1:5017'
curl.exe -i -H 'X-Request-Id: orientation-health' -H 'Origin: http://localhost:5173' "$base/health"
curl.exe -i -H 'Origin: http://outside.example' "$base/health"
```

Observed startup messages, in order, were `In-memory Redis initialized`, `LangGraph agent initialized`, and `Server started` with `port:5017`. The first request returned `200`, `X-Request-Id: orientation-health`, `Access-Control-Allow-Origin: http://localhost:5173` and a JSON body with `status: "ok"` and both checks marked `ok: true`. The second still returned `200` from the terminal and had no allow-origin header. The log recorded `event: "http.request"` and the supplied request ID.

### Lab B — Resource reads and early failures

```powershell
(Invoke-RestMethod "$base/api/problems").Count
(Invoke-RestMethod "$base/api/problems/url_shortener").title
curl.exe -i "$base/api/history"
curl.exe -i -H 'Content-Type: application/json' --data-binary '{' "$base/api/interview/start"
```

The list returned `200` with eight built-in entries, and the detail call returned `200` with a title. History without an identity returned `401` with `"Missing Authorization Header"`. The malformed body returned `400` with `"Invalid request"`, before reaching the route's checks. The matching completion event used the `unmatched` route label because the parser stopped the call first.

### Lab C — Start, owner check, first greeting and history

```powershell
$mock = @{ Authorization = 'Bearer mock-token-orientation-student' }
$start = @{ problemId = 'url_shortener'; difficulty = 'SDE1' } | ConvertTo-Json -Compress
$created = Invoke-RestMethod "$base/api/interview/start" -Method Post -Headers $mock -ContentType 'application/json' -Body $start -ResponseHeadersVariable startHeaders
$id = $created.interviewId
$startHeaders['X-RateLimit-Limit']

curl.exe -s -o NUL -w '%{http_code}\n' -H 'Authorization: Bearer mock-token-orientation-student' "$base/api/interview/state/$id"
curl.exe -s -o NUL -w '%{http_code}\n' -H 'Authorization: Bearer mock-token-orientation-other' "$base/api/interview/state/$id"

$init = @{ interviewId = $id } | ConvertTo-Json -Compress
$trace = $mock + @{ 'X-Request-Id' = 'orientation-greeting' }
$first = Invoke-RestMethod "$base/api/interview/initialize" -Method Post -Headers $trace -ContentType 'application/json' -Body $init
$second = Invoke-RestMethod "$base/api/interview/initialize" -Method Post -Headers $mock -ContentType 'application/json' -Body $init
$first.reply -eq $second.reply
(Invoke-RestMethod "$base/api/history" -Headers $mock).Count
```

Use the supplied synthetic identities only with the offline backend. Observed results were start `200` with a new ID and budget header `10`, owner `200`, other user `404`, initialize `200` with a reply, second initialize `200` with the same reply, and history `200` with one interview in a fresh process. Watch the logs in Terminal 1. Here are selected fields from the first initialization, with measured timings omitted.

```text
requestId=orientation-greeting  event=graph.node    node=greeting     outcome=success
requestId=orientation-greeting  event=graph.node    node=interviewer  outcome=success
requestId=orientation-greeting  event=http.request method=POST       status=200
```

Try the same start body with `difficulty = 'beginner'` to see the schema reject valid JSON with invalid data. If the request budget is exhausted, wait for the next bucket before comparing the responses.

### Lab D — Offline voice branch

```powershell
@'
const form = new FormData();
form.set("audio", new Blob([new Uint8Array([0, 1, 2])], { type: "audio/webm" }), "sample.webm");
const response = await fetch("http://127.0.0.1:5017/api/voice/transcribe", {
    method: "POST",
    headers: { Authorization: "Bearer mock-token-orientation-student" },
    body: form
});
const result = await response.json();
console.log({ status: response.status, hasTranscript: typeof result.transcript === "string" });
'@ | node --input-type=module
```

Observed `200` with `success` and `transcript` fields. The bytes are synthetic. Multer handles the file, and the substitute returns fixture text. The terminal example only prints whether the result includes text.

To try the browser offline, use the default mock backend port 5000 or set `VITE_API_URL` to the lab backend address before running `npm run dev:mock` in `frontend/`. Use `http://localhost:5173` with the lab's origin setting. `frontend/package.json:13` selects Vite's mock mode. Stop the lab server with Ctrl+C when finished.

## Verification on 11 November 2026

| Check | Observed result |
| --- | --- |
| Backend `npm test` | 17 test files, 199 tests passed. |
| Frontend `npm run lint` and `npx tsc -b` | Both passed. |
| Frontend `npm test -- --maxWorkers=2` | 36 test files, 249 tests passed. |
| Frontend `npm run build` | Passed with a large-chunk warning. The build output went to a temporary directory. |
| Browser test suite | `frontend/e2e` is absent. |

This lesson used the local mock backend and synthetic requests. Real provider behavior was outside the lab. The mock server was stopped and `git status --short --untracked-files=all` showed only `?? learning/00-orientation.md`. No temporary source edits were needed.

## Five-question quiz

Answer in your own words. Use the file or function name when you trace code. A few sentences per answer are enough.

1. **Define it.** Explain client, server, HTTP method and status code using the `POST /api/interview/start` exchange. Which status does the current code send on success?
2. **Trace it.** Starting with `npm run dev:mock`, name the files and functions that lead to `app.listen`. Where does the app choose the in-memory workflow saver, and when does it compile the workflow?
3. **What breaks if…** The frontend moves from `localhost:5173` to `localhost:5174`, with no change to `CORS_ORIGINS`. Why might the browser be unable to read a response while curl still gets `200`? Would adding the new origin authorize a user to read another user's interview?
4. **Trace it.** A different signed-in user requests the owner's `/api/interview/state/:interviewId`. What does authentication establish, what does the ownership guard read, and why do we get `404` instead of `401`?
5. **What breaks if…** `/health` returns `200` and a real user's first interview question fails. Name two services the endpoint did not test, and explain what the Postgres check actually does in mock mode.

After you answer, I’ll score each response, explain missing or incorrect details, and wait for you to type `next` before Module 1.
