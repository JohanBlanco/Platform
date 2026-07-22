package com.gymplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Parches idempotentes para H2 cuando ddl-auto no añade columnas nuevas en tablas existentes.
 * Debe correr antes de bootstraps de datos ({@code @Order(100)}).
 */
@Component
@Profile("dev")
@Order(10)
public class DatabaseSchemaPatch implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaPatch.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaPatch(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing(
                "broadcast_channel_settings",
                "whatsapp_web_session_confirmed",
                "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing(
                "broadcast_channel_settings",
                "delivery_mode",
                "VARCHAR(16) DEFAULT 'WA_ME'");
        addColumnIfMissing("broadcast_channel_settings", "cloud_api_access_token", "CLOB");
        addColumnIfMissing("broadcast_channel_settings", "cloud_api_phone_number_id", "VARCHAR(64)");
        addColumnIfMissing("broadcast_channel_settings", "cloud_api_waba_id", "VARCHAR(64)");
        addColumnIfMissing("broadcast_channel_settings", "cloud_api_app_id", "VARCHAR(64)");
        addColumnIfMissing("broadcast_channel_settings", "cloud_api_app_secret", "VARCHAR(1024)");
        addColumnIfMissing("broadcast_channel_settings", "cloud_api_verify_token", "VARCHAR(1024)");
        addColumnIfMissing(
                "broadcast_channel_settings",
                "cloud_api_graph_version",
                "VARCHAR(16) DEFAULT 'v22.0'");
        addColumnIfMissing("users", "national_id", "VARCHAR(16)");
        addColumnIfMissing("products", "apply_iva", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing("products", "iva_percent", "DECIMAL(7,2)");
        addColumnIfMissing("membership_packages", "apply_iva", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing("membership_packages", "iva_percent", "DECIMAL(7,2)");
        addColumnIfMissing("broadcast_message_templates", "membership_package_id", "BIGINT");
        addColumnIfMissing("broadcast_message_templates", "media_links_json", "CLOB");
        addColumnIfMissing(
                "cash_register_configs",
                "system_iva_percent",
                "DECIMAL(7,2) NOT NULL DEFAULT 13");
        addColumnIfMissing("store_sales", "payment_method", "VARCHAR(16)");
        addColumnIfMissing("store_sales", "payment_proof_data", "CLOB");
        addColumnIfMissing("store_sales", "voided_at", "TIMESTAMP");
        addColumnIfMissing("store_sales", "voided_by_user_id", "BIGINT");
        addColumnIfMissing("store_sales", "void_reason", "VARCHAR(300)");
        addColumnIfMissing("store_sale_items", "member_subscription_id", "BIGINT");
        addColumnIfMissing("routines", "valid_from", "DATE");
        addColumnIfMissing("routines", "valid_until", "DATE");
        addColumnIfMissing("routines", "validity_amount", "INTEGER");
        addColumnIfMissing("routines", "validity_unit", "VARCHAR(16)");
        addColumnIfMissing("organizations", "address", "VARCHAR(255)");
        addColumnIfMissing("organizations", "city", "VARCHAR(120)");
        addColumnIfMissing("organizations", "tagline", "VARCHAR(255)");
        addColumnIfMissing("organizations", "business_hours", "VARCHAR(255)");
        addColumnIfMissing("organizations", "website_url", "VARCHAR(255)");
        addColumnIfMissing("organizations", "social_handle", "VARCHAR(120)");
        addColumnIfMissing("organizations", "accent_id", "VARCHAR(16) DEFAULT 'indigo'");
        widenFormPurposeColumn();
        backfillUserNationalIds();
        ensureReservationActiveSlotUniqueIndex();
    }

    /**
     * Evita doble reserva del mismo miembro en la misma clase/fecha.
     * El cupo n vs n+1 lo cubre el lock pesimista en Activity; este índice es red de seguridad.
     */
    private void ensureReservationActiveSlotUniqueIndex() {
        try {
            Integer present = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                    WHERE TABLE_NAME = 'RESERVATIONS'
                      AND CONSTRAINT_NAME = 'UK_RESERVATIONS_ACTIVITY_MEMBER_OCCURRENCE'
                    """,
                    Integer.class);
            if (present != null && present > 0) {
                return;
            }
            Integer indexPresent = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.INDEXES
                    WHERE TABLE_NAME = 'RESERVATIONS'
                      AND INDEX_NAME = 'UK_RESERVATIONS_ACTIVITY_MEMBER_OCCURRENCE'
                    """,
                    Integer.class);
            if (indexPresent != null && indexPresent > 0) {
                return;
            }
            log.info("Aplicando parche de esquema: uk_reservations_activity_member_occurrence");
            jdbcTemplate.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uk_reservations_activity_member_occurrence
                    ON reservations(activity_id, member_id, occurrence_date)
                    """);
        } catch (Exception ex) {
            log.warn("No se pudo asegurar índice único de reservaciones: {}", ex.getMessage());
        }
    }

    /**
     * H2 crea ENUM rígido; Hibernate update no añade valores nuevos
     * (MEMBER_SIGNUP / MEMBER_ONBOARDING). Pasamos a VARCHAR.
     */
    private void widenFormPurposeColumn() {
        Integer present = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'CUSTOM_FORMS' AND COLUMN_NAME = 'FORM_PURPOSE'
                """,
                Integer.class);
        if (present == null || present == 0) {
            return;
        }
        try {
            log.info("Aplicando parche de esquema: custom_forms.form_purpose → VARCHAR(40)");
            jdbcTemplate.execute("ALTER TABLE custom_forms ALTER COLUMN form_purpose SET DATA TYPE VARCHAR(40)");
        } catch (Exception ex) {
            // Ya era VARCHAR, u otra sintaxis H2
            try {
                jdbcTemplate.execute("ALTER TABLE custom_forms ALTER COLUMN form_purpose VARCHAR(40)");
            } catch (Exception retry) {
                log.debug("form_purpose ya compatible o no requiere cambio: {}", retry.getMessage());
            }
        }
    }

    private void backfillUserNationalIds() {
        jdbcTemplate.update("""
                UPDATE users u
                SET national_id = (
                    SELECT REGEXP_REPLACE(COALESCE(mp.national_id, ''), '[^0-9]', '')
                    FROM member_profiles mp
                    WHERE mp.user_id = u.id
                )
                WHERE (u.national_id IS NULL OR TRIM(u.national_id) = '')
                  AND EXISTS (
                    SELECT 1 FROM member_profiles mp
                    WHERE mp.user_id = u.id
                      AND mp.national_id IS NOT NULL
                      AND TRIM(mp.national_id) <> ''
                  )
                """);
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
                """,
                Integer.class,
                table.toUpperCase(),
                column.toUpperCase());
        if (count != null && count > 0) {
            return;
        }
        log.info("Aplicando parche de esquema: {}.{}", table, column);
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
    }
}
