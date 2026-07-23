package com.gymplatform.controller;

import com.gymplatform.domain.enums.BroadcastChannel;
import com.gymplatform.domain.enums.BroadcastTemplatePurpose;
import com.gymplatform.domain.enums.FormFolderKind;
import com.gymplatform.dto.*;
import com.gymplatform.service.*;
import com.gymplatform.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Tag(name = "Gimnasio", description = "Usuarios, membresías, actividades, reservaciones y rutinas")
@RestController
@RequestMapping("/api")
public class GymController {

    private final UserService userService;
    private final MembershipPackageService packageService;
    private final ActivityService activityService;
    private final ReservationService reservationService;
    private final RoutineService routineService;
    private final ExerciseCatalogService exerciseCatalogService;
    private final AppointmentRequestService appointmentRequestService;
    private final StaffAvailabilityService staffAvailabilityService;

    private final MemberSubscriptionService memberSubscriptionService;
    private final GymStatsService gymStatsService;
    private final BodyMeasurementService bodyMeasurementService;
    private final NutritionPlanService nutritionPlanService;
    private final BroadcastSettingsService broadcastSettingsService;
    private final CustomFormService customFormService;
    private final FormFolderService formFolderService;
    private final MemberFileService memberFileService;
    private final RoutineGenerationService routineGenerationService;
    private final ForumService forumService;
    private final ProductService productService;
    private final WhatsAppCloudApiService whatsAppCloudApiService;
    private final OrganizationService organizationService;
    private final ActivityPromotionService activityPromotionService;

    public GymController(UserService userService,
                         MembershipPackageService packageService, ActivityService activityService,
                         ReservationService reservationService, RoutineService routineService,
                         ExerciseCatalogService exerciseCatalogService,
                         AppointmentRequestService appointmentRequestService,
                         StaffAvailabilityService staffAvailabilityService,
                         MemberSubscriptionService memberSubscriptionService,
                         GymStatsService gymStatsService,
                         BodyMeasurementService bodyMeasurementService,
                         NutritionPlanService nutritionPlanService,
                         BroadcastSettingsService broadcastSettingsService,
                         CustomFormService customFormService,
                         FormFolderService formFolderService,
                         MemberFileService memberFileService,
                         RoutineGenerationService routineGenerationService,
                         ForumService forumService,
                         ProductService productService,
                         WhatsAppCloudApiService whatsAppCloudApiService,
                         OrganizationService organizationService,
                         ActivityPromotionService activityPromotionService) {
        this.userService = userService;
        this.packageService = packageService;
        this.activityService = activityService;
        this.reservationService = reservationService;
        this.routineService = routineService;
        this.exerciseCatalogService = exerciseCatalogService;
        this.appointmentRequestService = appointmentRequestService;
        this.staffAvailabilityService = staffAvailabilityService;
        this.memberSubscriptionService = memberSubscriptionService;
        this.gymStatsService = gymStatsService;
        this.bodyMeasurementService = bodyMeasurementService;
        this.nutritionPlanService = nutritionPlanService;
        this.broadcastSettingsService = broadcastSettingsService;
        this.customFormService = customFormService;
        this.formFolderService = formFolderService;
        this.memberFileService = memberFileService;
        this.routineGenerationService = routineGenerationService;
        this.forumService = forumService;
        this.productService = productService;
        this.whatsAppCloudApiService = whatsAppCloudApiService;
        this.organizationService = organizationService;
        this.activityPromotionService = activityPromotionService;
    }

