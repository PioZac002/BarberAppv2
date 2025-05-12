
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Star, Calendar } from "lucide-react";
import Layout from "@/components/Layout";

// Define service types for filtering
type ServiceCategory = "all" | "haircut" | "beard" | "facial" | "kids";

// Sample service data
const services = [
    {
        id: 1,
        name: "Classic Haircut",
        description: "Traditional haircut with precision scissor work and styling.",
        duration: 45,
        rating: 4.8,
        price: 35,
        category: "haircut",
        image: "https://images.unsplash.com/photo-1521499892833-773a6c6fd0b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 2,
        name: "Beard Trim & Shape",
        description: "Expert beard trimming and shaping to perfect your facial hair.",
        duration: 30,
        rating: 4.9,
        price: 25,
        category: "beard",
        image: "https://images.unsplash.com/photo-1621605810052-80936562dcb4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 3,
        name: "Hot Towel Shave",
        description: "Luxurious straight razor shave with hot towels and premium products.",
        duration: 45,
        rating: 5.0,
        price: 40,
        category: "facial",
        image: "https://images.unsplash.com/photo-1599188574942-a6970f7a6137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 4,
        name: "Haircut & Beard Combo",
        description: "Complete package including haircut and beard trimming.",
        duration: 60,
        rating: 4.7,
        price: 55,
        category: "haircut",
        image: "https://images.unsplash.com/photo-1599351431613-18ef1fdd09e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 5,
        name: "Hair Coloring",
        description: "Professional hair coloring and styling with premium products.",
        duration: 90,
        rating: 4.6,
        price: 65,
        category: "haircut",
        image: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 6,
        name: "Kid's Haircut",
        description: "Special haircuts for children under 12 years.",
        duration: 30,
        rating: 4.9,
        price: 25,
        category: "kids",
        image: "https://images.unsplash.com/photo-1633957897986-70e83293b3cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 7,
        name: "Facial Treatment",
        description: "Refresh and rejuvenate your skin with our premium facial treatment.",
        duration: 45,
        rating: 4.8,
        price: 45,
        category: "facial",
        image: "https://images.unsplash.com/photo-1557053506-91e56d92fe19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 8,
        name: "Beard Oil Treatment",
        description: "Nourish and condition your beard with premium beard oils.",
        duration: 20,
        rating: 4.7,
        price: 20,
        category: "beard",
        image: "https://images.unsplash.com/photo-1592422301616-79a848e2342f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
];

const Services = () => {
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("all");

    const filteredServices = selectedCategory === "all"
        ? services
        : services.filter(service => service.category === selectedCategory);

    const categories = [
        { id: "all", name: "All Services" },
        { id: "haircut", name: "Haircuts" },
        { id: "beard", name: "Beard" },
        { id: "facial", name: "Facial" },
        { id: "kids", name: "Kids" }
    ];

    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative py-24 md:py-32">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1622288432428-5937a421a05c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80')",
                    }}
                ></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        Our Services
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        From classic cuts to premium grooming treatments, we offer a range of
                        services designed for the modern gentleman.
                    </p>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-4 justify-center mb-12">
                        {categories.map(category => (
                            <Button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id as ServiceCategory)}
                                variant={selectedCategory === category.id ? "default" : "outline"}
                                className={
                                    selectedCategory === category.id
                                        ? "bg-barber hover:bg-barber-muted"
                                        : "border-barber text-barber-dark hover:bg-barber hover:text-white"
                                }
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredServices.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow card-hover animate-fade-in"
                                style={{ animationDelay: `${0.1 * service.id}s` }}
                            >
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={service.image}
                                        alt={service.name}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-2 text-barber-dark">
                                        {service.name}
                                    </h3>
                                    <p className="text-gray-600 mb-4">{service.description}</p>
                                    <div className="flex items-center mb-4">
                                        <Clock className="h-5 w-5 text-barber mr-2" />
                                        <span className="text-gray-700">{service.duration} min</span>
                                        <div className="ml-auto flex items-center">
                                            <Star className="h-5 w-5 text-yellow-500 mr-1" />
                                            <span className="text-gray-700">{service.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                    <span className="text-xl font-semibold text-barber">
                      ${service.price}
                    </span>
                                        <Button
                                            asChild
                                            className="bg-barber hover:bg-barber-muted text-white"
                                        >
                                            <Link to="/booking">
                                                <Calendar className="h-4 w-4 mr-2" /> Book Now
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Services;
