import Sidebar from "./Sidebar";

interface Props {
    children: React.ReactNode;
}

export default function DashboardLayout({

    children,

}: Props) {

    return (

        <div className="bg-base">

            <Sidebar />

            <main className="ml-64 min-h-screen">

                <div className="p-8">

                    {children}

                </div>

            </main>

        </div>

    );

}