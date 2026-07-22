package com.gymplatform.service;

import com.gymplatform.domain.entity.MemberSubscription;
import com.gymplatform.domain.entity.MembershipPackage;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.MemberMembershipStatus;
import com.gymplatform.domain.enums.ReservationStatus;
import com.gymplatform.dto.MemberMembershipInfo;
import com.gymplatform.dto.MembershipUsageResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.MemberSubscriptionRepository;
import com.gymplatform.repository.MembershipPackageRepository;
import com.gymplatform.repository.ReservationRepository;
import com.gymplatform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Service
public class MemberSubscriptionService {

    private final MemberSubscriptionRepository subscriptionRepository;
    private final MembershipPackageRepository packageRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    public MemberSubscriptionService(MemberSubscriptionRepository subscriptionRepository,
                                       MembershipPackageRepository packageRepository,
                                       UserRepository userRepository,
                                       ReservationRepository reservationRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.packageRepository = packageRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
    }

    /**
     * Asigna membresía. Si el miembro ya tiene una vigente, la nueva queda programada
     * desde el día siguiente al vencimiento. No se permite más de una renovación en cola.
     */
    @Transactional
    public MemberSubscription assignMembership(Long organizationId, Long memberId, Long packageId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El miembro no pertenece a este gimnasio");
        }

        MembershipPackage pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Membresía no encontrada"));
        if (!pkg.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La membresía no pertenece a este gimnasio");
        }

        Optional<MemberSubscription> queued = getQueuedSubscription(memberId);
        if (queued.isPresent()) {
            throw new BusinessException(
                    "Este miembro ya tiene una membresía programada a partir del "
                            + queued.get().getStartDate()
                            + ". No se puede asignar otra hasta que esa surta efecto."
            );
        }

        LocalDate today = LocalDate.now();
        Optional<MemberSubscription> current = getCurrentPeriodSubscription(memberId);
        LocalDate startDate;
        if (current.isPresent()) {
            startDate = current.get().getEndDate().plusDays(1);
        } else {
            // Sin período vigente: desactivar restos activos vencidos / huérfanos
            for (MemberSubscription existing : subscriptionRepository.findByMemberIdAndActiveTrueOrderByStartDateAsc(memberId)) {
                existing.setActive(false);
            }
            startDate = today;
        }

