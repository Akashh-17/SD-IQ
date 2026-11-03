import { memo } from "react";
import { NodeToolbar, Position, useReactFlow } from "reactflow";
import {
    Copy,
    Trash2,
    Pencil,
} from "lucide-react";

type Props = {
    id: string;
    selected: boolean;
    onRename: () => void;
};

function Toolbar({
    id,
    selected,
    onRename,
}: Props) {

    const { getNode, setNodes } = useReactFlow();

    function duplicateNode() {

        const node = getNode(id);

        if (!node) return;

        setNodes((nodes) => [

            ...nodes,

            {

                ...node,

                id: crypto.randomUUID(),

                position: {

                    x: node.position.x + 40,

                    y: node.position.y + 40,

                },

            },

        ]);

    }

    function deleteNode() {

        setNodes((nodes) =>
            nodes.filter((n) => n.id !== id)
        );

    }

    return (

        <NodeToolbar
            isVisible={selected}
            position={Position.Top}
        >
                        <div
                className="
                    flex
                    items-center
                    gap-1
                    rounded-xl
                    border
                    border-white/10
                    bg-[#17191D]
                    p-1.5
                    shadow-xl
                "
            >

                <button

                    onClick={onRename}

                    className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        text-gray-300
                        transition-colors
                        hover:bg-[#23262D]
                        hover:text-white
                    "

                    title="Rename"

                >

                    <Pencil size={16} />

                </button>

                <button

                    onClick={duplicateNode}

                    className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        text-gray-300
                        transition-colors
                        hover:bg-[#23262D]
                        hover:text-white
                    "

                    title="Duplicate"

                >

                    <Copy size={16} />

                </button>

                <button

                    onClick={deleteNode}

                    className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        text-red-400
                        transition-colors
                        hover:bg-red-500/10
                    "

                    title="Delete"

                >

                    <Trash2 size={16} />

                </button>

            </div>

        </NodeToolbar>

    );

}

export default memo(Toolbar);
