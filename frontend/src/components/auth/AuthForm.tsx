import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, signIn, signUp } from "../../services/auth.service";
import { authConfigurationError } from "../../lib/supabase";
import { Badge, Button, Card, Input } from "../ui";
import { Reveal } from "../../motion";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";
import { authErrorMessage, validateAuth, type AuthMode } from "./auth.validation";

export default function AuthForm({ mode }: { mode: AuthMode }) {
    const navigate = useNavigate();
    const signup = mode === "signup";
    const [checking, setChecking] = useState(!authConfigurationError);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [touched, setTouched] = useState({ email: false, password: false });
    const [loading, setLoading] = useState<AuthMode | "demo" | null>(null);
    const [error, setError] = useState("");
    const [confirmation, setConfirmation] = useState(false);
    const emailInput = useRef<HTMLInputElement>(null);
    const passwordInput = useRef<HTMLInputElement>(null);
    const pending = useRef(false);
    const mounted = useRef(true);
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL?.trim();
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
    const hasDemo = !authConfigurationError && Boolean(demoEmail && demoPassword?.trim());
    const errors = validateAuth(mode, email, password);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        if (authConfigurationError) return;
        let active = true;
        getCurrentUser().then(user => {
            if (!active) return;
            if (user) navigate("/dashboard", { replace: true });
            else setChecking(false);
        }).catch(() => { if (active) setChecking(false); });
        return () => { active = false; };
    }, [navigate]);

    async function authenticate(kind: AuthMode | "demo") {
        if (authConfigurationError || pending.current || checking) return;
        if (kind !== "demo") {
            setTouched({ email: true, password: true });
            if (errors.email || errors.password) {
                (errors.email ? emailInput : passwordInput).current?.focus();
                return;
            }
        } else if (!hasDemo) return;

        pending.current = true;
        setError("");
        setLoading(kind);
        try {
            const result = kind === "signup"
                ? await signUp(email.trim(), password)
                : await signIn(kind === "demo" ? demoEmail! : email.trim(), kind === "demo" ? demoPassword! : password);
            if (!mounted.current) return;
            if (kind === "signup" && !result.session) {
                setPassword("");
                setConfirmation(true);
            } else if (result.session) {
                setPassword("");
                navigate("/dashboard", { replace: true });
            } else {
                setError(authErrorMessage(null, kind));
            }
        } catch (failure: unknown) {
            if (mounted.current) setError(authErrorMessage(failure, kind));
        } finally {
            pending.current = false;
            if (mounted.current) setLoading(null);
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void authenticate(mode);
    }

    return <AuthLayout>
        {checking ? <div role="status" className="auth-status-placeholder"><p className="section-kicker mb-4">Your workspace</p><p className="text-sm text-muted">Checking your session…</p></div>
            : confirmation ? <Reveal>
                <Badge mono tone="success"><Check size={12} aria-hidden="true" />One more step</Badge>
                <h1 className="mb-4 mt-6 text-h2">Check your inbox.</h1>
                <p className="mb-7 text-sm leading-relaxed text-muted">If this address can be registered, a confirmation link is on its way. Follow that link, then come back to sign in.</p>
                <Button fullWidth onClick={() => navigate("/login", { replace: true })}>Back to sign in<ArrowRight size={16} aria-hidden="true" /></Button>
            </Reveal>
            : <Reveal>
                <p className="section-kicker mb-5">Your SystemIQ workspace</p>
                <h1 className="text-h2">{signup ? "Create your account." : "Welcome back."}</h1>
                <p className="mb-8 mt-3 text-sm leading-relaxed text-muted">{signup ? "A space to practice, explore, and improve your system design thinking." : "Pick up the conversation. Your next iteration is waiting."}</p>
                <form noValidate onSubmit={submit} aria-label={signup ? "Create account" : "Sign in"} aria-busy={loading !== null} className="space-y-5">
                    <Input ref={emailInput} id="auth-email" name="email" type="email" inputMode="email" label="Email address" icon={Mail} autoComplete="username" autoCapitalize="none" spellCheck={false} required
                        value={email} disabled={Boolean(authConfigurationError) || loading !== null} placeholder="you@example.com" error={touched.email ? errors.email : undefined}
                        onBlur={() => setTouched(current => ({ ...current, email: true }))} onChange={event => { setEmail(event.target.value); setError(""); }} />
                    <PasswordField inputRef={passwordInput} signup={signup} value={password} disabled={Boolean(authConfigurationError) || loading !== null} error={touched.password ? errors.password : undefined}
                        onBlur={() => setTouched(current => ({ ...current, password: true }))} onChange={value => { setPassword(value); setError(""); }} />
                    {(authConfigurationError || error) && <Card role="alert" className="!border-danger/30 !bg-danger/5 p-3.5 text-sm leading-relaxed text-danger">{authConfigurationError || error}</Card>}
                    <Button type="submit" fullWidth loading={loading === mode} disabled={Boolean(authConfigurationError) || loading !== null}>
                        {loading === mode ? signup ? "Creating account…" : "Signing in…" : signup ? "Create account" : "Sign in"}<ArrowRight size={16} aria-hidden="true" />
                    </Button>
                    {hasDemo && <Button variant="secondary" fullWidth loading={loading === "demo"} disabled={loading !== null} onClick={() => void authenticate("demo")}><Play size={14} aria-hidden="true" />{loading === "demo" ? "Opening demo…" : "Try the demo"}</Button>}
                </form>
                <p className="mt-7 text-center text-sm text-muted">{signup ? "Already have an account?" : "New to SystemIQ?"}{" "}<Link to={signup ? "/login" : "/signup"} className="inline-flex min-h-11 items-center rounded-sm font-medium text-accent underline-offset-4 hover:underline">{signup ? "Sign in" : "Create an account"}</Link></p>
            </Reveal>}
    </AuthLayout>;
}
