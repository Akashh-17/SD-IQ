export type SidebarNode = {
    type: string;
    label: string;
    variant: NodeVariant;
};

export type NodeGroup = {
    title: string;
    nodes: SidebarNode[];
};

export type NodeVariant =
    | "service"
    | "gateway"
    | "db"
    | "cache"
    | "lb"
    | "cdn"
    | "queue"
    | "external";

export const NODE_GROUPS: NodeGroup[] = [
    {
        title: "Services",
        nodes: [
            {
                type: "generic",
                label: "Service",
                variant: "service",
            },
        ],
    },

    {
        title: "Infrastructure",
        nodes: [
            {
                type: "generic",
                label: "API Gateway",
                variant: "gateway",
            },
            {
                type: "generic",
                label: "Load Balancer",
                variant: "lb",
            },
            {
                type: "generic",
                label: "CDN",
                variant: "cdn",
            },
        ],
    },

    {
        title: "Storage",
        nodes: [
            {
                type: "generic",
                label: "Database",
                variant: "db",
            },
            {
                type: "generic",
                label: "Cache",
                variant: "cache",
            },
            {
                type: "generic",
                label: "Message Queue",
                variant: "queue",
            },
        ],
    },

    {
        title: "External",
        nodes: [
            {
                type: "generic",
                label: "External System",
                variant: "external",
            },
        ],
    },
];