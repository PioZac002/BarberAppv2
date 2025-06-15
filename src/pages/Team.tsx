import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Mail,
    Phone,
    Star,
    Calendar as CalendarIcon,
    Award,
    CheckCircle,
    User as UserIcon,
    Camera // Dodano ikonę aparatu dla portfolio
} from "lucide-react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Typy i dane pozostają bez zmian
type SpecializationId = "all" | "haircut" | "beard" | "coloring" | "shaving" | "kids";
const specializationOptions = [
    { id: "all", name: "All Specializations" },
    { id: "haircut", name: "Haircuts" },
    { id: "beard", name: "Beard Styling" },
    { id: "coloring", name: "Hair Coloring" },
    { id: "shaving", name: "Traditional Shaving" },
    { id: "kids", name: "Kids Haircuts" },
];

interface BarberSummary {
    id: number;
    name: string;
    role: string;
    rating: number;
    experience: number;
    specializations: string[];
    image: string | null;
}

interface BarberDetails extends BarberSummary {
    email: string;
    phone: string;
    bio: string;
    certifications: string[];
    portfolioImages: (string | null)[];
}

const Team = () => {
    const [teamMembers, setTeamMembers] = useState<BarberSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialization, setSelectedSpecialization] = useState<SpecializationId>("all");

    const [selectedMemberForModal, setSelectedMemberForModal] = useState<BarberSummary | null>(null);
    const [detailedMemberProfile, setDetailedMemberProfile] = useState<BarberDetails | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("http://localhost:3000/api/public/team/barbers");
                if (!response.ok) {
                    throw new Error("Failed to fetch team members");
                }
                const data = await response.json();
                setTeamMembers(data);
            } catch (error) {
                console.error("Error fetching team members:", error);
                toast.error("Could not load team members. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        if (selectedMemberForModal?.id) {
            const fetchMemberDetails = async () => {
                setIsModalLoading(true);
                setDetailedMemberProfile(null);
                try {
                    const response = await fetch(`http://localhost:3000/api/public/team/barbers/${selectedMemberForModal.id}/details`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch details for ${selectedMemberForModal.name}`);
                    }
                    const data = await response.json();
                    setDetailedMemberProfile(data);
                } catch (error) {
                    console.error("Error fetching member details:", error);
                    toast.error(`Could not load details for ${selectedMemberForModal.name}.`);
                } finally {
                    setIsModalLoading(false);
                }
            };
            fetchMemberDetails();
        }
    }, [selectedMemberForModal]);

    const filteredMembers = teamMembers.filter((member) => {
        const nameMatches = member.name.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatches = member.role.toLowerCase().includes(searchTerm.toLowerCase());
        const specializationMatches = selectedSpecialization === "all" ||
            (member.specializations && member.specializations.some(spec => spec.toLowerCase() === selectedSpecialization.toLowerCase()));
        return (nameMatches || roleMatches) && specializationMatches;
    });

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
        const fullIfAlmost = rating % 1 >= 0.75;
        let renderedStars = [];

        for (let i = 0; i < 5; i++) {
            if (i < fullStars || (i === fullStars && fullIfAlmost)) {
                renderedStars.push(<Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-yellow-400" />);
            } else if (i === fullStars && halfStar) {
                renderedStars.push(<Star key={`half-${i}`} className="h-5 w-5 text-yellow-400" />);
            } else {
                renderedStars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
            }
        }
        return <div className="flex">{renderedStars}</div>;
    };

    return (
        <Layout>
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

            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-auto md:flex-grow md:max-w-xs">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name or role..."
                                    className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-barber focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                {specializationOptions.map(spec => (
                                    <Button
                                        key={spec.id}
                                        onClick={() => setSelectedSpecialization(spec.id as SpecializationId)}
                                        variant={selectedSpecialization === spec.id ? "default" : "outline"}
                                        className={
                                            selectedSpecialization === spec.id
                                                ? "bg-barber hover:bg-barber-muted"
                                                : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                                        }
                                        size="sm"
                                    >
                                        {spec.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber mx-auto"></div>
                            <p className="mt-3 text-gray-600">Loading team members...</p>
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMembers.map((member, index) => (
                                <div
                                    key={member.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
                                    onClick={() => setSelectedMemberForModal(member)}
                                    style={{ animationDelay: `${0.05 * index}s` }}
                                >
                                    <div className="h-64 overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <UserIcon className="h-24 w-24 text-slate-400 dark:text-slate-500" />
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-xl font-semibold mb-1 text-gray-800 group-hover:text-barber transition-colors">
                                            {member.name}
                                        </h3>
                                        <p className="text-barber text-sm mb-3">{member.role}</p>
                                        <div className="flex items-center mb-3 text-sm">
                                            <div className="flex items-center mr-4">
                                                {renderStars(member.rating)}
                                                <span className="ml-1.5 text-gray-600">({member.rating.toFixed(1)})</span>
                                            </div>
                                            <span className="text-gray-600">{member.experience} Yrs Exp.</span>
                                        </div>
                                        {member.specializations && member.specializations.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {member.specializations.slice(0, 3).map((spec) => (
                                                    <Badge
                                                        key={spec}
                                                        variant="secondary"
                                                        className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                    >
                                                        {spec.charAt(0).toUpperCase() + spec.slice(1)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full text-barber border-barber hover:bg-barber hover:text-white transition-colors"
                                            onClick={(e) => { e.stopPropagation(); setSelectedMemberForModal(member); }}
                                        >
                                            View Profile
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 col-span-full">
                            <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No team members match your criteria.</p>
                            <p className="text-gray-500">Try adjusting your search or filter.</p>
                        </div>
                    )}
                </div>
            </section>

            <Dialog open={!!selectedMemberForModal} onOpenChange={(open) => !open && setSelectedMemberForModal(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                    {detailedMemberProfile && (
                        <DialogHeader className="sr-only">
                            <DialogTitle>Details for {detailedMemberProfile.name}</DialogTitle>
                            <DialogDescription>
                                Detailed information about {detailedMemberProfile.role}, {detailedMemberProfile.name}.
                            </DialogDescription>
                        </DialogHeader>
                    )}

                    {isModalLoading && !detailedMemberProfile ? (
                        <div className="h-96 flex items-center justify-center p-6">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-barber"></div>
                        </div>
                    ) : detailedMemberProfile ? (
                        <>
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
                                    <div className="flex-shrink-0">
                                        {detailedMemberProfile.image ? (
                                            <img
                                                src={detailedMemberProfile.image}
                                                alt={detailedMemberProfile.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white shadow-md">
                                                <UserIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 sm:mt-0">
                                        <h2 className="text-3xl font-bold text-gray-900">{detailedMemberProfile.name}</h2>
                                        <p className="text-lg text-gray-600 mt-1">
                                            {detailedMemberProfile.role} • {detailedMemberProfile.experience} Years Exp.
                                        </p>
                                        <div className="flex mt-2">{renderStars(detailedMemberProfile.rating)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-x-8 gap-y-6">
                                    <div className="md:col-span-3 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-800">About {detailedMemberProfile.name.split(" ")[0]}</h3>
                                            <p className="text-base text-gray-600 leading-relaxed">{detailedMemberProfile.bio || "No biography provided."}</p>
                                        </div>
                                        {detailedMemberProfile.specializations && detailedMemberProfile.specializations.length > 0 && (
                                            <div>
                                                <h3 className="text-xl font-semibold mb-3 text-gray-800">Specializations</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {detailedMemberProfile.specializations.map((spec) => (
                                                        <Badge key={spec} variant="secondary" className="bg-barber/10 text-barber text-sm">{spec.charAt(0).toUpperCase() + spec.slice(1)}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-6">
                                        {detailedMemberProfile.certifications && detailedMemberProfile.certifications.length > 0 && (
                                            <div>
                                                <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
                                                    <Award className="h-5 w-5 mr-2 text-barber" /> Certifications
                                                </h3>
                                                <ul className="space-y-1.5 text-sm text-gray-600">
                                                    {detailedMemberProfile.certifications.map((cert, index) => (
                                                        <li key={index} className="flex items-center">
                                                            <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" /> {cert}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-semibold mb-3 text-gray-800">Contact</h3>
                                            {detailedMemberProfile.email && (
                                                <p className="flex items-center mb-1 text-sm">
                                                    <Mail className="h-4 w-4 mr-2 text-barber flex-shrink-0" />
                                                    <a href={`mailto:${detailedMemberProfile.email}`} className="text-barber hover:underline truncate">
                                                        {detailedMemberProfile.email}
                                                    </a>
                                                </p>
                                            )}
                                            {detailedMemberProfile.phone && (
                                                <p className="flex items-center text-sm">
                                                    <Phone className="h-4 w-4 mr-2 text-barber flex-shrink-0" />
                                                    <a href={`tel:${detailedMemberProfile.phone}`} className="text-barber hover:underline">
                                                        {detailedMemberProfile.phone}
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {detailedMemberProfile.portfolioImages && detailedMemberProfile.portfolioImages.length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-5">
                                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Portfolio</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {detailedMemberProfile.portfolioImages.slice(0, 8).map((img, index) => (
                                            <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-sm bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                {img ? (
                                                    <img src={img} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-t sticky bottom-0 bg-white/80 backdrop-blur-sm">
                                <Button asChild className="w-full bg-barber hover:bg-barber-muted text-white text-lg py-6">
                                    <Link to={`/booking?barberId=${detailedMemberProfile.id}`}>
                                        <CalendarIcon className="h-5 w-5 mr-2" /> Book with {detailedMemberProfile.name.split(" ")[0]}
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="h-96 flex items-center justify-center p-6">
                            <p className="text-gray-500">Could not load barber details or barber not found.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default Team;