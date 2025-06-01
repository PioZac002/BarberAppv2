// src/components/ui/MuiDateRangePickerField.tsx
import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { DateRangePicker, DateRange } from '@mui/x-date-pickers-pro/DateRangePicker';
import { LicenseInfo } from '@mui/x-license-pro'; // Potrzebne dla komponentów Pro
import dayjs, { Dayjs } from 'dayjs';

// Ustaw klucz licencyjny, jeśli posiadasz
// LicenseInfo.setLicenseKey('YOUR_LICENSE_KEY');

export interface MuiDateRangePickerFieldProps {
    value: [Date | null, Date | null]; // Oczekujemy [Date | null, Date | null]
    onChange: (newDateRange: [Date | null, Date | null]) => void;
    className?: string;
    // Możesz dodać inne propsy, które chcesz przekazać do DateRangePicker
    minDate?: Date;
    maxDate?: Date;
}

const MuiDateRangePickerField: React.FC<MuiDateRangePickerFieldProps> = ({
                                                                             value,
                                                                             onChange,
                                                                             className,
                                                                             minDate,
                                                                             maxDate,
                                                                         }) => {
    const muiValue: DateRange<Dayjs> = [
        value[0] ? dayjs(value[0]) : null,
        value[1] ? dayjs(value[1]) : null,
    ];

    const handleDateChange = (newMuiDateRange: DateRange<Dayjs>) => {
        onChange([
            newMuiDateRange[0] ? newMuiDateRange[0].toDate() : null,
            newMuiDateRange[1] ? newMuiDateRange[1].toDate() : null,
        ]);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateRangePicker
                className={className}
                value={muiValue}
                onChange={handleDateChange}
                minDate={minDate ? dayjs(minDate) : undefined}
                maxDate={maxDate ? dayjs(maxDate) : undefined}
                // slotProps={{ textField: { size: 'small', variant: 'outlined' } }} // Opcjonalne propsy dla pola tekstowego
            />
        </LocalizationProvider>
    );
};

export default MuiDateRangePickerField;