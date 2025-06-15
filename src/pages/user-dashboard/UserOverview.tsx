import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar, // Jeśli to ikona z Lucide, upewnij się, że nie ma konfliktu z komponentem Calendar
    User,
    Star,
    Bell,
    Clock,
    CheckSquare,
    ThumbsUp,
    ArrowRight,
    Info,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isValid } from "date-fns";

// Interfejsy skopiowane z UserDashboard.tsx
interface UpcomingAppointmentInfo {
    id: number;
    date: string;
    time: string;
    service: string;
    barber: string;
}

interface UserStatsInfo {
    totalAppointments: number;
    hoursSaved: string; // To pole wydaje się nieużywane w logice, ale zostawiam
    avgRatingGiven: number | null;
}

interface OverviewNotificationInfo {
    id: number;
    title: string;
    created_at: string;
    link?: string | null;
    is_read: boolean;
    type?: string;
}

const UserOverview = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    // useRequireAuth jest już w UserDashboard.tsx, więc tutaj nie jest potrzebne

    const [upcomingAppointment, setUpcomingAppointment] = useState<UpcomingAppointmentInfo | null>(null);
    const [userStats, setUserStats] = useState<UserStatsInfo | null>(null);
    const [recentNotifications, setRecentNotifications] = useState<OverviewNotificationInfo[]>([]);
    const [isOverviewDataLoadingLocal, setIsOverviewDataLoadingLocal] = useState(true);

    useEffect(() => {
        if (authContextLoading) {
            setIsOverviewDataLoadingLocal(true);
            return;
        }
        if (!authUser || !token) {
            setIsOverviewDataLoadingLocal(false);
            setUpcomingAppointment(null);
            setUserStats(null);
            setRecentNotifications([]);
            return;
        }

        const fetchOverviewData = async () => {
            setIsOverviewDataLoadingLocal(true);
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [statsRes, nextApptRes, notifRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/stats`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/appointments/next-upcoming`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/notifications`, { headers }),
                ]);

                if (statsRes.ok) setUserStats(await statsRes.json());
                else console.error("Failed to fetch user stats:", await statsRes.text());

                if (nextApptRes.ok) setUpcomingAppointment(await nextApptRes.json());
                else {
                    // Jeśli nie ma następnej wizyty (np. 404 lub inny błąd), ustaw na null
                    setUpcomingAppointment(null);
                    console.error("Failed to fetch next upcoming appointment:", await nextApptRes.text());
                }

                if (notifRes.ok) {
                    const allNotifs: OverviewNotificationInfo[] = await notifRes.json();
                    setRecentNotifications(allNotifs.slice(0, 3));
                } else console.error("Failed to fetch recent notifications:", await notifRes.text());

            } catch (error) {
                console.error("Error fetching overview data:", error);
                toast.error("An error occurred while loading dashboard data.");
            } finally {
                setIsOverviewDataLoadingLocal(false);
            }
        };
        fetchOverviewData();
    }, [authUser, token, authContextLoading]);


    const StatCard = ({ title, value, icon, description, linkTo, isAction }: { title: string, value: string | number, icon: React.ReactNode, description?: string, linkTo?: string, isAction?: boolean }) => {
        const content = (
            <div className={`flex items-center p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-200 h-full ${isAction ? 'bg-barber/5 hover:bg-barber/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className={`p-2 sm:p-3 rounded-full mr-3 sm:mr-4 ${isAction ? 'bg-barber/20' : 'bg-barber/10'}`}>
                    {icon}
                </div>
                <div>
                    <p className={`text-xs sm:text-sm font-medium ${isAction ? 'text-barber' : 'text-gray-500'}`}>{title}</p>
                    <p className={`text-lg sm:text-xl font-semibold ${isAction ? 'text-barber' : 'text-gray-800'}`}>{value}</p>
                    {description && !isAction && <p className="text-xs text-gray-400">{description}</p>}
                </div>
            </div>
        );
        return linkTo ? <Link to={linkTo} className="block no-underline h-full">{content}</Link> : <div className="h-full">{content}</div>;
    }

    if (isOverviewDataLoadingLocal || authContextLoading) { // Sprawdzamy oba stany ładowania
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-pulse">
                <div className="md:col-span-2 xl:col-span-3"><Card><CardHeader className="pb-4"><div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div><div className="h-4 bg-gray-300 rounded w-1/2"></div></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="h-20 bg-gray-300 rounded-lg"></div><div className="h-20 bg-gray-300 rounded-lg"></div><div className="h-20 bg-gray-300 rounded-lg"></div></div></CardContent></Card></div>
                <div className="md:col-span-2"><Card><CardHeader><div className="h-6 bg-gray-300 rounded w-1/2"></div></CardHeader><CardContent><div className="h-24 bg-gray-300 rounded-lg"></div></CardContent></Card></div>
                <div className="md:col-span-1"><Card><CardHeader><div className="h-6 bg-gray-300 rounded w-3/4"></div></CardHeader><CardContent><div className="space-y-3"><div className="h-10 bg-gray-300 rounded-md"></div><div className="h-10 bg-gray-300 rounded-md"></div><div className="h-10 bg-gray-300 rounded-md"></div></div></CardContent></Card></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 xl:col-span-3">
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl sm:text-2xl font-semibold">
                            Hello, {authUser?.firstName || "Client"}!
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Welcome to your personal dashboard. Here's a summary of your activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <StatCard
                                title="Total Appointments"
                                value={userStats?.totalAppointments?.toString() ?? "0"}
                                icon={<CheckSquare className="h-6 w-6 text-barber" />}
                                description="Excluding canceled"
                            />
                            <StatCard
                                title="Avg. Rating Given"
                                value={userStats?.avgRatingGiven ? `${userStats.avgRatingGiven}/5.0` : "N/A"}
                                icon={<ThumbsUp className="h-6 w-6 text-barber" />}
                                description="Your average review score"
                            />
                            <StatCard
                                title="Quick Booking"
                                value="Find a Slot"
                                icon={<Calendar className="h-6 w-6 text-barber" />} // Upewnij się, że Calendar to ikona
                                linkTo="/booking"
                                // description="Book your next visit" // Usunięto description dla akcji
                                isAction
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Calendar className="h-5 w-5 mr-2 text-barber" /> {/* Upewnij się, że Calendar to ikona */}
                            Next Upcoming Appointment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointment && upcomingAppointment.date && isValid(new Date(upcomingAppointment.date)) ? (
                            <div className="bg-barber/5 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-md sm:text-lg text-gray-800">{upcomingAppointment.service}</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">with {upcomingAppointment.barber}</p>
                                    </div>
                                    <div className="mt-2 sm:mt-0 text-xs sm:text-sm flex items-center text-gray-700">
                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                        <span>
                                            {format(new Date(upcomingAppointment.date), "MMM d, yyyy")} at{" "}
                                            {upcomingAppointment.time}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled // Funkcjonalność niezaimplementowana
                                        className="w-full sm:w-auto border-barber text-barber hover:bg-barber/10"
                                    >
                                        Reschedule (soon)
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-3">You have no upcoming appointments.</p>
                                <Button asChild className="bg-barber hover:bg-barber-muted">
                                    <Link to="/booking">Book Now</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Bell className="h-5 w-5 mr-2 text-barber" />
                            Recent Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentNotifications.length > 0 ? (
                            <ul className="space-y-2.5">
                                {recentNotifications.map(notif => (
                                    <li key={notif.id} className={`p-2.5 rounded-md border ${notif.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                                        <Link to={notif.link || "/user-dashboard/notifications"} className="block group">
                                            <p className={`text-xs sm:text-sm font-medium truncate group-hover:text-barber ${notif.is_read ? 'text-gray-600' : 'text-gray-800'}`}>{notif.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {isValid(new Date(notif.created_at)) ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : "Invalid date"}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 py-4 text-center">No recent notifications.</p>
                        )}
                        <Button
                            variant="link"
                            className="w-full mt-3 text-barber px-0 text-xs sm:text-sm"
                            asChild
                        >
                            <Link to="/user-dashboard/notifications">View All Notifications</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserOverview;