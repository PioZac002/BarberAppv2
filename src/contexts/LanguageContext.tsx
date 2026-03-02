import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'pl' | 'en';

interface LanguageContextType {
    lang: Language;
    toggleLang: () => void;
    t: (path: string) => string;
}

const translations = {
    pl: {
        nav: {
            home: 'Strona główna',
            services: 'Usługi',
            team: 'Zespół',
            reviews: 'Opinie',
            bookAppointment: 'Zarezerwuj wizytę',
            account: 'Konto',
            profile: 'Profil',
            dashboard: 'Panel',
            logout: 'Wyloguj',
            login: 'Zaloguj się',
            register: 'Zarejestruj się',
        },
        adminMenu: {
            overview: 'Przegląd',
            users: 'Użytkownicy',
            appointments: 'Wizyty',
            services: 'Usługi',
            reviews: 'Opinie',
        },
        home: {
            heroTitle: 'Klasyczne cięcia',
            heroSubtitle: 'w nowoczesnym stylu',
            heroDescription: 'Doświadcz doskonałości fryzjerstwa w komfortowym i stylowym środowisku. Nasi wykwalifikowani barberzy dbają o każdy detal.',
            bookNow: 'Zarezerwuj teraz',
            ourServices: 'Nasze usługi',
            whyChooseUs: 'Dlaczego warto nas wybrać?',
            feature1Title: 'Doświadczeni barberzy',
            feature1Desc: 'Nasi barberzy mają wieloletnie doświadczenie i regularnie doskonalą swoje umiejętności.',
            feature2Title: 'Wygodna rezerwacja',
            feature2Desc: 'Zarezerwuj wizytę online w dowolnym czasie, bez konieczności dzwonienia.',
            feature3Title: 'Usługi premium',
            feature3Desc: 'Oferujemy szeroki zakres usług, od klasycznych cięć po zabiegi pielęgnacyjne.',
            feature4Title: 'Wysokiej jakości produkty',
            feature4Desc: 'Używamy wyłącznie profesjonalnych produktów najwyższej jakości.',
            ctaTitle: 'Gotowy na zmianę wizerunku?',
            ctaDescription: 'Zarezerwuj wizytę już dziś i doświadcz wyjątkowej opieki naszych specjalistów.',
            ctaButton: 'Zarezerwuj teraz',
        },
        footer: {
            tagline: 'Usługi premium dla mężczyzny. Doświadcz tradycji barberskiej w nowoczesnym wydaniu.',
            quickLinks: 'Szybkie linki',
            team: 'Nasz zespół',
            servicesTitle: 'Usługi',
            haircut: 'Strzyżenie',
            beardTrim: 'Trymowanie brody',
            hotTowelShave: 'Golenie z gorącym ręcznikiem',
            hairColoring: 'Koloryzacja włosów',
            kidsHaircut: 'Strzyżenie dziecięce',
            contact: 'Kontakt',
            allRightsReserved: 'Wszelkie prawa zastrzeżone.',
            privacyPolicy: 'Polityka prywatności',
            terms: 'Regulamin',
            contactUs: 'Skontaktuj się z nami',
        },
        dashboard: {
            welcome: 'Witaj',
            overview: 'Przegląd',
            appointments: 'Wizyty',
            profile: 'Profil',
            reviews: 'Opinie',
            notifications: 'Powiadomienia',
            schedule: 'Grafik',
            portfolio: 'Portfolio',
            users: 'Użytkownicy',
            services: 'Usługi',
            reports: 'Raporty',
            logout: 'Wyloguj',
            adminPanel: 'Panel Administratora',
            barberPanel: 'Panel Barbera',
            clientPanel: 'Panel Klienta',
        },
        services: {
            title: 'Nasze usługi',
            subtitle: 'Od klasycznych cięć po zabiegi pielęgnacyjne premium – oferujemy szeroki zakres usług dopasowanych do nowoczesnego mężczyzny.',
            bookAppointment: 'Zarezerwuj wizytę',
            loading: 'Ładowanie listy usług...',
            noServices: 'Obecnie brak dostępnych usług.',
            noServicesHint: 'Sprawdź ponownie w późniejszym terminie.',
            duration: 'min',
        },
        team: {
            title: 'Nasz zespół',
            subtitle: 'Poznaj naszych wykwalifikowanych specjalistów, którzy zadbają o Twój wygląd.',
            experience: 'lat doświadczenia',
            bookWith: 'Zarezerwuj z',
            seePortfolio: 'Zobacz portfolio',
        },
        booking: {
            title: 'Zarezerwuj wizytę',
            subtitle: 'Wybierz usługę, barbera i termin który Ci odpowiada.',
        },
        auth: {
            loginTitle: 'Zaloguj się',
            loginSubtitle: 'Wpisz swoje dane aby uzyskać dostęp do konta.',
            registerTitle: 'Utwórz konto',
            registerSubtitle: 'Zarejestruj się, aby móc rezerwować wizyty.',
            email: 'Adres e-mail',
            password: 'Hasło',
            firstName: 'Imię',
            lastName: 'Nazwisko',
            phone: 'Numer telefonu',
            loginButton: 'Zaloguj się',
            registerButton: 'Zarejestruj się',
            noAccount: 'Nie masz konta?',
            hasAccount: 'Masz już konto?',
            signUpLink: 'Zarejestruj się',
            signInLink: 'Zaloguj się',
        },
        common: {
            loading: 'Ładowanie...',
            save: 'Zapisz',
            cancel: 'Anuluj',
            edit: 'Edytuj',
            delete: 'Usuń',
            confirm: 'Potwierdź',
            back: 'Wstecz',
            close: 'Zamknij',
        },
    },
    en: {
        nav: {
            home: 'Home',
            services: 'Services',
            team: 'Team',
            reviews: 'Reviews',
            bookAppointment: 'Book Appointment',
            account: 'Account',
            profile: 'Profile',
            dashboard: 'Dashboard',
            logout: 'Sign Out',
            login: 'Sign In',
            register: 'Sign Up',
        },
        adminMenu: {
            overview: 'Overview',
            users: 'Users',
            appointments: 'Appointments',
            services: 'Services',
            reviews: 'Reviews',
        },
        home: {
            heroTitle: 'Classic cuts',
            heroSubtitle: 'in modern style',
            heroDescription: 'Experience the excellence of barbering in a comfortable and stylish environment. Our skilled barbers take care of every detail.',
            bookNow: 'Book Now',
            ourServices: 'Our Services',
            whyChooseUs: 'Why choose us?',
            feature1Title: 'Experienced barbers',
            feature1Desc: 'Our barbers have years of experience and regularly hone their skills.',
            feature2Title: 'Easy booking',
            feature2Desc: 'Book an appointment online at any time, without the need to call.',
            feature3Title: 'Premium services',
            feature3Desc: 'We offer a wide range of services, from classic cuts to grooming treatments.',
            feature4Title: 'High quality products',
            feature4Desc: 'We use only professional products of the highest quality.',
            ctaTitle: 'Ready for a new look?',
            ctaDescription: 'Book an appointment today and experience the exceptional care of our specialists.',
            ctaButton: 'Book Now',
        },
        footer: {
            tagline: 'Premium services for men. Experience barbering tradition in a modern setting.',
            quickLinks: 'Quick Links',
            team: 'Our Team',
            servicesTitle: 'Services',
            haircut: 'Haircut',
            beardTrim: 'Beard Trim',
            hotTowelShave: 'Hot Towel Shave',
            hairColoring: 'Hair Coloring',
            kidsHaircut: "Kids' Haircut",
            contact: 'Contact',
            allRightsReserved: 'All rights reserved.',
            privacyPolicy: 'Privacy Policy',
            terms: 'Terms of Service',
            contactUs: 'Contact Us',
        },
        dashboard: {
            welcome: 'Welcome',
            overview: 'Overview',
            appointments: 'Appointments',
            profile: 'Profile',
            reviews: 'Reviews',
            notifications: 'Notifications',
            schedule: 'Schedule',
            portfolio: 'Portfolio',
            users: 'Users',
            services: 'Services',
            reports: 'Reports',
            logout: 'Sign Out',
            adminPanel: 'Admin Panel',
            barberPanel: 'Barber Panel',
            clientPanel: 'Client Panel',
        },
        services: {
            title: 'Our Services',
            subtitle: 'From classic cuts to premium grooming treatments – we offer a wide range of services tailored to the modern man.',
            bookAppointment: 'Book Appointment',
            loading: 'Loading services...',
            noServices: 'No services available.',
            noServicesHint: 'Check back later.',
            duration: 'min',
        },
        team: {
            title: 'Our Team',
            subtitle: 'Meet our skilled specialists who will take care of your appearance.',
            experience: 'years of experience',
            bookWith: 'Book with',
            seePortfolio: 'See portfolio',
        },
        booking: {
            title: 'Book an Appointment',
            subtitle: 'Choose a service, barber, and time that suits you.',
        },
        auth: {
            loginTitle: 'Sign In',
            loginSubtitle: 'Enter your credentials to access your account.',
            registerTitle: 'Create Account',
            registerSubtitle: 'Sign up to book appointments.',
            email: 'Email address',
            password: 'Password',
            firstName: 'First name',
            lastName: 'Last name',
            phone: 'Phone number',
            loginButton: 'Sign In',
            registerButton: 'Sign Up',
            noAccount: "Don't have an account?",
            hasAccount: 'Already have an account?',
            signUpLink: 'Sign Up',
            signInLink: 'Sign In',
        },
        common: {
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            edit: 'Edit',
            delete: 'Delete',
            confirm: 'Confirm',
            back: 'Back',
            close: 'Close',
        },
    },
} as const;

type TranslationObj = typeof translations.pl;

function getNestedValue(obj: Record<string, any>, path: string): string {
    const result = path.split('.').reduce<any>((current, key) => current?.[key], obj);
    return typeof result === 'string' ? result : path;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<Language>(() => {
        return (localStorage.getItem('language') as Language) || 'pl';
    });

    const toggleLang = () => {
        const newLang = lang === 'pl' ? 'en' : 'pl';
        setLang(newLang);
        localStorage.setItem('language', newLang);
    };

    const t = (path: string): string => {
        return getNestedValue(translations[lang] as Record<string, any>, path);
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
