package com.gymplatform.config;

import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.service.CustomFormService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(100)
public class RegistrationFormBootstrap implements ApplicationRunner {

    private final OrganizationRepository organizationRepository;
    private final CustomFormService customFormService;

    public RegistrationFormBootstrap(
            OrganizationRepository organizationRepository,
            CustomFormService customFormService) {
        this.organizationRepository = organizationRepository;
        this.customFormService = customFormService;
    }

    @Override
    public void run(ApplicationArguments args) {
        organizationRepository.findAll().forEach(org ->
                customFormService.ensureSystemForms(org.getId()));
    }
}
