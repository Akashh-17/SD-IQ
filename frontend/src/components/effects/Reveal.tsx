import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function Reveal({children}: {children: ReactNode}){

return(

<motion.div

initial={{

opacity:0,
y:80

}}

whileInView={{

opacity:1,
y:0

}}

viewport={{

once:true

}}

transition={{

duration:.8

}}

>

{children}

</motion.div>

)

}