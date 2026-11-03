import LogoMark from "./LogoMark";

export default function Logo() {

    return (

        <div className="flex items-center gap-3">

            <LogoMark />

            <h1 className="text-2xl font-bold tracking-tight">

                <span className="text-white">

                    System

                </span>

                <span className="text-[#F5B301]">

                    IQ

                </span>

            </h1>

        </div>

    );

}