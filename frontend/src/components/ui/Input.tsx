import type { LucideIcon } from "lucide-react";

interface Props {
    icon: LucideIcon;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string;
}

export default function Input({
    icon: Icon,
    type = "text",
    placeholder,
    value,
    onChange,
    autoComplete,
}: Props) {
    return (
        <div className="relative">
            <Icon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                type={type}
                placeholder={placeholder}
                className="
                h-12
                w-full
                rounded-xl
                border
                border-white/10
                bg-[#1A2234]
                pl-11
                pr-4
                text-white
                placeholder:text-gray-500
                outline-none
                transition-all
                duration-300
                focus:border-amber-500
                focus:ring-2
                focus:ring-amber-500/20
                "
            />
        </div>
    );
}