        MemberSubscription subscription = new MemberSubscription();
        subscription.setMember(member);
        subscription.setMembershipPackage(pkg);
        subscription.setStartDate(startDate);
        subscription.setEndDate(startDate.plusMonths(pkg.getDurationMonths()));
        subscription.setActive(true);
        return subscriptionRepository.save(subscription);
    }

    /** Desactiva la suscripción creada por una venta anulada. */
    @Transactional
    public void deactivateSubscriptionFromSale(Long organizationId, Long subscriptionId) {
        MemberSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElse(null);
        if (subscription == null) {
            return;
        }
        User member = subscription.getMember();
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La membresía no pertenece a este gimnasio");
        }
        subscription.setActive(false);
        subscriptionRepository.save(subscription);
    }

    /**
     * Compatibilidad: ventas antiguas sin member_subscription_id.
     * Desactiva la suscripción activa del mismo plan creada cerca de la venta.
     */
    @Transactional
    public void deactivateMatchingSaleSubscription(
            Long organizationId,
            Long memberId,
            Long packageId,
            Instant saleCreatedAt) {
        Instant windowStart = saleCreatedAt.minusSeconds(120);
        Instant windowEnd = saleCreatedAt.plusSeconds(300);
        subscriptionRepository.findByMemberIdAndActiveTrueOrderByStartDateAsc(memberId).stream()
                .filter(s -> s.getMembershipPackage() != null
                        && s.getMembershipPackage().getId().equals(packageId))
                .filter(s -> {
                    Instant created = s.getCreatedAt();
                    if (created == null) {
                        return true;
                    }
                    return !created.isBefore(windowStart) && !created.isAfter(windowEnd);
                })
                .findFirst()
                .ifPresent(s -> {
                    if (s.getMember().getOrganization() != null
                            && s.getMember().getOrganization().getId().equals(organizationId)) {
                        s.setActive(false);
                        subscriptionRepository.save(s);
                    }
                });
    }

    public Optional<MemberSubscription> getCurrentPeriodSubscription(Long memberId) {
        LocalDate today = LocalDate.now();
        return subscriptionRepository.findByMemberIdAndActiveTrueOrderByStartDateAsc(memberId).stream()
                .filter(s -> !s.getStartDate().isAfter(today) && !s.getEndDate().isBefore(today))
                .findFirst();
    }

    public Optional<MemberSubscription> getQueuedSubscription(Long memberId) {
        LocalDate today = LocalDate.now();
        return subscriptionRepository.findByMemberIdAndActiveTrueOrderByStartDateAsc(memberId).stream()
                .filter(s -> s.getStartDate().isAfter(today))
                .findFirst();
    }

    public Optional<MemberSubscription> getActiveSubscription(Long memberId) {
        return getCurrentPeriodSubscription(memberId);
    }

    /**
     * Membresía vigente con bloqueo pesimista (FOR UPDATE) para no consumir
     * el mismo cupo gratuito en reservas concurrentes.
     */
    @Transactional
    public MemberSubscription requireActiveSubscriptionForUpdate(Long memberId) {
        MemberSubscription current = getCurrentPeriodSubscription(memberId)
                .orElseThrow(() -> new BusinessException("No tienes una membresía activa. Contacta a recepción."));
        return subscriptionRepository.findByIdForUpdate(current.getId())
                .orElseThrow(() -> new BusinessException("No tienes una membresía activa. Contacta a recepción."));
    }

    public boolean hasFreeSlotRemaining(Long memberId, MemberSubscription subscription) {
        Integer quota = subscription.getMembershipPackage().getFreeActivityQuota();
        if (quota == null) return true;
        return countUsedFreeActivities(memberId, subscription) < quota;
    }

    public Optional<MemberSubscription> getLatestSubscription(Long memberId) {
        return subscriptionRepository.findFirstByMemberIdOrderByStartDateDesc(memberId);
    }

    public MemberMembershipInfo getMembershipInfo(Long memberId) {
        Optional<MemberSubscription> queuedOpt = getQueuedSubscription(memberId);
        LocalDate queuedStart = queuedOpt.map(MemberSubscription::getStartDate).orElse(null);
        String queuedName = queuedOpt
                .map(s -> s.getMembershipPackage().getName())
                .orElse(null);
        boolean hasQueued = queuedOpt.isPresent();

        Optional<MemberSubscription> currentOpt = getCurrentPeriodSubscription(memberId);
        if (currentOpt.isPresent()) {
            MemberSubscription current = currentOpt.get();
            return new MemberMembershipInfo(
                    MemberMembershipStatus.ACTIVE,
                    current.getEndDate(),
                    current.getMembershipPackage().getName(),
                    hasQueued,
                    queuedStart,
                    queuedName
            );
        }

        Optional<MemberSubscription> latestOpt = getLatestSubscription(memberId);
        if (latestOpt.isEmpty()) {
            return new MemberMembershipInfo(MemberMembershipStatus.PAYMENT_PENDING, null, null, hasQueued, queuedStart, queuedName);
        }
        MemberSubscription latest = latestOpt.get();
        LocalDate today = LocalDate.now();
        LocalDate endDate = latest.getEndDate();
        String packageName = latest.getMembershipPackage().getName();

        // Si solo hay cola futura sin período actual (raro), marcar pendiente
        if (latest.getStartDate().isAfter(today)) {
            return new MemberMembershipInfo(
                    MemberMembershipStatus.PAYMENT_PENDING,
                    null,
                    packageName,
                    hasQueued,
                    queuedStart,
                    queuedName
            );
        }
        if (!endDate.isBefore(today.minusMonths(2))) {
            return new MemberMembershipInfo(
                    MemberMembershipStatus.PAYMENT_PENDING,
                    endDate,
                    packageName,
                    hasQueued,
                    queuedStart,
                    queuedName
            );
        }
        return new MemberMembershipInfo(MemberMembershipStatus.INACTIVE, null, packageName, hasQueued, queuedStart, queuedName);
    }

    private boolean isVigente(MemberSubscription subscription) {
        LocalDate today = LocalDate.now();
        return !subscription.getStartDate().isAfter(today) && !subscription.getEndDate().isBefore(today);
    }

    public long countUsedFreeActivities(Long memberId, MemberSubscription subscription) {
        Instant since = subscription.getStartDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        return reservationRepository.countByMemberIdAndFreeSlotTrueAndStatusAndCreatedAtGreaterThanEqual(
                memberId, ReservationStatus.CONFIRMED, since);
    }

    public boolean hasFreeSlotRemaining(Long memberId) {
        return getActiveSubscription(memberId)
                .map(sub -> {
                    Integer quota = sub.getMembershipPackage().getFreeActivityQuota();
                    if (quota == null) return true;
                    return countUsedFreeActivities(memberId, sub) < quota;
                })
                .orElse(false);
    }

    public MembershipUsageResponse getUsage(Long memberId) {
        Optional<MemberSubscription> subOpt = getActiveSubscription(memberId);
        if (subOpt.isEmpty()) {
            return new MembershipUsageResponse(null, null, null, 0, 0L, false);
        }
        MemberSubscription sub = subOpt.get();
        MembershipPackage pkg = sub.getMembershipPackage();
        Integer quota = pkg.getFreeActivityQuota();
        long used = countUsedFreeActivities(memberId, sub);
        boolean unlimited = quota == null;
        Long remaining = unlimited ? null : Math.max(0, quota - used);
        return new MembershipUsageResponse(
                pkg.getId(), pkg.getName(), quota, used, remaining, unlimited
        );
    }
}
