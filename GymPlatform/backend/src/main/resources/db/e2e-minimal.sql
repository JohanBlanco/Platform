-- GymPlatform E2E — org + staff mínimo (sin productos, membresías, actividades ni ventas)
-- Cargado por E2eMinimalSeeder cuando app.e2e.minimal-seed=true

SET REFERENTIAL_INTEGRITY FALSE;

INSERT INTO organizations (
  id, name, slug, contact_email, contact_phone, address, city, tagline,
  business_hours, website_url, social_handle, accent_id, season_theme,
  subscription_status, subscription_start, subscription_end, active, created_at
) VALUES (
  1, 'GymPlatform', 'gymplatform-demo', 'contacto@gymplatform.local', '555-0100', NULL, 'San José',
  'Entrena con propósito', 'Lun–Sáb 5:00–22:00', NULL, NULL, 'indigo', 'NONE',
  'ACTIVE', CURRENT_TIMESTAMP, DATEADD('YEAR', 1, CURRENT_TIMESTAMP), TRUE, CURRENT_TIMESTAMP
);

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
 1, TRUE, NULL, '190205678', CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role) VALUES
(2, 'INSTRUCTOR'),
(3, 'RECEPTIONIST'),
(4, 'GYM_OWNER'),
(4, 'RECEPTIONIST'),
(4, 'INSTRUCTOR'),
(4, 'MEMBER'),
(5, 'MEMBER');

SET REFERENTIAL_INTEGRITY TRUE;
