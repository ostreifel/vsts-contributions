
export const yearEnd = new Date();
yearEnd.setHours(0, 0, 0, 0);
export const yearStart = new Date(yearEnd.getTime());
yearStart.setDate(yearStart.getDate() - yearStart.getDay());
yearStart.setDate(yearStart.getDate() - 7 * 51);
