import { useState, useEffect } from "react";
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

interface StatsData {
    users: number;
    activeAppointments: number;
    services: number;
    revenue: number;
}

interface RevenueData {
    month: string;
    amount: number;
}

interface Activity {
    id: number;
    type: string;
    description: string;
    timestamp: string;
}

const AdminOverview = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, revenueRes, activitiesRes] = await Promise.all([
                    fetch('http://localhost:3000/api/admin/stats', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/revenue', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/recent-activities', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                ]);

                if (!statsRes.ok || !revenueRes.ok || !activitiesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const statsData = await statsRes.json();
                const revenueData = await revenueRes.json();
                const activitiesData = await activitiesRes.json();

                setStats(statsData);
                setRevenue(revenueData);
                setActivities(activitiesData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{stats?.users || 0}</h4>
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
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{stats?.activeAppointments || 0}</h4>
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
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{stats?.services || 0}</h4>
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
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">${stats?.revenue || 0}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+12.5%</span>
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
                                {revenue.map((data, index) => (
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
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex">
                                    <div className="mr-4">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium">{activity.type}</p>
                                        <p className="text-sm text-gray-500">{activity.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOverview;