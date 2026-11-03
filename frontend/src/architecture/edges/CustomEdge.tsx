import {
    BaseEdge,
    EdgeLabelRenderer,
    type EdgeProps,
    getBezierPath,
    useReactFlow,
} from "reactflow";

import { memo, useState } from "react";

type EdgeData = {
    label?: string;
};

function CustomEdge({

    id,

    sourceX,

    sourceY,

    targetX,

    targetY,

    sourcePosition,

    targetPosition,

    markerEnd,

    selected,

    data,

}: EdgeProps<EdgeData>) {

    const { setEdges } = useReactFlow();

    const [editing, setEditing] = useState(false);

    const [label, setLabel] = useState(
        data?.label ?? "HTTP"
    );

    const [
        edgePath,
        labelX,
        labelY,
    ] = getBezierPath({

        sourceX,

        sourceY,

        targetX,

        targetY,

        sourcePosition,

        targetPosition,

    });

    function save() {

        setEdges((edges) =>
            edges.map((edge) => {

                if (edge.id !== id)
                    return edge;

                return {

                    ...edge,

                    data: {

                        ...edge.data,

                        label,

                    },

                };

            })
        );

        setEditing(false);

    }
        return (

        <>

            <BaseEdge

                path={edgePath}

                markerEnd={markerEnd}

                style={{

                    strokeWidth: 2,

                    stroke: selected
                        ? "#F5B301"
                        : "#8B8B8B",

                }}

            />

            <EdgeLabelRenderer>

                <div

                    style={{

                        position: "absolute",

                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,

                        pointerEvents: "all",

                    }}

                >
                                        {editing ? (

                        <input

                            autoFocus

                            value={label}

                            onChange={(e) =>
                                setLabel(
                                    e.target.value
                                )
                            }

                            onBlur={save}

                            onKeyDown={(e) => {

                                if (e.key === "Enter")
                                    save();

                                if (e.key === "Escape") {

                                    setLabel(
                                        data?.label ??
                                            "HTTP"
                                    );

                                    setEditing(false);

                                }

                            }}

                            className="
                                w-24
                                rounded-md
                                border
                                border-[#F5B301]
                                bg-[#17191D]
                                px-2
                                py-1
                                text-center
                                text-xs
                                text-white
                                outline-none
                            "

                        />

                    ) : (

                        <button

                            onDoubleClick={() =>
                                setEditing(true)
                            }

                            className="
                                rounded-md
                                border
                                border-white/10
                                bg-[#17191D]
                                px-3
                                py-1
                                text-xs
                                text-gray-300
                                transition-all
                                hover:border-[#F5B301]/50
                                hover:text-white
                            "

                        >

                            {label}

                        </button>

                    )}

                </div>

            </EdgeLabelRenderer>

        </>

    );

}

export default memo(CustomEdge);