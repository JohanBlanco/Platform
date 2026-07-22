package com.gymplatform.service;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.Product;
import com.gymplatform.domain.entity.ProductCategory;
import com.gymplatform.dto.ProductCategoryCreateRequest;
import com.gymplatform.dto.ProductCategoryResponse;
import com.gymplatform.dto.ProductImageSuggestionResponse;
import com.gymplatform.dto.ProductOfferUpdateRequest;
import com.gymplatform.dto.ProductRequest;
import com.gymplatform.dto.ProductResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.ProductCategoryRepository;
import com.gymplatform.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ProductService {

    private static final List<CategorySeed> DEFAULT_CATEGORIES = List.of(
            new CategorySeed("Chicles y dulces", "chicles", "Chicles, gomitas y snacks dulces", 10),
            new CategorySeed("Barras", "barras", "Barras proteicas y energéticas", 20),
            new CategorySeed("Proteínas", "proteinas", "Whey, isolate, caseína y blends", 30),
            new CategorySeed("Creatina", "creatina", "Creatina monohidrato y variantes", 40),
            new CategorySeed("Aminoácidos", "aminos", "BCAA, EAA y aminoácidos", 50),
            new CategorySeed("Pre-entreno", "pre-entreno", "Pre-workouts y estimulantes", 60),
            new CategorySeed("Vitaminas y minerales", "vitaminas", "Multivitamínicos y minerales", 70),
            new CategorySeed("Bebidas", "bebidas", "Bebidas deportivas y listos para tomar", 80),
            new CategorySeed("Accesorios", "accesorios", "Shakers, bandas, ropa y más", 90),
            new CategorySeed("Otros", "otros", "Productos varios de tienda", 100)
    );

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final OrganizationRepository organizationRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public ProductService(
            ProductRepository productRepository,
            ProductCategoryRepository categoryRepository,
            OrganizationRepository organizationRepository,
            ObjectMapper objectMapper
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.organizationRepository = organizationRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void ensureCategories(Long organizationId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        for (CategorySeed seed : DEFAULT_CATEGORIES) {
            if (!categoryRepository.existsByOrganizationIdAndSlug(organizationId, seed.slug())) {
                ProductCategory cat = new ProductCategory();
                cat.setOrganization(org);
                cat.setName(seed.name());
                cat.setSlug(seed.slug());
                cat.setDescription(seed.description());
                cat.setSortOrder(seed.sortOrder());
                cat.setActive(true);
                categoryRepository.save(cat);
            }
        }
    }

    public List<ProductCategoryResponse> listCategories(Long organizationId) {
        ensureCategories(organizationId);
        return categoryRepository.findByOrganizationIdAndActiveTrueOrderBySortOrderAscNameAsc(organizationId)
                .stream()
                .map(c -> new ProductCategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getSortOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(Long organizationId, List<Long> categoryIds) {
        ensureCategories(organizationId);
        List<Product> products;
        if (categoryIds != null && !categoryIds.isEmpty()) {
            products = productRepository.findActiveByOrganizationAndCategoryIds(organizationId, categoryIds);
        } else {
            products = productRepository.findByOrganizationIdAndActiveTrueOrderByNameAsc(organizationId);
        }
        return products.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(Long organizationId, Long id) {
        return toResponse(requireProduct(organizationId, id));
    }

    @Transactional
    public ProductCategoryResponse createCategory(Long organizationId, ProductCategoryCreateRequest request) {
        ensureCategories(organizationId);
        return toCategoryResponse(createOrGetCategory(organizationId, request.name(), request.description()));
    }

    @Transactional
    public ProductResponse create(Long organizationId, ProductRequest request) {
        ensureCategories(organizationId);
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));

        String name = request.name().trim();
        String normalized = normalizeName(name);
        String codePrefix = codePrefixFromName(name);

        if (productRepository.existsByOrganizationIdAndNameNormalizedAndActiveTrue(organizationId, normalized)) {
            throw new BusinessException("Ya existe un producto con ese nombre");
        }
        if (productRepository.existsByOrganizationIdAndCodePrefixIgnoreCaseAndActiveTrue(organizationId, codePrefix)) {
            throw new BusinessException("Ya existe un producto con el código «" + codePrefix + "»");
        }

        var categories = resolveCategories(organizationId, request.categoryIds(), request.newCategories());
        Product product = new Product();
        product.setOrganization(org);
        applyRequest(product, request, name, normalized, codePrefix, categories);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long organizationId, Long id, ProductRequest request) {
        Product product = requireProduct(organizationId, id);
        String name = request.name().trim();
        String normalized = normalizeName(name);
        String codePrefix = product.getCodePrefix();

        if (productRepository.existsByOrganizationIdAndNameNormalizedAndActiveTrueAndIdNot(
                organizationId, normalized, id)) {
            throw new BusinessException("Ya existe un producto con ese nombre");
        }

        var categories = resolveCategories(organizationId, request.categoryIds(), request.newCategories());
        applyRequest(product, request, name, normalized, codePrefix, categories);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long organizationId, Long id) {
        Product product = requireProduct(organizationId, id);
        product.setActive(false);
        // libera unicidad para poder volver a crear el mismo nombre/código
        product.setNameNormalized(product.getNameNormalized() + "#del#" + product.getId());
        product.setCodePrefix(product.getCodePrefix() + "X" + product.getId());
        productRepository.save(product);
    }

    /** Primera imagen usable para seeds/demo (una sola búsqueda rápida). */
    public String findFirstImageUrl(String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) return null;
        try {
            List<ProductImageSuggestionResponse> ducks = duckDuckGoImages(q, 4);
            if (!ducks.isEmpty()) return ducks.get(0).url();
            List<ProductImageSuggestionResponse> foods = openFoodFactsImages(q, 4);
            if (!foods.isEmpty()) return foods.get(0).url();
        } catch (Exception ignored) {
            // best-effort for seeders
        }
        return null;
    }

    public List<ProductImageSuggestionResponse> suggestImages(String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) {
            return List.of();
        }

        // Preferir resultados de tiendas / empaque del producto sobre fotos genéricas CC.
        java.util.LinkedHashMap<String, ScoredImage> byUrl = new java.util.LinkedHashMap<>();
        for (String search : List.of(
                q + " producto",
                q + " packaging bottle jar",
                "\"" + q + "\" buy"
        )) {
            for (ProductImageSuggestionResponse item : duckDuckGoImages(search, 16)) {
                mergeSuggestion(byUrl, item, q);
            }
            if (byUrl.size() >= 18) break;
        }
        for (ProductImageSuggestionResponse item : openFoodFactsImages(q, 10)) {
            mergeSuggestion(byUrl, item, q);
        }

        return byUrl.values().stream()
                .sorted(java.util.Comparator.comparingInt(ScoredImage::score).reversed())
                .limit(12)
                .map(ScoredImage::suggestion)
                .toList();
    }

    private void mergeSuggestion(
            java.util.LinkedHashMap<String, ScoredImage> byUrl,
            ProductImageSuggestionResponse item,
            String query
    ) {
        if (item == null || item.url() == null || item.url().isBlank()) return;
        String key = item.url().trim();
        int score = imageRelevanceScore(item.title(), item.source(), query);
        ScoredImage existing = byUrl.get(key);
        if (existing == null || score > existing.score()) {
            byUrl.put(key, new ScoredImage(item, score));
        }
    }

    private int imageRelevanceScore(String title, String source, String query) {
        int score = 0;
        String t = normalizeSearch(title);
        String q = normalizeSearch(query);
        for (String token : q.split("\\s+")) {
            if (token.length() > 2 && t.contains(token)) {
                score += 12;
            }
        }
        String host = hostOf(source);
        String path = source == null ? "" : source.toLowerCase(Locale.ROOT);
        if (host.contains("shutterstock") || host.contains("gettyimages") || host.contains("alamy")
                || host.contains("istockphoto") || host.contains("dreamstime") || host.contains("depositphotos")) {
            score -= 40;
        }
        if (path.contains("/product") || path.contains("/products/") || path.contains("/p/")
                || path.contains("/dp/") || path.contains("/item/")) {
            score += 18;
        }
        if (host.contains("iherb") || host.contains("amazon") || host.contains("nutrition")
                || host.contains("supplement") || host.contains("farmac") || host.contains("oficial")
                || host.contains("bodybuilding") || host.contains("myprotein") || host.contains("optimumnutrition")) {
            score += 10;
        }
        if (host.contains("openfoodfacts")) {
            score += 14;
        }
        return score;
    }

    private List<ProductImageSuggestionResponse> duckDuckGoImages(String query, int limit) {
        try {
            String vqd = duckDuckGoVqd(query);
            if (vqd == null || vqd.isBlank()) {
                return List.of();
            }
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://duckduckgo.com/i.js?l=us-en&o=json&q=" + encoded
                    + "&vqd=" + URLEncoder.encode(vqd, StandardCharsets.UTF_8)
                    + "&f=,,,,,&p=1";
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .header("Accept", "application/json")
                    .header("User-Agent", BROWSER_UA)
                    .header("Referer", "https://duckduckgo.com/")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return List.of();
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode results = root.get("results");
            if (results == null || !results.isArray()) {
                return List.of();
            }
            List<ProductImageSuggestionResponse> out = new ArrayList<>();
            for (JsonNode item : results) {
                String image = text(item, "image");
                String thumb = text(item, "thumbnail");
                String img = (image != null && !image.isBlank()) ? image : thumb;
                if (img == null || img.isBlank()) continue;
                out.add(new ProductImageSuggestionResponse(
                        img,
                        text(item, "title"),
                        text(item, "url")
                ));
                if (out.size() >= limit) break;
            }
            return out;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String duckDuckGoVqd(String query) throws Exception {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://duckduckgo.com/?q=" + encoded + "&iax=images&ia=images";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .header("User-Agent", BROWSER_UA)
                .header("Accept", "text/html")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            return null;
        }
        java.util.regex.Matcher m = VQD_PATTERN.matcher(response.body());
        return m.find() ? m.group(1) : null;
    }

    private List<ProductImageSuggestionResponse> openFoodFactsImages(String query, int limit) {
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" + encoded
                    + "&search_simple=1&action=process&json=1&page_size=" + Math.max(limit, 8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .header("Accept", "application/json")
                    .header("User-Agent", "GymPlatform/1.0 (product image suggestions; gym inventory)")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return List.of();
            }
            String body = response.body();
            if (body == null || body.isBlank() || body.trim().startsWith("<")) {
                return List.of();
            }
            JsonNode root = objectMapper.readTree(body);
            JsonNode products = root.get("products");
            if (products == null || !products.isArray()) {
                return List.of();
            }
            List<ProductImageSuggestionResponse> out = new ArrayList<>();
            for (JsonNode product : products) {
                String img = firstNonBlank(
                        text(product, "image_front_url"),
                        text(product, "image_url"),
                        text(product, "image_front_small_url")
                );
                if (img == null) continue;
                String name = firstNonBlank(text(product, "product_name"), text(product, "generic_name"), query);
                String brands = text(product, "brands");
                String title = brands != null && !brands.isBlank() ? name + " · " + brands : name;
                String code = text(product, "code");
                String source = code != null
                        ? "https://world.openfoodfacts.org/product/" + code
                        : "https://world.openfoodfacts.org";
                out.add(new ProductImageSuggestionResponse(img, title, source));
                if (out.size() >= limit) break;
            }
            return out;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private static String normalizeSearch(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }

    private static String hostOf(String url) {
        if (url == null || url.isBlank()) return "";
        try {
            String host = URI.create(url.trim()).getHost();
            return host == null ? "" : host.toLowerCase(Locale.ROOT);
        } catch (Exception ex) {
            return "";
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private record ScoredImage(ProductImageSuggestionResponse suggestion, int score) {}

    private static final String BROWSER_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private static final java.util.regex.Pattern VQD_PATTERN =
            java.util.regex.Pattern.compile("vqd=['\"]?([0-9-]+)");

    private void applyRequest(
            Product product,
            ProductRequest request,
            String name,
            String normalized,
            String codePrefix,
            java.util.Set<ProductCategory> categories
    ) {
        boolean sellPackage = Boolean.TRUE.equals(request.sellByPackage());
        boolean sellUnit = Boolean.TRUE.equals(request.sellByUnit());
        int unitsPerPackage = request.unitsPerPackage() == null ? 1 : request.unitsPerPackage();
        if (unitsPerPackage < 1) {
            throw new BusinessException("Las unidades por paquete deben ser al menos 1");
        }
        int stock = request.stockUnits() == null ? 0 : request.stockUnits();
        if (stock < 0) {
            throw new BusinessException("El stock no puede ser negativo");
        }
        if (categories.isEmpty()) {
            throw new BusinessException("Asigna al menos una categoría");
        }

        product.setName(name);
        product.setNameNormalized(normalized);
        product.setCodePrefix(codePrefix);
        product.getCategories().clear();
        product.getCategories().addAll(categories);
        product.setDescription(blankToNull(request.description()));
        product.setImageUrl(blankToNull(request.imageUrl()));
        product.setStockUnits(stock);
        product.setUnitsPerPackage(unitsPerPackage);
        product.setPackageLabel(blankOr(request.packageLabel(), "caja"));
        product.setUnitLabel(blankOr(request.unitLabel(), "unidad"));
        product.setPackagePrice(request.packagePrice() != null ? request.packagePrice() : BigDecimal.ZERO);
        product.setUnitPrice(request.unitPrice() != null ? request.unitPrice() : BigDecimal.ZERO);
        boolean applyIva = com.gymplatform.util.PriceAddonUtils.resolveApplyIva(request.applyIva(), request.priceAddons());
        BigDecimal ivaPercent = applyIva
                ? com.gymplatform.util.PriceAddonUtils.resolveIvaPercent(request.ivaPercent(), request.priceAddons())
                : null;
        com.gymplatform.util.PriceAddonUtils.validateIva(applyIva, ivaPercent);
        product.setApplyIva(applyIva);
        product.setIvaPercent(ivaPercent);
        product.setSellByPackage(sellPackage);
        product.setSellByUnit(sellUnit);
        product.setActive(true);
    }

    private java.util.Set<ProductCategory> resolveCategories(
            Long organizationId,
            List<Long> categoryIds,
            List<String> newCategories
    ) {
        java.util.LinkedHashSet<ProductCategory> resolved = new java.util.LinkedHashSet<>();
        if (categoryIds != null) {
            for (Long id : categoryIds) {
                if (id != null) {
                    resolved.add(requireCategory(organizationId, id));
                }
            }
        }
        if (newCategories != null) {
            for (String raw : newCategories) {
                if (raw == null || raw.isBlank()) continue;
                resolved.add(createOrGetCategory(organizationId, raw.trim(), null));
            }
        }
        return resolved;
    }

    private ProductCategory createOrGetCategory(Long organizationId, String name, String description) {
        String trimmed = name.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException("El nombre de la categoría es obligatorio");
        }
        var byName = categoryRepository.findFirstByOrganizationIdAndNameIgnoreCaseAndActiveTrue(organizationId, trimmed);
        if (byName.isPresent()) {
            return byName.get();
        }
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        String slug = slugFromName(trimmed);
        String uniqueSlug = slug;
        int n = 2;
        while (categoryRepository.existsByOrganizationIdAndSlug(organizationId, uniqueSlug)) {
            uniqueSlug = slug + "-" + n;
            n++;
        }
        ProductCategory cat = new ProductCategory();
        cat.setOrganization(org);
        cat.setName(trimmed);
        cat.setSlug(uniqueSlug);
        cat.setDescription(blankToNull(description));
        cat.setSortOrder(500);
        cat.setActive(true);
        return categoryRepository.save(cat);
    }

    private Product requireProduct(Long organizationId, Long id) {
        return productRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
    }

    private ProductCategory requireCategory(Long organizationId, Long categoryId) {
        return categoryRepository.findByIdAndOrganizationIdAndActiveTrue(categoryId, organizationId)
                .orElseThrow(() -> new BusinessException("Categoría no válida"));
    }

    private ProductCategoryResponse toCategoryResponse(ProductCategory c) {
        return new ProductCategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getSortOrder());
    }

    @Transactional
    public ProductResponse updateOffer(Long organizationId, Long id, ProductOfferUpdateRequest request) {
        Product product = requireProduct(organizationId, id);
        if (request.offerFrom() != null
                && request.offerUntil() != null
                && request.offerUntil().isBefore(request.offerFrom())) {
            throw new BusinessException("La fecha fin de la oferta no puede ser anterior al inicio");
        }
        product.setOfferPercent(request.offerPercent());
        String badge = request.offerBadge() == null ? null : request.offerBadge().trim();
        product.setOfferBadge(badge == null || badge.isBlank() ? null : badge);
        product.setOfferFrom(request.offerFrom());
        product.setOfferUntil(request.offerUntil());
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void clearOffer(Long organizationId, Long id) {
        Product product = requireProduct(organizationId, id);
        product.setOfferPercent(null);
        product.setOfferBadge(null);
        product.setOfferFrom(null);
        product.setOfferUntil(null);
        productRepository.save(product);
    }

    private ProductResponse toResponse(Product p) {
        List<ProductCategoryResponse> cats = p.getCategories().stream()
                .sorted(java.util.Comparator.comparingInt(ProductCategory::getSortOrder)
                        .thenComparing(ProductCategory::getName))
                .map(this::toCategoryResponse)
                .toList();
        boolean offerActive = com.gymplatform.util.ProductOfferUtils.isOfferActive(p);
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getCodePrefix(),
                p.getDescription(),
                p.getImageUrl(),
                cats,
                p.getStockUnits(),
                p.getUnitsPerPackage(),
                p.getFullPackagesAvailable(),
                p.getPackageLabel(),
                p.getUnitLabel(),
                p.getPackagePrice(),
                p.getUnitPrice(),
                p.isSellByPackage(),
                p.isSellByUnit(),
                p.isOutOfStock(),
                p.isApplyIva(),
                p.getIvaPercent(),
                com.gymplatform.util.PriceAddonUtils.toResponses(p.isApplyIva(), p.getIvaPercent()),
                com.gymplatform.util.PriceAddonUtils.applyIva(p.getPackagePrice(), p.isApplyIva(), p.getIvaPercent()),
                com.gymplatform.util.PriceAddonUtils.applyIva(p.getUnitPrice(), p.isApplyIva(), p.getIvaPercent()),
                offerActive,
                p.getOfferPercent(),
                offerActive ? com.gymplatform.util.ProductOfferUtils.resolveBadge(p) : p.getOfferBadge(),
                p.getOfferFrom(),
                p.getOfferUntil()
        );
    }

    public static String normalizeName(String name) {
        return name.trim().toLowerCase(Locale.ROOT);
    }

    public static String codePrefixFromName(String name) {
        String base = Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "");
        if (base.isBlank()) {
            base = "PROD";
        }
        if (base.length() > 20) {
            base = base.substring(0, 20);
        }
        return base;
    }

    public static String slugFromName(String name) {
        String base = Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (base.isBlank()) {
            base = "categoria";
        }
        if (base.length() > 50) {
            base = base.substring(0, 50);
        }
        return base;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String blankOr(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim();
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }

    private record CategorySeed(String name, String slug, String description, int sortOrder) {}
}
