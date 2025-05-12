declare module 'vaul' {
    import * as React from 'react';

    export interface DrawerProps {
        children?: React.ReactNode;
        className?: string;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }

    export const Drawer: React.FC<DrawerProps> & {
        Root: React.FC<DrawerProps>;
        Trigger: React.FC<{ className?: string; children?: React.ReactNode; asChild?: boolean }>;
        Portal: React.FC<{ children: React.ReactNode }>;
        Close: React.FC;
        Overlay: React.FC<{ className?: string }>;
        Content: React.FC<{ className?: string; children?: React.ReactNode }>;
        Title: React.FC<{ className?: string; children?: React.ReactNode }>;
        Description: React.FC<{ className?: string; children?: React.ReactNode }>;
    };
}