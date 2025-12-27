import Navbar from "@/components/home/Navbar";

export default function PortfolioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <Navbar />
            {children}
        </div>
    );
}
