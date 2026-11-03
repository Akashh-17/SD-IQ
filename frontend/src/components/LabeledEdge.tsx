import { useEffect, useRef, useState } from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    useReactFlow,
    type EdgeProps,
} from "reactflow";

interface LabeledEdgeData {
    label?: string;
}

export default function LabeledEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
}: EdgeProps<LabeledEdgeData>) {

    const { setEdges } = useReactFlow();

    const [editing, setEditing] = useState(false);

    const [value, setValue] = useState(data?.label ?? "");

    const inputRef = useRef<HTMLInputElement>(null);

    const [edgePath, labelX, labelY] = getBezierPath({

        sourceX,

        sourceY,

        sourcePosition,

        targetX,

        targetY,

        targetPosition,

    });

    useEffect(() => {

        if (editing) {

            inputRef.current?.focus();

            inputRef.current?.select();

        }

    }, [editing]);

    const commit = () => {

        const trimmed = value.trim();

        setValue(trimmed);

        setEditing(false);

        setEdges((eds) =>

            eds.map((e) =>

                e.id === id

                    ? { ...e, data: { ...e.data, label: trimmed } }

                    : e

            )

        );

    };

    return (

        <>

            <BaseEdge

                id={id}

                path={edgePath}

                style={style}

                markerEnd={markerEnd}

            />

            <EdgeLabelRenderer>

                <div

                    style={{

                        position: "absolute",

                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,

                        pointerEvents: "all",

                    }}

                    className="nodrag nopan"

                    onDoubleClick={() => setEditing(true)}

                >

                    {editing ? (

                        <input

                            ref={inputRef}

                            value={value}

                            onChange={(e) => setValue(e.target.value)}

                            onBlur={commit}

                            onKeyDown={(e) => {

                                if (e.key === "Enter") commit();

                                if (e.key === "Escape") setEditing(false);

                            }}

                            placeholder="label"

                            className="
                                h-6
                                w-24
                                rounded-md
                                border
                                border-[#F5B301]
                                bg-[#16181D]
                                px-2
                                text-[10px]
                                text-white
                                outline-none
                            "

                        />

                    ) : value ? (

                        <div

                            className="
                                rounded-md
                                border
                                border-white/10
                                bg-[#16181D]
                                px-2
                                py-0.5
                                text-[10px]
                                text-gray-300
                                shadow
                                cursor-pointer
                                hover:border-[#F5B301]/40
                            "

                        >

                            {value}

                        </div>

                    ) : (

                        <div

                            className="
                                rounded-md
                                border
                                border-dashed
                                border-white/20
                                px-2
                                py-0.5
                                text-[10px]
                                text-gray-500
                                opacity-0
                                hover:opacity-70
                                transition-opacity
                                cursor-pointer
                            "

                        >

                            + label

                        </div>

                    )}

                </div>

            </EdgeLabelRenderer>

        </>

    );

}
