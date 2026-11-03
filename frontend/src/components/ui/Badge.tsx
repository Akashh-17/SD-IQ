interface Props{

    children:React.ReactNode;

    color?:
    |"green"
    |"amber"
    |"red";
}

export default function Badge({

    children,

    color="green"

}:Props){

    const styles={

        green:
        "bg-emerald-500/10 text-emerald-300",

        amber:
        "bg-amber-500/10 text-amber-300",

        red:
        "bg-red-500/10 text-red-300"

    }

    return(

        <span
        className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${styles[color]}
        `}
        >

            {children}

        </span>

    )

}