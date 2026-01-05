import { Link } from "react-router-dom";
import { ArrowRight, Scissors, Clock, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const Home = () => {
    return (
        <Layout>
            {/* Sekcja hero */}
            <section className="relative h-screen flex items-center">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80')",
                    }}
                ></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div
                        className="max-w-2xl animate-fade-in opacity-0"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Klasyczne cięcia{" "}
                            <span className="text-barber">w nowoczesnym stylu</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            Premium usługi barberskie dla wymagających mężczyzn.
                            Doświadcz perfekcyjnej pielęgnacji w swobodnej, ale profesjonalnej atmosferze.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                asChild
                                className="bg-barber hover:bg-barber-muted text-white text-lg px-8 py-6 btn-hover"
                            >
                                <Link to="/booking">Zarezerwuj wizytę</Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                className="bg-barber hover:bg-barber-muted text-white text-lg px-8 py-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                            >
                                <Link to="/services">Nasze usługi</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sekcja z cechami */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 section">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-barber-dark">
                            Dlaczego warto wybrać nasz barbershop?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Łączymy klasyczne rzemiosło barberskie z nowoczesnym stylem,
                            oferując usługi na najwyższym poziomie wykonywane przez doświadczony zespół.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Cecha 1 */}
                        <div
                            className="bg-gray-50 p-8 rounded-lg shadow-sm section"
                            style={{ animationDelay: "0.1s" }}
                        >
                            <div className="bg-barber rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                                <Scissors className="text-white h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-center">
                                Doświadczeni barberzy
                            </h3>
                            <p className="text-gray-600 text-center">
                                Nasz zespół tworzą wykwalifikowani specjaliści z wieloletnim
                                doświadczeniem w nowoczesnych i klasycznych technikach strzyżenia.
                            </p>
                        </div>

                        {/* Cecha 2 */}
                        <div
                            className="bg-gray-50 p-8 rounded-lg shadow-sm section"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <div className="bg-barber rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                                <Clock className="text-white h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-center">
                                Wygodna rezerwacja
                            </h3>
                            <p className="text-gray-600 text-center">
                                Nasz system rezerwacji online pozwala łatwo zaplanować wizytę
                                w dogodnym dla Ciebie terminie, o każdej porze – 24/7.
                            </p>
                        </div>

                        {/* Cecha 3 */}
                        <div
                            className="bg-gray-50 p-8 rounded-lg shadow-sm section"
                            style={{ animationDelay: "0.3s" }}
                        >
                            <div className="bg-barber rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                                <Star className="text-white h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-center">
                                Usługi premium
                            </h3>
                            <p className="text-gray-600 text-center">
                                Od klasycznego strzyżenia, przez modelowanie brody,
                                po gorące ręczniki – oferujemy szeroki zakres usług
                                dopasowanych do Twoich potrzeb.
                            </p>
                        </div>

                        {/* Cecha 4 */}
                        <div
                            className="bg-gray-50 p-8 rounded-lg shadow-sm section"
                            style={{ animationDelay: "0.4s" }}
                        >
                            <div className="bg-barber rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                                <Award className="text-white h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-center">
                                Wysokiej jakości produkty
                            </h3>
                            <p className="text-gray-600 text-center">
                                Korzystamy wyłącznie ze sprawdzonych kosmetyków do włosów
                                i brody, aby zapewnić najlepszy efekt i długotrwały rezultat.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sekcja CTA */}
            <section className="py-20 bg-barber-dark">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between">
                        <div className="mb-8 lg:mb-0 lg:w-1/2 section">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                Gotowy na nowy, świeży wygląd?
                            </h2>
                            <p className="text-xl text-gray-300 mb-6">
                                Zarezerwuj wizytę już dziś i skorzystaj z naszych
                                usług premium. Dobrze wyglądać jeszcze nigdy nie było tak prosto.
                            </p>
                            <Button
                                asChild
                                className="bg-barber hover:bg-barber-muted text-white text-lg px-8 py-6 btn-hover flex items-center"
                            >
                                <Link to="/booking">
                                    Zarezerwuj teraz{" "}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                        <div
                            className="lg:w-1/3 section"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1517832606299-7ae9b720a186?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80"
                                alt="Wnętrze barber shopu"
                                className="rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Home;
