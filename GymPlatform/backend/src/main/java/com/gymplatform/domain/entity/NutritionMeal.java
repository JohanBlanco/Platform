package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "nutrition_meals")
public class NutritionMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private NutritionPlan plan;

    @Column(nullable = false)
    private String name;

    private String suggestedTime;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private int orderIndex;

    @OneToMany(mappedBy = "meal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<NutritionMealItem> items = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public NutritionPlan getPlan() { return plan; }
    public void setPlan(NutritionPlan plan) { this.plan = plan; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSuggestedTime() { return suggestedTime; }
    public void setSuggestedTime(String suggestedTime) { this.suggestedTime = suggestedTime; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public List<NutritionMealItem> getItems() { return items; }
    public void setItems(List<NutritionMealItem> items) { this.items = items; }
}
