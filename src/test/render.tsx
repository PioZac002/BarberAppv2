import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";

/**
 * Renders a component inside the providers the app always gives it.
 *
 * Rendering a page bare throws on the first context hook it reaches, so every
 * page test needs the same wrapper. Keeping it here means a new test does not
 * have to rediscover which providers a page depends on.
 */
const Providers = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <LanguageProvider>
                    <MemoryRouter>
                        <AuthProvider>{children}</AuthProvider>
                    </MemoryRouter>
                </LanguageProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
    render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";
