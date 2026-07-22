package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "activity_occurrence_exclusions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"activity_id", "occurrence_date"})
)
public class ActivityOccurrenceExclusion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Column(nullable = false)
    private LocalDate occurrenceDate;

    @Column(nullable = false)
    private Instant excludedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Activity getActivity() { return activity; }
    public void setActivity(Activity activity) { this.activity = activity; }
    public LocalDate getOccurrenceDate() { return occurrenceDate; }
    public void setOccurrenceDate(LocalDate occurrenceDate) { this.occurrenceDate = occurrenceDate; }
    public Instant getExcludedAt() { return excludedAt; }
    public void setExcludedAt(Instant excludedAt) { this.excludedAt = excludedAt; }
}
