import { useReactFlow } from "reactflow";

import {
    Globe,
    Cog,
    Database,
    Boxes,
    Package,
    Zap,
    Scale,
    Earth,
} from "lucide-react";

const icons = {
    gateway: Globe,
    service: Cog,
    db: Database,
    queue: Boxes,
    cache: Zap,
    cdn: Package,
    lb: Scale,
    external: Earth,
};

const variants = [
    "service",
    "gateway",
    "db",
    "cache",
    "queue",
    "cdn",
    "lb",
    "external",
] as const;

export default function Inspector() {

    const {
        getNodes,
        setNodes,
    } = useReactFlow();

    const selected = getNodes().find(
        (n) => n.selected
    );

    if (!selected) {

        return (

            <aside
                className="
                    w-72
                    border-l
                    border-white/10
                    bg-[#0F1013]
                    flex
                    items-center
                    justify-center
                    text-sm
                    text-gray-500
                "
            >

                Select a node

            </aside>

        );

    }

    function update(
        key: string,
        value: any
    ) {
        const selectedId = selected?.id;

        if (!selectedId) return;

        setNodes((nodes) =>
            nodes.map((node) => {

                if (node.id !== selectedId)
                    return node;

                return {

                    ...node,

                    data: {

                        ...node.data,

                        [key]: value,

                    },

                };

            })
        );

    }

    const Icon = icons[selected.data.variant as keyof typeof icons];

    return (

        <aside
            className="
                w-72
                border-l
                border-white/10
                bg-[#0F1013]
                p-5
            "
        >
                        <div className="flex items-center gap-3">

                <div
                    className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#17191D]
                    "
                >

                    <Icon size={22} />

                </div>

                <div>

                    <h2 className="font-semibold">

                        Node Properties

                    </h2>

                    <p className="text-xs text-gray-500">

                        {selected.id}

                    </p>

                </div>

            </div>

            <div className="mt-8 space-y-6">

                <div>

                    <label className="text-xs text-gray-500">

                        Label

                    </label>

                    <input

                        value={selected.data.label}

                        onChange={(e) =>
                            update(
                                "label",
                                e.target.value
                            )
                        }

                        className="
                            mt-2
                            h-10
                            w-full
                            rounded-lg
                            border
                            border-white/10
                            bg-[#17191D]
                            px-3
                            text-sm
                            outline-none
                        "

                    />

                </div>

                <div>

                    <label className="text-xs text-gray-500">

                        Type

                    </label>

                    <select

                        value={selected.data.variant}

                        onChange={(e) =>
                            update(
                                "variant",
                                e.target.value
                            )
                        }

                        className="
                            mt-2
                            h-10
                            w-full
                            rounded-lg
                            border
                            border-white/10
                            bg-[#17191D]
                            px-3
                            text-sm
                        "

                    >

                        {variants.map((variant) => (

                            <option
                                key={variant}
                                value={variant}
                            >

                                {variant}

                            </option>

                        ))}

                    </select>

                </div>

            </div>

        </aside>

    );

}