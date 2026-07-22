








-- PostgreSQL: inserts demo en orden de FK




INSERT INTO routines (
  id, name, description, notes, member_id, instructor_id, template_id, organization_id,
  temporary, days_per_week, valid_from, valid_until, validity_amount, validity_unit,
  active, created_at
) VALUES
(1, 'Hipertrofia tren superior',
 'Rutina de 3 días enfocada en pecho, espalda y hombros.',
 'Descansa 90 s entre series. Prioriza técnica.',
 5, 2, NULL, 1, FALSE, 3,
 CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 month'), 8, 'WEEKS',
 TRUE, CURRENT_TIMESTAMP),
(2, 'Definición y cardio',
 'Plan suave para bajar grasa con fuerza liviana.',
 'Camina 20–30 min los días libres.',
 6, 2, NULL, 1, FALSE, 3,
 CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month'), 4, 'WEEKS',
 TRUE, CURRENT_TIMESTAMP);

INSERT INTO routine_days (id, routine_id, day_number, day_label, order_index) VALUES
(1, 1, 1, 'Día A — Pecho y tríceps', 0),
(2, 1, 2, 'Día B — Espalda y bíceps', 1),
(3, 1, 3, 'Día C — Hombros y core', 2),
(4, 2, 1, 'Día 1 — Full body', 0),
(5, 2, 2, 'Día 2 — Cardio + core', 1);

INSERT INTO routine_exercises (
  id, exercise_name, catalog_exercise_id, image_url, sets, reps, weight,
  duration_seconds, notes, order_index, routine_id, routine_day_id, template_id, template_day_id
) VALUES

(1, 'Press banca', NULL, NULL, 4, 8, '60 kg', NULL, 'Controla la bajada', 0, 1, 1, NULL, NULL),
(2, 'Aperturas con mancuernas', NULL, NULL, 3, 12, '12 kg', NULL, NULL, 1, 1, 1, NULL, NULL),
(3, 'Fondos en paralelas', NULL, NULL, 3, 10, 'Peso corporal', NULL, NULL, 2, 1, 1, NULL, NULL),
(4, 'Extensiones de tríceps polea', NULL, NULL, 3, 12, '25 kg', NULL, NULL, 3, 1, 1, NULL, NULL),

(5, 'Dominadas asistidas', NULL, NULL, 4, 8, 'Asistencia media', NULL, NULL, 0, 1, 2, NULL, NULL),
(6, 'Remo con barra', NULL, NULL, 4, 10, '50 kg', NULL, NULL, 1, 1, 2, NULL, NULL),
(7, 'Curl bíceps mancuernas', NULL, NULL, 3, 12, '10 kg', NULL, NULL, 2, 1, 2, NULL, NULL),
(8, 'Face pull', NULL, NULL, 3, 15, '15 kg', NULL, 'Hombros atrás', 3, 1, 2, NULL, NULL),

(9, 'Press militar', NULL, NULL, 4, 8, '40 kg', NULL, NULL, 0, 1, 3, NULL, NULL),
(10, 'Elevaciones laterales', NULL, NULL, 3, 15, '8 kg', NULL, NULL, 1, 1, 3, NULL, NULL),
(11, 'Plancha', NULL, NULL, 3, NULL, NULL, 45, 'Mantén abdomen firme', 2, 1, 3, NULL, NULL),
(12, 'Elevación de piernas', NULL, NULL, 3, 12, NULL, NULL, NULL, 3, 1, 3, NULL, NULL),

(13, 'Sentadilla goblet', NULL, NULL, 3, 12, '12 kg', NULL, NULL, 0, 2, 4, NULL, NULL),
(14, 'Press pecho mancuernas', NULL, NULL, 3, 12, '8 kg', NULL, NULL, 1, 2, 4, NULL, NULL),
(15, 'Remo en máquina', NULL, NULL, 3, 12, '30 kg', NULL, NULL, 2, 2, 4, NULL, NULL),
(16, 'Caminadora inclinada', NULL, NULL, 1, NULL, NULL, 1200, 'Ritmo conversacional', 0, 2, 5, NULL, NULL),
(17, 'Bicicleta estática', NULL, NULL, 1, NULL, NULL, 900, NULL, 1, 2, 5, NULL, NULL);


UPDATE routine_requests SET
  status = 'COMPLETED',
  assigned_instructor_id = 2,
  resulting_routine_id = 1,
  completed_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;




