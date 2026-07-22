package com.gymplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Migración puntual: products.category_id (ManyToOne) → product_category_links (ManyToMany).
 * Hibernate update no elimina la columna NOT NULL antigua, y eso rompe el INSERT.
 */
@Component
@Order(20)
public class ProductCategorySchemaMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductCategorySchemaMigrator.class);

    private final JdbcTemplate jdbcTemplate;

    public ProductCategorySchemaMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer present = jdbcTemplate.queryForObject(
                    """
                    select count(*) from information_schema.columns
                    where upper(table_name) = 'PRODUCTS'
                      and upper(column_name) = 'CATEGORY_ID'
                    """,
                    Integer.class
            );
            if (present == null || present == 0) {
                return;
            }

            jdbcTemplate.execute("""
                    create table if not exists product_category_links (
                        product_id bigint not null,
                        category_id bigint not null,
                        primary key (product_id, category_id)
                    )
                    """);

            jdbcTemplate.update("""
                    insert into product_category_links (product_id, category_id)
                    select p.id, p.category_id
                    from products p
                    where p.category_id is not null
                      and not exists (
                          select 1 from product_category_links l
                          where l.product_id = p.id and l.category_id = p.category_id
                      )
                    """);

            // 1) Quitar NOT NULL para que los inserts sin category_id no fallen.
            try {
                jdbcTemplate.execute("alter table products alter column category_id drop not null");
            } catch (Exception ignore) {
                try {
                    jdbcTemplate.execute("alter table products alter column category_id set null");
                } catch (Exception ignore2) {
                    // seguir intentando drop
                }
            }

            // 2) Dropear FKs que apunten a category_id, luego la columna.
            List<String> fkNames = jdbcTemplate.query(
                    """
                    select distinct tc.constraint_name
                    from information_schema.table_constraints tc
                    join information_schema.key_column_usage kcu
                      on tc.constraint_name = kcu.constraint_name
                     and tc.table_schema = kcu.table_schema
                    where upper(tc.table_name) = 'PRODUCTS'
                      and upper(tc.constraint_type) = 'FOREIGN KEY'
                      and upper(kcu.column_name) = 'CATEGORY_ID'
                    """,
                    (rs, rowNum) -> rs.getString(1)
            );
            for (String fk : fkNames) {
                if (fk == null || fk.isBlank()) continue;
                try {
                    jdbcTemplate.execute("alter table products drop constraint " + fk);
                } catch (Exception ex) {
                    log.debug("No se pudo dropear FK {}: {}", fk, ex.getMessage());
                }
            }

            try {
                jdbcTemplate.execute("alter table products drop column category_id");
                log.info("Migración products.category_id → product_category_links: columna eliminada");
            } catch (Exception dropEx) {
                // Si no se pudo borrar, al menos quedó nullable
                log.info("Migración products.category_id: columna quedó nullable (drop falló: {})", dropEx.getMessage());
            }
        } catch (Exception ex) {
            log.warn("No se pudo migrar products.category_id: {}", ex.getMessage());
        }
    }
}
