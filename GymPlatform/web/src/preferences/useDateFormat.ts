import { useMemo } from 'react'
import {
  formatDate,
  formatDateRangeLabel,
  formatDateTime,
  formatIsoDate,
  formatPeriodLabel,
  formatTime,
  formatTimeRangeLabel,
} from '../utils/dateFormat'
import { usePreferences } from './PreferencesProvider'

export function useDateFormat() {
  const { language } = usePreferences()

  return useMemo(() => ({
    language,
    formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(value, language, options),
    formatDateTime: (value: Date | string) => formatDateTime(value, language),
    formatTime: (value: Date | string) => formatTime(value, language),
    formatTimeRange: (
      start: Date | string | null | undefined,
      end: Date | string | null | undefined,
    ) => formatTimeRangeLabel(start, end, language),
    formatIsoDate: (isoDate: string) => formatIsoDate(isoDate, language),
    formatDateRangeLabel: (startDate: string, endDate?: string) =>
      formatDateRangeLabel(startDate, endDate, language),
    formatPeriodLabel: (view: Parameters<typeof formatPeriodLabel>[0], anchor: Date) =>
      formatPeriodLabel(view, anchor, language),
  }), [language])
}
