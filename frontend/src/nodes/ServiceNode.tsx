import { useEffect, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";

interface ServiceNodeData {
    label: string;
}

export function ServiceNode({ id, data }: NodeProps<ServiceNodeData>) {

    const { setNodes } = useReactFlow();

    const [editing, setEditing] = useState(false);

    const [value, setValue] = useState(data.label ?? "Service");

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {

        if (editing) {

            inputRef.current?.focus();

            inputRef.current?.select();

        }

    }, [editing]);

    const commit = () => {

        const trimmed = value.trim() || "Service";

        setValue(trimmed);

        setEditing(false);

        setNodes((nds) =>

            nds.map((n) =>

                n.id === id

                    ? { ...n, data: { ...n.data, label: trimmed } }

                    : n

            )

        );

    };

    const cancel = () => {

        setValue(data.label ?? "Service");

        setEditing(false);

    };

    return (

        <div
            className="
                min-w-[130px]
                px-3
                py-2
                bg-emerald-950
                border-2
                border-emerald-500
                rounded-lg
                text-emerald-200
                text-xs
                font-medium
                shadow-lg
                shadow-emerald-900/30
            "
            onDoubleClick={() => setEditing(true)}
        >

            <Handle type="target" position={Position.Left} />

            <div className="flex items-center gap-1.5">

                <span>⚙️</span>

                {editing ? (

                    <input

                        ref={inputRef}

                        value={value}

                        onChange={(e) => setValue(e.target.value)}

                        onBlur={commit}

                        onKeyDown={(e) => {

                            if (e.key === "Enter") commit();

                            if (e.key === "Escape") cancel();

                        }}

                        className="
                            nodrag
                            w-full
                            bg-transparent
                            border-b
                            border-emerald-400
                            text-emerald-100
                            outline-none
                            text-xs
                        "

                    />

                ) : (

                    <span

                        className="truncate max-w-[140px]"

                        title="Double-click to rename"

                    >

                        {value}

                    </span>

                )}

            </div>

            <Handle type="source" position={Position.Right} />

        </div>

    );

}

export function WorkerNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      💼 Worker
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function CronJobNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      🕑 Cron Job
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}