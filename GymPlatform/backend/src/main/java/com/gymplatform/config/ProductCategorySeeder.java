package com.gymplatform.config;

import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.service.ProductService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(4)
public class ProductCategorySeeder implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final ProductService productService;

    public ProductCategorySeeder(OrganizationRepository organizationRepository, ProductService productService) {
        this.organizationRepository = organizationRepository;
        this.productService = productService;
    }

    @Override
    public void run(String... args) {
        organizationRepository.findAll().forEach(org -> productService.ensureCategories(org.getId()));
    }
}
