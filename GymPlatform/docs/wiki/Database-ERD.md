# Modelo de datos (ERD)

GymPlatform usa **JPA/Hibernate** sobre H2 (dev) o PostgreSQL (prod). El esquema se actualiza con `ddl-auto=update`. Este documento describe el modelo por **dominios** (más legible que un único diagrama con ~40 entidades).

> El producto opera sobre **una organización (gimnasio)**. Usuarios pertenecen a esa org.

---

## Diagrama de contexto (dominios)

```mermaid
flowchart TB
  ORG["Organization<br/>(tenant)"]

  ORG --> USERS["Usuarios & perfiles"]
  ORG --> MEM["Membresías"]
  ORG --> ACT["Actividades & reservas"]
  ORG --> APT["Citas & disponibilidad"]
  ORG --> TRN["Rutinas / nutrición / medidas"]
  ORG --> POS["Tienda & caja"]
  ORG --> FRM["Formularios & expedientes"]
  ORG --> BC["WhatsApp / difusión"]
  ORG --> MKT["Mercadeo / promociones"]
```

---

## 1. Núcleo: organización y usuarios

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ USERS : has
  USERS ||--o{ USER_ROLES : has
  USERS ||--o| MEMBER_PROFILES : profile
  ORGANIZATIONS ||--o| ORGANIZATION_STATISTICS_ACCESS : private_areas

  ORGANIZATIONS {
    bigint id PK
    string name
    string slug UK
    string accent_id
    string subscription_status
    boolean active
  }

  USERS {
    bigint id PK
    string email UK
    string password_hash
    string first_name
    string last_name
    string whatsapp_phone
    string national_id
    bigint organization_id FK
    boolean active
  }

  USER_ROLES {
    bigint user_id FK
    string role
  }

  MEMBER_PROFILES {
    bigint id PK
    bigint user_id FK
    int birth_year
    string goals
    string phone
  }

  ORGANIZATION_STATISTICS_ACCESS {
    bigint id PK
    bigint organization_id FK
    string password_hash
  }
```

**Roles** (`user_roles.role`): `GYM_OWNER` (Administrador), `RECEPTIONIST`, `INSTRUCTOR`, `MEMBER` (un usuario puede tener varios).

---

## 2. Membresías

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ MEMBERSHIP_PACKAGES : offers
  MEMBERSHIP_PACKAGES ||--o{ PACKAGE_ADDONS : includes
  USERS ||--o{ MEMBER_SUBSCRIPTIONS : subscribes
  MEMBERSHIP_PACKAGES ||--o{ MEMBER_SUBSCRIPTIONS : plan

  MEMBERSHIP_PACKAGES {
    bigint id PK
    string name
    decimal price
    int duration_months
    int free_activity_quota
    boolean active
  }

  PACKAGE_ADDONS {
    bigint id PK
    string name
    decimal price
    bigint package_id FK
  }

  MEMBER_SUBSCRIPTIONS {
    bigint id PK
    bigint member_id FK
    bigint membership_package_id FK
    date start_date
    date end_date
    boolean active
  }
```

---

## 3. Actividades, cupos y reservas

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ ACTIVITIES : schedules
  USERS ||--o{ ACTIVITIES : instructs
  ACTIVITIES ||--o{ RESERVATIONS : books
  USERS ||--o{ RESERVATIONS : member
  ACTIVITIES ||--o{ ACTIVITY_OCCURRENCE_OVERRIDE : overrides
  ACTIVITIES ||--o{ ACTIVITY_OCCURRENCE_CANCELLATION : cancels
  ACTIVITIES ||--o{ ACTIVITY_OCCURRENCE_EXCLUSION : excludes
  ORGANIZATIONS ||--o{ ACTIVITY_PROMOTIONS : highlights
  ACTIVITIES ||--o{ ACTIVITY_PROMOTIONS : promoted

  ACTIVITIES {
    bigint id PK
    string name
    date start_date
    date end_date
    boolean recurring
    string repeat_days
    time start_time
    time end_time
    int capacity
    boolean active
  }

  RESERVATIONS {
    bigint id PK
    bigint activity_id FK
    bigint member_id FK
    date occurrence_date
    string status
    boolean free_slot
    boolean paid
  }

  ACTIVITY_PROMOTIONS {
    bigint id PK
    bigint organization_id FK
    bigint activity_id FK
    int slot_index
    string image_url
  }
```

Notas:

- Las **ocurrencias** de clases recurrentes se expanden en código (`ActivityRecurrenceUtil`); overrides/cancelaciones ajustan fechas concretas.
- **Promociones**: hasta 3 slots (`slot_index` 1–3) para el carrusel del inicio del miembro.

---

## 4. Citas y disponibilidad de staff

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ STAFF_AVAILABILITY : slots
  USERS ||--o{ STAFF_AVAILABILITY : staff_optional
  ORGANIZATIONS ||--o{ APPOINTMENT_REQUESTS : requests
  USERS ||--o{ APPOINTMENT_REQUESTS : member
  STAFF_AVAILABILITY ||--o{ APPOINTMENT_REQUESTS : booked_from

  STAFF_AVAILABILITY {
    bigint id PK
    bigint staff_id FK
    date availability_date
    time start_time
    time end_time
    int slot_duration_minutes
  }

  APPOINTMENT_REQUESTS {
    bigint id PK
    bigint member_id FK
    string type
    string status
    instant scheduled_start
    instant scheduled_end
  }
```

Tipos típicos: `MEASUREMENT`, `NUTRITION`, `CONSULTATION`. Estados: `PENDING`, `SCHEDULED`, `COMPLETED`, `REJECTED`, etc.

---

## 5. Entrenamiento: rutinas, nutrición, medidas

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ ROUTINE_TEMPLATES : templates
  ROUTINE_TEMPLATES ||--o{ ROUTINE_TEMPLATE_DAYS : days
  ROUTINE_TEMPLATE_DAYS ||--o{ ROUTINE_EXERCISES : exercises
  ORGANIZATIONS ||--o{ ROUTINES : assigned
  USERS ||--o{ ROUTINES : member
  USERS ||--o{ ROUTINES : instructor
  ROUTINES ||--o{ ROUTINE_DAYS : days
  ROUTINE_DAYS ||--o{ ROUTINE_EXERCISES : exercises
  ORGANIZATIONS ||--o{ ROUTINE_REQUESTS : requests
  USERS ||--o{ ROUTINE_REQUESTS : member
  ROUTINES ||--o| ROUTINE_REQUESTS : resulting

  ORGANIZATIONS ||--o{ NUTRITION_PLANS : plans
  USERS ||--o{ NUTRITION_PLANS : member
  NUTRITION_PLANS ||--o{ NUTRITION_MEALS : meals
  NUTRITION_MEALS ||--o{ NUTRITION_MEAL_ITEMS : items

  ORGANIZATIONS ||--o{ BODY_MEASUREMENTS : measures
  USERS ||--o{ BODY_MEASUREMENTS : member
  APPOINTMENT_REQUESTS ||--o| BODY_MEASUREMENTS : from_cita

  ORGANIZATIONS ||--o{ EXERCISES : catalog
```

---

## 6. Tienda, caja y ventas

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ PRODUCT_CATEGORIES : cats
  ORGANIZATIONS ||--o{ PRODUCTS : catalog
  PRODUCT_CATEGORIES ||--o{ PRODUCTS : category
  ORGANIZATIONS ||--o{ CASH_REGISTER_CONFIG : config
  ORGANIZATIONS ||--o{ CASH_DENOMINATIONS : dens
  ORGANIZATIONS ||--o{ CASH_SESSIONS : sessions
  CASH_SESSIONS ||--o{ CASH_COUNT_ENTRIES : counts
  CASH_SESSIONS ||--o{ STORE_SALES : sales
  STORE_SALES ||--o{ STORE_SALE_ITEMS : lines
  STORE_SALES ||--o{ STORE_SALE_PAYMENTS : payments
  PRODUCTS ||--o{ STORE_SALE_ITEMS : product
  USERS ||--o{ STORE_SALES : cashier
  USERS ||--o{ STORE_SALES : member_optional

  PRODUCTS {
    bigint id PK
    string name
    decimal price
    int stock
    boolean active
  }

  STORE_SALES {
    bigint id PK
    instant sold_at
    decimal total
    string status
  }

  CASH_SESSIONS {
    bigint id PK
    instant opened_at
    instant closed_at
    string status
  }
```

---

## 7. Formularios, carpetas y expedientes

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ FORM_FOLDERS : folders
  ORGANIZATIONS ||--o{ CUSTOM_FORMS : forms
  FORM_FOLDERS ||--o{ CUSTOM_FORMS : contains
  CUSTOM_FORMS ||--o{ CUSTOM_FORM_SUBMISSIONS : submissions
  USERS ||--o{ CUSTOM_FORM_SUBMISSIONS : member_optional

  CUSTOM_FORMS {
    bigint id PK
    string title
    string slug
    string form_purpose
    string access_type
    string fields_json
    boolean active
  }

  CUSTOM_FORM_SUBMISSIONS {
    bigint id PK
    string answers_json
    instant submitted_at
  }
```

Los campos del formulario viven en **JSON** (`fields_json` / `answers_json`), no en tablas normalizadas por campo.

---

## 8. Difusión WhatsApp y foros

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ BROADCAST_CHANNEL_SETTINGS : channel
  ORGANIZATIONS ||--o{ BROADCAST_MESSAGE_TEMPLATES : templates
  MEMBERSHIP_PACKAGES ||--o{ BROADCAST_MESSAGE_TEMPLATES : welcome_optional
  ORGANIZATIONS ||--o{ FORUMS : forums
  FORUMS ||--o{ FORUM_TOPICS : topics

  BROADCAST_CHANNEL_SETTINGS {
    bigint id PK
    string channel
    boolean enabled
    string delivery_mode
  }

  BROADCAST_MESSAGE_TEMPLATES {
    bigint id PK
    string purpose
    string body
    string media_links_json
  }
```

---

## Convenciones útiles para testing / improvements

| Tema | Convención actual |
|------|-------------------|
| IDs | `IDENTITY` / secuencias; seeds demo usan IDs fijos y luego `RESTART WITH 100` |
| Soft delete | Preferencia por `active` boolean en muchas entidades |
| Fechas | `LocalDate` / `LocalTime` para agenda; `Instant` para eventos/timestamps |
| Money | `BigDecimal` / decimal en JPA |
| Tenant filter | Siempre validar `organization_id` en servicios (no confiar solo en el front) |

---

## Inventario de entidades (Java)

Ubicación: `backend/src/main/java/com/gymplatform/domain/entity/`

| Dominio | Entidades |
|---------|-----------|
| Núcleo | `Organization`, `User`, `MemberProfile`, `OrganizationStatisticsAccess` |
| Membresía | `MembershipPackage`, `PackageAddon`, `MemberSubscription` |
| Actividades | `Activity`, `Reservation`, `ActivityOccurrence*`, `ActivityPromotion` |
| Citas | `StaffAvailability`, `AppointmentRequest` |
| Training | `Routine*`, `RoutineRequest`, `Exercise`, `Nutrition*`, `BodyMeasurement` |
| Tienda | `Product`, `ProductCategory`, `StoreSale*`, `Cash*` |
| Forms | `CustomForm`, `CustomFormSubmission`, `FormFolder` |
| Otros | `Broadcast*`, `Forum`, `ForumTopic` |

Para el esquema vivo en H2: consola http://localhost:8080/h2-console (JDBC URL del `application.properties`).
