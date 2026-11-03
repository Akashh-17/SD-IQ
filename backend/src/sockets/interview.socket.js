import {
  runAgent,
  agent,
} from "../controllers/interview.controller.js";
import { SessionService } from "../services/interview/session.service.js";
import { GraphService } from "../services/graph/graph.service.js";


export async function interviewSocket(socket) {
  let interviewId = null;

  console.log("User connected:", socket.id);

  // ============================================================
  // FRONTEND READY
  // ============================================================

  setImmediate(async () => {
    await initializeInterview();
  });

  // ============================================================
  // INITIALIZE / RESTORE
  // ============================================================

  async function initializeInterview() {

    console.log("INITIALIZE INTERVIEW");

    try {

      const state = await agent.getState({

        configurable: {

          thread_id: interviewId

        }

      });

      console.log("STATE:", state?.values?.interview);

      const interview = state?.values?.interview;

      if (!interview?.started) {

        console.log("RUNNING INITIAL GREETING");

        await runAgent(

          socket,

          {

            interview: {

              interviewId

            }

          }

        );

        return;

      }

      console.log("RESTORING INTERVIEW");

      const lastMessage = state.values.messages?.at(-1);

      if (lastMessage?.content) {

        socket.emit(

          "ai_question",

          lastMessage.content

        );

      }

    }

    catch (err) {

      console.log("NEW SESSION");

      await runAgent(

        socket,

        {

          interview: {

            interviewId

          }

        }

      );

    }

  }

  // ============================================================
  // USER MESSAGE
  // ============================================================

  socket.on("user_message", async (text) => {

    if (!text?.trim()) return;

    await runAgent(

      socket,

      {

        lastUserText: text

      }

    );

    const session = await SessionService.get(

      interviewId

    );

    if (session?.report) {

      socket.emit(

        "interview_completed",

        {

          interviewId

        }

      );

    }

  });

  // ============================================================
  // GRAPH UPDATE
  // ============================================================

  socket.on("graph_update", async (graph) => {

    await GraphService.update(

      interviewId,

      graph

    );

    console.log(

      "[GRAPH UPDATED]",

      graph.nodes.length,

      "nodes"

    );

    GraphService.scheduleAnalysis(

      interviewId,

      async () => {

        console.log(

          "[GRAPH ANALYSIS STARTED]"

        );

        await runAgent(socket, {

          graphOnly: true

        });

      }

    );

  });

  // ============================================================
  // DISCONNECT
  // ============================================================

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

  });

}