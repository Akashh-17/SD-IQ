import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Interview from "../pages/Interview";
import ReportPage from "../pages/ReportPage";
import ProblemPage from "../pages/ProblemPage";
import ProtectedRoute from "../components/ProtectedRoute.tsx";
import HistoryPage from "../pages/HistoryPage.tsx";
import ProgressPage from "../pages/ProgressPage.tsx";
import LandingPage from "../pages/LandingPage.tsx";

export default function AppRoutes() {

    return (

        <Routes>

            <Route

                path="/"

                element={<LandingPage />}

            />

            <Route

                path="/login"

                element={<Login />}

            />

            <Route
                path="/history"

                element={

                    <ProtectedRoute>

                        <HistoryPage />

                    </ProtectedRoute>

                }

            />

            <Route
                path="/progress"

                element={
                    <ProtectedRoute>
                        <ProgressPage />
                    </ProtectedRoute>
                }

            />
                
            <Route

                path="/problems"

                element={

                    <ProtectedRoute>

                        <ProblemPage />

                    </ProtectedRoute>

                }

            />

            <Route

                path="/signup"

                element={<Signup />}

            />

            <Route

                path="/dashboard"

                element={

                    <ProtectedRoute>

                        <Dashboard />

                    </ProtectedRoute>

                }

            />

            <Route

                path="/interview/:interviewId"

                element={

                    <ProtectedRoute>

                        <Interview />

                    </ProtectedRoute>

                }

            />

            <Route

                path="/report/:interviewId"

                element={

                    <ProtectedRoute>

                        <ReportPage />

                    </ProtectedRoute>

                }

            />

        </Routes>

    );

}