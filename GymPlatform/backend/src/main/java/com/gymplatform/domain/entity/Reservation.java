package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.ReservationStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "reservations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reservations_activity_member_occurrence",
                columnNames = {"activity_id", "member_id", "occurrence_date"}
        )
)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id")
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    /** Fecha concreta de la clase reservada (importante en actividades recurrentes) */
    @Column(nullable = false)
    private LocalDate occurrenceDate;

    /** Nombre de la actividad al reservar (se conserva si se cancela y se desvincula). */
    @Column(nullable = false)
    private String activityName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.CONFIRMED;

    @Column(nullable = false)
    private boolean freeSlot = false;

    @Column(nullable = false)
    private boolean paymentRequired = false;

    @Column(nullable = false)
    private boolean paid = false;

    @Column(nullable = false)
    private boolean attended = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Activity getActivity() { return activity; }
    public void setActivity(Activity activity) { this.activity = activity; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public LocalDate getOccurrenceDate() { return occurrenceDate; }
    public void setOccurrenceDate(LocalDate occurrenceDate) { this.occurrenceDate = occurrenceDate; }
    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }
    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public boolean isFreeSlot() { return freeSlot; }
    public void setFreeSlot(boolean freeSlot) { this.freeSlot = freeSlot; }
    public boolean isPaymentRequired() { return paymentRequired; }
    public void setPaymentRequired(boolean paymentRequired) { this.paymentRequired = paymentRequired; }
    public boolean isPaid() { return paid; }
    public void setPaid(boolean paid) { this.paid = paid; }
    public boolean isAttended() { return attended; }
    public void setAttended(boolean attended) { this.attended = attended; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
