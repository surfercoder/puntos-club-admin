"use client";

import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  placeholder: string;
  onValueChange?: (value: string) => void;
}

/** Searchable single-select. Drop-in replacement for <Select> in forms: submits `name` via a hidden input. */
export function Combobox({ name, options, defaultValue = '', placeholder, onValueChange }: ComboboxProps) {
  const t = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const selected = options.find(o => o.value === value);

  const select = (next: string) => {
    setValue(next);
    setOpen(false);
    onValueChange?.(next);
  };

  return (
    <>
      <input name={name} type="hidden" value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            aria-expanded={open}
            className="w-full justify-between font-normal"
            role="combobox"
            type="button"
            variant="outline"
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected?.label ?? placeholder}
            </span>
            <ChevronDownIcon className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={t('search')} />
            <CommandList>
              <CommandEmpty>{t('noResults')}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option.value} value={option.label} onSelect={() => select(option.value)}>
                    {option.label}
                    <CheckIcon className={cn('ml-auto size-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
