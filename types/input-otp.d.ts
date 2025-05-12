declare module 'input-otp' {
    import * as React from 'react';

    export interface OTPInputProps {
        children?: React.ReactNode;
        className?: string;
        containerClassName?: string;
        maxLength?: number;
        render?: (props: { slots: Array<{ char: string | null; hasFakeCaret: boolean; isActive: boolean }>; index: number }) => React.ReactNode;
    }

    export const OTPInput: React.FC<OTPInputProps>;
}