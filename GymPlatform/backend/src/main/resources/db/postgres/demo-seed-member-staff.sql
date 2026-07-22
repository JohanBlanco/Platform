







-- PostgreSQL: inserts demo en orden de FK




INSERT INTO routines (
  id, name, description, notes, member_id, instructor_id, template_id, organization_id,
  temporary, days_per_week, valid_from, valid_until, validity_amount, validity_unit,
  active, created_at
) VALUES
(50, 'Mantenimiento ejecutivo',
 'Rutina corta 3 días para mantener fuerza sin ocupar toda la mañana.',
 'Ideal entre reuniones. Prioriza compuestos.',
 4, 2, NULL, 1, FALSE, 3,
 CURRENT_DATE, (CURRENT_DATE + INTERVAL '3 month'), 12, 'WEEKS',
 TRUE, CURRENT_TIMESTAMP),
(51, 'Bienestar recepción',
 'Fuerza suave + movilidad para días de pie en recepción.',
 'Estira cuello y hombros al terminar el turno.',
 3, 2, NULL, 1, FALSE, 2,
 CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 month'), 8, 'WEEKS',
 TRUE, CURRENT_TIMESTAMP);

INSERT INTO routine_days (id, routine_id, day_number, day_label, order_index) VALUES
(50, 50, 1, 'Día A — Empuje', 0),
(51, 50, 2, 'Día B — Tirón', 1),
(52, 50, 3, 'Día C — Piernas', 2),
(53, 51, 1, 'Día 1 — Full body', 0),
(54, 51, 2, 'Día 2 — Movilidad', 1);

INSERT INTO routine_exercises (
  id, exercise_name, catalog_exercise_id, image_url, sets, reps, weight,
  duration_seconds, notes, order_index, routine_id, routine_day_id, template_id, template_day_id
) VALUES
(50, 'Press banca mancuernas', NULL, NULL, 3, 10, '22 kg', NULL, NULL, 0, 50, 50, NULL, NULL),
(51, 'Press militar sentado', NULL, NULL, 3, 10, '20 kg', NULL, NULL, 1, 50, 50, NULL, NULL),
(52, 'Fondos en banco', NULL, NULL, 3, 12, 'Peso corporal', NULL, NULL, 2, 50, 50, NULL, NULL),
(53, 'Remo mancuerna', NULL, NULL, 3, 10, '24 kg', NULL, 'Cada brazo', 0, 50, 51, NULL, NULL),
(54, 'Jalón al pecho', NULL, NULL, 3, 12, '40 kg', NULL, NULL, 1, 50, 51, NULL, NULL),
(55, 'Curl bíceps', NULL, NULL, 3, 12, '12 kg', NULL, NULL, 2, 50, 51, NULL, NULL),
(56, 'Sentadilla goblet', NULL, NULL, 3, 12, '16 kg', NULL, NULL, 0, 50, 52, NULL, NULL),
(57, 'Peso muerto rumano', NULL, NULL, 3, 10, '40 kg', NULL, NULL, 1, 50, 52, NULL, NULL),
(58, 'Elevación de gemelos', NULL, NULL, 3, 15, '30 kg', NULL, NULL, 2, 50, 52, NULL, NULL),
(59, 'Sentadilla bodyweight', NULL, NULL, 3, 15, NULL, NULL, NULL, 0, 51, 53, NULL, NULL),
(60, 'Flexiones inclinadas', NULL, NULL, 3, 10, NULL, NULL, NULL, 1, 51, 53, NULL, NULL),
(61, 'Remo con banda', NULL, NULL, 3, 15, NULL, NULL, NULL, 2, 51, 53, NULL, NULL),
(62, 'Gato-vaca', NULL, NULL, 2, NULL, NULL, 60, NULL, 0, 51, 54, NULL, NULL),
(63, 'Estiramiento pecho pared', NULL, NULL, 2, NULL, NULL, 45, 'Cada lado', 1, 51, 54, NULL, NULL);




