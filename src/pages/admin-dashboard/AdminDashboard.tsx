
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    Calendar,
    Scissors,
    DollarSign,
    TrendingUp,
    Clock,
    UserCheck,
    Star,
} from "lucide-react";

// Sample data for the admin dashboard
const statsData = {
    users: 1254,
    activeAppointments: 87,
    services: 24,
    revenue: 8976,
    growthRate: 12.5,
};

// Revenue data for the chart
const revenueData = [
    { month: "Jan", amount: 5200 },
    { month: "Feb", amount: 5800 },
    { month: "Mar", amount: 6300 },
    { month: "Apr", amount: 5900 },
    { month: "May", amount: 6800 },
    { month: "Jun", amount: 7200 },
    { month: "Jul", amount: 7800 },
    { month: "Aug", amount: 8100 },
    { month: "Sep", amount: 8500 },
    { month: "Oct", amount: 8976 },
];

const AdminDashboard = () => {
    const { user, loading } = useRequireAuth({ allowedRoles: ["admin"] });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <DashboardLayout title="Admin Dashboard">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{statsData.users}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+7.2%</span>
                            <span className="ml-1 text-gray-500">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Appointments</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{statsData.activeAppointments}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                            <Clock className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-blue-500 font-medium">18 today</span>
                            <span className="ml-1 text-gray-500">across all barbers</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Services</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{statsData.services}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Scissors className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-yellow-500 font-medium">4.8 avg rating</span>
                            <span className="ml-1 text-gray-500">across all services</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">${statsData.revenue}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+{statsData.growthRate}%</span>
                            <span className="ml-1 text-gray-500">vs last month</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-barber" />
                            Revenue Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <div className="h-full w-full flex items-end">
                                {revenueData.map((data, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-barber mb-2 rounded-t-sm"
                                            style={{
                                                height: `${(data.amount / 9000) * 100}%`,
                                                maxHeight: "90%"
                                            }}
                                        ></div>
                                        <p className="text-xs text-gray-500">{data.month}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-barber" />
                            Recent Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex">
                                <div className="mr-4">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <UserCheck className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">New user registered</p>
                                    <p className="text-sm text-gray-500">John Smith created a new account</p>
                                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="mr-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">New appointment booked</p>
                                    <p className="text-sm text-gray-500">Michael Brown booked a Classic Haircut</p>
                                    <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="mr-4">
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Star className="h-5 w-5 text-yellow-600" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">New review submitted</p>
                                    <p className="text-sm text-gray-500">James Wilson left a 5-star review</p>
                                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="mr-4">
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">Appointment cancelled</p>
                                    <p className="text-sm text-gray-500">Robert Johnson cancelled his appointment</p>
                                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="mr-4">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Scissors className="h-5 w-5 text-purple-600" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium">New service added</p>
                                    <p className="text-sm text-gray-500">Admin added "Hair Coloring with Highlights"</p>
                                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
