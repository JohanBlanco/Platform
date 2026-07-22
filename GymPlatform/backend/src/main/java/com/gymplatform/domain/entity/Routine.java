package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routines")
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private RoutineTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    /** true = rutina temporal para un solo usuario */
    @Column(nullable = false)
    private boolean temporary = false;

    private Integer daysPerWeek;

    /** Inicio de vigencia (normalmente el día de asignación). */
    private LocalDate validFrom;

    /** Fin de vigencia inclusive. */
    private LocalDate validUntil;

    private Integer validityAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private RoutineValidityUnit validityUnit;

    @OneToMany(mappedBy = "routine", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<RoutineDay> days = new ArrayList<>();

    @OneToMany(mappedBy = "routine", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<RoutineExercise> exercises = new ArrayList<>();

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public User getInstructor() { return instructor; }
    public void setInstructor(User instructor) { this.instructor = instructor; }
    public RoutineTemplate getTemplate() { return template; }
    public void setTemplate(RoutineTemplate template) { this.template = template; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public boolean isTemporary() { return temporary; }
    public void setTemporary(boolean temporary) { this.temporary = temporary; }
    public Integer getDaysPerWeek() { return daysPerWeek; }
    public void setDaysPerWeek(Integer daysPerWeek) { this.daysPerWeek = daysPerWeek; }
    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }
    public LocalDate getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }
    public Integer getValidityAmount() { return validityAmount; }
    public void setValidityAmount(Integer validityAmount) { this.validityAmount = validityAmount; }
    public RoutineValidityUnit getValidityUnit() { return validityUnit; }
    public void setValidityUnit(RoutineValidityUnit validityUnit) { this.validityUnit = validityUnit; }
    public List<RoutineDay> getDays() { return days; }
    public void setDays(List<RoutineDay> days) { this.days = days; }
    public List<RoutineExercise> getExercises() { return exercises; }
    public void setExercises(List<RoutineExercise> exercises) { this.exercises = exercises; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
