interface Props {

    open: boolean;

    title: string;

    description: string;

    confirmText?: string;

    cancelText?: string;

    loading?: boolean;

    onConfirm: () => void;

    onCancel: () => void;

}

export default function ConfirmModal({

    open,

    title,

    description,

    confirmText = "Confirm",

    cancelText = "Cancel",

    loading = false,

    onConfirm,

    onCancel,

}: Props) {

    if (!open)

        return null;

    return (

        <div
            className="
                fixed
                inset-0
                z-[999]
                flex
                items-center
                justify-center
                bg-black/70
                backdrop-blur-sm
            "
        >

            <div
                className="
                    w-[420px]
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#101114]
                    p-6
                    shadow-2xl
                "
            >

                <h2 className="text-xl font-semibold text-white">

                    {title}

                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-400">

                    {description}

                </p>

                <div className="mt-8 flex justify-end gap-3">

                    <button

                        onClick={onCancel}

                        className="
                            rounded-lg
                            border
                            border-white/10
                            px-4
                            py-2
                            text-sm
                            text-gray-300
                            transition
                            hover:bg-white/5
                        "

                    >

                        {cancelText}

                    </button>

                    <button

                        disabled={loading}

                        onClick={onConfirm}

                        className="
                            rounded-lg
                            bg-red-500
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-red-600
                            disabled:opacity-60
                        "

                    >

                        {

                            loading

                                ? "Ending..."

                                : confirmText

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}