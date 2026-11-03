import type { ReactNode } from "react";

interface Props{
    children:ReactNode;
    className?:string;
}

export default function Card({
    children,
    className=""
}:Props){

    return(

        <div
            className={`
            rounded-3xl
            border
            border-white/10
            bg-[#111827]
            p-6
            shadow-xl
            transition-all
            duration-300
            hover:border-amber-400/30
            hover:-translate-y-1
            ${className}
            `}
        >

            {children}

        </div>

    )

}