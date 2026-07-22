package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormAccessType;
import com.gymplatform.domain.enums.FormPurpose;

import java.util.List;

public record PublicFormResponse(
        Long id,
        String title,
        String slug,
        String description,
        FormAccessType accessType,
        FormPurpose formPurpose,
        boolean createsUser,
        boolean requiresAuth,
        String organizationName,
        String organizationSlug,
        List<FormFieldDto> fields,
        List<PublicMembershipOption> membershipPackages
) {
    public PublicFormResponse {
        membershipPackages = membershipPackages != null ? membershipPackages : List.of();
    }
}
