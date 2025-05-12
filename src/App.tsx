
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import Home from "./pages/Home";
import Services from "./pages/Services";
import Team from "./pages/Team";
import Reviews from "./pages/Reviews";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// User Dashboard
import UserDashboard from "./pages/user-dashboard/UserDashboard";

// Barber Dashboard
import BarberDashboard from "./pages/barber-dashboard/BarberDashboard";
import BarberPortfolio from "./pages/barber-dashboard/BarberPortfolio";

// Admin Dashboard
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <AuthProvider>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/reviews" element={<Reviews />} />
                        <Route path="/booking" element={<Booking />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Client Dashboard Routes */}
                        <Route path="/user-dashboard" element={<UserDashboard />} />
                        <Route path="/user-dashboard/:tab" element={<UserDashboard />} />

                        {/* Barber Dashboard Routes */}
                        <Route path="/barber-dashboard" element={<BarberDashboard />} />
                        <Route path="/barber-dashboard/portfolio" element={<BarberPortfolio />} />

                        {/* Admin Dashboard Routes */}
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />

                        {/* 404 Page */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </TooltipProvider>
            </AuthProvider>
        </BrowserRouter>
    </QueryClientProvider>
);

export default App;
