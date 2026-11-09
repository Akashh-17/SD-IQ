import { Navigate } from "react-router-dom";
import { useEffect, useState, type JSX } from "react";
import { getCurrentUser } from "../services/auth.service";
import RouteLoader from "./layout/RouteLoader";

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

        return <RouteLoader />;

    }

    if (!authenticated) {

        return <Navigate to="/" replace />;

    }

    return children;

}
