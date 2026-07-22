package com.gymplatform.config;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.Product;
import com.gymplatform.domain.entity.ProductCategory;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.ProductCategoryRepository;
import com.gymplatform.repository.ProductRepository;
import com.gymplatform.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Catálogo demo de tienda para FitLife (solo si aún no hay productos).
 */
@Component
@Order(25)
public class ProductCatalogSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductCatalogSeeder.class);

    private final OrganizationRepository organizationRepository;
    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductService productService;

    public ProductCatalogSeeder(
            OrganizationRepository organizationRepository,
            ProductRepository productRepository,
            ProductCategoryRepository categoryRepository,
            ProductService productService
    ) {
        this.organizationRepository = organizationRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productService = productService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        organizationRepository.findBySlug("fitlife").ifPresent(this::seedIfEmpty);
    }

    private void seedIfEmpty(Organization org) {
        productService.ensureCategories(org.getId());
        // Fuente de verdad de demo: db/demo-seed.sql. Solo rellena si el SQL no dejó productos.
        if (productRepository.countByOrganizationIdAndActiveTrue(org.getId()) > 0) {
            log.info("Catálogo demo omitido: ya hay productos (p. ej. desde db/demo-seed.sql)");
            return;
        }

        Map<String, ProductCategory> bySlug = new HashMap<>();
        for (ProductCategory cat : categoryRepository.findByOrganizationIdAndActiveTrueOrderBySortOrderAscNameAsc(org.getId())) {
            bySlug.put(cat.getSlug(), cat);
        }
        Map<String, String> imageCache = new HashMap<>();

        List<SeedProduct> seeds = List.of(
                // Proteínas (tarro / servida)
                packaged("Optimum Nutrition Gold Standard Whey 2lb", "proteinas", "tarro", "servida", 30, 8, 28000, 1200, "optimum nutrition whey"),
                packaged("MuscleTech Nitro-Tech 2lb", "proteinas", "tarro", "servida", 28, 6, 26000, 1100, "muscletech nitrotech"),
                packaged("Dymatize ISO100 1.6lb", "proteinas", "tarro", "servida", 20, 5, 32000, 1600, "dymatize iso100"),
                packaged("MyProtein Impact Whey 1kg", "proteinas", "tarro", "servida", 40, 4, 22000, 700, "myprotein impact whey"),
                packaged("Quest Protein Powder Chocolate", "proteinas", "tarro", "servida", 24, 4, 24000, 1000, "quest protein powder"),

                // Chicles (caja / chicle)
                packaged("Trident Spearmint", "chicles", "caja", "chicle", 12, 20, 1200, 150, "trident spearmint gum"),
                packaged("Trident Fresa", "chicles", "caja", "chicle", 12, 18, 1200, 150, "trident strawberry gum"),
                packaged("Orbit Peppermint", "chicles", "caja", "chicle", 14, 15, 1100, 120, "orbit peppermint gum"),
                packaged("Five Wintermint", "chicles", "caja", "chicle", 15, 12, 1400, 150, "five gum wintermint"),

                // Bebidas (unidad suelta = botella)
                loose("Powerade Mora Azul 600ml", "bebidas", "botella", 24, 1500, "powerade blue"),
                loose("Powerade Naranja 600ml", "bebidas", "botella", 20, 1500, "powerade orange"),
                loose("Powerade Rojo 600ml", "bebidas", "botella", 18, 1500, "powerade red"),
                loose("Monster Energy Original 473ml", "bebidas", "lata", 30, 2200, "monster energy drink"),
                loose("Monster Ultra White 473ml", "bebidas", "lata", 16, 2200, "monster ultra white"),
                loose("Monster Mango Loco 473ml", "bebidas", "lata", 14, 2200, "monster mango loco"),
                loose("Red Bull 250ml", "bebidas", "lata", 20, 1800, "red bull energy"),

                // Paños (solo unidades)
                loose("Paño de microfibra gym", "accesorios", "paño", 40, 2500, "gym microfiber towel"),
                loose("Paño absorbente deporte", "accesorios", "paño", 25, 2000, "sports towel"),

                // Creatinas
                packaged("Creatina Monohidrato Creapure 300g", "creatina", "tarro", "servida", 60, 8, 12000, 300, "creatina monohidrato"),
                packaged("ON Micronized Creatine 300g", "creatina", "tarro", "servida", 60, 6, 14000, 350, "optimum nutrition creatine"),
                packaged("MuscleTech Platinum Creatine", "creatina", "tarro", "servida", 80, 5, 11000, 250, "muscletech creatine"),

                // Aminos
                packaged("Scivation Xtend BCAA", "aminos", "tarro", "servida", 30, 5, 18000, 800, "xtend bcaa"),
                packaged("ON Essential Amin.O. Energy", "aminos", "tarro", "servida", 30, 4, 16000, 700, "essential amino energy"),
                packaged("BCAA Powder Fruit Punch", "aminos", "tarro", "servida", 30, 4, 14000, 600, "bcaa powder"),

                // Barras
                packaged("Quest Bar Cookies & Cream", "barras", "caja", "barra", 12, 6, 18000, 1800, "quest bar"),
                packaged("Pure Protein Chocolate Deluxe", "barras", "caja", "barra", 6, 8, 9000, 1600, "pure protein bar"),
                packaged("Built Bar Brownie Batter", "barras", "caja", "barra", 12, 5, 16000, 1500, "built bar"),
                packaged("One Bar Birthday Cake", "barras", "caja", "barra", 12, 5, 15000, 1400, "one protein bar"),

                // Otros
                loose("Shaker Pro 700ml", "accesorios", "unidad", 20, 4500, "protein shaker bottle"),
                packaged("C4 Original Pre-Workout", "pre-entreno", "tarro", "servida", 30, 4, 20000, 900, "c4 pre workout"),
                packaged("Cellucor C4 Ripped", "pre-entreno", "tarro", "servida", 30, 3, 22000, 1000, "c4 ripped"),
                packaged("Multivitamínico deportivo 60 caps", "vitaminas", "frasco", "cápsula", 60, 5, 8000, 200, "multivitamin sports"),
                loose("Guantes de entrenamiento M", "accesorios", "par", 12, 6500, "gym workout gloves")
        );

        int created = 0;
        for (SeedProduct seed : seeds) {
            ProductCategory category = bySlug.get(seed.categorySlug());
            if (category == null) continue;
            if (productRepository.existsByOrganizationIdAndNameNormalizedAndActiveTrue(
                    org.getId(), ProductService.normalizeName(seed.name()))) {
                continue;
            }

            String imageUrl = imageCache.computeIfAbsent(seed.imageQuery(), productService::findFirstImageUrl);
            Product product = new Product();
            product.setOrganization(org);
            product.setName(seed.name());
            product.setNameNormalized(ProductService.normalizeName(seed.name()));
            product.setCodePrefix(uniqueCode(org.getId(), ProductService.codePrefixFromName(seed.name())));
            product.setCategories(new LinkedHashSet<>(Set.of(category)));
            product.setImageUrl(imageUrl);
            product.setPackageLabel(seed.packageLabel());
            product.setUnitLabel(seed.unitLabel());
            product.setUnitsPerPackage(seed.unitsPerPackage());
            product.setStockUnits(seed.stockUnits());
            product.setPackagePrice(BigDecimal.valueOf(seed.packagePrice()));
            product.setUnitPrice(BigDecimal.valueOf(seed.unitPrice()));
            product.setSellByPackage(seed.sellByPackage());
            product.setSellByUnit(seed.sellByUnit());
            product.setActive(true);
            productRepository.save(product);
            created++;
        }
        log.info("Catálogo demo FitLife: {} productos creados", created);
    }

    private String uniqueCode(Long orgId, String base) {
        String code = base;
        int n = 2;
        while (productRepository.existsByOrganizationIdAndCodePrefixIgnoreCaseAndActiveTrue(orgId, code)) {
            String suffix = String.valueOf(n++);
            code = base.length() + suffix.length() > 20
                    ? base.substring(0, 20 - suffix.length()) + suffix
                    : base + suffix;
        }
        return code.toUpperCase(Locale.ROOT);
    }

    private static SeedProduct packaged(
            String name, String categorySlug, String packageLabel, String unitLabel,
            int unitsPerPackage, int packagesInStock, int packagePrice, int unitPrice, String imageQuery
    ) {
        return new SeedProduct(
                name, categorySlug, packageLabel, unitLabel,
                unitsPerPackage, packagesInStock * unitsPerPackage,
                packagePrice, unitPrice, true, true, imageQuery
        );
    }

    private static SeedProduct loose(
            String name, String categorySlug, String unitLabel,
            int stock, int unitPrice, String imageQuery
    ) {
        return new SeedProduct(
                name, categorySlug, "paquete", unitLabel,
                1, stock, 0, unitPrice, false, true, imageQuery
        );
    }

    private record SeedProduct(
            String name,
            String categorySlug,
            String packageLabel,
            String unitLabel,
            int unitsPerPackage,
            int stockUnits,
            int packagePrice,
            int unitPrice,
            boolean sellByPackage,
            boolean sellByUnit,
            String imageQuery
    ) {}
}
