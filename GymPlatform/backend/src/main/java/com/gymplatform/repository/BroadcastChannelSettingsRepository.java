package com.gymplatform.repository;

import com.gymplatform.domain.entity.BroadcastChannelSettings;
import com.gymplatform.domain.enums.BroadcastChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BroadcastChannelSettingsRepository extends JpaRepository<BroadcastChannelSettings, Long> {

    Optional<BroadcastChannelSettings> findByOrganizationIdAndChannel(Long organizationId, BroadcastChannel channel);
}
