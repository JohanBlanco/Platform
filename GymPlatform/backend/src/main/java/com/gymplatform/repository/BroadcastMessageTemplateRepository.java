package com.gymplatform.repository;

import com.gymplatform.domain.entity.BroadcastMessageTemplate;
import com.gymplatform.domain.enums.BroadcastChannel;
import com.gymplatform.domain.enums.BroadcastTemplatePurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BroadcastMessageTemplateRepository extends JpaRepository<BroadcastMessageTemplate, Long> {

    List<BroadcastMessageTemplate> findByOrganizationIdAndChannelOrderByNameAsc(
            Long organizationId, BroadcastChannel channel);

    List<BroadcastMessageTemplate> findByOrganizationIdAndChannelAndPurposeOrderByNameAsc(
            Long organizationId, BroadcastChannel channel, BroadcastTemplatePurpose purpose);

    Optional<BroadcastMessageTemplate> findByIdAndOrganizationId(Long id, Long organizationId);

    Optional<BroadcastMessageTemplate> findFirstByOrganizationIdAndChannelAndMembershipPackageIdAndPurpose(
            Long organizationId,
            BroadcastChannel channel,
            Long membershipPackageId,
            BroadcastTemplatePurpose purpose);

    List<BroadcastMessageTemplate> findByOrganizationIdAndChannelAndMembershipPackageId(
            Long organizationId, BroadcastChannel channel, Long membershipPackageId);
}
