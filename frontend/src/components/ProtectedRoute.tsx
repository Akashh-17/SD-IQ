import { Navigate } from "react-router-dom";
import { useEffect, useState, type JSX } from "react";
import { getCurrentUser } from "../services/auth.service";

type Props = {
    children: JSX.Element;
};

export default function ProtectedRoute({ children }: Props) {

    const [loading, setLoading] = useState(true);

    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {

        async function checkAuth() {

            const user = await getCurrentUser();

            setAuthenticated(!!user);

            setLoading(false);

        }

        checkAuth();

    }, []);

    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">

                Loading...

            </div>

        );

    }

    if (!authenticated) {

        return <Navigate to="/" replace />;

    }

    return children;

}