package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.BiologicalSex;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "body_measurements")
public class BodyMeasurement {

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
    @JoinColumn(name = "recorded_by_id", nullable = false)
    private User recordedBy;

    @Column(nullable = false)
    private Instant measuredAt = Instant.now();

    @Column(nullable = false)
    private Integer ageYears;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private BiologicalSex sex;

    @Column(nullable = false)
    private Double weightKg;

    @Column(nullable = false)
    private Double heightCm;

    private Double neckCm;
    private Double chestCm;
    private Double waistCm;
    private Double hipsCm;
    private Double shouldersCm;
    private Double leftArmCm;
    private Double rightArmCm;
    private Double leftForearmCm;
    private Double rightForearmCm;
    private Double leftThighCm;
    private Double rightThighCm;
    private Double leftCalfCm;
    private Double rightCalfCm;

    @Column(length = 2000)
    private String notes;

    private Long appointmentRequestId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }
    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }
    public Integer getAgeYears() { return ageYears; }
    public void setAgeYears(Integer ageYears) { this.ageYears = ageYears; }
    public BiologicalSex getSex() { return sex; }
    public void setSex(BiologicalSex sex) { this.sex = sex; }
    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }
    public Double getNeckCm() { return neckCm; }
    public void setNeckCm(Double neckCm) { this.neckCm = neckCm; }
    public Double getChestCm() { return chestCm; }
    public void setChestCm(Double chestCm) { this.chestCm = chestCm; }
    public Double getWaistCm() { return waistCm; }
    public void setWaistCm(Double waistCm) { this.waistCm = waistCm; }
    public Double getHipsCm() { return hipsCm; }
    public void setHipsCm(Double hipsCm) { this.hipsCm = hipsCm; }
    public Double getShouldersCm() { return shouldersCm; }
    public void setShouldersCm(Double shouldersCm) { this.shouldersCm = shouldersCm; }
    public Double getLeftArmCm() { return leftArmCm; }
    public void setLeftArmCm(Double leftArmCm) { this.leftArmCm = leftArmCm; }
    public Double getRightArmCm() { return rightArmCm; }
    public void setRightArmCm(Double rightArmCm) { this.rightArmCm = rightArmCm; }
    public Double getLeftForearmCm() { return leftForearmCm; }
    public void setLeftForearmCm(Double leftForearmCm) { this.leftForearmCm = leftForearmCm; }
    public Double getRightForearmCm() { return rightForearmCm; }
    public void setRightForearmCm(Double rightForearmCm) { this.rightForearmCm = rightForearmCm; }
    public Double getLeftThighCm() { return leftThighCm; }
    public void setLeftThighCm(Double leftThighCm) { this.leftThighCm = leftThighCm; }
    public Double getRightThighCm() { return rightThighCm; }
    public void setRightThighCm(Double rightThighCm) { this.rightThighCm = rightThighCm; }
    public Double getLeftCalfCm() { return leftCalfCm; }
    public void setLeftCalfCm(Double leftCalfCm) { this.leftCalfCm = leftCalfCm; }
    public Double getRightCalfCm() { return rightCalfCm; }
    public void setRightCalfCm(Double rightCalfCm) { this.rightCalfCm = rightCalfCm; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getAppointmentRequestId() { return appointmentRequestId; }
    public void setAppointmentRequestId(Long appointmentRequestId) { this.appointmentRequestId = appointmentRequestId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
