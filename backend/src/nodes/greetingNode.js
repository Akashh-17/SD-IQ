export async function greetingNode(state) {

    if (!state.interview.started) {

        return {
            nextNode: "interviewer"
        };

    }

    return {
        nextNode: "input"
    };

}