-- GymPlatform demo completo para PostgreSQL (generado desde seeds H2)
-- Regenerar: mvn test -Dtest=PostgresSeedScriptGeneratorTest
-- Cargar: bash scripts/load-postgres-demo.sh

-- ========== demo-seed.sql ==========
-- PostgreSQL: inserts demo en orden de FK




INSERT INTO organizations (
  id, name, slug, contact_email, contact_phone, address, city, tagline,
  business_hours, website_url, social_handle, accent_id, season_theme,
  subscription_status, subscription_start, subscription_end, active, created_at
) VALUES
(1, 'Bulls Gym', 'fitlife', 'contacto@fitlife.com', '555-0100', NULL, 'San José',
 'Entrena con propósito', 'Lun–Sáb 5:00–22:00', NULL, NULL, 'indigo', 'NONE',
 'ACTIVE', CURRENT_TIMESTAMP, (CURRENT_TIMESTAMP + INTERVAL '1 year'), TRUE, CURRENT_TIMESTAMP),
(2, 'Power Gym', 'powergym', 'contacto@powergym.com', '555-0300', NULL, NULL,
 NULL, NULL, NULL, NULL, 'indigo', 'NONE',
 'TRIAL', CURRENT_TIMESTAMP, (CURRENT_TIMESTAMP + INTERVAL '30 day'), TRUE, CURRENT_TIMESTAMP),
(3, 'Iron Fit', 'ironfit', 'contacto@ironfit.com', '555-0400', NULL, NULL,
 NULL, NULL, NULL, NULL, 'indigo', 'NONE',
 'SUSPENDED', NULL, NULL, FALSE, CURRENT_TIMESTAMP);









INSERT INTO users (
  id, first_name, last_name, email, password_hash, organization_id,
  active, whatsapp_phone, national_id, created_at
) VALUES
(2, 'Ana', 'Torres', 'instructor@fitlife.com',
 '$2a$10$yahLES3NACJ0QXq8oRayvOfJfACKC6HiFkvagLi2yiseWnUdaiChq',
 1, TRUE, NULL, '203451234', CURRENT_TIMESTAMP),
(3, 'María', 'López', 'recepcion@fitlife.com',
 '$2a$10$iuS5ejskEwQ4NmFUb1.EzOl2jgY/1WJ/ox9ozW24BeoIzlu.Bvao2',
 1, TRUE, NULL, '305672345', CURRENT_TIMESTAMP),
(4, 'Carlos', 'Mendoza', 'admin@fitlife.com',
 '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2',
 1, TRUE, NULL, '104560123', CURRENT_TIMESTAMP),
