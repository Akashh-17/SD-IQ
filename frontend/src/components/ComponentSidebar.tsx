import { useMemo, useState } from "react";
import { Search } from "lucide-react";

const onDragStart = (
    event: React.DragEvent,
    nodeType: string
) => {

    event.dataTransfer.setData(
        "application/reactflow",
        nodeType
    );

    event.dataTransfer.effectAllowed = "move";

};

interface NodeDef {

    label: string;

    icon: string;

    type: string;

}

interface Category {

    name: string;

    nodes: NodeDef[];

}

const CATEGORIES: Category[] = [

    {

        name: "Client",

        nodes: [

            {

                label: "Web Client",

                icon: "💻",

                type: "webclient",

            },

            {

                label: "Mobile App",

                icon: "📱",

                type: "mobile",

            },

            {

                label: "Third Party API",

                icon: "🔗",

                type: "thirdparty",

            },

        ],

    },

    {

        name: "Network",

        nodes: [

            {

                label: "API Gateway",

                icon: "🌐",

                type: "api",

            },

            {

                label: "Load Balancer",

                icon: "⚖️",

                type: "lb",

            },

            {

                label: "CDN",

                icon: "📦",

                type: "cdn",

            },

            {

                label: "Reverse Proxy",

                icon: "🖥",

                type: "proxy",

            },

            {

                label: "Firewall",

                icon: "🛡️",

                type: "firewall",

            },

            {

                label: "DNS",

                icon: "ᯤ",

                type: "dns",

            },

        ],

    },

    {

        name: "Cache",

        nodes: [

            {

                label: "Redis",

                icon: "⚡",

                type: "redis",

            },

            {

                label: "MemCache",

                icon: "⚡",

                type: "memcache",

            },

            {

                label: "Local Cache",

                icon: "💾",

                type: "localcache",

            },

        ],

    },

    {

        name: "Database",

        nodes: [

            {

                label: "SQL Database",

                icon: "🗄️",

                type: "sqldb",

            },

            {

                label: "NoSQL Database",

                icon: "{ }",

                type: "nosqldb",

            },

            {

                label: "Graph Database",

                icon: "🖧",

                type: "graphdb",

            },

            {

                label: "Vector Database",

                icon: "📑",

                type: "vectordb",

            },

            {

                label: "TimeSeries DB",

                icon: "📈",

                type: "timeseriesdb",

            },

        ],

    },

    {

        name: "Compute",

        nodes: [

            {

                label: "Service",

                icon: "⚙️",

                type: "service",

            },

            {

                label: "CronJob",

                icon: "🕑",

                type: "cronjob",

            },

            {

                label: "Worker",

                icon: "💼",

                type: "worker",

            },

        ],

    },

    {

        name: "Storage",

        nodes: [

            {

                label: "BlobStorage",

                icon: "☁️",

                type: "blobstore",

            },

             {

                label: "File Storage",

                icon: "🗃️",

                type: "filestore",

            },

             {

                label: "Object Storage",

                icon: "🪣",

                type: "objectstore",

            },

        ],

    },

    {

        name: "Messaging",

        nodes: [

            {

                label: "Msg Queue",

                icon: "📨",

                type: "msgqueue",

            },

            {

                label: "Event Bus",

                icon: "⛟",

                type: "eventbus",

            },

            {

                label: "Publisher",

                icon: "📢",

                type: "publisher",

            },

            {

                label: "Subscriber",

                icon: "📩",

                type: "subscriber",

            },

            {

                label: "Kafka",

                icon: "📨",

                type: "kafka",

            },

        ],

    },

    {

        name: "Search",

        nodes: [

            {

                label: "Search Engine",

                icon: "🛠",

                type: "searchengine",

            },

            {

                label: "Elastic Search",

                icon: "🔎",

                type: "elasticsearch",

            },

        ],

    },

];

export default function Sidebar() {

    const [search, setSearch] = useState("");

    const filteredCategories = useMemo(() => {

        const query = search.toLowerCase();

        return CATEGORIES.map((category) => ({

            ...category,

            nodes: category.nodes.filter((node) =>

                node.label.toLowerCase().includes(query)

            ),

        })).filter((category) => category.nodes.length > 0);

    }, [search]);

    return (

        <aside
            className="
                w-48
                shrink-0
                border-r
                border-white/10
                bg-[#0F1013]
                flex
                flex-col
            "
        >

            {/* Search */}

            <div className="border-b border-white/10 p-3">

                <div className="relative">

                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                            h-8
                            w-full
                            rounded-lg
                            border
                            border-white/10
                            bg-[#16181D]
                            pl-9
                            pr-3
                            text-xs
                            text-white
                            outline-none
                            placeholder:text-gray-500
                            focus:border-[#F5B301]
                        "

                    />

                </div>

            </div>

            {/* Components */}

            <div
                className="
                    flex-1
                    overflow-y-auto
                    overflow-x-hidden
                    p-2
                    space-y-4
                "
            >

                {

                    filteredCategories.map((category) => (

                        <div key={category.name}>

                            <div
                                className="
                                    px-1
                                    pb-1.5
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    text-gray-500
                                "
                            >

                                {category.name}

                            </div>

                            <div className="space-y-1">

                                {

                                    category.nodes.map(

                                        ({

                                            label,

                                            icon,

                                            type,

                                        }) => (

                                            <button

                                                key={type}

                                                draggable

                                                onDragStart={(e) =>

                                                    onDragStart(

                                                        e,

                                                        type

                                                    )

                                                }

                                                className="
                                                    flex
                                                    h-9
                                                    w-full
                                                    items-center
                                                    gap-2
                                                    rounded-lg
                                                    border
                                                    border-transparent
                                                    bg-[#17191D]
                                                    px-3
                                                    text-left
                                                    text-xs
                                                    text-gray-300
                                                    transition-all
                                                    hover:border-[#F5B301]/40
                                                    hover:bg-[#202228]
                                                    active:scale-[0.98]
                                                    cursor-grab
                                                "
                                            >

                                                <span className="text-sm">

                                                    {icon}

                                                </span>

                                                <span className="truncate">

                                                    {label}

                                                </span>

                                            </button>

                                        )

                                    )

                                }

                            </div>

                        </div>

                    ))

                }

            </div>

        </aside>

    );

}