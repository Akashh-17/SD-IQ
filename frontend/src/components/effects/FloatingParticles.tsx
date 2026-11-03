import { motion } from "framer-motion";

const particles=new Array(18).fill(0);

export default function FloatingParticles(){

return(

<>

{particles.map((_,i)=>(

<motion.div

key={i}

animate={{

y:[0,-25,0],

opacity:[.2,.8,.2]

}}

transition={{

repeat:Infinity,

duration:4+i*.5

}}

style={{

left:`${Math.random()*100}%`,
top:`${Math.random()*100}%`

}}

className="absolute h-1 w-1 rounded-full bg-yellow-400"

/>

))}

</>

)

}