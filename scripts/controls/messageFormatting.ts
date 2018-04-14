import { format } from "VSS/Utils/Date";
import { ISelectedRange } from "../filter";

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
    return `${dow[date.getDay()]} ${format(date, " yyyy-MM-dd")}`;
}

export function toTimeString(date: Date, showDay: boolean): string {
    const timeString = date.toLocaleTimeString();
    if (showDay) {
        return `${toDateString(date)} ${timeString}`;
    }
    return timeString;
}

export function toCountString(count: number, noun: string): string {
    if (count === 1) {
        return `1 ${noun}`;
    }
    return `${count} ${noun}s`;
}

export function isOneDayRange({startDate, endDate}: ISelectedRange) {
    const startDateP1 = new Date(startDate.getTime());
    startDateP1.setDate(startDateP1.getDate() + 1);
    return startDateP1.getTime() === endDate.getTime();
}