(5, 'Luis', 'García', 'miembro@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '190205678', CURRENT_TIMESTAMP),
(6, 'Patricia', 'Ruiz', 'patricia@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '203456789', CURRENT_TIMESTAMP),
(7, 'Roberto', 'Sánchez', 'roberto@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '111223344', CURRENT_TIMESTAMP),
(8, 'Sofía', 'Hernández', 'sofia@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '304567890', CURRENT_TIMESTAMP),
(9, 'Diego', 'Morales', 'diego@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '122334455', CURRENT_TIMESTAMP),
(10, 'Elena', 'Castillo', 'elena@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '205678901', CURRENT_TIMESTAMP),
(11, 'Héctor', 'Navarro', 'hector@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '133445566', CURRENT_TIMESTAMP),
(12, 'Carmen', 'Vega', 'carmen@fitlife.com',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, FALSE, NULL, '206789012', CURRENT_TIMESTAMP),
(13, 'Jorge', 'Ramírez', 'admin@powergym.com',
 '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2',
 2, TRUE, NULL, '204560001', CURRENT_TIMESTAMP),
(14, 'Laura', 'Vega', 'instructor@powergym.com',
 '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2',
 2, TRUE, NULL, '204560002', CURRENT_TIMESTAMP),
(15, 'Pedro', 'Silva', 'admin@ironfit.com',
 '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2',
 3, TRUE, NULL, '204560003', CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role) VALUES
(2, 'INSTRUCTOR'),
(3, 'RECEPTIONIST'),
(3, 'MEMBER'),
(4, 'GYM_OWNER'),
(4, 'RECEPTIONIST'),
(4, 'INSTRUCTOR'),
(4, 'MEMBER'),
(5, 'MEMBER'),
(6, 'MEMBER'),
(7, 'MEMBER'),
(8, 'MEMBER'),
(9, 'MEMBER'),
(10, 'MEMBER'),
(11, 'MEMBER'),
(12, 'MEMBER'),
(13, 'GYM_OWNER'),
(14, 'INSTRUCTOR'),
(15, 'GYM_OWNER');




INSERT INTO member_profiles (
  id, user_id, birth_year, age, goals, phone, emergency_contact, national_id, created_at, updated_at
) VALUES
(1, 4, 1985, EXTRACT(YEAR FROM CURRENT_DATE) - 1985, 'Mantener condición física y liderar el gym', '555-0101', NULL, '104560123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, 1990, EXTRACT(YEAR FROM CURRENT_DATE) - 1990, 'Bienestar general', '555-0102', NULL, '305672345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 5, 1995, EXTRACT(YEAR FROM CURRENT_DATE) - 1995, 'Ganar masa muscular y mejorar resistencia', '555-0200', NULL, '190205678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 6, 1992, EXTRACT(YEAR FROM CURRENT_DATE) - 1992, 'Bajar de peso y tonificar', '555-0201', NULL, '203456789', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 7, 1988, EXTRACT(YEAR FROM CURRENT_DATE) - 1988, 'Mejorar resistencia cardiovascular', '555-0202', NULL, '111223344', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 8, 2000, EXTRACT(YEAR FROM CURRENT_DATE) - 2000, 'Flexibilidad y bienestar general', '555-0203', NULL, '304567890', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 9, 1987, EXTRACT(YEAR FROM CURRENT_DATE) - 1987, 'Retomar entrenamiento después de pausa', '555-0204', NULL, '122334455', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 10, 1993, EXTRACT(YEAR FROM CURRENT_DATE) - 1993, 'Preparación para competencia local', '555-0205', NULL, '205678901', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 11, 1991, EXTRACT(YEAR FROM CURRENT_DATE) - 1991, 'Recuperación post-lesión de hombro', '555-0206', NULL, '133445566', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 12, 1984, EXTRACT(YEAR FROM CURRENT_DATE) - 1984, 'Cuenta suspendida por administración', '555-0207', NULL, '206789012', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);




INSERT INTO membership_packages (
  id, name, description, price, apply_iva, iva_percent, duration_months,
  free_activity_quota, organization_id, active, created_at
) VALUES
(1, 'Membresía Básica', 'Acceso a área de pesas y cardio', 599.00, FALSE, NULL, 1, 4, 1, TRUE, CURRENT_TIMESTAMP),
(2, 'Membresía Regular', 'Pesas, cardio y clases grupales incluidas', 749.00, FALSE, NULL, 1, 8, 1, TRUE, CURRENT_TIMESTAMP),
(3, 'Membresía Premium', 'Acceso completo + clases ilimitadas', 899.00, FALSE, NULL, 1, NULL, 1, TRUE, CURRENT_TIMESTAMP),
(4, 'Plan Anual Legacy', 'Plan descontinuado — solo referencia histórica', 4999.00, FALSE, NULL, 12, 2, 1, FALSE, CURRENT_TIMESTAMP),
(5, 'Plan Mensual', 'Acceso general al gimnasio', 499.00, FALSE, NULL, 1, 6, 2, TRUE, CURRENT_TIMESTAMP);

INSERT INTO package_addons (id, name, description, price, package_id, active) VALUES
(1, 'Casillero', 'Casillero mensual', 150.00, 1, TRUE),
(2, 'Toalla', 'Servicio de toalla', 80.00, 1, TRUE);


INSERT INTO organization_statistics_access (id, organization_id, password_hash, updated_at) VALUES
(1, 1, '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2', CURRENT_TIMESTAMP);








INSERT INTO member_subscriptions (
  id, member_id, membership_package_id, start_date, end_date, active, created_at
) VALUES
(1, 5, 1, (CURRENT_DATE - INTERVAL '10 day'), (CURRENT_DATE + INTERVAL '1 month'), TRUE, CURRENT_TIMESTAMP),
(2, 4, 3, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month'), TRUE, CURRENT_TIMESTAMP),
(3, 3, 1, CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month'), TRUE, CURRENT_TIMESTAMP),
(4, 10, 3, (CURRENT_DATE - INTERVAL '25 day'), (CURRENT_DATE + INTERVAL '5 day'), TRUE, CURRENT_TIMESTAMP),
(5, 6, 1, (CURRENT_DATE - INTERVAL '2 month'), (CURRENT_DATE - INTERVAL '20 day'), TRUE, CURRENT_TIMESTAMP),
(6, 11, 1, (CURRENT_DATE - INTERVAL '1 month'), (CURRENT_DATE - INTERVAL '10 day'), TRUE, CURRENT_TIMESTAMP),
(7, 7, 3, (CURRENT_DATE - INTERVAL '3 month'), (CURRENT_DATE - INTERVAL '45 day'), TRUE, CURRENT_TIMESTAMP),
(8, 9, 1, (CURRENT_DATE - INTERVAL '5 month'), (CURRENT_DATE - INTERVAL '3 month'), TRUE, CURRENT_TIMESTAMP);




INSERT INTO activities (
  id, name, description, image_url, start_date, end_date, recurring, repeat_days,
  start_time, end_time, location_name, instructor_id, organization_id,
  capacity, all_day, active, created_at
) VALUES
(1, 'Spinning matutino', 'Ciclismo indoor de alta intensidad',
 '/uploads/marketing/promo-spinning.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '07:30:00', TIME '08:30:00', 'Sala 1', 2, 1, 15, FALSE, TRUE, CURRENT_TIMESTAMP),
(2, 'Funcional', 'Entrenamiento funcional de hoy',
 '/uploads/marketing/promo-funcional.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '10:00:00', TIME '11:00:00', 'Sala 2', 2, 1, 20, FALSE, TRUE, CURRENT_TIMESTAMP),
(3, 'HIIT Grupal', 'Circuito de alta intensidad',
 '/uploads/marketing/promo-hiit.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '11:30:00', TIME '12:30:00', 'Sala 2', 2, 1, 16, FALSE, TRUE, CURRENT_TIMESTAMP),
(4, 'Zumba', 'Baile fitness en grupo',
 '/uploads/marketing/promo-zumba.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '14:00:00', TIME '15:00:00', 'Sala 1', 2, 1, 25, FALSE, TRUE, CURRENT_TIMESTAMP),
(5, 'Boxeo tarde', 'Técnica y acondicionamiento',
 '/uploads/marketing/promo-boxeo.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '16:00:00', TIME '17:00:00', 'Sala 4', 2, 1, 12, FALSE, TRUE, CURRENT_TIMESTAMP),
(6, 'Yoga al atardecer', 'Sesión de flexibilidad — cupo ilimitado',
 '/uploads/marketing/promo-yoga.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '18:00:00', TIME '19:00:00', 'Terraza', 2, 1, NULL, FALSE, TRUE, CURRENT_TIMESTAMP),
(7, 'Spinning nocturno', 'Ciclismo indoor vespertino',
 '/uploads/marketing/promo-spinning.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '19:30:00', TIME '20:30:00', 'Sala 1', 2, 1, 15, FALSE, TRUE, CURRENT_TIMESTAMP),
(8, 'Spinning', 'Clase grupal de ciclismo indoor',
 '/uploads/marketing/promo-spinning.jpg',
 (CURRENT_DATE + INTERVAL '2 day'), (CURRENT_DATE + INTERVAL '2 day'), FALSE, NULL,
 TIME '07:00:00', TIME '08:00:00', 'Sala 1', 2, 1, 15, FALSE, TRUE, CURRENT_TIMESTAMP),
(9, 'Yoga', 'Sesión de flexibilidad y respiración',
 '/uploads/marketing/promo-yoga.jpg',
 (CURRENT_DATE + INTERVAL '3 day'), (CURRENT_DATE + INTERVAL '3 day'), FALSE, NULL,
 TIME '18:30:00', TIME '19:30:00', 'Terraza', 2, 1, NULL, FALSE, TRUE, CURRENT_TIMESTAMP),
(10, 'HIIT Express', 'Alta intensidad en 45 minutos',
 '/uploads/marketing/promo-hiit.jpg',
 (CURRENT_DATE + INTERVAL '5 day'), (CURRENT_DATE + INTERVAL '5 day'), FALSE, NULL,
 TIME '19:00:00', TIME '19:45:00', 'Sala 2', 2, 1, 10, FALSE, TRUE, CURRENT_TIMESTAMP),
(11, 'Boxeo fitness', 'Combinación de técnica y cardio',
 '/uploads/marketing/promo-boxeo.jpg',
 (CURRENT_DATE - INTERVAL '1 day'), (CURRENT_DATE - INTERVAL '1 day'), FALSE, NULL,
 TIME '17:00:00', TIME '18:00:00', 'Sala 4', 2, 1, 12, FALSE, TRUE, CURRENT_TIMESTAMP),
(12, 'Pilates', 'Clase recurrente lun/mié/vie',
 '/uploads/marketing/promo-pilates.jpg',
 (CURRENT_DATE - INTERVAL '7 day'), (CURRENT_DATE + INTERVAL '3 month'), TRUE,
 'MONDAY,WEDNESDAY,FRIDAY',
 TIME '09:00:00', TIME '10:00:00', 'Sala 3', 2, 1, 12, FALSE, TRUE, CURRENT_TIMESTAMP),
(13, 'CrossFit', 'WOD del día',
 '/uploads/marketing/promo-crossfit.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '08:00:00', TIME '09:00:00', 'Box principal', 14, 2, 18, FALSE, TRUE, CURRENT_TIMESTAMP);



INSERT INTO activity_promotions (
  id, organization_id, activity_id, slot_index, image_url, created_at, updated_at
) VALUES
(1, 1, 12, 1, '/uploads/marketing/promo-pilates.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 9, 2, '/uploads/marketing/promo-yoga.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 10, 3, '/uploads/marketing/promo-hiit.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);




INSERT INTO reservations (
  id, activity_id, member_id, occurrence_date, activity_name, status,
  free_slot, payment_required, paid, attended, created_at, updated_at
) VALUES
(1, 2, 5, CURRENT_DATE, 'Funcional', 'CONFIRMED', TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 5, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 9, 5, (CURRENT_DATE + INTERVAL '3 day'), 'Yoga', 'CONFIRMED', FALSE, TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 6, 5, CURRENT_DATE, 'Yoga al atardecer', 'CANCELLED', FALSE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 6, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 7, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 2, 10, CURRENT_DATE, 'Funcional', 'CONFIRMED', TRUE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 10, 11, (CURRENT_DATE + INTERVAL '5 day'), 'HIIT Express', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 11, 3, (CURRENT_DATE - INTERVAL '1 day'), 'Boxeo fitness', 'CONFIRMED', FALSE, TRUE, TRUE, TRUE, (CURRENT_TIMESTAMP - INTERVAL '1 day'), CURRENT_TIMESTAMP),
(10, 11, 7, (CURRENT_DATE - INTERVAL '1 day'), 'Boxeo fitness', 'CONFIRMED', FALSE, TRUE, TRUE, TRUE, (CURRENT_TIMESTAMP - INTERVAL '20 day'), CURRENT_TIMESTAMP);




INSERT INTO staff_availability (
  id, staff_id, organization_id, availability_date, start_time, end_time, slot_duration_minutes, created_at
) VALUES
(1, NULL, 1, (CURRENT_DATE + INTERVAL '1 day'), TIME '09:00:00', TIME '13:00:00', 30, CURRENT_TIMESTAMP),
(2, NULL, 1, (CURRENT_DATE + INTERVAL '1 day'), TIME '16:00:00', TIME '19:00:00', 30, CURRENT_TIMESTAMP),
(3, NULL, 1, (CURRENT_DATE + INTERVAL '2 day'), TIME '09:00:00', TIME '13:00:00', 30, CURRENT_TIMESTAMP),
(4, NULL, 1, (CURRENT_DATE + INTERVAL '2 day'), TIME '16:00:00', TIME '19:00:00', 30, CURRENT_TIMESTAMP),
(5, NULL, 1, (CURRENT_DATE + INTERVAL '3 day'), TIME '09:00:00', TIME '13:00:00', 30, CURRENT_TIMESTAMP),
(6, NULL, 1, (CURRENT_DATE + INTERVAL '3 day'), TIME '16:00:00', TIME '19:00:00', 30, CURRENT_TIMESTAMP);




INSERT INTO appointment_requests (
  id, member_id, organization_id, type, notes, status,
  preferred_staff_id, assigned_staff_id, staff_availability_id,
  scheduled_start, scheduled_end, created_at, updated_at
) VALUES
(1, 5, 1, 'MEASUREMENT', 'Primera toma de medidas del mes', 'SCHEDULED',
 2, 2, 1,
 (((CURRENT_DATE + INTERVAL '1 day'))::date + TIME '09:00:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '1 day'))::date + TIME '09:30:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 6, 1, 'NUTRITION', 'Consulta nutricional — plan de déficit calórico', 'SCHEDULED',
 2, 2, 1,
 (((CURRENT_DATE + INTERVAL '1 day'))::date + TIME '10:00:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '1 day'))::date + TIME '10:30:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 7, 1, 'CONSULTATION', 'Seguimiento de objetivos y lesión de rodilla', 'SCHEDULED',
 2, 2, 2,
 (((CURRENT_DATE + INTERVAL '1 day'))::date + TIME '16:00:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '1 day'))::date + TIME '16:30:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 10, 1, 'MEASUREMENT', 'Control pre-competencia agendado', 'SCHEDULED',
 2, 2, 3,
 (((CURRENT_DATE + INTERVAL '2 day'))::date + TIME '09:30:00')::timestamp,
 (((CURRENT_DATE + INTERVAL '2 day'))::date + TIME '10:00:00')::timestamp,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 8, 1, 'CONSULTATION', 'Primera evaluación — pendiente de confirmar', 'PENDING',
 2, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 9, 1, 'NUTRITION', 'Solicitud rechazada — no asiste', 'REJECTED',
 NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);




INSERT INTO routine_requests (
  id, member_id, organization_id, description, goals, additional_notes, status,
  assigned_instructor_id, preferred_instructor_id, resulting_routine_id,
  created_at, updated_at, completed_at
) VALUES
(1, 5, 1, 'Quiero una rutina de fuerza', 'Hipertrofia en tren superior',
 'Prefiero entrenar por la mañana', 'PENDING', NULL, 2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(2, 6, 1, 'Rutina para perder grasa', 'Definición y cardio moderado',
 NULL, 'PENDING', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(3, 11, 1, 'Plan post-lesión de hombro', 'Movilidad y fortalecimiento progresivo',
 'Evitar press vertical por ahora', 'IN_PROGRESS', 2, 2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(4, 7, 1, 'Rutina completada — mantenimiento', 'Consolidar avances del trimestre',
 NULL, 'COMPLETED', 2, 2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 8, 1, 'Solicitud rechazada — fuera de alcance', 'Preparación powerlifting competencia',
 NULL, 'REJECTED', NULL, 2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);




INSERT INTO broadcast_message_templates (
  id, organization_id, channel, name, body, purpose, membership_package_id,
  media_links_json, created_at, updated_at
) VALUES
(1, 1, 'WHATSAPP', 'Bienvenida Básica',
 '¡Hola {{nombre}}! Bienvenido(a) a {{gimnasio}} con Membresía Básica. ¡Nos vemos en el gym!',
 'WELCOME', 1, '["https://example.com/fitlife/guia-basica.pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'WHATSAPP', 'Bienvenida Regular',
 '¡Hola {{nombre}}! Gracias por unirte a {{gimnasio}} con Membresía Regular.',
 'WELCOME', 2, '["https://example.com/fitlife/guia-regular.pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 'WHATSAPP', 'Bienvenida Premium',
 '¡Hola {{nombre}}! Bienvenido(a) al plan Premium de {{gimnasio}}. Acceso completo y clases ilimitadas.',
 'WELCOME', 3, '["https://example.com/fitlife/guia-premium.pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);





INSERT INTO product_categories (
  id, organization_id, name, slug, description, sort_order, active, created_at
) VALUES
(1, 1, 'Chicles y dulces', 'chicles', 'Chicles, gomitas y snacks dulces', 10, TRUE, CURRENT_TIMESTAMP),
(2, 1, 'Barras', 'barras', 'Barras proteicas y energéticas', 20, TRUE, CURRENT_TIMESTAMP),
(3, 1, 'Proteínas', 'proteinas', 'Whey, isolate, caseína y blends', 30, TRUE, CURRENT_TIMESTAMP),
(4, 1, 'Creatina', 'creatina', 'Creatina monohidrato y variantes', 40, TRUE, CURRENT_TIMESTAMP),
(5, 1, 'Aminoácidos', 'aminos', 'BCAA, EAA y aminoácidos', 50, TRUE, CURRENT_TIMESTAMP),
(6, 1, 'Pre-entreno', 'pre-entreno', 'Pre-workouts y estimulantes', 60, TRUE, CURRENT_TIMESTAMP),
(7, 1, 'Vitaminas y minerales', 'vitaminas', 'Multivitamínicos y minerales', 70, TRUE, CURRENT_TIMESTAMP),
(8, 1, 'Bebidas', 'bebidas', 'Bebidas deportivas y listos para tomar', 80, TRUE, CURRENT_TIMESTAMP),
(9, 1, 'Accesorios', 'accesorios', 'Shakers, bandas, ropa y más', 90, TRUE, CURRENT_TIMESTAMP),
(10, 1, 'Otros', 'otros', 'Productos varios de tienda', 100, TRUE, CURRENT_TIMESTAMP);

INSERT INTO products (
  id, organization_id, name, name_normalized, code_prefix, description, image_url,
  stock_units, units_per_package, package_label, unit_label,
  package_price, unit_price, apply_iva, iva_percent, sell_by_package, sell_by_unit,
  offer_percent, offer_badge, offer_from, offer_until, active, created_at, updated_at
) VALUES
(1, 1, 'Optimum Nutrition Gold Standard Whey 2lb', 'optimum nutrition gold standard whey 2lb', 'OPTIMUM',
 'Proteína whey demo', NULL, 240, 30, 'tarro', 'servida', 28000.00, 1200.00, FALSE, NULL, TRUE, TRUE,
 15, '15% OFF', CURRENT_DATE, (CURRENT_DATE + INTERVAL '30 day'), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'MuscleTech Nitro-Tech 2lb', 'muscletech nitro-tech 2lb', 'MUSCLETECH',
 NULL, NULL, 168, 28, 'tarro', 'servida', 26000.00, 1100.00, FALSE, NULL, TRUE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 'Trident Spearmint', 'trident spearmint', 'TRIDENT',
 NULL, NULL, 240, 12, 'caja', 'chicle', 1200.00, 150.00, FALSE, NULL, TRUE, TRUE,
 20, '20% OFF', CURRENT_DATE, (CURRENT_DATE + INTERVAL '14 day'), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 1, 'Powerade Mora Azul 600ml', 'powerade mora azul 600ml', 'POWERADE',
 NULL, NULL, 24, 1, 'paquete', 'botella', 0.00, 1500.00, FALSE, NULL, FALSE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 'Monster Energy Original 473ml', 'monster energy original 473ml', 'MONSTER',
 NULL, NULL, 30, 1, 'paquete', 'lata', 0.00, 2200.00, FALSE, NULL, FALSE, TRUE,
 10, '10% OFF', CURRENT_DATE, (CURRENT_DATE + INTERVAL '7 day'), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 'Creatina Monohidrato Creapure 300g', 'creatina monohidrato creapure 300g', 'CREATINA',
 NULL, NULL, 480, 60, 'tarro', 'servida', 12000.00, 300.00, FALSE, NULL, TRUE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 'Quest Bar Cookies & Cream', 'quest bar cookies & cream', 'QUEST',
 NULL, NULL, 72, 12, 'caja', 'barra', 18000.00, 1800.00, FALSE, NULL, TRUE, TRUE,
 25, '25% OFF', CURRENT_DATE, (CURRENT_DATE + INTERVAL '21 day'), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 'Shaker Pro 700ml', 'shaker pro 700ml', 'SHAKER',
 NULL, NULL, 20, 1, 'paquete', 'unidad', 0.00, 4500.00, FALSE, NULL, FALSE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 'C4 Original Pre-Workout', 'c4 original pre-workout', 'C4',
 NULL, NULL, 120, 30, 'tarro', 'servida', 20000.00, 900.00, FALSE, NULL, TRUE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 'Guantes de entrenamiento M', 'guantes de entrenamiento m', 'GUANTES',
 NULL, NULL, 12, 1, 'paquete', 'par', 0.00, 6500.00, FALSE, NULL, FALSE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO product_category_links (product_id, category_id) VALUES
(1, 3), (2, 3), (3, 1), (4, 8), (5, 8), (6, 4), (7, 2), (8, 9), (9, 6), (10, 9);

-- fin seeds demo


SELECT setval(pg_get_serial_sequence('organizations', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('organization_statistics_access', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('users', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('member_profiles', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('membership_packages', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('package_addons', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('member_subscriptions', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('activities', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('activity_promotions', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('reservations', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('staff_availability', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('appointment_requests', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('routine_requests', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('broadcast_message_templates', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('product_categories', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('products', 'id'), 100, false);

-- ========== demo-seed-sales.sql ==========
-- PostgreSQL: inserts demo en orden de FK




INSERT INTO cash_sessions (
  id, organization_id, opened_by_user_id, closed_by_user_id, status,
  opened_at, closed_at, opening_total, closing_total, expected_closing_total, notes
) VALUES
(1, 1, 3, 3, 'CLOSED',
 (CURRENT_TIMESTAMP - INTERVAL '35 day'), (CURRENT_TIMESTAMP - INTERVAL '34 day'),
 50000.00, 185000.00, 182000.00, 'Caja mes anterior'),
(2, 1, 4, 4, 'CLOSED',
 (CURRENT_TIMESTAMP - INTERVAL '20 day'), (CURRENT_TIMESTAMP - INTERVAL '19 day'),
 50000.00, 210000.00, 208500.00, 'Caja quincena'),
(3, 1, 3, 3, 'CLOSED',
 (CURRENT_TIMESTAMP - INTERVAL '7 day'), (CURRENT_TIMESTAMP - INTERVAL '6 day'),
 50000.00, 156000.00, 155200.00, 'Caja semana pasada'),
(4, 1, 3, NULL, 'OPEN',
 (CURRENT_TIMESTAMP - INTERVAL '6 hour'), NULL,
 50000.00, NULL, NULL, 'Caja abierta hoy');


INSERT INTO store_sales (
  id, organization_id, cash_session_id, member_id, created_by_user_id,
  type, payment_method, payment_proof_data, total, notes, created_at,
  voided_at, voided_by_user_id, void_reason
) VALUES

(1, 1, 1, 5, 3, 'SALE', NULL, NULL, 28000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '40 day') + INTERVAL '10 hour'), NULL, NULL, NULL),
(2, 1, 1, 6, 3, 'SALE', NULL, NULL, 749.00, 'Membresía Regular',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '38 day') + INTERVAL '11 hour'), NULL, NULL, NULL),
(3, 1, 1, NULL, 3, 'SALE', NULL, NULL, 4400.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '36 day') + INTERVAL '16 hour'), NULL, NULL, NULL),
(4, 1, 1, 7, 4, 'SALE', NULL, NULL, 18000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '34 day') + INTERVAL '9 hour'), NULL, NULL, NULL),
(5, 1, 1, NULL, 3, 'MANUAL_INCOME', NULL, NULL, 25000.00, 'Alquiler de espacio evento',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '33 day') + INTERVAL '14 hour'), NULL, NULL, NULL),
(6, 1, 1, NULL, 3, 'MANUAL_EXPENSE', NULL, NULL, 8000.00, 'Compra insumos limpieza',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '32 day') + INTERVAL '17 hour'), NULL, NULL, NULL),
(7, 1, 2, 8, 4, 'SALE', NULL, NULL, 899.00, 'Membresía Premium',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '28 day') + INTERVAL '10 hour'), NULL, NULL, NULL),
(8, 1, 2, 5, 3, 'SALE', NULL, NULL, 4500.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '26 day') + INTERVAL '12 hour'), NULL, NULL, NULL),
(9, 1, 2, 10, 3, 'SALE', NULL, NULL, 32000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '24 day') + INTERVAL '18 hour'), NULL, NULL, NULL),
(10, 1, 2, NULL, 4, 'SALE', NULL, NULL, 3600.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '22 day') + INTERVAL '8 hour'), NULL, NULL, NULL),
(11, 1, 2, 11, 3, 'SALE', NULL, NULL, 12000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '21 day') + INTERVAL '15 hour'), NULL, NULL, NULL),
(12, 1, 2, NULL, 3, 'MANUAL_EXPENSE', NULL, NULL, 15000.00, 'Reparación equipo cardio',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '20 day') + INTERVAL '11 hour'), NULL, NULL, NULL),
(13, 1, 2, 6, 4, 'SALE', NULL, NULL, 599.00, 'Membresía Básica',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '18 day') + INTERVAL '9 hour'), NULL, NULL, NULL),
(14, 1, 2, 7, 3, 'SALE', NULL, NULL, 6600.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '16 day') + INTERVAL '19 hour'), NULL, NULL, NULL),
(15, 1, 2, NULL, 3, 'MANUAL_INCOME', NULL, NULL, 12000.00, 'Patrocinio local',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '15 day') + INTERVAL '13 hour'), NULL, NULL, NULL),

(16, 1, 3, 5, 3, 'SALE', NULL, NULL, 28000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '12 day') + INTERVAL '9 hour'), NULL, NULL, NULL),
(17, 1, 3, 6, 3, 'SALE', NULL, NULL, 3700.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '11 day') + INTERVAL '10 hour'), NULL, NULL, NULL),
(18, 1, 3, 7, 4, 'SALE', NULL, NULL, 899.00, 'Membresía Premium',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '10 day') + INTERVAL '11 hour'), NULL, NULL, NULL),
(19, 1, 3, NULL, 3, 'SALE', NULL, NULL, 5400.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '9 day') + INTERVAL '16 hour'), NULL, NULL, NULL),
(20, 1, 3, 8, 3, 'SALE', NULL, NULL, 18000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '8 day') + INTERVAL '12 hour'), NULL, NULL, NULL),
(21, 1, 3, 10, 4, 'SALE', NULL, NULL, 1200.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '7 day') + INTERVAL '8 hour'), NULL, NULL, NULL),
(22, 1, 3, NULL, 3, 'MANUAL_EXPENSE', NULL, NULL, 9500.00, 'Pago proveedor bebidas',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '7 day') + INTERVAL '14 hour'), NULL, NULL, NULL),
(23, 1, 3, 5, 3, 'SALE', NULL, NULL, 20000.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '6 day') + INTERVAL '17 hour'), NULL, NULL, NULL),
(24, 1, 3, 11, 4, 'SALE', NULL, NULL, 749.00, 'Membresía Regular',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '5 day') + INTERVAL '9 hour'), NULL, NULL, NULL),
(25, 1, 4, 6, 3, 'SALE', NULL, NULL, 4500.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '4 day') + INTERVAL '10 hour'), NULL, NULL, NULL),
(26, 1, 4, 7, 3, 'SALE', NULL, NULL, 6600.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '3 day') + INTERVAL '11 hour'), NULL, NULL, NULL),
(27, 1, 4, NULL, 4, 'SALE', NULL, NULL, 32500.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '3 day') + INTERVAL '15 hour'), NULL, NULL, NULL),
(28, 1, 4, 8, 3, 'SALE', NULL, NULL, 599.00, 'Membresía Básica',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '2 day') + INTERVAL '9 hour'), NULL, NULL, NULL),
(29, 1, 4, 5, 3, 'SALE', NULL, NULL, 10100.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '2 day') + INTERVAL '18 hour'), NULL, NULL, NULL),
(30, 1, 4, NULL, 3, 'MANUAL_INCOME', NULL, NULL, 18000.00, 'Clase particular grupal',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '1 day') + INTERVAL '13 hour'), NULL, NULL, NULL),
(31, 1, 4, 10, 4, 'SALE', NULL, NULL, 1500.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '1 day') + INTERVAL '19 hour'), NULL, NULL, NULL),
(32, 1, 4, 6, 3, 'SALE', NULL, NULL, 28000.00, NULL,
 (CURRENT_TIMESTAMP - INTERVAL '5 hour'), NULL, NULL, NULL),
