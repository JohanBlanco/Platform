package com.gymplatform.util;

import java.time.LocalTime;

public final class ActivityOverlapUtil {

    private ActivityOverlapUtil() {}

    public static boolean timesOverlap(
            boolean aAllDay,
            LocalTime aStart,
            LocalTime aEnd,
            boolean bAllDay,
            LocalTime bStart,
            LocalTime bEnd) {
        if (aAllDay || bAllDay) {
            return true;
        }
        LocalTime aEndResolved = resolveEnd(aStart, aEnd);
        LocalTime bEndResolved = resolveEnd(bStart, bEnd);
        return aStart.isBefore(bEndResolved) && bStart.isBefore(aEndResolved);
    }

    public static LocalTime resolveEnd(LocalTime start, LocalTime end) {
        if (end != null && end.isAfter(start)) {
            return end;
        }
        return start.plusHours(1);
    }
}
