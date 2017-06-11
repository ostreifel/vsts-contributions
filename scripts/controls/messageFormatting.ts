import { format } from "VSS/Utils/Date";

const dow = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
export function toDateString(date: Date): string {
    return `${dow[date.getDay()]} ${format(date, " yyyy-MM-dd")}`
}

export function toTimeString(date: Date, showDay: boolean): string {
    const timeString = date.toLocaleTimeString();
    if (showDay) {
        return `${toDateString(date)} ${timeString}`
    }
    return timeString;
}

export function toCountString(count: number, noun: string): string {
    if (count === 1) {
        return `1 ${noun}`;
    }
    return `${count} ${noun}s`;
}