(33, 1, 4, 7, 3, 'SALE', NULL, NULL, 4400.00, NULL,
 (CURRENT_TIMESTAMP - INTERVAL '4 hour'), NULL, NULL, NULL),
(34, 1, 4, 5, 4, 'SALE', NULL, NULL, 899.00, 'Membresía Premium',
 (CURRENT_TIMESTAMP - INTERVAL '3 hour'), NULL, NULL, NULL),
(35, 1, 4, NULL, 3, 'SALE', NULL, NULL, 6500.00, NULL,
 (CURRENT_TIMESTAMP - INTERVAL '2 hour'), NULL, NULL, NULL),
(36, 1, 4, 8, 3, 'SALE', NULL, NULL, 3700.00, NULL,
 (CURRENT_TIMESTAMP - INTERVAL '1 hour'), NULL, NULL, NULL),
(37, 1, 4, NULL, 3, 'MANUAL_EXPENSE', NULL, NULL, 4200.00, 'Material oficina',
 (CURRENT_TIMESTAMP - INTERVAL '45 minute'), NULL, NULL, NULL),
(38, 1, 4, 11, 4, 'SALE', NULL, NULL, 12000.00, NULL,
 (CURRENT_TIMESTAMP - INTERVAL '30 minute'), NULL, NULL, NULL),
