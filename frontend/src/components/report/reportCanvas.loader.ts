export const loadReportCanvas = () => import("./ReportCanvas");

export async function prepareReportPrint() {
    await loadReportCanvas();
    // Wait (up to 3s) for the whiteboard SVG to be drawn before printing.
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && !document.querySelector("[data-report-whiteboard][data-ready='true']")) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
}
