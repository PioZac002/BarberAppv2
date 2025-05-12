
import { Link } from "react-router-dom";
import {
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Mail,
    Phone,
    MapPin
} from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-barber-dark text-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="animate-fade-in">
                        <h3 className="text-2xl font-bold mb-4 text-barber">BarberShop</h3>
                        <p className="mb-4 text-gray-300">
                            Premium grooming services for the modern gentleman. Experience the
                            tradition of barbering with a contemporary twist.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="#"
                                className="text-gray-300 hover:text-barber transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook />
                            </a>
                            <a
                                href="#"
                                className="text-gray-300 hover:text-barber transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter />
                            </a>
                            <a
                                href="#"
                                className="text-gray-300 hover:text-barber transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram />
                            </a>
                            <a
                                href="#"
                                className="text-gray-300 hover:text-barber transition-colors"
                                aria-label="Youtube"
                            >
                                <Youtube />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                        <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/team"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Our Team
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/reviews"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Reviews
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/booking"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Book Now
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        <h3 className="text-xl font-semibold mb-4">Services</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/services"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Haircut
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Beard Trim
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Hot Towel Shave
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Hair Coloring
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-gray-300 hover:text-barber transition-colors"
                                >
                                    Kids Haircut
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                        <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <MapPin className="mr-2 h-5 w-5 text-barber" />
                                <span className="text-gray-300">
                  123 Barber Street, Downtown, City 12345
                </span>
                            </li>
                            <li className="flex items-center">
                                <Phone className="mr-2 h-5 w-5 text-barber" />
                                <span className="text-gray-300">(123) 456-7890</span>
                            </li>
                            <li className="flex items-center">
                                <Mail className="mr-2 h-5 w-5 text-barber" />
                                <span className="text-gray-300">info@barbershop.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm mb-4 md:mb-0">
                        © {new Date().getFullYear()} BarberShop. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link
                            to="/privacy"
                            className="text-gray-400 text-sm hover:text-barber transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            to="/terms"
                            className="text-gray-400 text-sm hover:text-barber transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            to="/contact"
                            className="text-gray-400 text-sm hover:text-barber transition-colors"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
