declare module 'react-resizable-panels' {
    import * as React from 'react';

    export interface ResizablePanelGroupProps {
        direction: 'horizontal' | 'vertical';
        className?: string;
        children?: React.ReactNode;
    }

    export interface ResizablePanelProps {
        className?: string;
        defaultSize?: number;
        minSize?: number;
        maxSize?: number;
        children?: React.ReactNode;
    }

    export interface ResizableHandleProps {
        className?: string;
        withHandle?: boolean;
    }

    export const PanelGroup: React.FC<ResizablePanelGroupProps>;
    export const Panel: React.FC<ResizablePanelProps>;
    export const PanelResizeHandle: React.FC<ResizableHandleProps>;
}