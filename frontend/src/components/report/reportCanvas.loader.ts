export const loadReportCanvas = () => import("./ReportCanvas");

export async function prepareReportPrint() {
    await loadReportCanvas();
    // Allow the Suspense boundary and its styles to commit before printing.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}
