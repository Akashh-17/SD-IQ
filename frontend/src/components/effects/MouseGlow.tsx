import { useState } from "react";

export default function MouseGlow(){

const [pos,setPos]=useState({

x:0,
y:0

});

return(

<div

onMouseMove={(e)=>{

const rect=e.currentTarget.getBoundingClientRect();

setPos({

x:e.clientX-rect.left,

y:e.clientY-rect.top

})

}}

className="absolute inset-0"

>

<div

className="pointer-events-none absolute h-72 w-72 rounded-full bg-yellow-500/20 blur-[110px] transition-all duration-150"

style={{

left:pos.x-150,

top:pos.y-150

}}

/>

</div>

)

}