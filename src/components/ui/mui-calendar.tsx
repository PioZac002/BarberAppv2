// src/components/ui/mui-calendar.tsx
import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs, { Dayjs } from 'dayjs';

// Możesz chcieć zdefiniować bardziej szczegółowe propsy, jeśli potrzebujesz przekazywać
// np. disabledDates, onChange, value itp. z komponentu nadrzędnego.
// Na razie użyjemy podstawowych propsów DateCalendarProps z MUI.
// Zauważ, że MUI używa 'value' i 'onChange' inaczej niż react-day-picker.
// react-day-picker dla pojedynczej daty: selected={date} onSelect={setDate}
// MUI dla pojedynczej daty: value={dayjs(date)} onChange={(newValue) => setDate(newValue?.toDate())}

export interface MuiCalendarProps {
    value?: Date | null; // Wartość daty
    onChange?: (date: Date | null) => void; // Funkcja zmiany
    // Możesz dodać inne propsy z DateCalendarProps, które chcesz przekazać
    // np. minDate, maxDate, shouldDisableDate
    minDate?: Dayjs;
    maxDate?: Dayjs;
    shouldDisableDate?: (day: Dayjs) => boolean;
    className?: string;
}

const MuiCalendar: React.FC<MuiCalendarProps> = ({
                                                     value,
                                                     onChange,
                                                     minDate,
                                                     maxDate,
                                                     shouldDisableDate,
                                                     className
                                                 }) => {
    const internalValue = value ? dayjs(value) : null;

    const handleDateChange = (newValue: Dayjs | null) => {
        if (onChange) {
            onChange(newValue ? newValue.toDate() : null);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
                className={className} // Pozwala na przekazanie dodatkowych klas
                value={internalValue}
                onChange={handleDateChange}
                minDate={minDate}
                maxDate={maxDate}
                shouldDisableDate={shouldDisableDate}
                // Możesz dodać inne propsy tutaj, np. disablePast, disableFuture
            />
        </LocalizationProvider>
    );
};

export default MuiCalendar;