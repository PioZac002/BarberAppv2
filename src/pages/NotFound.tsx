import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
    const location = useLocation();

    useEffect(() => {
        console.error(
            "404 Error: User attempted to access non-existent route:",
            location.pathname
        );
    }, [location.pathname]);

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <h1 className="text-9xl font-bold text-barber mb-4">404</h1>
                    <p className="text-2xl font-semibold mb-4 text-barber-dark">
                        Strona nie została znaleziona
                    </p>
                    <p className="text-gray-600 mb-8">
                        Strona, której szukasz, nie istnieje lub została przeniesiona.
                    </p>
                    <Button asChild className="bg-barber hover:bg-barber-muted btn-hover">
                        <Link to="/">Wróć do strony głównej</Link>
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default NotFound;