INSERT INTO nutrition_plans (
  id, organization_id, member_id, created_by_id, title, objective,
  daily_calories_target, protein_grams, carbs_grams, fat_grams, water_liters,
  guidelines, notes, status, valid_from, valid_until, created_at, updated_at
) VALUES
(50, 1, 4, 2, 'Plan mantenimiento Carlos',
 'Mantener peso y energía para el día a día del gym.',
 2400, 140, 260, 75, 2.8,
 'No saltes el desayuno. Incluye proteína en almuerzo y cena.',
 'Ajusta si entrenas más de 4 días/semana.',
 'ACTIVE', CURRENT_DATE, (CURRENT_DATE + INTERVAL '3 month'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(51, 1, 3, 2, 'Plan bienestar María',
 'Energía estable en turnos largos de recepción.',
 2000, 110, 220, 60, 2.5,
 'Snacks cada 3–4 h. Limita cafeína después de las 16:00.',
 NULL,
 'ACTIVE', CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 month'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO nutrition_meals (id, plan_id, name, suggested_time, notes, order_index) VALUES
(50, 50, 'Desayuno', '07:00', NULL, 0),
(51, 50, 'Almuerzo', '12:30', NULL, 1),
(52, 50, 'Cena', '19:30', NULL, 2),
(53, 51, 'Desayuno', '06:30', 'Antes del turno', 0),
(54, 51, 'Almuerzo', '13:00', NULL, 1),
(55, 51, 'Merienda', '16:30', NULL, 2);

INSERT INTO nutrition_meal_items (id, meal_id, food_name, portion, notes, order_index) VALUES
(50, 50, 'Huevos revueltos', '3 unidades', NULL, 0),
(51, 50, 'Pan integral', '2 rebanadas', NULL, 1),
(52, 50, 'Aguacate', '1/2 unidad', NULL, 2),
(53, 51, 'Arroz', '1 taza', NULL, 0),
(54, 51, 'Pollo a la plancha', '160 g', NULL, 1),
(55, 51, 'Ensalada', '1 bowl', NULL, 2),
(56, 52, 'Pescado', '150 g', NULL, 0),
(57, 52, 'Vegetales', '1 plato', NULL, 1),
(58, 53, 'Yogur griego', '200 g', NULL, 0),
(59, 53, 'Granola', '40 g', NULL, 1),
(60, 54, 'Wrap de atún', '1 unidad', NULL, 0),
(61, 54, 'Fruta', '1 unidad', NULL, 1),
(62, 55, 'Mix de nueces', '30 g', NULL, 0),
(63, 55, 'Manzana', '1 unidad', NULL, 1);




INSERT INTO body_measurements (
  id, organization_id, member_id, recorded_by_id, measured_at,
  age_years, sex, weight_kg, height_cm,
  neck_cm, chest_cm, waist_cm, hips_cm, shoulders_cm,
  left_arm_cm, right_arm_cm, left_forearm_cm, right_forearm_cm,
  left_thigh_cm, right_thigh_cm, left_calf_cm, right_calf_cm,
  notes, appointment_request_id, created_at
) VALUES
(50, 1, 4, 2,
 (CURRENT_TIMESTAMP - INTERVAL '30 day'),
 40, 'MALE', 82.0, 178.0,
 39.0, 102.0, 88.0, 100.0, 118.0,
 36.0, 36.5, 29.0, 29.5,
 58.0, 58.5, 38.0, 38.5,
 'Baseline administrador — perfil miembro', NULL, (CURRENT_TIMESTAMP - INTERVAL '30 day')),
(51, 1, 4, 2,
 (CURRENT_TIMESTAMP - INTERVAL '2 day'),
 40, 'MALE', 81.2, 178.0,
 38.5, 103.0, 86.5, 99.0, 119.0,
 36.5, 37.0, 29.0, 29.5,
 58.5, 59.0, 38.0, 38.5,
 'Mejora de cintura', NULL, (CURRENT_TIMESTAMP - INTERVAL '2 day')),
(52, 1, 3, 2,
 (CURRENT_TIMESTAMP - INTERVAL '10 day'),
 35, 'FEMALE', 62.5, 165.0,
 32.0, 88.0, 70.0, 94.0, 98.0,
 27.0, 27.5, 22.5, 23.0,
 52.0, 52.5, 34.0, 34.0,
 'Control recepción', NULL, (CURRENT_TIMESTAMP - INTERVAL '10 day'));




INSERT INTO reservations (
  id, activity_id, member_id, occurrence_date, activity_name, status,
  free_slot, payment_required, paid, attended, created_at, updated_at
) VALUES
(50, 1, 4, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(51, 2, 4, (CURRENT_DATE + INTERVAL '2 day'), 'Funcional', 'CONFIRMED', TRUE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(52, 6, 4, (CURRENT_DATE + INTERVAL '4 day'), 'Yoga al atardecer', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(53, 2, 3, CURRENT_DATE, 'Funcional', 'CONFIRMED', TRUE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(54, 9, 3, (CURRENT_DATE + INTERVAL '3 day'), 'Yoga', 'CONFIRMED', FALSE, TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(55, 10, 5, (CURRENT_DATE + INTERVAL '5 day'), 'HIIT Express', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(56, 8, 5, (CURRENT_DATE + INTERVAL '2 day'), 'Spinning', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);




INSERT INTO appointment_requests (
  id, member_id, organization_id, type, notes, status,
  preferred_staff_id, assigned_staff_id, staff_availability_id,
  scheduled_start, scheduled_end, created_at, updated_at
) VALUES
(50, 4, 1, 'CONSULTATION', 'Revisión de objetivos del trimestre', 'SCHEDULED',
 2, 2, 3,
 (((CURRENT_DATE + INTERVAL '2 day'))::date + TIME '09:00:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '2 day'))::date + TIME '09:30:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(51, 4, 1, 'MEASUREMENT', 'Control de medidas mensuales', 'SCHEDULED',
 2, 2, 5,
 (((CURRENT_DATE + INTERVAL '3 day'))::date + TIME '09:00:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '3 day'))::date + TIME '09:30:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(52, 4, 1, 'NUTRITION', 'Ajuste del plan de mantenimiento', 'PENDING',
 2, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(53, 3, 1, 'MEASUREMENT', 'Toma de medidas recepción', 'SCHEDULED',
 2, 2, 4,
 (((CURRENT_DATE + INTERVAL '2 day'))::date + TIME '16:30:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '2 day'))::date + TIME '17:00:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(54, 5, 1, 'NUTRITION', 'Seguimiento plan hipertrofia', 'SCHEDULED',
 2, 2, 6,
 (((CURRENT_DATE + INTERVAL '3 day'))::date + TIME '16:00:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '3 day'))::date + TIME '16:30:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(55, 5, 1, 'CONSULTATION', 'Evaluación de progreso — completada', 'COMPLETED',
 2, 2, NULL,
 (((CURRENT_DATE - INTERVAL '7 day'))::date + TIME '10:00:00')::timestamp,
 (((CURRENT_DATE - INTERVAL '7 day'))::date + TIME '10:30:00')::timestamp,
 (CURRENT_TIMESTAMP - INTERVAL '8 day'), CURRENT_TIMESTAMP),
(56, 5, 1, 'MEASUREMENT', 'Solicitud pendiente de horario', 'PENDING',
 2, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- fin seeds demo

