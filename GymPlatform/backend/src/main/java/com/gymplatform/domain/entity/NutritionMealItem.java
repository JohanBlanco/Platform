package com.gymplatform.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "nutrition_meal_items")
public class NutritionMealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_id", nullable = false)
    private NutritionMeal meal;

    @Column(nullable = false)
    private String foodName;

    private String portion;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private int orderIndex;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public NutritionMeal getMeal() { return meal; }
    public void setMeal(NutritionMeal meal) { this.meal = meal; }
    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }
    public String getPortion() { return portion; }
    public void setPortion(String portion) { this.portion = portion; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