INSERT INTO nutrition_plans (
  id, organization_id, member_id, created_by_id, title, objective,
  daily_calories_target, protein_grams, carbs_grams, fat_grams, water_liters,
  guidelines, notes, status, valid_from, valid_until, created_at, updated_at
) VALUES
(1, 1, 5, 2, 'Plan ganancia muscular',
 'Superávit ligero para hipertrofia con énfasis en proteína.',
 2800, 160, 320, 80, 3.0,
 'Come cada 3–4 horas. Prioriza proteína en cada comida. Entrena con la rutina asignada.',
 'Ajusta porciones si subes más de 0.5 kg/semana.',
 'ACTIVE', CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 month'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 6, 2, 'Plan déficit suave',
 'Bajar grasa manteniendo músculo.',
 1900, 130, 180, 55, 2.5,
 'Prioriza vegetales y proteína magra. Evita bebidas azucaradas.',
 NULL,
 'ACTIVE', CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO nutrition_meals (id, plan_id, name, suggested_time, notes, order_index) VALUES
(1, 1, 'Desayuno', '07:30', NULL, 0),
(2, 1, 'Almuerzo', '12:30', NULL, 1),
(3, 1, 'Merienda pre-entreno', '16:00', '1–2 h antes de entrenar', 2),
(4, 1, 'Cena', '20:00', NULL, 3),
(5, 2, 'Desayuno', '08:00', NULL, 0),
(6, 2, 'Almuerzo', '13:00', NULL, 1),
(7, 2, 'Cena', '19:30', NULL, 2);

INSERT INTO nutrition_meal_items (id, meal_id, food_name, portion, notes, order_index) VALUES
(1, 1, 'Avena cocida', '80 g en seco', NULL, 0),
(2, 1, 'Clara de huevo / huevo', '3 enteros + 2 claras', NULL, 1),
(3, 1, 'Banano', '1 unidad', NULL, 2),
(4, 2, 'Arroz integral', '1 taza cocido', NULL, 0),
(5, 2, 'Pechuga de pollo', '180 g', 'A la plancha', 1),
(6, 2, 'Ensalada mixta', '1 bowl', 'Aceite de oliva 1 cdita', 2),
(7, 3, 'Whey protein', '1 scoop', NULL, 0),
(8, 3, 'Manzana', '1 unidad', NULL, 1),
(9, 4, 'Salmón o tilapia', '150 g', NULL, 0),
(10, 4, 'Papa o camote', '200 g', NULL, 1),
(11, 4, 'Vegetales al vapor', '1 plato', NULL, 2),
(12, 5, 'Yogur griego', '200 g', 'Sin azúcar', 0),
(13, 5, 'Frutos rojos', '1 taza', NULL, 1),
(14, 6, 'Ensalada de atún', '1 lata en agua', NULL, 0),
(15, 6, 'Pan integral', '2 rebanadas', NULL, 1),
(16, 7, 'Huevos revueltos', '2 unidades', NULL, 0),
(17, 7, 'Ensalada verde', '1 plato', NULL, 1);




INSERT INTO body_measurements (
  id, organization_id, member_id, recorded_by_id, measured_at,
  age_years, sex, weight_kg, height_cm,
  neck_cm, chest_cm, waist_cm, hips_cm, shoulders_cm,
  left_arm_cm, right_arm_cm, left_forearm_cm, right_forearm_cm,
  left_thigh_cm, right_thigh_cm, left_calf_cm, right_calf_cm,
  notes, appointment_request_id, created_at
) VALUES
(1, 1, 5, 2,
 (CURRENT_TIMESTAMP - INTERVAL '45 day'),
 30, 'MALE', 78.5, 175.0,
 38.0, 98.0, 86.0, 98.0, 112.0,
 34.0, 34.5, 28.0, 28.5,
 56.0, 56.5, 37.0, 37.5,
 'Medición inicial de seguimiento', NULL, (CURRENT_TIMESTAMP - INTERVAL '45 day')),
(2, 1, 5, 2,
 (CURRENT_TIMESTAMP - INTERVAL '15 day'),
 30, 'MALE', 79.8, 175.0,
 38.5, 100.0, 85.0, 97.5, 114.0,
 35.0, 35.5, 28.5, 29.0,
 57.0, 57.5, 37.5, 38.0,
 'Buen progreso en pecho y brazos', NULL, (CURRENT_TIMESTAMP - INTERVAL '15 day')),
(3, 1, 5, 2,
 (CURRENT_TIMESTAMP - INTERVAL '2 hour'),
 31, 'MALE', 80.2, 175.0,
 38.5, 101.0, 84.5, 97.0, 115.0,
 35.5, 36.0, 28.5, 29.0,
 57.5, 58.0, 38.0, 38.0,
 'Control reciente — listo para cita de seguimiento', 1, CURRENT_TIMESTAMP),
(4, 1, 6, 2,
 (CURRENT_TIMESTAMP - INTERVAL '20 day'),
 33, 'FEMALE', 68.0, 162.0,
 33.0, 92.0, 74.0, 98.0, 100.0,
 28.0, 28.5, 23.0, 23.5,
 54.0, 54.5, 35.0, 35.0,
 'Inicio plan de definición', NULL, (CURRENT_TIMESTAMP - INTERVAL '20 day')),
(5, 1, 6, 2,
 (CURRENT_TIMESTAMP - INTERVAL '3 day'),
 33, 'FEMALE', 66.8, 162.0,
 32.5, 91.0, 72.0, 96.5, 99.0,
 28.0, 28.0, 23.0, 23.0,
 53.5, 54.0, 34.5, 34.5,
 'Bajó cintura; mantener proteína', NULL, (CURRENT_TIMESTAMP - INTERVAL '3 day'));



-- fin seeds demo

SELECT setval(pg_get_serial_sequence('routines', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('routine_days', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('routine_exercises', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('nutrition_plans', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('nutrition_meals', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('nutrition_meal_items', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('body_measurements', 'id'), 100, false);

