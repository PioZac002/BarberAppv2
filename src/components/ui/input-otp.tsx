import React from "react";
import { OTPInput, OTPInputProps } from "input-otp";
import { cn } from "@/lib/utils";

const OTPInputComponent = ({ className, containerClassName, ...props }: OTPInputProps) => (
    <OTPInput
        className={cn("flex gap-2", className)}
        containerClassName={cn("flex justify-center", containerClassName)}
        {...props}
    />
);
OTPInputComponent.displayName = "OTPInput";

export { OTPInputComponent as OTPInput };