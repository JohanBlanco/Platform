package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.FormAccessType;
import com.gymplatform.domain.enums.FormPurpose;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "custom_forms",
        uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "slug"})
)
public class CustomForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 120)
    private String slug;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormAccessType accessType = FormAccessType.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FormPurpose formPurpose = FormPurpose.CUSTOM;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fieldsJson = "[]";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_folder_id")
    private FormFolder templateFolder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_folder_id")
    private FormFolder responseFolder;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public FormAccessType getAccessType() { return accessType; }
    public void setAccessType(FormAccessType accessType) { this.accessType = accessType; }
    public FormPurpose getFormPurpose() { return formPurpose; }
    public void setFormPurpose(FormPurpose formPurpose) { this.formPurpose = formPurpose; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getFieldsJson() { return fieldsJson; }
    public void setFieldsJson(String fieldsJson) { this.fieldsJson = fieldsJson; }
    public FormFolder getTemplateFolder() { return templateFolder; }
    public void setTemplateFolder(FormFolder templateFolder) { this.templateFolder = templateFolder; }
    public FormFolder getResponseFolder() { return responseFolder; }
    public void setResponseFolder(FormFolder responseFolder) { this.responseFolder = responseFolder; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
