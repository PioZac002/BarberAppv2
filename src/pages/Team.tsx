
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Search,
    Mail,
    Phone,
    Star,
    Calendar,
    Award,
    CheckCircle
} from "lucide-react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";

// Define types for team members
type Specialization = "haircut" | "beard" | "coloring" | "shaving" | "kids";

interface TeamMember {
    id: number;
    name: string;
    role: string;
    rating: number;
    experience: number;
    specializations: Specialization[];
    email: string;
    phone: string;
    bio: string;
    certifications: string[];
    portfolioImages: string[];
    image: string;
}

// Sample team data
const teamMembers: TeamMember[] = [
    {
        id: 1,
        name: "David Mitchell",
        role: "Master Barber",
        rating: 4.9,
        experience: 12,
        specializations: ["haircut", "beard", "shaving"],
        email: "david@barbershop.com",
        phone: "(123) 456-7890",
        bio: "David is our master barber with over 12 years of experience. He specializes in classic cuts and traditional hot towel shaves.",
        certifications: ["Master Barber License", "Advanced Hair Design"],
        portfolioImages: [
            "https://images.unsplash.com/photo-1584487862937-4781db1c1e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1029&q=80",
            "https://images.unsplash.com/photo-1596728325488-5c4917fbd617?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        ],
        image: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 2,
        name: "Sarah Johnson",
        role: "Style Specialist",
        rating: 4.8,
        experience: 8,
        specializations: ["haircut", "coloring", "kids"],
        email: "sarah@barbershop.com",
        phone: "(123) 456-7891",
        bio: "Sarah is known for her creative approach to men's styling and expertise in hair coloring techniques.",
        certifications: ["Hair Color Specialist", "Modern Styling Techniques"],
        portfolioImages: [
            "https://images.unsplash.com/photo-1605497788044-5a32c7078486?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
            "https://images.unsplash.com/photo-1599351431613-18ef1fdd09e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1583499871880-de841d1ace2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        ],
        image: "https://images.unsplash.com/photo-1595110045835-8dcc5c8bfa6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 3,
        name: "Michael Rodriguez",
        role: "Beard Expert",
        rating: 5.0,
        experience: 10,
        specializations: ["beard", "shaving"],
        email: "michael@barbershop.com",
        phone: "(123) 456-7892",
        bio: "Michael is our beard expert, specializing in intricate beard designs and luxurious hot towel shaves.",
        certifications: ["Beard Sculpting", "Traditional Shaving Techniques"],
        portfolioImages: [
            "https://images.unsplash.com/photo-1633957897986-70e83293b3cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1521144236085-322425a4d837?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
            "https://images.unsplash.com/photo-1584487862937-4781db1c1e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        ],
        image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    },
    {
        id: 4,
        name: "James Wilson",
        role: "Senior Barber",
        rating: 4.7,
        experience: 15,
        specializations: ["haircut", "beard", "kids", "shaving"],
        email: "james@barbershop.com",
        phone: "(123) 456-7893",
        bio: "With 15 years of experience, James combines traditional techniques with modern trends for a unique barbering experience.",
        certifications: ["Master Barber", "Children's Hair Specialist"],
        portfolioImages: [
            "https://images.unsplash.com/photo-1622296089354-d42ec6721f5d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
            "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
            "https://images.unsplash.com/photo-1593764592116-bfb2a97c642a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        ],
        image: "https://images.unsplash.com/photo-1534386428710-ac49b6b1e552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=685&q=80",
    },
    {
        id: 5,
        name: "Emma Thompson",
        role: "Color Specialist",
        rating: 4.9,
        experience: 7,
        specializations: ["coloring", "haircut"],
        email: "emma@barbershop.com",
        phone: "(123) 456-7894",
        bio: "Emma specializes in men's hair coloring and bleaching, bringing the latest color trends to our barbershop.",
        certifications: ["Advanced Color Techniques", "Fashion-Forward Styling"],
        portfolioImages: [
            "https://images.unsplash.com/photo-1599577180413-10fa0ecd19aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
            "https://images.unsplash.com/photo-1622285482980-1f1ce962321e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
            "https://images.unsplash.com/photo-1587892959296-7eaf95c8813e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        ],
        image: "https://images.unsplash.com/photo-1577037838969-78e9aba4539a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    },
    {
        id: 6,
        name: "Daniel Lee",
        role: "Junior Barber",
        rating: 4.6,
        experience: 3,
        specializations: ["haircut", "beard"],
        email: "daniel@barbershop.com",
        phone: "(123) 456-7895",
        bio: "Daniel brings fresh perspective and energy to our team, specializing in contemporary haircuts and styles.",
        certifications: ["Barber School Graduate", "Modern Barbering Techniques"],
        portfolioImages: [
            "https://images.unsplash.com/photo-1580391564590-aeca66ac5d45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            "https://images.unsplash.com/photo-1504257432389-52343af06ae3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1187&q=80",
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        ],
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    },
];

const Team = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization | "all">("all");
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    // Filter team members based on search and specialization
    const filteredMembers = teamMembers.filter((member) => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.role.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSpecialization = selectedSpecialization === "all" ||
            member.specializations.includes(selectedSpecialization as Specialization);

        return matchesSearch && matchesSpecialization;
    });

    const specializations = [
        { id: "all", name: "All Specializations" },
        { id: "haircut", name: "Haircuts" },
        { id: "beard", name: "Beard Styling" },
        { id: "coloring", name: "Hair Coloring" },
        { id: "shaving", name: "Traditional Shaving" },
        { id: "kids", name: "Kids Haircuts" },
    ];

    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative py-24 md:py-32">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1599491143868-40d9afbd6c0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80')",
                    }}
                ></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        Meet Our Team
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        Our skilled team of barbers and stylists bring years of experience and
                        passion to every service.
                    </p>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    {/* Search and Filter */}
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            {/* Search Bar */}
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search team members..."
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-barber focus:border-barber"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Specialization Filters */}
                            <div className="flex flex-wrap gap-2">
                                {specializations.map(spec => (
                                    <Button
                                        key={spec.id}
                                        onClick={() => setSelectedSpecialization(spec.id as Specialization | "all")}
                                        variant={selectedSpecialization === spec.id ? "default" : "outline"}
                                        className={
                                            selectedSpecialization === spec.id
                                                ? "bg-barber hover:bg-barber-muted"
                                                : "border-barber text-barber-dark hover:bg-barber hover:text-white"
                                        }
                                        size="sm"
                                    >
                                        {spec.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Team Members Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer card-hover animate-fade-in"
                                onClick={() => setSelectedMember(member)}
                                style={{ animationDelay: `${0.1 * member.id}s` }}
                            >
                                <div className="h-64 overflow-hidden">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-1 text-barber-dark">
                                        {member.name}
                                    </h3>
                                    <p className="text-barber mb-2">{member.role}</p>

                                    <div className="flex items-center mb-4">
                                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                                        <span className="text-gray-700 mr-4">{member.rating}</span>
                                        <span className="text-gray-700">{member.experience} Years Experience</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {member.specializations.map((spec) => (
                                            <span
                                                key={spec}
                                                className="px-3 py-1 bg-gray-100 text-barber-dark text-sm rounded-full"
                                            >
                        {spec.charAt(0).toUpperCase() + spec.slice(1)}
                      </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex space-x-4">
                                            <a href={`mailto:${member.email}`} className="text-barber hover:text-barber-muted transition-colors">
                                                <Mail className="h-5 w-5" />
                                            </a>
                                            <a href={`tel:${member.phone}`} className="text-barber hover:text-barber-muted transition-colors">
                                                <Phone className="h-5 w-5" />
                                            </a>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="text-barber hover:text-barber-muted border border-barber hover:bg-barber/5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMember(member);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Member Detail Modal */}
            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedMember && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-barber-dark flex items-center gap-2">
                                    {selectedMember.name}
                                    <div className="flex items-center ml-2">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        <span className="text-lg ml-1">{selectedMember.rating}</span>
                                    </div>
                                </DialogTitle>
                                <DialogDescription className="text-lg text-barber">
                                    {selectedMember.role} • {selectedMember.experience} Years Experience
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <img
                                        src={selectedMember.image}
                                        alt={selectedMember.name}
                                        className="w-full h-64 object-cover rounded-lg"
                                    />

                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                                            <Award className="h-5 w-5 mr-2 text-barber" />
                                            Certifications
                                        </h3>
                                        <ul className="space-y-2">
                                            {selectedMember.certifications.map((cert, index) => (
                                                <li key={index} className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 mr-2 text-barber" />
                                                    {cert}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                                        <p className="flex items-center mb-2">
                                            <Mail className="h-5 w-5 mr-2 text-barber" />
                                            <a href={`mailto:${selectedMember.email}`} className="text-barber hover:underline">
                                                {selectedMember.email}
                                            </a>
                                        </p>
                                        <p className="flex items-center">
                                            <Phone className="h-5 w-5 mr-2 text-barber" />
                                            <a href={`tel:${selectedMember.phone}`} className="text-barber hover:underline">
                                                {selectedMember.phone}
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">About {selectedMember.name}</h3>
                                    <p className="text-gray-700 mb-6">{selectedMember.bio}</p>

                                    <h3 className="text-lg font-semibold mb-3">Specializations</h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {selectedMember.specializations.map((spec) => (
                                            <span
                                                key={spec}
                                                className="px-3 py-1 bg-barber/10 text-barber text-sm rounded-full"
                                            >
                        {spec.charAt(0).toUpperCase() + spec.slice(1)}
                      </span>
                                        ))}
                                    </div>

                                    <h3 className="text-lg font-semibold mb-3">Portfolio</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {selectedMember.portfolioImages.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                alt={`Portfolio ${index + 1}`}
                                                className="rounded-lg h-32 w-full object-cover"
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        asChild
                                        className="w-full mt-6 bg-barber hover:bg-barber-muted text-white"
                                    >
                                        <Link to="/booking">
                                            <Calendar className="h-5 w-5 mr-2" /> Book Appointment with {selectedMember.name.split(" ")[0]}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default Team;
