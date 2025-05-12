import { DayPicker, DayPickerSingleProps } from "react-day-picker";
import { cn } from "@/lib/utils"; // Assuming you have a utility for classNames

type CalendarProps = DayPickerSingleProps & {
    className?: string;
    disabled?: (date: Date) => boolean; // Add this line
};

const Calendar = ({ className, disabled, ...props }: CalendarProps) => (
    <DayPicker
        className={cn("p-3", className)}
        disabled={disabled}
        {...props}
    />
);

Calendar.displayName = "Calendar";

export default Calendar;