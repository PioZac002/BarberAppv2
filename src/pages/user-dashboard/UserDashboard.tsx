
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Calendar, User, Star, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Dummy data for the dashboard
const upcomingAppointment = {
    id: 1,
    date: "2023-11-15",
    time: "10:30 AM",
    service: "Classic Haircut",
    barber: "David Mitchell",
};

const UserDashboard = () => {
    const { user, loading } = useRequireAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <DashboardLayout title="Dashboard Overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Welcome Card */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-2xl">
                                Hello, {user?.firstName || "Client"}!
                            </CardTitle>
                            <CardDescription>
                                Welcome to your personal dashboard. Here's a summary of your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <Calendar className="h-8 w-8 text-barber mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Appointments</p>
                                        <p className="text-xl font-semibold">3 Total</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <Clock className="h-8 w-8 text-barber mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Hours Saved</p>
                                        <p className="text-xl font-semibold">2.5 Hours</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <Star className="h-8 w-8 text-barber mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Avg Rating</p>
                                        <p className="text-xl font-semibold">5.0</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button asChild className="w-full mb-2 bg-barber hover:bg-barber-muted">
                                <Link to="/booking">Book New Appointment</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full mb-2">
                                <Link to="/user-dashboard/appointments">View My Appointments</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/user-dashboard/profile">Update Profile</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Appointment */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-barber" />
                                Upcoming Appointment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingAppointment ? (
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <div className="flex flex-col sm:flex-row justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{upcomingAppointment.service}</h3>
                                            <p className="text-gray-600">with {upcomingAppointment.barber}</p>
                                        </div>
                                        <div className="mt-2 sm:mt-0 flex items-center">
                                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                            <span>
                        {new Date(upcomingAppointment.date).toLocaleDateString()} at{" "}
                                                {upcomingAppointment.time}
                      </span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-barber text-barber hover:bg-barber/10"
                                        >
                                            Reschedule
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-500 text-red-500 hover:bg-red-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">You have no upcoming appointments.</p>
                                    <Button asChild className="bg-barber hover:bg-barber-muted">
                                        <Link to="/booking">Book Now</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activities / Notifications */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Bell className="h-5 w-5 mr-2 text-barber" />
                                Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                <li className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-sm">Your appointment for Classic Haircut is confirmed.</p>
                                    <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                                </li>
                                <li className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-sm">
                                        New promotional offer: 20% off for all services this weekend!
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">5 days ago</p>
                                </li>
                                <li className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-sm">
                                        Thank you for your recent visit. Please rate your experience.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                                </li>
                            </ul>
                            <Button
                                variant="link"
                                className="w-full mt-4 text-barber"
                                asChild
                            >
                                <Link to="/user-dashboard/notifications">View All Notifications</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserDashboard;
