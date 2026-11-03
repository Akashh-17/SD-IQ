import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signIn, getCurrentUser } from "../services/auth.service";
import { Mail, Lock, Sparkles } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {

        async function check() {

            const user = await getCurrentUser();

            if (user) {

                navigate("/dashboard");

            }

        }

        check();

    }, [navigate]);

    async function handleLogin() {

        setError("");

        setLoading(true);

        try {

            await signIn(email, password);

            navigate("/dashboard");

        }

        catch (err: any) {

            setError(

                err.message ||

                "Login failed"

            );

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="card w-full max-w-md overflow-hidden p-8"
            >
                <span className="eyebrow">
                    <Sparkles size={13} className="text-amber-400" />
                    Welcome Back
                </span>

                <h2 className="mb-2 mt-4 font-display text-3xl font-bold text-white">
                    Sign in
                </h2>

                <p className="mb-8 text-white/60">
                    Continue your SystemIQ interview journey.
                </p>

                <div className="space-y-5">

                    <Input
                        icon={Mail}
                        placeholder="Email"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        icon={Lock}
                        type="password"
                        placeholder="Password"
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                            {error}
                        </div>
                    )}

                    <Button
                        loading={loading}
                        disabled={!email || !password}
                        onClick={handleLogin}
                    >
                        Sign In
                    </Button>

                    <p className="text-center text-sm text-white/50">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-amber-400 transition hover:text-amber-300"
                        >
                            Create Account
                        </Link>
                    </p>

                </div>

            </motion.div>
        </AuthLayout>

    );

}