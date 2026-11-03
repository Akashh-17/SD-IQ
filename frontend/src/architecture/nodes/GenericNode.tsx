import { memo, useEffect, useRef, useState } from "react";
import {
    Handle,
    type NodeProps,
    Position,
    useReactFlow,
} from "reactflow";

import { iconMap } from "../constants/iconMap";
import { variants } from "../constants/variants";
import Toolbar from "../components/NodeToolbar";

type GenericNodeData = {
    label: string;
    variant: keyof typeof variants;
};

function GenericNode({
    id,
    data,
    selected,
}: NodeProps<GenericNodeData>) {

    const { setNodes } = useReactFlow();

    const [editing, setEditing] = useState(false);

    const [label, setLabel] = useState(data.label);

    const inputRef = useRef<HTMLInputElement>(null);

    const Icon = iconMap[data.variant];

    useEffect(() => {

        if (editing) {

            inputRef.current?.focus();

            inputRef.current?.select();

        }

    }, [editing]);

    function saveLabel() {

        setNodes((nodes) =>
            nodes.map((node) => {

                if (node.id !== id) return node;

                return {

                    ...node,

                    data: {

                        ...node.data,

                        label,

                    },

                };

            })
        );

        setEditing(false);

    }
    return (

        <div
            className={`
                relative
                min-w-[180px]
                rounded-xl
                border-2
                px-4
                py-3
                shadow-xl
                transition-all
                ${variants[data.variant]}
                ${selected ? "ring-2 ring-[#F5B301]" : ""}
            `}
        >
            <Toolbar

                id={id}

                selected={selected}

                onRename={() => setEditing(true)}

            />

            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3"
            />

            <div className="flex items-center gap-3">

                <div
                    className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        bg-black/20
                    "
                >

                    <Icon size={18} />

                </div>

                <div className="flex-1">

                    {editing ? (

                        <input

                            ref={inputRef}

                            value={label}

                            onChange={(e) =>
                                setLabel(
                                    e.target.value
                                )
                            }

                            onBlur={saveLabel}

                            onKeyDown={(e) => {

                                if (e.key === "Enter")
                                    saveLabel();

                                if (e.key === "Escape") {

                                    setLabel(data.label);

                                    setEditing(false);

                                }

                            }}

                            className="
                                w-full
                                bg-transparent
                                text-sm
                                font-semibold
                                outline-none
                            "

                        />

                    ) : (

                        <p

                            onDoubleClick={() =>
                                setEditing(true)
                            }

                            className="
                                cursor-text
                                text-sm
                                font-semibold
                            "

                        >

                            {label}

                        </p>

                    )}
                    <p
                        className="
                            mt-1
                            text-[11px]
                            opacity-60
                        "
                    >

                        Double-click to rename

                    </p>

                </div>

            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!h-3 !w-3"
            />

        </div>

    );

}

export default memo(GenericNode);