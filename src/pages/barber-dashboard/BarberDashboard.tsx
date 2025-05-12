import React from "react";
import { Select } from "@radix-ui/react-select";

const BarberDashboard = () => {
    const [availabilityMode, setAvailabilityMode] = React.useState<"all" | "available" | "booked">("all");

    return (
        <Select
            value={availabilityMode}
            onValueChange={(value: "all" | "available" | "booked") => setAvailabilityMode(value)}
        >
            {/* Select options */}
        </Select>
    );
};

export default BarberDashboard;