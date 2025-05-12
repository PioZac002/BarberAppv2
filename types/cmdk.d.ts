declare module 'cmdk' {
    import * as React from 'react';

    export interface CommandProps {
        children?: React.ReactNode;
        className?: string;
        onKeyDown?: (e: React.KeyboardEvent) => void;
        value?: string;
        onValueChange?: (value: string) => void;
    }

    export interface CommandInputProps {
        className?: string;
        placeholder?: string;
        value?: string;
        onValueChange?: (value: string) => void;
    }

    export const Command: React.FC<CommandProps> & {
        Input: React.FC<CommandInputProps>;
        List: React.FC<{ className?: string; children?: React.ReactNode }>;
        Empty: React.FC<{ className?: string; children?: React.ReactNode }>;
        Group: React.FC<{ heading?: string; className?: string; children?: React.ReactNode }>;
        Item: React.FC<{ className?: string; onSelect?: (value: string) => void; children?: React.ReactNode }>;
        Separator: React.FC<{ className?: string }>;
    };
}