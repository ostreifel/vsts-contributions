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
export function toDateString(date: Date) {
    return `${dow[date.getDay()]} ${format(date, " yyyy-MM-dd")}`
}

export function toCountString(count: number, noun: string) {
    if (count === 1) {
        return `1 ${noun}`;
    }
    return `${count} ${noun}s`;
}
