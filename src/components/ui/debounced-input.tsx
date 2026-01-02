import { useState, useEffect, useCallback } from "react";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface DebouncedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function DebouncedInput({ 
  value, 
  onChange, 
  debounceMs = 500, 
  ...props 
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state when external value changes (from database refresh)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced save
  useEffect(() => {
    if (localValue === value) return;
    
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs, value]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}

interface DebouncedTextareaProps extends Omit<React.ComponentProps<typeof Textarea>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function DebouncedTextarea({ 
  value, 
  onChange, 
  debounceMs = 500, 
  ...props 
}: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced save
  useEffect(() => {
    if (localValue === value) return;
    
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs, value]);

  return (
    <Textarea
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}
