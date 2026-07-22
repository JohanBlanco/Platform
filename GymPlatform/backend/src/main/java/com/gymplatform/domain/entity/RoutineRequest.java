package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.RoutineRequestStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "routine_requests")
public class RoutineRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    private String description;
    private String goals;
    private String additionalNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoutineRequestStatus status = RoutineRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_instructor_id")
    private User assignedInstructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_instructor_id")
    private User preferredInstructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resulting_routine_id")
    private Routine resultingRoutine;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    private Instant completedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }
    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }
    public RoutineRequestStatus getStatus() { return status; }
    public void setStatus(RoutineRequestStatus status) { this.status = status; }
    public User getAssignedInstructor() { return assignedInstructor; }
    public void setAssignedInstructor(User assignedInstructor) { this.assignedInstructor = assignedInstructor; }
    public User getPreferredInstructor() { return preferredInstructor; }
    public void setPreferredInstructor(User preferredInstructor) { this.preferredInstructor = preferredInstructor; }
    public Routine getResultingRoutine() { return resultingRoutine; }
    public void setResultingRoutine(Routine resultingRoutine) { this.resultingRoutine = resultingRoutine; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
