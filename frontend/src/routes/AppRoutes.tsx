import { Routes, Route } from "react-router-dom";
import { lazy, Suspense, type ComponentType } from "react";
import RouteLoader from "../components/layout/RouteLoader";
// Keep the public hero in the entry to avoid an extra first-paint waterfall.
import LandingPage from "../pages/LandingPage.tsx";

// The page and guard load together. ProtectedRoute still authenticates before
// mounting the page, avoiding a guard -> auth -> page download waterfall.
function protectedPage(load: () => Promise<{ default: ComponentType }>) {
    return lazy(async () => {
        const [{ default: Page }, { default: Guard }] = await Promise.all([
            load(), import("../components/ProtectedRoute.tsx")
        ]);
        return { default: function ProtectedPage() { return <Guard><Page /></Guard>; } };
    });
}
const Login = lazy(() => import("../pages/Login"));
const Signup = lazy(() => import("../pages/Signup"));
const Dashboard = protectedPage(() => import("../pages/Dashboard"));
const Interview = protectedPage(() => import("../pages/Interview"));
const ReportPage = protectedPage(() => import("../pages/ReportPage"));
const ProblemPage = protectedPage(() => import("../pages/ProblemPage"));
const HistoryPage = protectedPage(() => import("../pages/HistoryPage"));
const ProgressPage = protectedPage(() => import("../pages/ProgressPage"));
const DesignPage = import.meta.env.DEV ? lazy(() => import("../pages/DesignPage")) : null;

export default function AppRoutes() {
    return <Suspense fallback={<RouteLoader />}><Routes>
        {DesignPage && <Route path="/design" element={<DesignPage />} />}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/problems" element={<ProblemPage />} />
        <Route path="/interview/:interviewId" element={<Interview />} />
        <Route path="/report/:interviewId" element={<ReportPage />} />
    </Routes></Suspense>;
}
