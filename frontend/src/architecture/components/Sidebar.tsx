import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";


type NodeItem = {
    label: string;
    icon?: ReactNode;
    type: string;
    variant: string;
};

type SidebarNode = NodeItem;

const NODE_GROUPS: { title: string; nodes: NodeItem[] }[] = [
    {
        title: "Services",
        nodes: [
            {
                type: "service",
                label: "Service",
                variant: "service",
            },
        ],
    },

    {
        title: "Infrastructure",
        nodes: [
            {
                type: "gateway",
                label: "API Gateway",
                variant: "gateway",
            },
            {
                type: "lb",
                label: "Load Balancer",
                variant: "lb",
            },
            {
                type: "cdn",
                label: "CDN",
                variant: "cdn",
            },
        ],
    },

    {
        title: "Storage",
        nodes: [
            {
                type: "db",
                label: "Database",
                variant: "db",
            },
            {
                type: "cache",
                label: "Cache",
                variant: "cache",
            },
            {
                type: "queue",
                label: "Message Queue",
                variant: "queue",
            },
        ],
    },

    {
        title: "External",
        nodes: [
            {
                type: "external",
                label: "External System",
                variant: "external",
            },
        ],
    },
];

const onDragStart = (
    event: React.DragEvent,
    node: SidebarNode
) => {

    const payload = {

        type: "generic",

        data: {

            label: node.label,

            variant: node.variant,

        },

    };

    event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify(payload)
    );

    event.dataTransfer.effectAllowed = "move";

};

export default function Sidebar() {

    const [search, setSearch] = useState("");

    const filteredGroups = useMemo(() => {

        return NODE_GROUPS
            .map((group) => ({

                ...group,

                nodes: group.nodes.filter((node) =>
                    node.label
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )
                ),

            }))
            .filter(
                (group) =>
                    group.nodes.length > 0
            );

    }, [search]);

    return (

        <aside
            className="
                w-56
                shrink-0
                border-r
                border-white/10
                bg-[#0F1013]
                flex
                flex-col
            "
        >

            {/* Header */}

            <div
                className="
                    border-b
                    border-white/10
                    px-4
                    py-4
                "
            >

                <h2
                    className="
                        text-sm
                        font-semibold
                        text-white
                    "
                >

                    Components

                </h2>

                <p
                    className="
                        mt-1
                        text-xs
                        text-gray-500
                    "
                >

                    Drag onto the canvas

                </p>

            </div>

            {/* Search */}

            <div
                className="
                    border-b
                    border-white/10
                    p-3
                "
            >

                <div className="relative">

                    <Search
                        size={15}
                        className="
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-gray-500
                        "
                    />

                    <input

                        value={search}

                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }

                        placeholder="Search..."

                        className="
                            h-9
                            w-full
                            rounded-lg
                            border
                            border-white/10
                            bg-[#17191D]
                            pl-9
                            pr-3
                            text-xs
                            text-white
                            outline-none
                            placeholder:text-gray-500
                            focus:border-[#F5B301]
                            transition-colors
                        "

                    />

                </div>

            </div>

            {/* Groups */}

            <div
                className="
                    flex-1
                    overflow-y-auto
                    px-2
                    py-3
                "
            >
                {filteredGroups.length === 0 ? (

                    <div
                        className="
                            flex
                            h-full
                            items-center
                            justify-center
                            px-4
                            text-center
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-sm
                                    text-gray-400
                                "
                            >

                                No components found

                            </p>

                            <p
                                className="
                                    mt-1
                                    text-xs
                                    text-gray-600
                                "
                            >

                                Try another search

                            </p>

                        </div>

                    </div>

                ) : (

                    filteredGroups.map((group) => (

                        <div
                            key={group.title}
                            className="mb-6"
                        >

                            {/* Group Title */}

                            <h3
                                className="
                                    mb-2
                                    px-2
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-gray-500
                                "
                            >

                                {group.title}

                            </h3>

                            <div className="space-y-1">

                                {group.nodes.map((node) => (

                                    <button

                                        key={node.type}

                                        draggable

                                        onDragStart={(e) =>
                                            onDragStart(
                                                e,
                                                node
                                            )
                                        }

                                        className="
                                            group
                                            flex
                                            w-full
                                            cursor-grab
                                            items-center
                                            gap-3
                                            rounded-lg
                                            border
                                            border-transparent
                                            bg-[#17191D]
                                            px-3
                                            py-2.5
                                            text-left
                                            transition-all
                                            duration-200
                                            hover:border-[#F5B301]/40
                                            hover:bg-[#1F2228]
                                            hover:shadow-lg
                                            hover:shadow-yellow-500/5
                                            active:cursor-grabbing
                                            active:scale-[0.98]
                                        "

                                    >

                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#22252B]
                                                text-base
                                                transition-colors
                                                group-hover:bg-[#2B2F37]
                                            "
                                        >

                                            {node.icon}

                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <p
                                                className="
                                                    truncate
                                                    text-xs
                                                    font-medium
                                                    text-white
                                                "
                                            >

                                                {node.label}

                                            </p>

                                            <p
                                                className="
                                                    text-[10px]
                                                    text-gray-500
                                                "
                                            >

                                                Drag to canvas

                                            </p>

                                        </div>

                                    </button>

                                ))}

                            </div>

                        </div>

                    ))

                )}

            </div>

            {/* Footer */}

            <div
                className="
                    border-t
                    border-white/10
                    px-4
                    py-3
                "
            >

                <p
                    className="
                        text-[11px]
                        text-gray-500
                    "
                >

                    Drag components onto the canvas to
                    build your architecture.

                </p>

            </div>

        </aside>

    );

}