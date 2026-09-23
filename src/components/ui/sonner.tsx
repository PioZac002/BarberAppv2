import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Notices are slips printed at the counter: label stock, square, one rule. */
const Toaster = ({ ...props }: ToasterProps) => {
    const { theme } = useTheme();

    return (
        <Sonner
            theme={theme === "dark" ? "dark" : "light"}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:rounded-[2px] group-[.toaster]:bg-card " +
                        "group-[.toaster]:text-card-foreground group-[.toaster]:border " +
                        "group-[.toaster]:border-foreground/25 group-[.toaster]:shadow-plate-lift",
                    title: "group-[.toast]:label-caps group-[.toast]:text-[0.8125rem]",
                    description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
                    actionButton:
                        "group-[.toast]:label-caps group-[.toast]:rounded-[2px] group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:label-caps group-[.toast]:rounded-[2px] group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
                    error: "group-[.toaster]:border-destructive",
                },
            }}
            {...props}
        />
    );
};

export { Toaster, toast };
