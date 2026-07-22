import { useMemo } from 'react'

import { useDateFormat } from '../preferences/useDateFormat'

import {
  countAvailabilitySlots,
  countDaysInRange,
  formatTimeShort,
  isDateRangeValid,
} from '../utils/availabilityUtils'

export type AvailabilityScheduleValues = {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

const DURATION_OPTIONS = [15, 30, 45, 60] as const

export function useAvailabilityScheduleSummary(values: AvailabilityScheduleValues) {
  const { formatIsoDate, formatDateRangeLabel } = useDateFormat()
  const { startDate, endDate, startTime, endTime, slotDurationMinutes } = values

  const slotCount = useMemo(
    () => countAvailabilitySlots(startTime, endTime, slotDurationMinutes),
    [startTime, endTime, slotDurationMinutes],
  )

  const dayCount = useMemo(
    () => countDaysInRange(startDate, endDate || undefined),
    [startDate, endDate],
  )

  const dateRangeValid = isDateRangeValid(startDate, endDate || undefined)
  const timeRangeValid = slotCount > 0 && endTime > startTime
  const rangeValid = dateRangeValid && timeRangeValid

  const summaryLine = useMemo(() => {
    if (!rangeValid) return null
    const datePart = endDate
      ? formatDateRangeLabel(startDate, endDate)
      : formatIsoDate(startDate)
    const slotsPart = `${slotCount} espacio${slotCount === 1 ? '' : 's'}/día`
    const timePart = `${formatTimeShort(startTime)} – ${formatTimeShort(endTime)}`
    if (dayCount > 1) {
      return `${slotsPart} · ${slotDurationMinutes} min · ${timePart} · ${dayCount} días (${datePart})`
    }
    return `${slotsPart} · ${slotDurationMinutes} min · ${timePart} · ${datePart}`
  }, [
    rangeValid,
    startDate,
    endDate,
    slotCount,
    slotDurationMinutes,
    startTime,
    endTime,
    dayCount,
    formatIsoDate,
    formatDateRangeLabel,
  ])

  return {
    slotCount,
    dayCount,
    totalSlots: slotCount * dayCount,
    dateRangeValid,
    timeRangeValid,
    rangeValid,
    summaryLine,
  }
}

type Props = {
  values: AvailabilityScheduleValues
  onChange: (patch: Partial<AvailabilityScheduleValues>) => void
  singleDayMode?: boolean
  singleDayLabel?: string
}

export default function AvailabilityScheduleForm({ values, onChange, singleDayMode, singleDayLabel }: Props) {
  const summary = useAvailabilityScheduleSummary(values)
  const { startDate, endDate, startTime, endTime, slotDurationMinutes } = values

  return (
    <div className="availability-schedule-form">
      <div className="availability-schedule-section">
        <span className="availability-schedule-label">Fechas</span>
        {singleDayMode ? (
          <p className="availability-single-day-label">{singleDayLabel ?? values.startDate}</p>
        ) : (
          <>
            <div className="availability-inline-pair">
              <label>
                Desde
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onChange({ startDate: e.target.value })}
                  required
                />
              </label>
              <label>
                Hasta <span className="label-optional">opc.</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => onChange({ endDate: e.target.value })}
                />
              </label>
            </div>
            {!summary.dateRangeValid && (
              <p className="availability-field-hint availability-field-hint--error">
                La fecha final debe ser igual o posterior a la inicial.
              </p>
            )}
          </>
        )}
      </div>

      <div className="availability-schedule-section">
        <span className="availability-schedule-label">Horario</span>
        <div className="availability-time-row">
          <label>
            Inicio
            <input
              type="time"
              value={startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              required
            />
          </label>
          <label>
            Fin
            <input
              type="time"
              value={endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="availability-duration-pills" role="group" aria-label="Duración por cita">
          {DURATION_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={`availability-duration-pill${slotDurationMinutes === minutes ? ' active' : ''}`}
              onClick={() => onChange({ slotDurationMinutes: minutes })}
              aria-pressed={slotDurationMinutes === minutes}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>

      <div className={`availability-summary${summary.rangeValid ? '' : ' availability-summary--invalid'}`}>
        {summary.rangeValid ? (
          <p>{summary.summaryLine}</p>
        ) : (
          <p>Revisa fechas y horario: debe caber al menos un espacio.</p>
        )}
      </div>
    </div>
  )
}
