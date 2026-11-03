interface Props {

    title: string;

    subtitle: string;

}

export default function SectionTitle({

    title,

    subtitle

}: Props) {

    return (

        <div>

            <h1
                className="
text-4xl
font-bold
tracking-tight
text-white
">

                {title}

            </h1>

            <p
                className="
mt-2
text-gray-400
">

                {subtitle}

            </p>

        </div>

    )

}