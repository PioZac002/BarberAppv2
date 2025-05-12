import React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizableHandle = ({ className, ...props }: { className?: string }) => (
    <ResizablePrimitive.PanelResizeHandle
        className={cn("w-2 bg-gray-200", className)}
        {...props}
    />
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizableHandle };