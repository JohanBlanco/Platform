-- =============================================================================
-- GymPlatform — datos demo (fuente de verdad)
-- =============================================================================
-- Se carga al arrancar si NO existe la organización slug = 'gymplatform-demo'
-- (ver DemoSqlSeeder.java).
--
-- Para regenerar desde cero:
--   1) Detén el backend
--   2) Borra backend/data/gymdb*.db
--   3) Arranca de nuevo (Hibernate crea tablas + este script)
--
-- Contraseñas (texto plano → hash BCrypt abajo):
--   admin123 | 12345678 | instructor123 | recepcion123 | miembro123
--   Áreas privadas (estadísticas): 12345678
--
-- Color de marca demo: indigo (default de GymPlatform)
--
-- IDs fijos (referencia rápida):
--   Orgs: 1=GymPlatform(gymplatform-demo)  2=Power Gym  3=Iron Fit
--   Users GymPlatform: 2=instructor  3=recepción  4=administrador  5..12=miembros
--   (sin cuenta PLATFORM_OWNER — el producto es un solo gimnasio)
--   Users otros: 13=power admin  14=power instructor  15=iron admin
--   Packages GymPlatform: 1=Básica  2=Regular  3=Premium  4=Anual legacy
-- =============================================================================

SET REFERENTIAL_INTEGRITY FALSE;

-- ---------------------------------------------------------------------------
-- Organizaciones
-- ---------------------------------------------------------------------------
INSERT INTO organizations (
  id, name, slug, contact_email, contact_phone, address, city, tagline,
  business_hours, website_url, social_handle, accent_id, season_theme,
  subscription_status, subscription_start, subscription_end, active, created_at
) VALUES
(1, 'GymPlatform', 'gymplatform-demo', 'contacto@gymplatform.local', '555-0100', NULL, 'San José',
 'Entrena con propósito', 'Lun–Sáb 5:00–22:00', NULL, NULL, 'indigo', 'NONE',
 'ACTIVE', CURRENT_TIMESTAMP, DATEADD('YEAR', 1, CURRENT_TIMESTAMP), TRUE, CURRENT_TIMESTAMP),
(2, 'Power Gym', 'powergym', 'contacto@powergym.com', '555-0300', NULL, NULL,
 NULL, NULL, NULL, NULL, 'indigo', 'NONE',
 'TRIAL', CURRENT_TIMESTAMP, DATEADD('DAY', 30, CURRENT_TIMESTAMP), TRUE, CURRENT_TIMESTAMP),
(3, 'Iron Fit', 'ironfit', 'contacto@ironfit.com', '555-0400', NULL, NULL,
 NULL, NULL, NULL, NULL, 'indigo', 'NONE',
 'SUSPENDED', NULL, NULL, FALSE, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Usuarios (password_hash = BCrypt)
-- ---------------------------------------------------------------------------
-- admin123
-- 12345678
-- instructor123
-- recepcion123
-- miembro123
INSERT INTO users (
  id, first_name, last_name, email, password_hash, organization_id,
  active, whatsapp_phone, national_id, created_at
) VALUES
(2, 'Ana', 'Torres', 'instructor@gymplatform.local',
 '$2a$10$yahLES3NACJ0QXq8oRayvOfJfACKC6HiFkvagLi2yiseWnUdaiChq',
 1, TRUE, NULL, '203451234', CURRENT_TIMESTAMP),
(3, 'María', 'López', 'recepcion@gymplatform.local',
 '$2a$10$iuS5ejskEwQ4NmFUb1.EzOl2jgY/1WJ/ox9ozW24BeoIzlu.Bvao2',
 1, TRUE, NULL, '305672345', CURRENT_TIMESTAMP),
(4, 'Carlos', 'Mendoza', 'admin@gymplatform.local',
 '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2',
 1, TRUE, NULL, '104560123', CURRENT_TIMESTAMP),
(5, 'Luis', 'García', 'miembro@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '190205678', CURRENT_TIMESTAMP),
(6, 'Patricia', 'Ruiz', 'patricia@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '203456789', CURRENT_TIMESTAMP),
(7, 'Roberto', 'Sánchez', 'roberto@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '111223344', CURRENT_TIMESTAMP),
(8, 'Sofía', 'Hernández', 'sofia@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '304567890', CURRENT_TIMESTAMP),
(9, 'Diego', 'Morales', 'diego@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '122334455', CURRENT_TIMESTAMP),
(10, 'Elena', 'Castillo', 'elena@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '205678901', CURRENT_TIMESTAMP),
(11, 'Héctor', 'Navarro', 'hector@gymplatform.local',
 '$2a$10$HZcfhzuy4OcuSKR9jXRehe6a4GKCJNPGOeoNj3YnAKdTb86pb30xC',
 1, TRUE, NULL, '133445566', CURRENT_TIMESTAMP),
(12, 'Carmen', 'Vega', 'carmen@gymplatform.local',
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

-- ---------------------------------------------------------------------------
-- Perfiles de miembro
-- ---------------------------------------------------------------------------
INSERT INTO member_profiles (
  id, user_id, birth_year, age, goals, phone, emergency_contact, national_id, created_at, updated_at
) VALUES
(1, 4, 1985, YEAR(CURRENT_DATE) - 1985, 'Mantener condición física y liderar el gym', '555-0101', NULL, '104560123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, 1990, YEAR(CURRENT_DATE) - 1990, 'Bienestar general', '555-0102', NULL, '305672345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 5, 1995, YEAR(CURRENT_DATE) - 1995, 'Ganar masa muscular y mejorar resistencia', '555-0200', NULL, '190205678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 6, 1992, YEAR(CURRENT_DATE) - 1992, 'Bajar de peso y tonificar', '555-0201', NULL, '203456789', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 7, 1988, YEAR(CURRENT_DATE) - 1988, 'Mejorar resistencia cardiovascular', '555-0202', NULL, '111223344', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 8, 2000, YEAR(CURRENT_DATE) - 2000, 'Flexibilidad y bienestar general', '555-0203', NULL, '304567890', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 9, 1987, YEAR(CURRENT_DATE) - 1987, 'Retomar entrenamiento después de pausa', '555-0204', NULL, '122334455', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 10, 1993, YEAR(CURRENT_DATE) - 1993, 'Preparación para competencia local', '555-0205', NULL, '205678901', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 11, 1991, YEAR(CURRENT_DATE) - 1991, 'Recuperación post-lesión de hombro', '555-0206', NULL, '133445566', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 12, 1984, YEAR(CURRENT_DATE) - 1984, 'Cuenta suspendida por administración', '555-0207', NULL, '206789012', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Paquetes de membresía
-- ---------------------------------------------------------------------------
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

-- Contraseña áreas privadas (estadísticas): 12345678
INSERT INTO organization_statistics_access (id, organization_id, password_hash, updated_at) VALUES
(1, 1, '$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2', CURRENT_TIMESTAMP);

-- Ventas / caja: ver db/demo-seed-sales.sql
-- Perfil miembro (rutinas, nutrición, medidas): ver db/demo-seed-member.sql


-- ---------------------------------------------------------------------------
-- Suscripciones (fechas relativas a CURRENT_DATE)
-- ---------------------------------------------------------------------------
INSERT INTO member_subscriptions (
  id, member_id, membership_package_id, start_date, end_date, active, created_at
) VALUES
(1, 5, 1, DATEADD('DAY', -10, CURRENT_DATE), DATEADD('MONTH', 1, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(2, 4, 3, CURRENT_DATE, DATEADD('MONTH', 1, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(3, 3, 1, CURRENT_DATE, DATEADD('MONTH', 1, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(4, 10, 3, DATEADD('DAY', -25, CURRENT_DATE), DATEADD('DAY', 5, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(5, 6, 1, DATEADD('MONTH', -2, CURRENT_DATE), DATEADD('DAY', -20, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(6, 11, 1, DATEADD('MONTH', -1, CURRENT_DATE), DATEADD('DAY', -10, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(7, 7, 3, DATEADD('MONTH', -3, CURRENT_DATE), DATEADD('DAY', -45, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP),
(8, 9, 1, DATEADD('MONTH', -5, CURRENT_DATE), DATEADD('MONTH', -3, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Actividades GymPlatform (+ imagen de portada)
-- ---------------------------------------------------------------------------
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
 DATEADD('DAY', 2, CURRENT_DATE), DATEADD('DAY', 2, CURRENT_DATE), FALSE, NULL,
 TIME '07:00:00', TIME '08:00:00', 'Sala 1', 2, 1, 15, FALSE, TRUE, CURRENT_TIMESTAMP),
(9, 'Yoga', 'Sesión de flexibilidad y respiración',
 '/uploads/marketing/promo-yoga.jpg',
 DATEADD('DAY', 3, CURRENT_DATE), DATEADD('DAY', 3, CURRENT_DATE), FALSE, NULL,
 TIME '18:30:00', TIME '19:30:00', 'Terraza', 2, 1, NULL, FALSE, TRUE, CURRENT_TIMESTAMP),
(10, 'HIIT Express', 'Alta intensidad en 45 minutos',
 '/uploads/marketing/promo-hiit.jpg',
 DATEADD('DAY', 5, CURRENT_DATE), DATEADD('DAY', 5, CURRENT_DATE), FALSE, NULL,
 TIME '19:00:00', TIME '19:45:00', 'Sala 2', 2, 1, 10, FALSE, TRUE, CURRENT_TIMESTAMP),
(11, 'Boxeo fitness', 'Combinación de técnica y cardio',
 '/uploads/marketing/promo-boxeo.jpg',
 DATEADD('DAY', -1, CURRENT_DATE), DATEADD('DAY', -1, CURRENT_DATE), FALSE, NULL,
 TIME '17:00:00', TIME '18:00:00', 'Sala 4', 2, 1, 12, FALSE, TRUE, CURRENT_TIMESTAMP),
(12, 'Pilates', 'Clase recurrente lun/mié/vie',
 '/uploads/marketing/promo-pilates.jpg',
 DATEADD('DAY', -7, CURRENT_DATE), DATEADD('MONTH', 3, CURRENT_DATE), TRUE,
 'MONDAY,WEDNESDAY,FRIDAY',
 TIME '09:00:00', TIME '10:00:00', 'Sala 3', 2, 1, 12, FALSE, TRUE, CURRENT_TIMESTAMP),
(13, 'CrossFit', 'WOD del día',
 '/uploads/marketing/promo-crossfit.jpg',
 CURRENT_DATE, CURRENT_DATE, FALSE, NULL,
 TIME '08:00:00', TIME '09:00:00', 'Box principal', 14, 2, 18, FALSE, TRUE, CURRENT_TIMESTAMP);

-- Promociones de actividades (Mercadeo) — slots 1..3 (inicio del miembro)
-- Actividades con fechas futuras / recurrentes para que el carrusel no quede vacío al día siguiente.
INSERT INTO activity_promotions (
  id, organization_id, activity_id, slot_index, image_url, created_at, updated_at
) VALUES
(1, 1, 12, 1, '/uploads/marketing/promo-pilates.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 9, 2, '/uploads/marketing/promo-yoga.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 10, 3, '/uploads/marketing/promo-hiit.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Reservaciones
-- ---------------------------------------------------------------------------
INSERT INTO reservations (
  id, activity_id, member_id, occurrence_date, activity_name, status,
  free_slot, payment_required, paid, attended, created_at, updated_at
) VALUES
(1, 2, 5, CURRENT_DATE, 'Funcional', 'CONFIRMED', TRUE, FALSE, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 5, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 9, 5, DATEADD('DAY', 3, CURRENT_DATE), 'Yoga', 'CONFIRMED', FALSE, TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 6, 5, CURRENT_DATE, 'Yoga al atardecer', 'CANCELLED', FALSE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 6, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 7, CURRENT_DATE, 'Spinning matutino', 'CONFIRMED', FALSE, TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 2, 10, CURRENT_DATE, 'Funcional', 'CONFIRMED', TRUE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 10, 11, DATEADD('DAY', 5, CURRENT_DATE), 'HIIT Express', 'CONFIRMED', FALSE, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 11, 3, DATEADD('DAY', -1, CURRENT_DATE), 'Boxeo fitness', 'CONFIRMED', FALSE, TRUE, TRUE, TRUE, DATEADD('DAY', -1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
(10, 11, 7, DATEADD('DAY', -1, CURRENT_DATE), 'Boxeo fitness', 'CONFIRMED', FALSE, TRUE, TRUE, TRUE, DATEADD('DAY', -20, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Disponibilidad de citas (gimnasio, sin staff) — próximos 10 días hábiles
-- ---------------------------------------------------------------------------
INSERT INTO staff_availability (
  id, staff_id, organization_id, availability_date, start_time, end_time, slot_duration_minutes, created_at
) VALUES
(1, NULL, 1, DATEADD('DAY', 1, CURRENT_DATE), TIME '09:00:00', TIME '13:00:00', 30, CURRENT_TIMESTAMP),
(2, NULL, 1, DATEADD('DAY', 1, CURRENT_DATE), TIME '16:00:00', TIME '19:00:00', 30, CURRENT_TIMESTAMP),
(3, NULL, 1, DATEADD('DAY', 2, CURRENT_DATE), TIME '09:00:00', TIME '13:00:00', 30, CURRENT_TIMESTAMP),
(4, NULL, 1, DATEADD('DAY', 2, CURRENT_DATE), TIME '16:00:00', TIME '19:00:00', 30, CURRENT_TIMESTAMP),
(5, NULL, 1, DATEADD('DAY', 3, CURRENT_DATE), TIME '09:00:00', TIME '13:00:00', 30, CURRENT_TIMESTAMP),
(6, NULL, 1, DATEADD('DAY', 3, CURRENT_DATE), TIME '16:00:00', TIME '19:00:00', 30, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Citas / appointment requests
-- ---------------------------------------------------------------------------
INSERT INTO appointment_requests (
  id, member_id, organization_id, type, notes, status,
  preferred_staff_id, assigned_staff_id, staff_availability_id,
  scheduled_start, scheduled_end, created_at, updated_at
) VALUES
(1, 5, 1, 'MEASUREMENT', 'Primera toma de medidas del mes', 'SCHEDULED',
 2, 2, 1,
 CAST(CONCAT(CAST(DATEADD('DAY', 1, CURRENT_DATE) AS VARCHAR), ' 09:00:00') AS TIMESTAMP),
 CAST(CONCAT(CAST(DATEADD('DAY', 1, CURRENT_DATE) AS VARCHAR), ' 09:30:00') AS TIMESTAMP),
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 6, 1, 'NUTRITION', 'Consulta nutricional — plan de déficit calórico', 'SCHEDULED',
 2, 2, 1,
 CAST(CONCAT(CAST(DATEADD('DAY', 1, CURRENT_DATE) AS VARCHAR), ' 10:00:00') AS TIMESTAMP),
 CAST(CONCAT(CAST(DATEADD('DAY', 1, CURRENT_DATE) AS VARCHAR), ' 10:30:00') AS TIMESTAMP),
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 7, 1, 'CONSULTATION', 'Seguimiento de objetivos y lesión de rodilla', 'SCHEDULED',
 2, 2, 2,
 CAST(CONCAT(CAST(DATEADD('DAY', 1, CURRENT_DATE) AS VARCHAR), ' 16:00:00') AS TIMESTAMP),
 CAST(CONCAT(CAST(DATEADD('DAY', 1, CURRENT_DATE) AS VARCHAR), ' 16:30:00') AS TIMESTAMP),
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 10, 1, 'MEASUREMENT', 'Control pre-competencia agendado', 'SCHEDULED',
 2, 2, 3,
 CAST(CONCAT(CAST(DATEADD('DAY', 2, CURRENT_DATE) AS VARCHAR), ' 09:30:00') AS TIMESTAMP),
 CAST(CONCAT(CAST(DATEADD('DAY', 2, CURRENT_DATE) AS VARCHAR), ' 10:00:00') AS TIMESTAMP),
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 8, 1, 'CONSULTATION', 'Primera evaluación — pendiente de confirmar', 'PENDING',
 2, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 9, 1, 'NUTRITION', 'Solicitud rechazada — no asiste', 'REJECTED',
 NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Solicitudes de rutina
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Plantillas WhatsApp de bienvenida (simples)
-- ---------------------------------------------------------------------------
INSERT INTO broadcast_message_templates (
  id, organization_id, channel, name, body, purpose, membership_package_id,
  media_links_json, created_at, updated_at
) VALUES
(1, 1, 'WHATSAPP', 'Bienvenida Básica',
 '¡Hola {{nombre}}! Bienvenido(a) a {{gimnasio}} con Membresía Básica. ¡Nos vemos en el gym!',
 'WELCOME', 1, '["https://example.com/gymplatform/guia-basica.pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'WHATSAPP', 'Bienvenida Regular',
 '¡Hola {{nombre}}! Gracias por unirte a {{gimnasio}} con Membresía Regular.',
 'WELCOME', 2, '["https://example.com/gymplatform/guia-regular.pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 'WHATSAPP', 'Bienvenida Premium',
 '¡Hola {{nombre}}! Bienvenido(a) al plan Premium de {{gimnasio}}. Acceso completo y clases ilimitadas.',
 'WELCOME', 3, '["https://example.com/gymplatform/guia-premium.pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------------
-- Categorías de producto + productos demo (con ofertas)
-- (ProductCatalogSeeder no duplica si ya hay productos)
-- ---------------------------------------------------------------------------
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
 15, '15% OFF', CURRENT_DATE, DATEADD('DAY', 30, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'MuscleTech Nitro-Tech 2lb', 'muscletech nitro-tech 2lb', 'MUSCLETECH',
 NULL, NULL, 168, 28, 'tarro', 'servida', 26000.00, 1100.00, FALSE, NULL, TRUE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 'Trident Spearmint', 'trident spearmint', 'TRIDENT',
 NULL, NULL, 240, 12, 'caja', 'chicle', 1200.00, 150.00, FALSE, NULL, TRUE, TRUE,
 20, '20% OFF', CURRENT_DATE, DATEADD('DAY', 14, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 1, 'Powerade Mora Azul 600ml', 'powerade mora azul 600ml', 'POWERADE',
 NULL, NULL, 24, 1, 'paquete', 'botella', 0.00, 1500.00, FALSE, NULL, FALSE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 'Monster Energy Original 473ml', 'monster energy original 473ml', 'MONSTER',
 NULL, NULL, 30, 1, 'paquete', 'lata', 0.00, 2200.00, FALSE, NULL, FALSE, TRUE,
 10, '10% OFF', CURRENT_DATE, DATEADD('DAY', 7, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 'Creatina Monohidrato Creapure 300g', 'creatina monohidrato creapure 300g', 'CREATINA',
 NULL, NULL, 480, 60, 'tarro', 'servida', 12000.00, 300.00, FALSE, NULL, TRUE, TRUE,
 NULL, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 'Quest Bar Cookies & Cream', 'quest bar cookies & cream', 'QUEST',
 NULL, NULL, 72, 12, 'caja', 'barra', 18000.00, 1800.00, FALSE, NULL, TRUE, TRUE,
 25, '25% OFF', CURRENT_DATE, DATEADD('DAY', 21, CURRENT_DATE), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
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

SET REFERENTIAL_INTEGRITY TRUE;

-- Reiniciar secuencias IDENTITY para no chocar con IDs fijos
ALTER TABLE organizations ALTER COLUMN id RESTART WITH 100;
ALTER TABLE organization_statistics_access ALTER COLUMN id RESTART WITH 100;
ALTER TABLE users ALTER COLUMN id RESTART WITH 100;
ALTER TABLE member_profiles ALTER COLUMN id RESTART WITH 100;
ALTER TABLE membership_packages ALTER COLUMN id RESTART WITH 100;
ALTER TABLE package_addons ALTER COLUMN id RESTART WITH 100;
ALTER TABLE member_subscriptions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE activities ALTER COLUMN id RESTART WITH 100;
ALTER TABLE activity_promotions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE reservations ALTER COLUMN id RESTART WITH 100;
ALTER TABLE staff_availability ALTER COLUMN id RESTART WITH 100;
ALTER TABLE appointment_requests ALTER COLUMN id RESTART WITH 100;
ALTER TABLE routine_requests ALTER COLUMN id RESTART WITH 100;
ALTER TABLE broadcast_message_templates ALTER COLUMN id RESTART WITH 100;
ALTER TABLE product_categories ALTER COLUMN id RESTART WITH 100;
ALTER TABLE products ALTER COLUMN id RESTART WITH 100;
