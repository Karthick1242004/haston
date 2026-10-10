"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SearchableSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

/**
 * A select you can type into. Scrolling 250 countries to reach one is the
 * whole problem it solves, so the search box is focused the moment it opens.
 *
 * The panel is pinned below the trigger. Radix would otherwise flip it above
 * when the field sits low on the screen, which on a phone covers the fields
 * the customer has just filled in and reads as the dropdown opening the wrong
 * way. Instead the trigger is scrolled to the middle of the viewport first, so
 * there is always room underneath for the list.
 */
export function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyText = "No match found.",
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const handleOpenChange = (next: boolean) => {
    if (next && triggerRef.current) {
      // Park the field a quarter of the way down: clear of the sticky header
      // above it, and high enough that the list and the phone keyboard both
      // fit underneath. scrollIntoView("center") is not enough once a keyboard
      // takes the bottom half of the screen.
      const rect = triggerRef.current.getBoundingClientRect()
      const top = window.scrollY + rect.top - window.innerHeight * 0.25
      window.scrollTo({ top: Math.max(0, top) })
    }
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          // Matches SelectTrigger so the field is indistinguishable from the
          // other controls in the form.
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("line-clamp-1 text-left", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        avoidCollisions={false}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command
          // cmdk's default scorer matches characters that are not next to each
          // other, so "ind" put Bosnia and Herzegovina above India. For a list
          // of place names people type the start of what they want: rank a
          // prefix first, accept a substring, and drop everything else.
          filter={(value, search) => {
            const haystack = value.toLowerCase()
            const needle = search.toLowerCase().trim()
            if (!needle) return 1
            if (haystack.startsWith(needle)) return 3
            // "nadu" should still find Tamil Nadu, and ahead of a mid-word hit.
            if (haystack.includes(` ${needle}`)) return 2
            if (haystack.includes(needle)) return 1
            return 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