(39, 1, 4, 5, 3, 'SALE', NULL, NULL, 1500.00, 'Venta anulada demo',
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '2 day') + INTERVAL '20 hour'),
 (((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '2 day') + INTERVAL '30 minute') + INTERVAL '20 hour'),
 3, 'Error de cobro'),
(40, 1, 1, 9, 4, 'SALE', NULL, NULL, 24500.00, NULL,
 ((CAST(CURRENT_DATE AS TIMESTAMP) - INTERVAL '3 month') + INTERVAL '12 hour'), NULL, NULL, NULL);

INSERT INTO store_sale_items (
  id, store_sale_id, kind, product_id, membership_package_id, description,
  quantity, stock_units_deducted, member_subscription_id, unit_price, line_total
) VALUES
(1, 1, 'PACKAGE', 1, NULL, 'Optimum Nutrition Gold Standard Whey 2lb', 1, 30, NULL, 28000.00, 28000.00),
(2, 2, 'MEMBERSHIP', NULL, 2, 'Membresía Regular', 1, 0, NULL, 749.00, 749.00),
(3, 3, 'UNIT', 5, NULL, 'Monster Energy Original 473ml', 2, 2, NULL, 2200.00, 4400.00),
(4, 4, 'PACKAGE', 7, NULL, 'Quest Bar Cookies & Cream', 1, 12, NULL, 18000.00, 18000.00),
(5, 5, 'MANUAL', NULL, NULL, 'Alquiler de espacio evento', 1, 0, NULL, 25000.00, 25000.00),
(6, 6, 'MANUAL', NULL, NULL, 'Compra insumos limpieza', 1, 0, NULL, 8000.00, 8000.00),
(7, 7, 'MEMBERSHIP', NULL, 3, 'Membresía Premium', 1, 0, NULL, 899.00, 899.00),
(8, 8, 'UNIT', 8, NULL, 'Shaker Pro 700ml', 1, 1, NULL, 4500.00, 4500.00),
(9, 9, 'PACKAGE', 2, NULL, 'MuscleTech Nitro-Tech 2lb', 1, 28, NULL, 26000.00, 26000.00),
(10, 9, 'UNIT', 3, NULL, 'Trident Spearmint', 4, 4, NULL, 1500.00, 6000.00),
(11, 10, 'UNIT', 4, NULL, 'Powerade Mora Azul 600ml', 2, 2, NULL, 1500.00, 3000.00),
(12, 10, 'UNIT', 3, NULL, 'Trident Spearmint', 4, 4, NULL, 150.00, 600.00),
(13, 11, 'PACKAGE', 6, NULL, 'Creatina Monohidrato Creapure 300g', 1, 60, NULL, 12000.00, 12000.00),
(14, 12, 'MANUAL', NULL, NULL, 'Reparación equipo cardio', 1, 0, NULL, 15000.00, 15000.00),
(15, 13, 'MEMBERSHIP', NULL, 1, 'Membresía Básica', 1, 0, NULL, 599.00, 599.00),
(16, 14, 'UNIT', 5, NULL, 'Monster Energy Original 473ml', 3, 3, NULL, 2200.00, 6600.00),
(17, 15, 'MANUAL', NULL, NULL, 'Patrocinio local', 1, 0, NULL, 12000.00, 12000.00),
(18, 16, 'PACKAGE', 1, NULL, 'Optimum Nutrition Gold Standard Whey 2lb', 1, 30, NULL, 28000.00, 28000.00),
(19, 17, 'UNIT', 4, NULL, 'Powerade Mora Azul 600ml', 1, 1, NULL, 1500.00, 1500.00),
(20, 17, 'UNIT', 5, NULL, 'Monster Energy Original 473ml', 1, 1, NULL, 2200.00, 2200.00),
(21, 18, 'MEMBERSHIP', NULL, 3, 'Membresía Premium', 1, 0, NULL, 899.00, 899.00),
(22, 19, 'UNIT', 8, NULL, 'Shaker Pro 700ml', 1, 1, NULL, 4500.00, 4500.00),
(23, 19, 'UNIT', 3, NULL, 'Trident Spearmint', 6, 6, NULL, 150.00, 900.00),
(24, 20, 'PACKAGE', 7, NULL, 'Quest Bar Cookies & Cream', 1, 12, NULL, 18000.00, 18000.00),
(25, 21, 'UNIT', 3, NULL, 'Trident Spearmint', 8, 8, NULL, 150.00, 1200.00),
(26, 22, 'MANUAL', NULL, NULL, 'Pago proveedor bebidas', 1, 0, NULL, 9500.00, 9500.00),
(27, 23, 'PACKAGE', 9, NULL, 'C4 Original Pre-Workout', 1, 30, NULL, 20000.00, 20000.00),
(28, 24, 'MEMBERSHIP', NULL, 2, 'Membresía Regular', 1, 0, NULL, 749.00, 749.00),
(29, 25, 'UNIT', 8, NULL, 'Shaker Pro 700ml', 1, 1, NULL, 4500.00, 4500.00),
(30, 26, 'UNIT', 5, NULL, 'Monster Energy Original 473ml', 3, 3, NULL, 2200.00, 6600.00),
(31, 27, 'PACKAGE', 2, NULL, 'MuscleTech Nitro-Tech 2lb', 1, 28, NULL, 26000.00, 26000.00),
(32, 27, 'UNIT', 10, NULL, 'Guantes de entrenamiento M', 1, 1, NULL, 6500.00, 6500.00),
(33, 28, 'MEMBERSHIP', NULL, 1, 'Membresía Básica', 1, 0, NULL, 599.00, 599.00),
(34, 29, 'UNIT', 4, NULL, 'Powerade Mora Azul 600ml', 2, 2, NULL, 1500.00, 3000.00),
(35, 29, 'UNIT', 10, NULL, 'Guantes de entrenamiento M', 1, 1, NULL, 6500.00, 6500.00),
(36, 29, 'UNIT', 3, NULL, 'Trident Spearmint', 4, 4, NULL, 150.00, 600.00),
(37, 30, 'MANUAL', NULL, NULL, 'Clase particular grupal', 1, 0, NULL, 18000.00, 18000.00),
(38, 31, 'UNIT', 4, NULL, 'Powerade Mora Azul 600ml', 1, 1, NULL, 1500.00, 1500.00),
(39, 32, 'PACKAGE', 1, NULL, 'Optimum Nutrition Gold Standard Whey 2lb', 1, 30, NULL, 28000.00, 28000.00),
(40, 33, 'UNIT', 5, NULL, 'Monster Energy Original 473ml', 2, 2, NULL, 2200.00, 4400.00),
(41, 34, 'MEMBERSHIP', NULL, 3, 'Membresía Premium', 1, 0, NULL, 899.00, 899.00),
(42, 35, 'UNIT', 10, NULL, 'Guantes de entrenamiento M', 1, 1, NULL, 6500.00, 6500.00),
(43, 36, 'UNIT', 4, NULL, 'Powerade Mora Azul 600ml', 1, 1, NULL, 1500.00, 1500.00),
(44, 36, 'UNIT', 5, NULL, 'Monster Energy Original 473ml', 1, 1, NULL, 2200.00, 2200.00),
(45, 37, 'MANUAL', NULL, NULL, 'Material oficina', 1, 0, NULL, 4200.00, 4200.00),
(46, 38, 'PACKAGE', 6, NULL, 'Creatina Monohidrato Creapure 300g', 1, 60, NULL, 12000.00, 12000.00),
(47, 39, 'UNIT', 4, NULL, 'Powerade Mora Azul 600ml', 1, 1, NULL, 1500.00, 1500.00),
(48, 40, 'PACKAGE', 9, NULL, 'C4 Original Pre-Workout', 1, 30, NULL, 20000.00, 20000.00),
(49, 40, 'UNIT', 8, NULL, 'Shaker Pro 700ml', 1, 1, NULL, 4500.00, 4500.00);

