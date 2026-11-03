import { motion } from "framer-motion";

const badges = [

"Redis",
"Kafka",
"Kubernetes",
"AWS",
"CDN",
"Microservices",
"CAP",
"Load Balancer"

];

export default function FloatingBadges(){

return(

<>

{badges.map((badge,index)=>(

<motion.div

key={badge}

animate={{

y:[0,-20,0],

}}

transition={{

duration:5+index,

repeat:Infinity

}}

style={{

top:60+index*70,

left:index%2===0?0:600

}}

className="absolute rounded-full border border-yellow-500/20 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-300 backdrop-blur"

>

{badge}

</motion.div>

))}

</>

)

}