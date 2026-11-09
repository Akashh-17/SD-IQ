import { useState, type Ref } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button, Input } from "../ui";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    error?: string;
    signup?: boolean;
    disabled?: boolean;
    inputRef?: Ref<HTMLInputElement>;
}

export default function PasswordField({ value, onChange, onBlur, error, signup, disabled, inputRef }: Props) {
    const [visible, setVisible] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    return <div className="space-y-2">
        <label htmlFor="auth-password" className="block text-sm font-medium">Password</label>
        <div className="relative">
            <Input ref={inputRef} id="auth-password" name="password" icon={LockKeyhole} type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"} required disabled={disabled} value={value}
                onChange={event => onChange(event.target.value)} onBlur={() => { setCapsLock(false); onBlur(); }}
                onKeyDown={event => setCapsLock(event.getModifierState("CapsLock"))}
                onKeyUp={event => setCapsLock(event.getModifierState("CapsLock"))}
                aria-describedby={capsLock ? "auth-caps-lock" : undefined} error={error}
                hint={signup ? "At least 8 characters. Make it something only you know." : undefined} className="pr-14" />
            <Button variant="ghost" size="icon" disabled={disabled} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}
                onClick={() => setVisible(current => !current)} className="absolute right-0.5 top-0.5 !h-11 !w-11">
                {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </Button>
        </div>
        <p id="auth-caps-lock" role="status" aria-live="polite" className="min-h-4 text-xs text-warning">{capsLock ? "Caps Lock is on." : ""}</p>
    </div>;
}
