package com.gymplatform.service;

import com.gymplatform.domain.entity.*;
import com.gymplatform.domain.enums.NutritionPlanStatus;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.NutritionPlanRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.security.UserPrincipal;
import com.gymplatform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NutritionPlanService {

    private final NutritionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    public NutritionPlanService(NutritionPlanRepository planRepository,
                                UserRepository userRepository,
                                OrganizationRepository organizationRepository) {
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional
    public NutritionPlanResponse create(Long organizationId, Long creatorId, NutritionPlanCreateRequest request) {
        requireStaffCreator(creatorId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User member = requireMember(organizationId, request.memberId());
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        archiveActivePlans(organizationId, member.getId());

        NutritionPlan plan = new NutritionPlan();
        plan.setOrganization(org);
        plan.setMember(member);
        plan.setCreatedBy(creator);
        applyRequest(plan, request);
        plan.setStatus(NutritionPlanStatus.ACTIVE);
        plan.setUpdatedAt(Instant.now());

        return toResponse(planRepository.save(plan));
    }

    @Transactional
    public NutritionPlanResponse update(Long organizationId, Long planId, NutritionPlanCreateRequest request) {
        requireStaffCreator(SecurityUtils.currentUser().getId());
        NutritionPlan plan = requirePlan(organizationId, planId);
        requireMember(organizationId, request.memberId());
        if (!plan.getMember().getId().equals(request.memberId())) {
            throw new BusinessException("No puedes cambiar el miembro de un plan existente");
        }
        plan.getMeals().clear();
        applyRequest(plan, request);
        plan.setUpdatedAt(Instant.now());
        return toResponse(planRepository.save(plan));
    }

    @Transactional
    public NutritionPlanResponse archive(Long organizationId, Long planId) {
        requireStaffCreator(SecurityUtils.currentUser().getId());
        NutritionPlan plan = requirePlan(organizationId, planId);
        plan.setStatus(NutritionPlanStatus.ARCHIVED);
        plan.setUpdatedAt(Instant.now());
        return toResponse(planRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public List<NutritionPlanResponse> findActiveByOrganization(Long organizationId) {
        requireStaffCreator(SecurityUtils.currentUser().getId());
        return planRepository.findByOrganizationIdAndStatusOrderByUpdatedAtDesc(
                        organizationId, NutritionPlanStatus.ACTIVE)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NutritionPlanResponse> findByMember(Long organizationId, Long memberId, Long requesterId) {
        requireMemberAccess(organizationId, memberId, requesterId);
        return planRepository.findByOrganizationIdAndMemberIdOrderByCreatedAtDesc(organizationId, memberId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NutritionPlanResponse> findMine(Long organizationId, Long memberId) {
        return findByMember(organizationId, memberId, memberId);
    }

    @Transactional(readOnly = true)
    public NutritionPlanResponse findById(Long organizationId, Long id, Long requesterId) {
        NutritionPlan plan = requirePlan(organizationId, id);
        requireMemberAccess(organizationId, plan.getMember().getId(), requesterId);
        return toResponse(plan);
    }

    private void archiveActivePlans(Long organizationId, Long memberId) {
        planRepository.findByOrganizationIdAndMemberIdOrderByCreatedAtDesc(organizationId, memberId)
                .stream()
                .filter(p -> p.getStatus() == NutritionPlanStatus.ACTIVE)
                .forEach(p -> {
                    p.setStatus(NutritionPlanStatus.ARCHIVED);
                    p.setUpdatedAt(Instant.now());
                });
    }

    private void applyRequest(NutritionPlan plan, NutritionPlanCreateRequest request) {
        plan.setTitle(request.title().trim());
        plan.setObjective(trimToNull(request.objective()));
        plan.setDailyCaloriesTarget(request.dailyCaloriesTarget());
        plan.setProteinGrams(request.proteinGrams());
        plan.setCarbsGrams(request.carbsGrams());
        plan.setFatGrams(request.fatGrams());
        plan.setWaterLiters(request.waterLiters());
        plan.setGuidelines(encodeGuidelines(request.guidelines()));
        plan.setNotes(trimToNull(request.notes()));
        plan.setValidFrom(request.validFrom());
        plan.setValidUntil(request.validUntil());
        addMeals(plan, request.meals());
    }

    private void addMeals(NutritionPlan plan, List<NutritionMealRequest> meals) {
        if (meals == null) return;
        for (int i = 0; i < meals.size(); i++) {
            NutritionMealRequest mealReq = meals.get(i);
            NutritionMeal meal = new NutritionMeal();
            meal.setPlan(plan);
            meal.setName(mealReq.name().trim());
            meal.setSuggestedTime(trimToNull(mealReq.suggestedTime()));
            meal.setNotes(trimToNull(mealReq.notes()));
            meal.setOrderIndex(i);
            if (mealReq.items() != null) {
                for (int j = 0; j < mealReq.items().size(); j++) {
                    NutritionMealItemRequest itemReq = mealReq.items().get(j);
                    NutritionMealItem item = new NutritionMealItem();
                    item.setMeal(meal);
                    item.setFoodName(itemReq.foodName().trim());
                    item.setPortion(trimToNull(itemReq.portion()));
                    item.setNotes(trimToNull(itemReq.notes()));
                    item.setOrderIndex(j);
                    meal.getItems().add(item);
                }
            }
            plan.getMeals().add(meal);
        }
    }

    private NutritionPlanResponse toResponse(NutritionPlan plan) {
        User member = plan.getMember();
        User creator = plan.getCreatedBy();
        return new NutritionPlanResponse(
                plan.getId(),
                member.getId(),
                member.getFirstName() + " " + member.getLastName(),
                creator.getId(),
                creator.getFirstName() + " " + creator.getLastName(),
                plan.getTitle(),
                plan.getObjective(),
                plan.getDailyCaloriesTarget(),
                plan.getProteinGrams(),
                plan.getCarbsGrams(),
                plan.getFatGrams(),
                plan.getWaterLiters(),
                decodeGuidelines(plan.getGuidelines()),
                plan.getNotes(),
                plan.getStatus(),
                plan.getValidFrom(),
                plan.getValidUntil(),
                plan.getMeals().stream().map(this::toMealResponse).toList(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }

    private NutritionMealResponse toMealResponse(NutritionMeal meal) {
        return new NutritionMealResponse(
                meal.getId(),
                meal.getName(),
                meal.getSuggestedTime(),
                meal.getNotes(),
                meal.getOrderIndex(),
                meal.getItems().stream().map(item -> new NutritionMealItemResponse(
                        item.getId(),
                        item.getFoodName(),
                        item.getPortion(),
                        item.getNotes(),
                        item.getOrderIndex()
                )).toList()
        );
    }

    private NutritionPlan requirePlan(Long organizationId, Long planId) {
        return planRepository.findByIdAndOrganizationId(planId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan nutricional no encontrado"));
    }

    private User requireMember(Long organizationId, Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El miembro no pertenece a este gimnasio");
        }
        if (!member.hasRole(Role.MEMBER)) {
            throw new BusinessException("Solo se pueden asignar planes a miembros");
        }
        return member;
    }

    private void requireStaffCreator(Long creatorId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if (!principal.hasRole("INSTRUCTOR") && !principal.hasRole("GYM_OWNER")
                && !principal.hasRole("RECEPTIONIST")) {
            throw new BusinessException("Solo el personal autorizado puede gestionar planes nutricionales");
        }
        if (!creatorId.equals(principal.getId())) {
            throw new BusinessException("Operación inválida");
        }
    }

    private void requireMemberAccess(Long organizationId, Long memberId, Long requesterId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if (requesterId.equals(memberId)) {
            if (!principal.getId().equals(memberId)) {
                throw new BusinessException("No puedes consultar planes de otro miembro");
            }
            return;
        }
        requireStaffCreator(principal.getId());
        requireMember(organizationId, memberId);
    }

    private String encodeGuidelines(List<String> guidelines) {
        if (guidelines == null || guidelines.isEmpty()) return null;
        return guidelines.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining("\n"));
    }

    private List<String> decodeGuidelines(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
