import clsx from "clsx";
import { LoaderCircle } from "lucide-react";

interface Props {
    children: React.ReactNode;
    loading?: boolean;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: "button" | "submit";
}

export default function Button({
    children,
    loading,
    className,
    disabled,
    onClick,
    type = "button",
}: Props) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            className={clsx(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl",
                "bg-amber-500 text-black font-semibold",
                "transition-all duration-300",
                "hover:bg-amber-400 hover:scale-[1.02]",
                "disabled:opacity-50 disabled:hover:scale-100",
                className
            )}
        >
            {loading && (
                <LoaderCircle className="animate-spin" size={18} />
            )}

            {children}
        </button>
    );
}