INSERT INTO store_sale_payments (id, store_sale_id, payment_method, amount, payment_proof_data) VALUES
(1, 1, 'CARD', 28000.00, NULL),
(2, 2, 'CASH', 749.00, NULL),
(3, 3, 'CASH', 4400.00, NULL),
(4, 4, 'SINPE', 18000.00, NULL),
(5, 5, 'CASH', 25000.00, NULL),
(6, 6, 'CASH', 8000.00, NULL),
(7, 7, 'CARD', 899.00, NULL),
(8, 8, 'CASH', 4500.00, NULL),
(9, 9, 'CARD', 20000.00, NULL),
(10, 9, 'CASH', 12000.00, NULL),
(11, 10, 'CASH', 3600.00, NULL),
(12, 11, 'SINPE', 12000.00, NULL),
(13, 12, 'CASH', 15000.00, NULL),
(14, 13, 'CASH', 599.00, NULL),
(15, 14, 'CARD', 6600.00, NULL),
(16, 15, 'CASH', 12000.00, NULL),
(17, 16, 'CARD', 28000.00, NULL),
(18, 17, 'CASH', 3700.00, NULL),
(19, 18, 'SINPE', 899.00, NULL),
(20, 19, 'CASH', 5400.00, NULL),
(21, 20, 'CARD', 18000.00, NULL),
(22, 21, 'CASH', 1200.00, NULL),
(23, 22, 'CASH', 9500.00, NULL),
(24, 23, 'SINPE', 20000.00, NULL),
(25, 24, 'CARD', 749.00, NULL),
(26, 25, 'CASH', 4500.00, NULL),
(27, 26, 'CASH', 6600.00, NULL),
(28, 27, 'CARD', 32500.00, NULL),
(29, 28, 'CASH', 599.00, NULL),
(30, 29, 'CASH', 5000.00, NULL),
(31, 29, 'CARD', 5100.00, NULL),
(32, 30, 'CASH', 18000.00, NULL),
(33, 31, 'CASH', 1500.00, NULL),
(34, 32, 'CARD', 28000.00, NULL),
(35, 33, 'CASH', 4400.00, NULL),
(36, 34, 'SINPE', 899.00, NULL),
(37, 35, 'CASH', 6500.00, NULL),
(38, 36, 'CARD', 3700.00, NULL),
(39, 37, 'CASH', 4200.00, NULL),
(40, 38, 'CASH', 12000.00, NULL),
(41, 39, 'CASH', 1500.00, NULL),
(42, 40, 'CARD', 24500.00, NULL);

-- fin seeds demo

SELECT setval(pg_get_serial_sequence('cash_sessions', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('store_sales', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('store_sale_items', 'id'), 100, false);
SELECT setval(pg_get_serial_sequence('store_sale_payments', 'id'), 100, false);

-- ========== demo-seed-member.sql ==========
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

-- ========== demo-seed-member-staff.sql ==========
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

