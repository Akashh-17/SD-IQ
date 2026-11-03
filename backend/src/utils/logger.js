import fs from "fs";
import path from "path";
import util from "util";

const LOG_FILE = path.join(process.cwd(), "sample.txt");

// Clear the file whenever the server starts
fs.writeFileSync(LOG_FILE, "");

export function log(section, data = null) {

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

    fs.appendFileSync(LOG_FILE, output);
}

export function separator(title = "") {

    const output = `

######################################################################
######################## ${title} ########################
######################################################################

`;

    fs.appendFileSync(LOG_FILE, output);
}