    @Operation(summary = "Perfil / branding del gimnasio actual")
    @GetMapping("/organization")
    public GymOrganizationResponse getMyOrganization() {
        return organizationService.getGymProfile(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Actualizar perfil del gimnasio (solo admin; requiere contraseña de áreas privadas)")
    @PutMapping("/organization")
    public GymOrganizationResponse updateMyOrganization(@Valid @RequestBody GymOrganizationUpdateRequest request) {
        return organizationService.updateGymProfile(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request);
    }

    // --- Usuarios ---
    @Operation(summary = "Crear usuario del gimnasio",
            description = "Crea usuarios del gimnasio actual con uno o más roles (Admin, Recepcionista, Instructor, Miembro). "
                    + "Cada usuario pertenece solo a su organización. Password opcional (default 12345678).")
    @PostMapping("/users")
    public UserCreateResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        return userService.createStaff(SecurityUtils.requireOrganizationId(), request);
    }

    @GetMapping("/users")
    public List<UserResponse> getUsers() {
        return userService.findByOrganization(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/instructors")
    @Operation(summary = "Listar instructores del gimnasio",
            description = "Instructores y admins activos. Pensado para que miembros elijan preferencia en solicitudes.")
    public List<InstructorOptionResponse> getInstructors() {
        return userService.findInstructors(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/users/pending-membership-payment")
    @Operation(summary = "Miembros con membresía pendiente de pago",
            description = "Lista miembros morosos o sin membresía vigente (vencida hace menos de 2 meses).")
    public List<UserResponse> getPendingMembershipPayment() {
        return userService.findPendingMembershipPayment(SecurityUtils.requireOrganizationId());
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Actualizar usuario del gimnasio",
            description = "Actualiza datos de un usuario del gimnasio. Password opcional: si se omite, no cambia.")
    public UserResponse updateUser(@PathVariable Long id, @Valid @RequestBody UserCreateRequest request) {
        return userService.updateStaff(SecurityUtils.requireOrganizationId(), id, request);
    }

    @PostMapping("/users/{id}/resend-registration-form")
    @Operation(summary = "Reenviar formulario de registro por WhatsApp",
            description = "Genera un enlace wa.me con el mensaje y el formulario de registro del miembro.")
    public WhatsappOutboundResponse resendRegistrationForm(@PathVariable Long id) {
        return userService.resendRegistrationForm(SecurityUtils.requireOrganizationId(), id);
    }

    @PostMapping("/users/send-whatsapp-messages-bulk")
    @Operation(summary = "Enviar mensajes de WhatsApp a todos con número",
            description = "Envía plantillas y/o formulario de registro a todos los usuarios activos "
                    + "con WhatsApp. Requiere Cloud API.")
    public WhatsappBulkMessagesOutboundResponse sendWhatsappMessagesBulk(
            @Valid @RequestBody UserWhatsappMessagesRequest request) {
        return userService.sendWhatsappMessagesToAllWithPhone(
                SecurityUtils.requireOrganizationId(), request);
    }

    @PostMapping("/users/send-whatsapp-messages-phone")
    @Operation(summary = "Enviar mensajes de WhatsApp a un número libre",
            description = "Prepara plantillas y/o el formulario de registro público (sin miembro) "
                    + "para un número de WhatsApp (prospecto / pre-inscripción). wa.me o Cloud API.")
    public WhatsappMessagesOutboundResponse sendWhatsappMessagesToPhone(
            @Valid @RequestBody GuestWhatsappMessagesRequest request) {
        return userService.sendWhatsappMessagesToPhone(
                SecurityUtils.requireOrganizationId(), request);
    }

    @PostMapping("/users/{id}/send-whatsapp-messages")
    @Operation(summary = "Enviar mensajes de WhatsApp al miembro",
            description = "Prepara plantillas seleccionadas y/o el formulario de registro (wa.me o Cloud API).")
    public WhatsappMessagesOutboundResponse sendWhatsappMessages(
            @PathVariable Long id,
            @Valid @RequestBody UserWhatsappMessagesRequest request) {
        return userService.sendWhatsappMessages(SecurityUtils.requireOrganizationId(), id, request);
    }

    @GetMapping("/users/me")
    public UserResponse getMyProfile() {
        return userService.getProfile(SecurityUtils.currentUser().getId());
    }

    @PutMapping("/users/me/profile")
    public UserResponse updateMyProfile(@Valid @RequestBody MemberProfileUpdateRequest request) {
        return userService.updateProfile(SecurityUtils.currentUser().getId(), request);
    }

    // --- Membresías ---
    @PostMapping("/packages")
    public MembershipPackageResponse createPackage(@Valid @RequestBody MembershipPackageRequest request) {
        return packageService.create(SecurityUtils.requireOrganizationId(), request);
    }

    @GetMapping("/packages")
    public List<MembershipPackageResponse> getPackages() {
        return packageService.findByOrganization(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/packages/{id}")
    public MembershipPackageResponse getPackage(@PathVariable Long id) {
        return packageService.findById(SecurityUtils.requireOrganizationId(), id);
    }

    @PutMapping("/packages/{id}")
    public MembershipPackageResponse updatePackage(@PathVariable Long id, @Valid @RequestBody MembershipPackageRequest request) {
        return packageService.update(SecurityUtils.requireOrganizationId(), id, request);
    }

    // --- Tienda / Productos ---
    @Operation(summary = "Categorías de productos de la tienda")
    @GetMapping("/product-categories")
    public List<ProductCategoryResponse> listProductCategories() {
        return productService.listCategories(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Crear categoría de producto")
    @PostMapping("/product-categories")
    public ProductCategoryResponse createProductCategory(@Valid @RequestBody ProductCategoryCreateRequest request) {
        return productService.createCategory(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Listar productos de la tienda")
    @GetMapping("/products")
    public List<ProductResponse> listProducts(
            @RequestParam(required = false) List<Long> categoryIds) {
        return productService.listProducts(SecurityUtils.requireOrganizationId(), categoryIds);
    }

    @Operation(summary = "Sugerencias de imagen de producto (búsqueda web / empaque)")
    @GetMapping("/products/image-suggestions")
    public List<ProductImageSuggestionResponse> suggestProductImages(@RequestParam String q) {
        return productService.suggestImages(q);
    }

    @Operation(summary = "Detalle de producto")
    @GetMapping("/products/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.getProduct(SecurityUtils.requireOrganizationId(), id);
    }

    @Operation(summary = "Crear producto")
    @PostMapping("/products")
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        return productService.create(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Actualizar producto")
    @PutMapping("/products/{id}")
    public ProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Eliminar producto (soft delete)")
    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        productService.delete(SecurityUtils.requireOrganizationId(), id);
    }

    // --- Actividades ---
    @GetMapping("/activity-promotions/admin")
    @Operation(summary = "Tres espacios de actividades promocionadas para administración")
    public List<ActivityPromotionResponse> getActivityPromotionSlots() {
        requirePromotionManager();
        return activityPromotionService.getAdminSlots(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/activity-promotions/home")
    @Operation(summary = "Promociones del inicio del miembro",
            description = "Solo actividades configuradas en Mercadeo con fecha próxima. Vacío si no hay ninguna.")
    public List<ActivityPromotionResponse> getActivityHomePromotions() {
        return activityPromotionService.getHomePromotions(SecurityUtils.requireOrganizationId());
    }

    @PutMapping("/activity-promotions/{slotIndex}")
    @Operation(summary = "Configurar un espacio promocional (admin o recepción)")
    public ActivityPromotionResponse saveActivityPromotion(
            @PathVariable int slotIndex,
            @Valid @RequestBody ActivityPromotionRequest request) {
        requirePromotionManager();
        return activityPromotionService.saveSlot(
                SecurityUtils.requireOrganizationId(), slotIndex, request);
    }

    @DeleteMapping("/activity-promotions/{slotIndex}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Vaciar un espacio promocional (admin o recepción)")
    public void clearActivityPromotion(@PathVariable int slotIndex) {
        requirePromotionManager();
        activityPromotionService.clearSlot(SecurityUtils.requireOrganizationId(), slotIndex);
    }

    @PostMapping("/activities")
    public ActivityResponse createActivity(@Valid @RequestBody ActivityRequest request) {
        return activityService.create(SecurityUtils.requireOrganizationId(), request);
    }

    @GetMapping("/activities")
    public List<ActivityResponse> getActivities(
            @RequestParam(required = false) java.time.LocalDate from,
            @RequestParam(required = false) java.time.LocalDate to,
            @RequestParam(required = false, defaultValue = "false") boolean series,
            @RequestParam(required = false, defaultValue = "active") String status) {
        Long orgId = SecurityUtils.requireOrganizationId();
        if (series) {
            return "cancelled".equalsIgnoreCase(status)
                    ? activityService.findCancelledSeries(orgId)
                    : activityService.findSeries(orgId);
        }
        return activityService.findByOrganization(orgId, from, to);
    }

    @GetMapping("/activities/{id}")
    public ActivityResponse getActivity(@PathVariable Long id) {
        return activityService.findById(SecurityUtils.requireOrganizationId(), id);
    }

    @PutMapping("/activities/{id}")
    public ActivityResponse updateActivity(@PathVariable Long id, @Valid @RequestBody ActivityRequest request) {
        return activityService.update(SecurityUtils.requireOrganizationId(), id, request);
    }

    @PostMapping("/activities/{id}/reservation-impact/preview")
    @Operation(summary = "Vista previa de reservaciones afectadas al editar")
    public ActivityReservationImpactResponse previewActivityUpdateImpact(
            @PathVariable Long id,
            @Valid @RequestBody ActivityRequest request) {
        return activityService.previewUpdateImpact(SecurityUtils.requireOrganizationId(), id, request);
    }

    @GetMapping("/activities/{id}/reservation-impact")
    @Operation(summary = "Reservaciones activas antes de eliminar")
    public ActivityReservationImpactResponse getActivityDeleteImpact(@PathVariable Long id) {
        return activityService.getDeleteImpact(SecurityUtils.requireOrganizationId(), id);
    }

    @DeleteMapping("/activities/{id}")
    @Operation(summary = "Cancelar actividad por emergencia",
            description = "Desactiva la serie (active=false) mientras siga vigente. No elimina el registro.")
    public void deleteActivity(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean cancelReservations) {
        activityService.delete(SecurityUtils.requireOrganizationId(), id, cancelReservations);
    }

    @GetMapping("/activities/{id}/cancel-impact")
    @Operation(summary = "Reservaciones afectadas al cancelar",
            description = "scope=OCCURRENCE solo la fecha indicada; scope=SERIES toda la actividad.")
    public ActivityReservationImpactResponse getActivityCancelImpact(
            @PathVariable Long id,
            @RequestParam java.time.LocalDate occurrenceDate,
            @RequestParam String scope) {
        return activityService.getCancelImpact(
                SecurityUtils.requireOrganizationId(), id, occurrenceDate, scope);
    }

    @PostMapping("/activities/{id}/occurrence-cancel")
    @Operation(summary = "Cancelar ocurrencia o serie",
            description = "scope=OCCURRENCE cancela solo la fecha; scope=SERIES desactiva toda la actividad.")
    public void cancelActivityOccurrence(
            @PathVariable Long id,
            @Valid @RequestBody com.gymplatform.dto.ActivityOccurrenceCancelRequest request) {
        activityService.cancelOccurrence(SecurityUtils.requireOrganizationId(), id, request);
    }

    @PostMapping("/activities/{id}/occurrence-restore")
    @Operation(summary = "Reactivar ocurrencia o serie cancelada",
            description = "scope=OCCURRENCE reactiva solo la fecha; scope=SERIES reactiva toda la actividad.")
    public void restoreActivityOccurrence(
            @PathVariable Long id,
            @Valid @RequestBody com.gymplatform.dto.ActivityOccurrenceScopeRequest request) {
        activityService.restoreOccurrence(SecurityUtils.requireOrganizationId(), id, request);
    }

    @PostMapping("/activities/{id}/occurrence-delete")
    @Operation(summary = "Eliminar ocurrencia o serie del calendario",
            description = "scope=OCCURRENCE oculta solo la fecha; scope=SERIES elimina la actividad por completo.")
    public void deleteActivityOccurrence(
            @PathVariable Long id,
            @Valid @RequestBody com.gymplatform.dto.ActivityOccurrenceScopeRequest request) {
        activityService.deleteOccurrence(SecurityUtils.requireOrganizationId(), id, request);
    }

    @PostMapping("/activities/{id}/restore")
    @Operation(summary = "Reactivar actividad cancelada por emergencia",
            description = "Solo actividades vigentes (endDate >= hoy). Las vencidas se eliminan automáticamente.")
    public ActivityResponse restoreActivity(@PathVariable Long id) {
        return activityService.restore(SecurityUtils.requireOrganizationId(), id);
    }

    @PutMapping("/activities/{id}/occurrence-edit")
    @Operation(summary = "Editar ocurrencia desde calendario",
            description = "scope=OCCURRENCE aplica solo a la fecha; scope=SERIES actualiza toda la serie.")
    public ActivityResponse editActivityOccurrence(
            @PathVariable Long id,
            @Valid @RequestBody ActivityOccurrenceEditRequest request) {
        return activityService.editOccurrence(SecurityUtils.requireOrganizationId(), id, request);
    }

    private void requirePromotionManager() {
        var user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new com.gymplatform.exception.BusinessException(
                    "Solo administración o recepción pueden gestionar actividades promocionadas");
        }
    }

    // --- Reservaciones ---
    @PostMapping("/activities/{activityId}/reservations")
    public ReservationResponse createReservation(
            @PathVariable Long activityId,
            @RequestBody(required = false) ReservationCreateRequest request) {
        return reservationService.create(activityId, SecurityUtils.currentUser().getId(), request);
    }

    @PostMapping("/reservations/{id}/confirm")
    public ReservationResponse confirmReservation(@PathVariable Long id) {
        return reservationService.confirm(id);
    }

    @PostMapping("/reservations/{id}/cancel")
    public ReservationResponse cancelReservation(@PathVariable Long id) {
        return reservationService.cancel(id);
    }

    @GetMapping("/reservations/me")
    public List<ReservationResponse> myReservations() {
        return reservationService.findByMember(SecurityUtils.currentUser().getId());
    }

    @GetMapping("/reservations/pending-payment")
    @Operation(summary = "Reservaciones con pago pendiente", description = "Lista reservaciones que requieren pago en recepción.")
    public List<ReservationResponse> pendingPaymentReservations() {
        return reservationService.findPendingPayments(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/activities/{activityId}/reservations")
    public List<ReservationResponse> activityReservations(@PathVariable Long activityId) {
        return reservationService.findByActivity(activityId);
    }

    @PostMapping("/reservations/{id}/mark-paid")
    @Operation(summary = "Marcar reservación como pagada", description = "Recepción marca el pago antes de confirmar la reservación.")
    public ReservationResponse markReservationPaid(@PathVariable Long id) {
        return reservationService.markPaid(id);
    }

    @GetMapping("/sales")
    @Operation(summary = "Ventas registradas", description = "Pagos de actividades marcados en recepción.")
    public List<SaleResponse> getSales() {
        return gymStatsService.findSales(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/stats/summary")
    @Operation(summary = "Estadísticas del gimnasio")
    public GymStatsResponse getStatsSummary() {
        return gymStatsService.getSummary(SecurityUtils.requireOrganizationId());
    }

    @GetMapping("/users/me/membership-usage")
    public MembershipUsageResponse myMembershipUsage() {
        return memberSubscriptionService.getUsage(SecurityUtils.currentUser().getId());
    }

    @PostMapping("/users/{userId}/membership")
    public void assignMembership(@PathVariable Long userId, @RequestBody java.util.Map<String, Long> body) {
        Long packageId = body.get("membershipPackageId");
        if (packageId == null) {
            throw new com.gymplatform.exception.BusinessException("membershipPackageId es requerido");
        }
        memberSubscriptionService.assignMembership(SecurityUtils.requireOrganizationId(), userId, packageId);
    }

    // --- Rutinas ---
    @Operation(summary = "Catálogo de ejercicios")
    @GetMapping("/exercises")
    public List<ExerciseResponse> getExercises(
            @RequestParam(required = false) com.gymplatform.domain.enums.MuscleGroup muscleGroup) {
        return exerciseCatalogService.findAll(muscleGroup);
    }

    @Operation(summary = "Agregar ejercicio al catálogo")
    @PostMapping("/exercises")
    public ExerciseResponse createExercise(@Valid @RequestBody ExerciseCreateRequest request) {
        return exerciseCatalogService.create(request);
    }

    @Operation(summary = "Eliminar ejercicio del catálogo")
    @DeleteMapping("/exercises/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExercise(@PathVariable Long id) {
        exerciseCatalogService.delete(id);
    }

    // --- Foros ---
    @Operation(summary = "Listar foros")
    @GetMapping("/forums")
    public List<ForumResponse> listForums() {
        return forumService.listForums();
    }

    @Operation(summary = "Listar temas de un foro")
    @GetMapping("/forums/{slug}/topics")
    public List<ForumTopicSummaryResponse> listForumTopics(
            @PathVariable String slug,
            @RequestParam(required = false) com.gymplatform.domain.enums.MuscleGroup muscleGroup) {
        return forumService.listTopics(slug, muscleGroup);
    }

    @Operation(summary = "Detalle de un tema del foro")
    @GetMapping("/forums/topics/{topicId}")
    public ForumTopicDetailResponse getForumTopic(@PathVariable Long topicId) {
        return forumService.getTopic(topicId);
    }

    @Operation(summary = "Guía de foro por ejercicio del catálogo")
    @GetMapping("/forums/exercises/by-exercise/{exerciseId}")
    public ForumTopicDetailResponse getForumTopicByExercise(@PathVariable Long exerciseId) {
        return forumService.getTopicByExerciseId(exerciseId);
    }

    @PostMapping("/routine-templates")
    public RoutineTemplateResponse createTemplate(@Valid @RequestBody RoutineTemplateRequest request) {
        var user = SecurityUtils.currentUser();
        return routineService.createTemplate(SecurityUtils.requireOrganizationId(), user.getId(), request);
    }

    @GetMapping("/routine-templates")
    public List<RoutineTemplateResponse> getTemplates() {
        return routineService.findTemplates(SecurityUtils.requireOrganizationId());
    }

    @PutMapping("/routine-templates/{id}")
    @Operation(summary = "Actualizar plantilla de rutina")
    public RoutineTemplateResponse updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody RoutineTemplateRequest request) {
        return routineService.updateTemplate(SecurityUtils.requireOrganizationId(), id, request);
    }

    @PostMapping("/routines")
    public RoutineResponse createRoutine(@Valid @RequestBody CreateRoutineRequest request) {
        var user = SecurityUtils.currentUser();
        return routineService.createRoutine(SecurityUtils.requireOrganizationId(), user.getId(), request);
    }

    @PostMapping("/routines/assign-template")
    public List<RoutineResponse> assignTemplate(@Valid @RequestBody AssignTemplateRequest request) {
        var user = SecurityUtils.currentUser();
        return routineService.assignTemplate(SecurityUtils.requireOrganizationId(), user.getId(), request);
    }

    @GetMapping("/routines/me")
    public List<RoutineResponse> myRoutines() {
        return routineService.findByMember(SecurityUtils.currentUser().getId());
    }

    @Operation(summary = "Listar rutinas del gimnasio (staff)")
    @GetMapping("/routines")
    public List<RoutineResponse> getRoutines() {
        return routineService.findByOrganization(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Rutinas de un miembro (staff)")
    @GetMapping("/routines/member/{memberId}")
    public List<RoutineResponse> getMemberRoutines(@PathVariable Long memberId) {
        return routineService.findByMember(memberId);
    }

    @Operation(summary = "Crear rutina personalizada y completar solicitud")
    @PostMapping("/routine-requests/{id}/fulfill")
    public RoutineResponse fulfillRoutineRequest(
            @PathVariable Long id,
            @Valid @RequestBody FulfillRoutineRequest request) {
        var user = SecurityUtils.currentUser();
        return routineService.fulfillRequest(
                SecurityUtils.requireOrganizationId(), user.getId(), id, request);
    }

    @Operation(summary = "Guardar progreso de rutina (solicitud En progreso)")
    @PostMapping("/routine-requests/{id}/draft")
    public RoutineRequestResponse saveRoutineRequestDraft(
            @PathVariable Long id,
            @Valid @RequestBody SaveRoutineDraftRequest request) {
        var user = SecurityUtils.currentUser();
        return routineService.saveRequestDraft(
                SecurityUtils.requireOrganizationId(), user.getId(), id, request);
    }

    @Operation(summary = "Contexto del miembro para generar rutina (datos ya conocidos)")
    @GetMapping("/routines/generate/context")
    public RoutineGenerationContextResponse getRoutineGenerationContext(
            @RequestParam Long memberId,
            @RequestParam(required = false) Long routineRequestId) {
        return routineGenerationService.getContext(
                SecurityUtils.requireOrganizationId(), memberId, routineRequestId);
    }

    @Operation(summary = "Generar plan de rutina automático (no guarda; el instructor confirma en el builder)")
    @PostMapping("/routines/generate")
    public GeneratedRoutinePlanResponse generateRoutine(@Valid @RequestBody GenerateRoutineRequest request) {
        return routineGenerationService.generate(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Detalle de rutina (staff, incluye borradores inactivos)")
    @GetMapping("/routines/{id}")
    public RoutineResponse getRoutine(@PathVariable Long id) {
        return routineService.getRoutineForStaff(SecurityUtils.requireOrganizationId(), id);
    }

    @PostMapping("/routine-requests")
    public RoutineRequestResponse createRoutineRequest(@Valid @RequestBody RoutineRequestCreate request) {
        return routineService.createRequest(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request
        );
    }

    @GetMapping("/routine-requests")
    @Operation(summary = "Listar solicitudes de rutina",
            description = "Staff ve todas las del gimnasio. El miembro solo ve las propias. "
                    + "Con assignedToMe=true el instructor ve las que lo eligieron de preferencia.")
    public List<RoutineRequestResponse> getRoutineRequests(
            @RequestParam(required = false, defaultValue = "false") boolean assignedToMe) {
        Long orgId = SecurityUtils.requireOrganizationId();
        var current = SecurityUtils.currentUser();
        if (assignedToMe) {
            return routineService.findRequestsAssignedToInstructor(orgId, current.getId());
        }
        // Miembro sin rol de staff: solo sus solicitudes
        if (current.hasRole("MEMBER")
                && !current.hasRole("GYM_OWNER")
                && !current.hasRole("INSTRUCTOR")
                && !current.hasRole("RECEPTIONIST")) {
            return routineService.findRequestsByMember(current.getId());
        }
        return routineService.findRequests(orgId);
    }

    @Operation(summary = "Asignar plantilla y completar solicitud")
    @PostMapping("/routine-requests/{id}/assign-template")
    public RoutineResponse assignTemplateToRequest(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequestTemplateRequest request) {
        var user = SecurityUtils.currentUser();
        return routineService.assignTemplateToRequest(
                SecurityUtils.requireOrganizationId(), user.getId(), id, request);
    }

    @PutMapping("/routine-requests/{id}/status")
    public RoutineRequestResponse updateRoutineRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody RoutineRequestStatusUpdate request) {
        return routineService.updateRequestStatus(
                id,
                request.status(),
                SecurityUtils.currentUser().getId()
        );
    }

    @Operation(summary = "Crear solicitud de cita (medición, nutrición, rutina o consulta)")
    @PostMapping("/appointment-requests")
    public AppointmentRequestResponse createAppointmentRequest(@Valid @RequestBody AppointmentRequestCreate request) {
        var current = SecurityUtils.currentUser();
        Long memberId = current.getId();
        if (request.memberId() != null) {
            if (!current.hasRole("GYM_OWNER") && !current.hasRole("INSTRUCTOR") && !current.hasRole("RECEPTIONIST")) {
                throw new com.gymplatform.exception.BusinessException("No autorizado para crear citas en nombre de otro miembro");
            }
            memberId = request.memberId();
        }
        return appointmentRequestService.create(
                SecurityUtils.requireOrganizationId(),
                memberId,
                request
        );
    }

    @Operation(summary = "Listar solicitudes de cita del gimnasio (staff)")
    @GetMapping("/appointment-requests")
    public List<AppointmentRequestResponse> getAppointmentRequests(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false, defaultValue = "false") boolean preferredToMe) {
        return appointmentRequestService.findForOrganization(
                SecurityUtils.requireOrganizationId(),
                from,
                to,
                preferredToMe,
                SecurityUtils.currentUser().getId());
    }

    @Operation(summary = "Mis solicitudes de cita")
    @GetMapping("/appointment-requests/me")
    public List<AppointmentRequestResponse> getMyAppointmentRequests(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return appointmentRequestService.findForMember(
                SecurityUtils.currentUser().getId(),
                SecurityUtils.requireOrganizationId(),
                from,
                to);
    }

    @Operation(summary = "Aceptar / confirmar solicitud de cita")
    @PutMapping("/appointment-requests/{id}/accept")
    public AppointmentRequestResponse acceptAppointmentRequest(
            @PathVariable Long id,
            @RequestBody(required = false) AppointmentRequestScheduleUpdate request) {
        return appointmentRequestService.accept(
                id,
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request);
    }

    @Operation(summary = "Rechazar solicitud de cita")
    @PutMapping("/appointment-requests/{id}/reject")
    public AppointmentRequestResponse rejectAppointmentRequest(@PathVariable Long id) {
        return appointmentRequestService.reject(id, SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Actualizar horario de una cita")
    @PutMapping("/appointment-requests/{id}/schedule")
    public AppointmentRequestResponse updateAppointmentSchedule(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequestScheduleUpdate request) {
        return appointmentRequestService.updateSchedule(
                id,
                SecurityUtils.requireOrganizationId(),
                request);
    }

    @Operation(summary = "Actualizar estado de solicitud de cita")
    @PutMapping("/appointment-requests/{id}/status")
    public AppointmentRequestResponse updateAppointmentRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequestStatusUpdate request) {
        return appointmentRequestService.updateStatus(
                id,
                SecurityUtils.requireOrganizationId(),
                request.status()
        );
    }

    @Operation(summary = "Listar disponibilidad del gimnasio para citas")
    @GetMapping("/staff-availability/me")
    public List<StaffAvailabilityResponse> getMyStaffAvailability(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return staffAvailabilityService.findForOrganization(
                SecurityUtils.requireOrganizationId(),
                from,
                to);
    }

    @Operation(summary = "Crear bloque de disponibilidad del gimnasio")
    @PostMapping("/staff-availability/me")
    public StaffAvailabilityResponse createMyStaffAvailability(
            @Valid @RequestBody StaffAvailabilityCreate request) {
        return staffAvailabilityService.create(
                SecurityUtils.requireOrganizationId(),
                request);
    }

    @Operation(summary = "Crear disponibilidad del gimnasio en rango de fechas (fecha final opcional)")
    @PostMapping("/staff-availability/me/range")
    public StaffAvailabilityRangeResponse createMyStaffAvailabilityRange(
            @Valid @RequestBody StaffAvailabilityRangeCreate request) {
        return staffAvailabilityService.createRange(
                SecurityUtils.requireOrganizationId(),
                request);
    }

    @Operation(summary = "Eliminar bloque de disponibilidad del gimnasio")
    @DeleteMapping("/staff-availability/me/{id}")
    public void deleteMyStaffAvailability(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean cancelReserved) {
        staffAvailabilityService.delete(
                SecurityUtils.requireOrganizationId(),
                id,
                cancelReserved);
    }

    @Operation(summary = "Actualizar bloque de disponibilidad del gimnasio")
    @PutMapping("/staff-availability/me/{id}")
    public StaffAvailabilityResponse updateMyStaffAvailability(
            @PathVariable Long id,
            @Valid @RequestBody StaffAvailabilityUpdate request) {
        return staffAvailabilityService.update(
                SecurityUtils.requireOrganizationId(),
                id,
                request);
    }

    @Operation(summary = "Actualizar rango contiguo de disponibilidad (mismo horario en días consecutivos)")
    @PutMapping("/staff-availability/me/{id}/range")
    public StaffAvailabilityRangeMutationResponse updateMyStaffAvailabilityRange(
            @PathVariable Long id,
            @Valid @RequestBody StaffAvailabilityRangeUpdate request) {
        return staffAvailabilityService.updateRange(
                SecurityUtils.requireOrganizationId(),
                id,
                request);
    }

    @Operation(summary = "Eliminar rango contiguo de disponibilidad")
    @DeleteMapping("/staff-availability/me/{id}/range")
    public StaffAvailabilityRangeMutationResponse deleteMyStaffAvailabilityRange(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean cancelReserved) {
        return staffAvailabilityService.deleteRange(
                SecurityUtils.requireOrganizationId(),
                id,
                cancelReserved);
    }

    @Operation(summary = "Cancelar todas las citas abiertas de un bloque de disponibilidad")
    @PostMapping("/staff-availability/me/{id}/cancel-appointments")
    public int cancelAvailabilityAppointments(@PathVariable Long id) {
        return staffAvailabilityService.cancelOpenAppointmentsForAvailability(
                SecurityUtils.requireOrganizationId(),
                id);
    }

    @Operation(summary = "Cancelar citas abiertas en todo el rango contiguo de disponibilidad")
    @PostMapping("/staff-availability/me/{id}/range/cancel-appointments")
    public int cancelAvailabilityRangeAppointments(@PathVariable Long id) {
        return staffAvailabilityService.cancelOpenAppointmentsForRange(
                SecurityUtils.requireOrganizationId(),
                id);
    }

    @Operation(summary = "Marcar un espacio de disponibilidad como no disponible")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping("/staff-availability/me/{id}/block-slot")
    public void blockMyStaffAvailabilitySlot(
            @PathVariable Long id,
            @Valid @RequestBody StaffAvailabilityBlockSlotRequest request) {
        staffAvailabilityService.blockSlot(
                SecurityUtils.requireOrganizationId(),
                id,
                request.startTime(),
                request.endTime());
    }

    @Operation(summary = "Reactivar un espacio marcado como no disponible")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping("/staff-availability/me/{id}/unblock-slot")
    public void unblockMyStaffAvailabilitySlot(
            @PathVariable Long id,
            @Valid @RequestBody StaffAvailabilityBlockSlotRequest request) {
        staffAvailabilityService.unblockSlot(
                SecurityUtils.requireOrganizationId(),
                id,
                request.startTime(),
                request.endTime());
    }

    @Operation(summary = "Horarios disponibles del gimnasio para solicitar citas")
    @GetMapping("/staff-availability/slots")
    public List<AvailableSlotResponse> getStaffAvailableSlots(@RequestParam LocalDate date) {
        return staffAvailabilityService.getAvailableSlots(
                SecurityUtils.requireOrganizationId(),
                date);
    }

    // --- Medidas corporales ---

    @Operation(summary = "Registrar medidas corporales de un miembro",
            description = "Instructor o personal autorizado registra peso, altura, circunferencias y obtiene análisis calculado.")
    @PostMapping("/body-measurements")
    public BodyMeasurementResponse createBodyMeasurement(@Valid @RequestBody BodyMeasurementCreateRequest request) {
        return bodyMeasurementService.create(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request);
    }

    @Operation(summary = "Vista previa del análisis sin guardar",
            description = "Calcula IMC, grasa corporal estimada y recomendaciones antes de confirmar la medición.")
    @PostMapping("/body-measurements/preview")
    public BodyMeasurementResponse previewBodyMeasurement(@Valid @RequestBody BodyMeasurementCreateRequest request) {
        return bodyMeasurementService.analyzePreview(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Historial de medidas de un miembro")
    @GetMapping("/body-measurements/member/{memberId}")
    public List<BodyMeasurementResponse> getMemberBodyMeasurements(@PathVariable Long memberId) {
        return bodyMeasurementService.findByMember(
                SecurityUtils.requireOrganizationId(),
                memberId,
                SecurityUtils.currentUser().getId());
    }

    @Operation(summary = "Mis medidas corporales")
    @GetMapping("/body-measurements/me")
    public List<BodyMeasurementResponse> getMyBodyMeasurements() {
        return bodyMeasurementService.findMine(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId());
    }

    @Operation(summary = "Detalle de una medición")
    @GetMapping("/body-measurements/{id}")
    public BodyMeasurementResponse getBodyMeasurement(@PathVariable Long id) {
        return bodyMeasurementService.findById(
                SecurityUtils.requireOrganizationId(),
                id,
                SecurityUtils.currentUser().getId());
    }

    // --- Planes nutricionales ---

    @Operation(summary = "Crear plan nutricional para un miembro")
    @PostMapping("/nutrition-plans")
    public NutritionPlanResponse createNutritionPlan(@Valid @RequestBody NutritionPlanCreateRequest request) {
        return nutritionPlanService.create(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request);
    }

    @Operation(summary = "Actualizar plan nutricional")
    @PutMapping("/nutrition-plans/{id}")
    public NutritionPlanResponse updateNutritionPlan(@PathVariable Long id,
                                                     @Valid @RequestBody NutritionPlanCreateRequest request) {
        return nutritionPlanService.update(SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Archivar plan nutricional")
    @PostMapping("/nutrition-plans/{id}/archive")
    public NutritionPlanResponse archiveNutritionPlan(@PathVariable Long id) {
        return nutritionPlanService.archive(SecurityUtils.requireOrganizationId(), id);
    }

    @Operation(summary = "Planes activos del gimnasio")
    @GetMapping("/nutrition-plans/active")
    public List<NutritionPlanResponse> getActiveNutritionPlans() {
        return nutritionPlanService.findActiveByOrganization(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Planes nutricionales de un miembro")
    @GetMapping("/nutrition-plans/member/{memberId}")
    public List<NutritionPlanResponse> getMemberNutritionPlans(@PathVariable Long memberId) {
        return nutritionPlanService.findByMember(
                SecurityUtils.requireOrganizationId(),
                memberId,
                SecurityUtils.currentUser().getId());
    }

    @Operation(summary = "Mis planes nutricionales")
    @GetMapping("/nutrition-plans/me")
    public List<NutritionPlanResponse> getMyNutritionPlans() {
        return nutritionPlanService.findMine(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId());
    }

    @Operation(summary = "Detalle de un plan nutricional")
    @GetMapping("/nutrition-plans/{id}")
    public NutritionPlanResponse getNutritionPlan(@PathVariable Long id) {
        return nutritionPlanService.findById(
                SecurityUtils.requireOrganizationId(),
                id,
                SecurityUtils.currentUser().getId());
    }

    // --- WhatsApp (wa.me / Cloud API) ---

    @Operation(summary = "Configuración de canal WhatsApp")
    @GetMapping("/broadcast/settings/{channel}")
    public BroadcastChannelSettingsResponse getBroadcastChannelSettings(@PathVariable BroadcastChannel channel) {
        return broadcastSettingsService.getChannelSettings(SecurityUtils.requireOrganizationId(), channel);
    }

    @Operation(summary = "Actualizar configuración de canal WhatsApp")
    @PutMapping("/broadcast/settings/{channel}")
    public BroadcastChannelSettingsResponse updateBroadcastChannelSettings(
            @PathVariable BroadcastChannel channel,
            @Valid @RequestBody BroadcastChannelSettingsRequest request) {
        return broadcastSettingsService.updateChannelSettings(
                SecurityUtils.requireOrganizationId(), channel, request);
    }

    @Operation(summary = "Plantillas de mensajes WhatsApp")
    @GetMapping("/broadcast/templates/{channel}")
    public List<BroadcastMessageTemplateResponse> getBroadcastTemplates(
            @PathVariable BroadcastChannel channel,
            @RequestParam(required = false) BroadcastTemplatePurpose purpose) {
        return broadcastSettingsService.listTemplates(SecurityUtils.requireOrganizationId(), channel, purpose);
    }

    @Operation(summary = "Crear plantilla de mensaje")
    @PostMapping("/broadcast/templates/{channel}")
    @ResponseStatus(HttpStatus.CREATED)
    public BroadcastMessageTemplateResponse createBroadcastTemplate(
            @PathVariable BroadcastChannel channel,
            @Valid @RequestBody BroadcastMessageTemplateRequest request) {
        return broadcastSettingsService.createTemplate(
                SecurityUtils.requireOrganizationId(), channel, request);
    }

    @Operation(summary = "Actualizar plantilla de mensaje")
    @PutMapping("/broadcast/templates/{channel}/{id}")
    public BroadcastMessageTemplateResponse updateBroadcastTemplate(
            @PathVariable BroadcastChannel channel,
            @PathVariable Long id,
            @Valid @RequestBody BroadcastMessageTemplateRequest request) {
        return broadcastSettingsService.updateTemplate(
                SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Eliminar plantilla de mensaje")
    @DeleteMapping("/broadcast/templates/{channel}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBroadcastTemplate(@PathVariable BroadcastChannel channel, @PathVariable Long id) {
        broadcastSettingsService.deleteTemplate(SecurityUtils.requireOrganizationId(), id);
    }

    @Operation(summary = "Cloud API: enviar texto",
            description = "Equivalente a Send Text Message del Postman collection (POST /{Phone-Number-ID}/messages).")
    @PostMapping("/whatsapp/cloud/send-text")
    public WhatsAppCloudSendResponse sendWhatsAppCloudText(
            @Valid @RequestBody WhatsAppCloudSendTextRequest request) {
        Long orgId = SecurityUtils.requireOrganizationId();
        boolean preview = request.previewUrl() == null || Boolean.TRUE.equals(request.previewUrl());
        String messageId = whatsAppCloudApiService.sendText(orgId, request.to(), request.body(), preview);
        return new WhatsAppCloudSendResponse(messageId, null);
    }

    @Operation(summary = "Cloud API: enviar documento",
            description = "Por URL pública o subiendo base64 a /media y enviando por ID (Postman: Send Document / Upload Media).")
    @PostMapping("/whatsapp/cloud/send-document")
    public WhatsAppCloudSendResponse sendWhatsAppCloudDocument(
            @Valid @RequestBody WhatsAppCloudSendDocumentRequest request) {
        Long orgId = SecurityUtils.requireOrganizationId();
        boolean hasUrl = request.documentUrl() != null && !request.documentUrl().isBlank();
        boolean hasFile = request.fileBase64() != null && !request.fileBase64().isBlank();
        if (!hasUrl && !hasFile) {
            throw new com.gymplatform.exception.BusinessException(
                    "Indica documentUrl o fileBase64 para enviar el archivo");
        }
        if (hasFile) {
            byte[] bytes = whatsAppCloudApiService.decodeBase64File(request.fileBase64());
            var result = whatsAppCloudApiService.sendDocumentUpload(
                    orgId,
                    request.to(),
                    bytes,
                    request.filename(),
                    request.mimeType(),
                    request.caption());
            return new WhatsAppCloudSendResponse(result.messageId(), result.mediaId());
        }
        String messageId = whatsAppCloudApiService.sendDocumentByLink(
                orgId,
                request.to(),
                request.documentUrl(),
                request.filename(),
                request.caption());
        return new WhatsAppCloudSendResponse(messageId, null);
    }

    // --- Formularios ---

    @Operation(summary = "Listar formularios del gimnasio")
    @GetMapping("/forms")
    public List<CustomFormResponse> getForms(@RequestParam(required = false) Long templateFolderId) {
        return customFormService.listForms(SecurityUtils.requireOrganizationId(), templateFolderId);
    }

    @Operation(summary = "Obtener formulario")
    @GetMapping("/forms/{id}")
    public CustomFormResponse getForm(@PathVariable Long id) {
        return customFormService.getForm(SecurityUtils.requireOrganizationId(), id);
    }

    @Operation(summary = "Crear formulario")
    @PostMapping("/forms")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomFormResponse createForm(@Valid @RequestBody CustomFormRequest request) {
        return customFormService.createForm(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Actualizar formulario")
    @PutMapping("/forms/{id}")
    public CustomFormResponse updateForm(@PathVariable Long id, @Valid @RequestBody CustomFormRequest request) {
        return customFormService.updateForm(SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Eliminar formulario")
    @DeleteMapping("/forms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteForm(@PathVariable Long id) {
        customFormService.deleteForm(SecurityUtils.requireOrganizationId(), id);
    }

    @Operation(summary = "Enviar respuestas de formulario (usuarios autenticados)")
    @PostMapping("/forms/{id}/submit")
    @ResponseStatus(HttpStatus.CREATED)
    public FormSubmissionResponse submitForm(@PathVariable Long id, @Valid @RequestBody FormSubmissionRequest request) {
        return customFormService.submitAuthenticatedForm(SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Listar carpetas de formularios")
    @GetMapping("/forms/folders")
    public List<FormFolderResponse> getFormFolders(@RequestParam FormFolderKind kind) {
        return formFolderService.listFolders(SecurityUtils.requireOrganizationId(), kind);
    }

    @Operation(summary = "Crear carpeta de formularios")
    @PostMapping("/forms/folders")
    @ResponseStatus(HttpStatus.CREATED)
    public FormFolderResponse createFormFolder(
            @RequestParam FormFolderKind kind,
            @Valid @RequestBody FormFolderRequest request) {
        return formFolderService.createFolder(SecurityUtils.requireOrganizationId(), kind, request);
    }

    @Operation(summary = "Listar respuestas de una carpeta")
    @GetMapping("/forms/response-folders/{folderId}/submissions")
    public List<FormSubmissionDetailResponse> getFormSubmissions(@PathVariable Long folderId) {
        return customFormService.listSubmissions(SecurityUtils.requireOrganizationId(), folderId);
    }

    @Operation(summary = "Expedientes de miembros con formularios completados")
    @GetMapping("/member-files")
    public List<MemberFileUserResponse> getMemberFiles() {
        return memberFileService.listMemberFiles(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Expediente de un miembro")
    @GetMapping("/member-files/users/{userId}")
    public MemberFileUserResponse getMemberFilesForUser(@PathVariable Long userId) {
        return memberFileService.getMemberFilesForUser(SecurityUtils.requireOrganizationId(), userId);
    }

    @Operation(summary = "Detalle de archivo de formulario para PDF")
    @GetMapping("/member-files/users/{userId}/{submissionId}")
    public MemberFileDetailResponse getMemberFileDetail(
            @PathVariable Long userId,
            @PathVariable Long submissionId) {
        return memberFileService.getMemberFileDetail(
                SecurityUtils.requireOrganizationId(), userId, submissionId);
    }
}
