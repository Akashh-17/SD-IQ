import axios from "axios";

// HTTP status of a failed axios request, if any
export function errorStatus(err: unknown): number | undefined {

    return axios.isAxiosError(err) ? err.response?.status : undefined;

}

// A message the candidate can act on, instead of one generic error
export function describeApiError(err: unknown): string {

    switch (errorStatus(err)) {

        case 400:
            return "That message couldn't be sent. Please keep it under 4,000 characters.";

        case 401:
            return "Your session has expired. Please log in again.";

        case 404:
            return "This interview is no longer active.";

        case 429:
            return "You're sending messages too quickly. Please wait a moment and try again.";

        case undefined:
            return "Can't reach the server. Check your connection and try again.";

        default:
            return "The AI interviewer hit a problem. Please try sending that again.";

    }

}
