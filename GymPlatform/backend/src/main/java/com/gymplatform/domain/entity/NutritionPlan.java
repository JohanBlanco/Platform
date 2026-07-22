package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.NutritionPlanStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "nutrition_plans")
public class NutritionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String objective;

    private Integer dailyCaloriesTarget;
    private Integer proteinGrams;
    private Integer carbsGrams;
    private Integer fatGrams;
    private Double waterLiters;

    @Column(length = 4000)
    private String guidelines;

    @Column(length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NutritionPlanStatus status = NutritionPlanStatus.ACTIVE;

    private LocalDate validFrom;
    private LocalDate validUntil;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<NutritionMeal> meals = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }
    public Integer getDailyCaloriesTarget() { return dailyCaloriesTarget; }
    public void setDailyCaloriesTarget(Integer dailyCaloriesTarget) { this.dailyCaloriesTarget = dailyCaloriesTarget; }
    public Integer getProteinGrams() { return proteinGrams; }
    public void setProteinGrams(Integer proteinGrams) { this.proteinGrams = proteinGrams; }
    public Integer getCarbsGrams() { return carbsGrams; }
    public void setCarbsGrams(Integer carbsGrams) { this.carbsGrams = carbsGrams; }
    public Integer getFatGrams() { return fatGrams; }
    public void setFatGrams(Integer fatGrams) { this.fatGrams = fatGrams; }
    public Double getWaterLiters() { return waterLiters; }
    public void setWaterLiters(Double waterLiters) { this.waterLiters = waterLiters; }
    public String getGuidelines() { return guidelines; }
    public void setGuidelines(String guidelines) { this.guidelines = guidelines; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public NutritionPlanStatus getStatus() { return status; }
    public void setStatus(NutritionPlanStatus status) { this.status = status; }
    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }
    public LocalDate getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }
    public List<NutritionMeal> getMeals() { return meals; }
    public void setMeals(List<NutritionMeal> meals) { this.meals = meals; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
