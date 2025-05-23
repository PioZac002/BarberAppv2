import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, ChevronDown } from "lucide-react";

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<"client" | "barber" | "admin" | null>(null);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
            const storedRole = localStorage.getItem("userRole");
            setUserRole(storedRole as "client" | "barber" | "admin" || "client");
        }

        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        setIsLoggedIn(false);
        setUserRole(null);
        window.location.href = "/";
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Team", path: "/team" },
        { name: "Reviews", path: "/reviews" },
        { name: "Book Now", path: "/booking", isButton: true },
    ];

    const getDashboardUrl = () => {
        if (!userRole) return "/";
        switch (userRole) {
            case "admin":
                return "/admin-dashboard";
            case "barber":
                return "/barber-dashboard";
            case "client":
            default:
                return "/user-dashboard";
        }
    };

    const adminSubMenu = [
        { name: "Overview", path: "/admin-dashboard" },
        { name: "Users", path: "/admin-dashboard/users" },
        { name: "Appointments", path: "/admin-dashboard/appointments" },
        { name: "Services", path: "/admin-dashboard/services" },
        { name: "Reviews", path: "/admin-dashboard/reviews" },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? "bg-barber-dark shadow-md py-2"
                    : "bg-transparent py-4"
            }`}
        >
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-barber">
                    BarberShop
                </Link>

                <nav className="hidden md:flex items-center space-x-6">
                    {navLinks.map((link) =>
                        link.isButton ? (
                            <Button
                                key={link.name}
                                asChild
                                className="bg-barber hover:bg-barber-muted text-white btn-hover"
                            >
                                <Link to={link.path}>{link.name}</Link>
                            </Button>
                        ) : (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-white hover:text-barber transition-colors ${
                                    location.pathname === link.path
                                        ? "border-b-2 border-barber"
                                        : ""
                                }`}
                            >
                                {link.name}
                            </Link>
                        )
                    )}

                    <div className="hidden md:flex items-center space-x-4">
                        {isLoggedIn ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center text-white">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Account</span>
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile">Profile</Link>
                                    </DropdownMenuItem>
                                    {userRole === "admin" ? (
                                        adminSubMenu.map((subLink) => (
                                            <DropdownMenuItem key={subLink.name} asChild>
                                                <Link to={subLink.path}>{subLink.name}</Link>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <DropdownMenuItem asChild>
                                            <Link to={getDashboardUrl()}>Dashboard</Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={handleLogout}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Button asChild variant="ghost" className="text-white">
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button
                                    asChild
                                    className="bg-barber hover:bg-barber-muted text-white btn-hover"
                                >
                                    <Link to="/register">Register</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>

                <button
                    className="md:hidden text-white"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {isMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-40 md:hidden animate-fade-in">
                    <div className="flex flex-col h-full justify-center items-center space-y-8 p-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-xl ${
                                    link.isButton
                                        ? "bg-barber text-white px-6 py-2 rounded-md"
                                        : "text-white"
                                } ${location.pathname === link.path ? "text-barber" : ""}`}
                                onClick={closeMenu}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {isLoggedIn ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="text-xl text-white"
                                    onClick={closeMenu}
                                >
                                    Profile
                                </Link>
                                {userRole === "admin" ? (
                                    adminSubMenu.map((subLink) => (
                                        <Link
                                            key={subLink.name}
                                            to={subLink.path}
                                            className="text-xl text-white"
                                            onClick={closeMenu}
                                        >
                                            {subLink.name}
                                        </Link>
                                    ))
                                ) : (
                                    <Link
                                        to={getDashboardUrl()}
                                        className="text-xl text-white"
                                        onClick={closeMenu}
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                <button
                                    className="text-xl text-white"
                                    onClick={() => {
                                        handleLogout();
                                        closeMenu();
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-xl text-white"
                                    onClick={closeMenu}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-xl text-white bg-barber px-6 py-2 rounded-md"
                                    onClick={closeMenu}
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navigation;