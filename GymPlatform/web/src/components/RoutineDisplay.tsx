import type { Routine, RoutineDay, RoutineExercise } from '../types'

type Props = {
  routine: Routine
  compact?: boolean
}

function ExerciseRow({ ex }: { ex: RoutineExercise }) {
  return (
    <div className="routine-exercise-row">
      <div className="routine-exercise-info">
        <strong>{ex.exerciseName}</strong>
        <span className="routine-exercise-meta">
          {ex.sets} series × {ex.reps} reps
          {ex.notes ? ` · ${ex.notes}` : ''}
        </span>
      </div>
    </div>
  )
}

function DayBlock({ day }: { day: RoutineDay }) {
  return (
    <div className="routine-day-block">
      <h4>{day.dayLabel}</h4>
      <div className="routine-exercise-list">
        {day.exercises.map((ex, i) => (
          <ExerciseRow key={ex.id ?? `${day.dayNumber}-${i}`} ex={ex} />
        ))}
      </div>
    </div>
  )
}

export default function RoutineDisplay({ routine, compact = false }: Props) {
  const hasDays = routine.days && routine.days.length > 0
  const flatExercises = routine.exercises ?? []

  return (
    <div className={`routine-display${compact ? ' routine-display--compact' : ''}`}>
      {hasDays ? (
        routine.days!.map((day) => (
          <DayBlock key={day.id ?? day.dayNumber} day={day} />
        ))
      ) : flatExercises.length > 0 ? (
        <div className="routine-exercise-list">
          {flatExercises.map((ex, i) => (
            <ExerciseRow key={ex.id ?? i} ex={ex} />
          ))}
        </div>
      ) : (
        <p className="muted">Sin ejercicios</p>
      )}
    </div>
  )
}
