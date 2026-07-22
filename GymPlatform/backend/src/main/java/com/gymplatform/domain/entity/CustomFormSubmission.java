package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "custom_form_submissions")
public class CustomFormSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "form_id", nullable = false)
    private CustomForm form;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "response_folder_id", nullable = false)
    private FormFolder responseFolder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answersJson;

    private Instant importedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CustomForm getForm() { return form; }
    public void setForm(CustomForm form) { this.form = form; }
    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }
    public FormFolder getResponseFolder() { return responseFolder; }
    public void setResponseFolder(FormFolder responseFolder) { this.responseFolder = responseFolder; }
    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }
    public Instant getImportedAt() { return importedAt; }
    public void setImportedAt(Instant importedAt) { this.importedAt = importedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
