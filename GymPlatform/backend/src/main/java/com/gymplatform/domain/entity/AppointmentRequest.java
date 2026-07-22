package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.AppointmentRequestStatus;
import com.gymplatform.domain.enums.AppointmentType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "appointment_requests")
public class AppointmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private User member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentType type;

    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentRequestStatus status = AppointmentRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_staff_id")
    private User preferredStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_availability_id")
    private StaffAvailability staffAvailability;

    private Instant scheduledStart;

    private Instant scheduledEnd;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public AppointmentType getType() { return type; }
    public void setType(AppointmentType type) { this.type = type; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public AppointmentRequestStatus getStatus() { return status; }
    public void setStatus(AppointmentRequestStatus status) { this.status = status; }
    public User getPreferredStaff() { return preferredStaff; }
    public void setPreferredStaff(User preferredStaff) { this.preferredStaff = preferredStaff; }
    public User getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(User assignedStaff) { this.assignedStaff = assignedStaff; }
    public StaffAvailability getStaffAvailability() { return staffAvailability; }
    public void setStaffAvailability(StaffAvailability staffAvailability) { this.staffAvailability = staffAvailability; }
    public Instant getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(Instant scheduledStart) { this.scheduledStart = scheduledStart; }
    public Instant getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(Instant scheduledEnd) { this.scheduledEnd = scheduledEnd; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
