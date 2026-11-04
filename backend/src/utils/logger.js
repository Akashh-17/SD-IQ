import fs from "fs";
import util from "util";

import { LOG_FILE } from "../config/paths.js";

// Debug log of agent activity, written to backend/sample.txt.
// The file is cleared on every server start.
// A write stream appends in order without blocking the event loop
// (appendFileSync paused every request while it wrote).
// Set LOG_TO_FILE=false to turn it off, e.g. in production.
const enabled = process.env.LOG_TO_FILE !== "false";

const stream = enabled

    ? fs.createWriteStream(LOG_FILE, { flags: "w" })

    : null;

function write(output) {

    stream?.write(output);

}

export function log(section, data = null) {

    if (!enabled) return;

    const timestamp = new Date().toLocaleTimeString();

    let output = "";

    output += "\n";
    output += "============================================================\n";
    output += `[${timestamp}] ${section}\n`;
    output += "============================================================\n";

    if (typeof data === "string") {

        output += data + "\n";

    } else if (data !== null) {

        output += util.inspect(data, {
            depth: null,
            colors: false,
            compact: false,
            breakLength: 120
        });

        output += "\n";
    }

    write(output);
}

export function separator(title = "") {

    write(`

######################################################################
######################## ${title} ########################
######################################################################

`);
}
