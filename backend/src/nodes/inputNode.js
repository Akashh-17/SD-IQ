import { log } from "../utils/logger.js";   

export async function inputNode(state) {

    log("USER", state.candidate.latestMessage);

    return {};

}