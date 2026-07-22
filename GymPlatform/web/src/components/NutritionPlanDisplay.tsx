import type { NutritionPlan } from '../types'

type Props = {
  plan: NutritionPlan
  compact?: boolean
}

export default function NutritionPlanDisplay({ plan, compact = false }: Props) {
  return (
    <div className={`nutrition-plan-display${compact ? ' nutrition-plan-display--compact' : ''}`}>
      {!compact && plan.objective && (
        <p className="nutrition-plan-objective">{plan.objective}</p>
      )}

      <div className="nutrition-macros-grid">
        {plan.dailyCaloriesTarget != null && (
          <div className="nutrition-macro-card nutrition-macro-card--primary">
            <span className="nutrition-macro-label">Calorías / día</span>
            <span className="nutrition-macro-value">{plan.dailyCaloriesTarget}</span>
          </div>
        )}
        {plan.proteinGrams != null && (
          <div className="nutrition-macro-card">
            <span className="nutrition-macro-label">Proteína</span>
            <span className="nutrition-macro-value">{plan.proteinGrams} g</span>
          </div>
        )}
        {plan.carbsGrams != null && (
          <div className="nutrition-macro-card">
            <span className="nutrition-macro-label">Carbohidratos</span>
            <span className="nutrition-macro-value">{plan.carbsGrams} g</span>
          </div>
        )}
        {plan.fatGrams != null && (
          <div className="nutrition-macro-card">
            <span className="nutrition-macro-label">Grasas</span>
            <span className="nutrition-macro-value">{plan.fatGrams} g</span>
          </div>
        )}
        {plan.waterLiters != null && (
          <div className="nutrition-macro-card">
            <span className="nutrition-macro-label">Agua</span>
            <span className="nutrition-macro-value">{plan.waterLiters} L</span>
          </div>
        )}
      </div>

      {plan.meals.length > 0 && (
        <div className="nutrition-meals">
          <h4>{compact ? 'Comidas' : 'Comidas del día'}</h4>
          <div className="nutrition-meals-list">
            {plan.meals.map((meal) => (
              <article key={meal.id ?? meal.name} className="nutrition-meal-card">
                <header className="nutrition-meal-header">
                  <strong>{meal.name}</strong>
                  {meal.suggestedTime && <span className="nutrition-meal-time">{meal.suggestedTime}</span>}
                </header>
                {meal.notes && <p className="nutrition-meal-notes">{meal.notes}</p>}
                {meal.items.length > 0 && (
                  <ul className="nutrition-meal-items">
                    {meal.items.map((item) => (
                      <li key={item.id ?? `${item.foodName}-${item.portion}`}>
                        <span>{item.foodName}</span>
                        {item.portion && <span className="nutrition-item-portion">{item.portion}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {!compact && plan.guidelines.length > 0 && (
        <div className="nutrition-guidelines">
          <h4>Recomendaciones</h4>
          <ul>
            {plan.guidelines.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {!compact && plan.notes && !plan.notes.startsWith('demo:') && (
        <div className="nutrition-notes">
          <h4>Notas del instructor</h4>
          <p>{plan.notes.replace(/^demo:[^\—]+—\s*/, '')}</p>
        </div>
      )}

      {!compact && plan.notes?.startsWith('demo:') && plan.notes.includes('—') && (
        <div className="nutrition-notes">
          <h4>Notas del instructor</h4>
          <p>{plan.notes.replace(/^demo:[^\—]+—\s*/, '')}</p>
        </div>
      )}
    </div>
  )
}
