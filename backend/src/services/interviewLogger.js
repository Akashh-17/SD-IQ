export function logInterviewStep(title, data) {

    console.log("\n");

    console.log("===================================");

    console.log(title);     

    console.log("-----------------------------------");

    console.dir(data, { depth: null });

    console.log("===================================");

}