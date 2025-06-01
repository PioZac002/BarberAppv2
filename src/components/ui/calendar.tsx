import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DropdownProps, CaptionLayout } from "react-day-picker"; // Dodano DropdownProps i CaptionLayout
import { format, addMonths, setMonth, setYear } from "date-fns"; // Dodano więcej funkcji z date-fns
import { pl } from "date-fns/locale"; // Opcjonalnie dla polskich nazw miesięcy/dni

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
                      className,
                      classNames,
                      showOutsideDays = true,
                      // Props poniżej są specyficzne dla tej implementacji i nie są bezpośrednio z DayPickerProps
                      // można je dodać do CalendarProps jeśli chcemy je konfigurować z zewnątrz
                      // Poniżej przykładowe użycie bardziej zaawansowanego Caption
                      components, // Pozwalamy na przekazanie `components`
                      ...props
                  }: CalendarProps) {

    const handleMonthChange = (date: Date) => {
        if (props.onMonthChange) {
            props.onMonthChange(date);
        }
    };

    const currentYear = new Date().getFullYear();
    const fromYear = props.fromYear || currentYear - 100;
    const toYear = props.toYear || currentYear + 10;

    const years: number[] = [];
    for (let i = fromYear; i <= toYear; i++) {
        years.push(i);
    }

    const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i));


    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                // caption: "flex justify-center pt-1 relative items-center", // Zostanie obsłużone przez CustomCaption
                // caption_label: "text-sm font-medium", // Zostanie obsłużone przez CustomCaption
                caption_dropdowns: "flex justify-center gap-1 items-center", // Style dla dropdownów w caption
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse", // Usunięto space-y-1
                head_row: "flex w-full",       // Dodano w-full
                head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center", // Usunięto flex-1
                row: "flex w-full mt-2",     // Usunięto justify-around
                cell: cn(
                    "h-9 w-9 text-center text-sm p-0 relative",
                    "focus-within:relative focus-within:z-20",
                    props.mode === "range" // Style dla trybu "range"
                        ? "[&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                        : "[&:has([aria-selected])]:rounded-md"
                ),
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{ // Przekazujemy komponenty zgodnie z API react-day-picker v8+
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
                Caption: ({ displayMonth }) => ( // Niestandardowy komponent Caption
                    <div className="flex justify-between items-center px-2 py-1.5">
                        {/* Etykieta miesiąca i roku - można usunąć jeśli Dropdowny są wystarczające */}
                        <h2 className="text-sm font-medium">
                            {format(displayMonth, "LLLL yyyy", { locale: pl })}
                        </h2>
                        <div className="flex gap-1">
                            <Select
                                onValueChange={(value) => {
                                    handleMonthChange(setMonth(displayMonth, parseInt(value)));
                                }}
                                value={displayMonth.getMonth().toString()}
                            >
                                <SelectTrigger className="h-7 text-xs w-[100px] focus:ring-0 border-0 focus-visible:ring-offset-0 data-[state=open]:border data-[state=open]:ring-1 data-[state=open]:ring-ring">
                                    <SelectValue placeholder={format(displayMonth, "LLLL", { locale: pl })} />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {months.map((month, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            {format(month, "LLLL", { locale: pl })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                onValueChange={(value) => {
                                    handleMonthChange(setYear(displayMonth, parseInt(value)));
                                }}
                                value={displayMonth.getFullYear().toString()}
                            >
                                <SelectTrigger className="h-7 text-xs w-[70px] focus:ring-0 border-0 focus-visible:ring-offset-0 data-[state=open]:border data-[state=open]:ring-1 data-[state=open]:ring-ring">
                                    <SelectValue placeholder={displayMonth.getFullYear().toString()} />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ),
                ...components // Łączymy z komponentami przekazanymi z zewnątrz
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export default Calendar; // Zmieniono na eksport domyślny, jeśli tak jest używany
// lub export { Calendar } jeśli preferujesz nazwany eksport