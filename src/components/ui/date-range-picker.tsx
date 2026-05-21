"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";

import { cn } from "@/utils/clx";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  toDate?: Date;
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  toDate,
}: DateRangePickerProps) {
  const [month, setMonth] = React.useState<Date | undefined>(date?.from);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover onOpenChange={() => setMonth(date?.from)}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            toDate={toDate}
            captionLayout="dropdown-buttons"
            fromYear={new Date().getFullYear() - 5}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
