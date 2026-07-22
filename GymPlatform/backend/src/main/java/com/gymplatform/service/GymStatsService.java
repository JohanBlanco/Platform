package com.gymplatform.service;

import com.gymplatform.domain.entity.Reservation;
import com.gymplatform.domain.enums.ReservationStatus;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.GymStatsResponse;
import com.gymplatform.dto.SaleResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.repository.ActivityRepository;
import com.gymplatform.repository.ReservationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.ActivityRecurrenceUtil;
import com.gymplatform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class GymStatsService {

    private static final BigDecimal DEFAULT_ACTIVITY_SALE_AMOUNT = new BigDecimal("99.00");

    private final ReservationRepository reservationRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public GymStatsService(ReservationRepository reservationRepository,
                           ActivityRepository activityRepository,
                           UserRepository userRepository) {
        this.reservationRepository = reservationRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    public List<SaleResponse> findSales(Long organizationId) {
        requireReceptionRole();
        return reservationRepository.findPaidSalesByOrganization(organizationId).stream()
                .map(this::toSaleResponse)
                .toList();
    }

    public GymStatsResponse getSummary(Long organizationId) {
        requireReceptionRole();
        LocalDate today = LocalDate.now();
        Instant startOfToday = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant startOfMonth = today.withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        long members = userRepository.findByOrganizationIdAndRole(organizationId, Role.MEMBER).size();
        long activitiesScheduled = activityRepository
                .findByOrganizationIdAndActiveTrueOrderByStartDateAscStartTimeAsc(organizationId).size();
        long activitiesToday = activityRepository.findActiveSeriesOverlapping(organizationId, today, today).stream()
                .flatMap(a -> ActivityRecurrenceUtil.expandOccurrences(
                        a.getStartDate(),
                        a.getEndDate(),
                        a.isRecurring(),
                        a.getRepeatDays(),
                        today,
                        today).stream())
                .count();

        List<Reservation> orgReservations = reservationRepository.findByOrganizationId(organizationId);
        long reservationsToday = orgReservations.stream()
                .filter(r -> r.getCreatedAt().isAfter(startOfToday) || r.getCreatedAt().equals(startOfToday))
                .count();
        long confirmed = orgReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED)
                .count();
        long pendingPayments = reservationRepository.findPendingPaymentsByOrganization(organizationId).size();
        long salesToday = orgReservations.stream()
                .filter(r -> r.isPaymentRequired() && r.isPaid())
                .filter(r -> r.getUpdatedAt().isAfter(startOfToday))
                .count();
        long salesMonth = orgReservations.stream()
                .filter(r -> r.isPaymentRequired() && r.isPaid())
                .filter(r -> r.getUpdatedAt().isAfter(startOfMonth))
                .count();
        long attendancesMonth = orgReservations.stream()
                .filter(r -> r.isAttended() && r.getStatus() == ReservationStatus.CONFIRMED)
                .filter(r -> r.getUpdatedAt().isAfter(startOfMonth))
                .count();

        return new GymStatsResponse(
                members,
                activitiesScheduled,
                activitiesToday,
                reservationsToday,
                confirmed,
                pendingPayments,
                salesToday,
                salesMonth,
                attendancesMonth
        );
    }

    private SaleResponse toSaleResponse(Reservation reservation) {
        return new SaleResponse(
                reservation.getId(),
                reservation.getMember().getFirstName() + " " + reservation.getMember().getLastName(),
                reservation.getActivityName(),
                "Pago actividad",
                DEFAULT_ACTIVITY_SALE_AMOUNT,
                reservation.getUpdatedAt()
        );
    }

    private void requireReceptionRole() {
        var user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new BusinessException("No tienes permiso para esta acción");
        }
    }
}
