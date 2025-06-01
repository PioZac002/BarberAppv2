import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import Home from "./pages/Home";
import PublicServices from "./pages/Services";
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
// Importy podstron BarberDashboard nie są tu potrzebne, jeśli BarberDashboard.tsx ma własne <Routes>

// Admin Dashboard
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard";
// Importy podstron AdminDashboard nie są tu potrzebne, jeśli AdminDashboard.tsx ma własne <Routes>

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
                        <Route path="/services" element={<PublicServices />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/reviews" element={<Reviews />} />
                        <Route path="/booking" element={<Booking />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Client Dashboard Routes */}
                        {/* Użyj /* aby UserDashboard mógł obsługiwać zagnieżdżone trasy np. /:tab */}
                        <Route path="/user-dashboard/*" element={<UserDashboard />} />

                        {/* Barber Dashboard Routes */}
                        {/* Użyj /* aby BarberDashboard mógł obsługiwać zagnieżdżone trasy */}
                        <Route path="/barber-dashboard/*" element={<BarberDashboard />} />

                        {/* Admin Dashboard Routes */}
                        {/* KLUCZOWA ZMIANA: Użyj "/*", aby AdminDashboard mógł obsługiwać wszystkie zagnieżdżone trasy */}
                        <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
                        {/* Usuwamy zagnieżdżone <Route> stąd, ponieważ są one teraz w AdminDashboard.tsx */}

                        {/* 404 Page */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </TooltipProvider>
            </AuthProvider>
        </BrowserRouter>
    </QueryClientProvider>
);

export default App;