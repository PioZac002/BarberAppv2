
import { ReactNode } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";

type LayoutProps = {
    children: ReactNode;
    withFooter?: boolean;
};

const Layout = ({ children, withFooter = true }: LayoutProps) => {
    return (
        <div className="flex flex-col min-h-screen bg-barber-dark">
            <Navigation />
            <main className="flex-grow pt-16">
                {children}
            </main>
            {withFooter && <Footer />}
        </div>
    );
};

export default Layout;
