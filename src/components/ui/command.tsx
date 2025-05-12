import React from "react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";

// Props for CommandWrapper, matching cmdk's Command expectations
interface CommandWrapperProps {
    children?: React.ReactNode;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent<Element>) => void; // Matches Command's expected type
    value?: string;
    onValueChange?: (value: string) => void;
}

const CommandWrapper = ({ className, onKeyDown, ...props }: CommandWrapperProps) => (
    <Command className={cn("flex flex-col", className)} onKeyDown={onKeyDown} {...props} />
);
CommandWrapper.displayName = "CommandWrapper";

// Props for CommandInput, using onValueChange instead of onChange
interface CommandInputProps {
    className?: string;
    placeholder?: string;
    value?: string;
    onValueChange?: (value: string) => void; // Matches Command.Input's expected prop
}

const CommandInput = ({ className, value, onValueChange, ...props }: CommandInputProps) => (
    <Command.Input
        className={cn("border p-2", className)}
        value={value}
        onValueChange={onValueChange} // Use onValueChange instead of onChange
        {...props}
    />
);
CommandInput.displayName = "CommandInput";

// Command List
const CommandList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <Command.List className={cn("overflow-auto", className)} {...props} />
);
CommandList.displayName = "CommandList";

// Command Empty
const CommandEmpty = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <Command.Empty className={cn("p-2 text-gray-500", className)} {...props} />
);
CommandEmpty.displayName = "CommandEmpty";

// Command Group
const CommandGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <Command.Group className={cn("p-2", className)} {...props} />
);
CommandGroup.displayName = "CommandGroup";

// Command Separator
const CommandSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <Command.Separator className={cn("h-px bg-gray-200", className)} {...props} />
);
CommandSeparator.displayName = "CommandSeparator";

// Props for CommandItem, overriding onSelect
interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
    onSelect?: (value: string) => void; // Matches Command.Item's expected type
}

const CommandItem = ({ className, onSelect, ...props }: CommandItemProps) => (
    <Command.Item
        className={cn("p-2 cursor-pointer", className)}
        onSelect={onSelect}
        {...props}
    />
);
CommandItem.displayName = "CommandItem";

export {
    CommandWrapper as Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandSeparator,
    CommandItem,
};