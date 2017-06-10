import { IContribution } from "../data/contracts";
function getIndex(arr: IContribution[], val: Date) {
    let start = 0;
    let end = arr.length;
    while (start < end) {
        let idx = Math.floor((start + end) / 2);
        const comp = arr[idx].date.getTime() - val.getTime();
        if (comp < 0) {
            start = idx;
            if (start + 1 === end) {
                return end;
            }
        } else if (comp > 0) {
            end = idx;
        } else {
            return idx;
        }
    }
    return end;
}
export function sliceContributions(arr: IContribution[], start?: Date, end?: Date) {
    const startIdx = start ? getIndex(arr, start) : 0;
    const endIdx = end ? getIndex(arr, end) : arr.length;
    if (startIdx === endIdx && end && arr[startIdx] && arr[startIdx].date.getTime() > end.getTime()) {
        return [];
    }
    return arr.slice(startIdx, endIdx);
}
