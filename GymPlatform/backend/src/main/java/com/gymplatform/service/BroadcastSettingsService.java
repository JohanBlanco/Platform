package com.gymplatform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.crypto.SecretsCryptoService;
import com.gymplatform.domain.entity.BroadcastChannelSettings;
import com.gymplatform.domain.entity.BroadcastMessageTemplate;
import com.gymplatform.domain.entity.CustomForm;
import com.gymplatform.domain.entity.MembershipPackage;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.BroadcastChannel;
import com.gymplatform.domain.enums.BroadcastTemplatePurpose;
import com.gymplatform.domain.enums.WhatsAppDeliveryMode;
import com.gymplatform.dto.BroadcastChannelSettingsRequest;
import com.gymplatform.dto.BroadcastChannelSettingsResponse;
import com.gymplatform.dto.BroadcastMessageTemplateRequest;
import com.gymplatform.dto.BroadcastMessageTemplateResponse;
import com.gymplatform.dto.WhatsappMessagesOutboundResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.BroadcastChannelSettingsRepository;
import com.gymplatform.repository.BroadcastMessageTemplateRepository;
import com.gymplatform.repository.CustomFormRepository;
import com.gymplatform.repository.MemberSubscriptionRepository;
import com.gymplatform.repository.MembershipPackageRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.util.SecurityUtils;
import com.gymplatform.util.WhatsAppLinkHelper;
import com.gymplatform.util.WhatsAppMessageFormatter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class BroadcastSettingsService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{8,15}$");
    private static final String MESSAGE_SEPARATOR = "\n\n————\n\n";

    private final BroadcastChannelSettingsRepository channelSettingsRepository;
    private final BroadcastMessageTemplateRepository templateRepository;
    private final OrganizationRepository organizationRepository;
    private final MembershipPackageRepository membershipPackageRepository;
    private final MemberSubscriptionRepository memberSubscriptionRepository;
    private final CustomFormRepository customFormRepository;
    private final SecretsCryptoService secretsCryptoService;
    private final ObjectMapper objectMapper;
    private final WhatsAppCloudApiService whatsAppCloudApiService;
    private final String publicBaseUrl;

    public BroadcastSettingsService(
            BroadcastChannelSettingsRepository channelSettingsRepository,
            BroadcastMessageTemplateRepository templateRepository,
            OrganizationRepository organizationRepository,
            MembershipPackageRepository membershipPackageRepository,
            MemberSubscriptionRepository memberSubscriptionRepository,
            CustomFormRepository customFormRepository,
            SecretsCryptoService secretsCryptoService,
            ObjectMapper objectMapper,
            @Lazy WhatsAppCloudApiService whatsAppCloudApiService,
            @Value("${app.public-base-url}") String publicBaseUrl) {
        this.channelSettingsRepository = channelSettingsRepository;
        this.templateRepository = templateRepository;
        this.organizationRepository = organizationRepository;
        this.membershipPackageRepository = membershipPackageRepository;
        this.memberSubscriptionRepository = memberSubscriptionRepository;
        this.customFormRepository = customFormRepository;
        this.secretsCryptoService = secretsCryptoService;
        this.objectMapper = objectMapper;
        this.whatsAppCloudApiService = whatsAppCloudApiService;
        this.publicBaseUrl = publicBaseUrl;
    }

    public BroadcastChannelSettingsResponse getChannelSettings(Long organizationId, BroadcastChannel channel) {
        requireConfigRole();
        return toSettingsResponse(getOrCreateSettings(organizationId, channel));
    }

    @Transactional
    public BroadcastChannelSettingsResponse updateChannelSettings(
            Long organizationId,
            BroadcastChannel channel,
            BroadcastChannelSettingsRequest request) {
        requireConfigRole();
        BroadcastChannelSettings settings = getOrCreateSettings(organizationId, channel);

        WhatsAppDeliveryMode mode = request.deliveryMode() != null
                ? request.deliveryMode()
                : settings.getDeliveryMode();
        settings.setDeliveryMode(mode);

        applyNonSecretCloudFields(settings, request);
        applyEncryptedSecrets(settings, request);

        if (Boolean.TRUE.equals(request.enabled())) {
            enableChannel(settings, mode, request);
        } else {
            settings.setEnabled(false);
            settings.setWhatsappWebSessionConfirmed(false);
            if (request.senderPhone() != null && !request.senderPhone().isBlank()) {
                settings.setSenderPhone(normalizePhone(request.senderPhone()));
            }
        }

        settings.setUpdatedAt(Instant.now());
        return toSettingsResponse(channelSettingsRepository.save(settings));
    }

    private void enableChannel(
            BroadcastChannelSettings settings,
            WhatsAppDeliveryMode mode,
            BroadcastChannelSettingsRequest request) {
        if (mode == WhatsAppDeliveryMode.CLOUD_API) {
            if (!settings.hasCloudApiCredentials()) {
                throw new BusinessException(
                        "Configura Phone Number ID y Access Token (Cloud API) antes de activar");
            }
            settings.setWhatsappWebSessionConfirmed(false);
            settings.setEnabled(true);
            if (request.senderPhone() != null && !request.senderPhone().isBlank()) {
                String phone = normalizePhone(request.senderPhone());
                if (!PHONE_PATTERN.matcher(phone).matches()) {
                    throw new BusinessException("El número debe incluir código de país, por ejemplo +50688887777");
                }
                settings.setSenderPhone(phone);
            }
            return;
        }

        // wa.me es envío manual: basta un número válido. La confirmación de sesión es UX, no bloquea el guardado.
        String phoneSource = request.senderPhone() != null && !request.senderPhone().isBlank()
                ? request.senderPhone()
                : settings.getSenderPhone();
        String phone = normalizePhone(phoneSource);
        if (phone == null || phone.isBlank()) {
            throw new BusinessException("Indica el número de WhatsApp para activar los envíos");
        }
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new BusinessException("El número debe incluir código de país, por ejemplo +50688887777");
        }
        settings.setSenderPhone(phone);
        settings.setWhatsappWebSessionConfirmed(true);
        settings.setEnabled(true);
    }

    private void applyNonSecretCloudFields(
            BroadcastChannelSettings settings,
            BroadcastChannelSettingsRequest request) {
        if (request.cloudApiAppId() != null) {
            settings.setCloudApiAppId(blankToNull(request.cloudApiAppId()));
        }
        if (request.cloudApiPhoneNumberId() != null) {
            settings.setCloudApiPhoneNumberId(blankToNull(request.cloudApiPhoneNumberId()));
        }
        if (request.cloudApiWabaId() != null) {
            settings.setCloudApiWabaId(blankToNull(request.cloudApiWabaId()));
        }
        if (request.cloudApiGraphVersion() != null && !request.cloudApiGraphVersion().isBlank()) {
            String version = request.cloudApiGraphVersion().trim();
            if (!version.startsWith("v")) {
                version = "v" + version;
            }
            settings.setCloudApiGraphVersion(version);
        }
    }

    private void applyEncryptedSecrets(
            BroadcastChannelSettings settings,
            BroadcastChannelSettingsRequest request) {
        if (Boolean.TRUE.equals(request.clearAccessToken())) {
            settings.setCloudApiAccessToken(null);
        }
        if (Boolean.TRUE.equals(request.clearAppSecret())) {
            settings.setCloudApiAppSecret(null);
        }
        if (Boolean.TRUE.equals(request.clearVerifyToken())) {
            settings.setCloudApiVerifyToken(null);
        }
        if (request.encryptedSecrets() == null) {
            return;
        }
        Map<String, String> secrets = secretsCryptoService.decryptTransitSecrets(request.encryptedSecrets());
        putSecret(settings::setCloudApiAccessToken, secrets.get("accessToken"));
        putSecret(settings::setCloudApiAppSecret, secrets.get("appSecret"));
        putSecret(settings::setCloudApiVerifyToken, secrets.get("verifyToken"));
    }

    private void putSecret(java.util.function.Consumer<String> setter, String plaintext) {
        if (plaintext == null) {
            return;
        }
        String trimmed = plaintext.trim();
        if (trimmed.isEmpty()) {
            return;
        }
        setter.accept(secretsCryptoService.encryptAtRest(trimmed));
    }

    /** Credenciales descifradas para uso interno (envío Cloud API). */
    public Optional<WhatsAppCloudCredentials> resolveCloudCredentials(Long organizationId) {
        BroadcastChannelSettings settings = getOrCreateSettings(organizationId, BroadcastChannel.WHATSAPP);
        if (settings.getDeliveryMode() != WhatsAppDeliveryMode.CLOUD_API || !settings.hasCloudApiCredentials()) {
            return Optional.empty();
        }
        String token = secretsCryptoService.decryptAtRest(settings.getCloudApiAccessToken());
        return Optional.of(new WhatsAppCloudCredentials(
                token,
                settings.getCloudApiPhoneNumberId(),
                settings.getCloudApiGraphVersion(),
                settings.getCloudApiWabaId(),
                settings.getCloudApiAppId(),
                secretsCryptoService.decryptAtRest(settings.getCloudApiAppSecret()),
                secretsCryptoService.decryptAtRest(settings.getCloudApiVerifyToken())
        ));
    }

    public record WhatsAppCloudCredentials(
            String accessToken,
            String phoneNumberId,
            String graphVersion,
            String wabaId,
            String appId,
            String appSecret,
            String verifyToken
    ) {}

    public List<BroadcastMessageTemplateResponse> listTemplates(
            Long organizationId,
            BroadcastChannel channel,
            BroadcastTemplatePurpose purpose) {
        requireConfigRole();
        List<BroadcastMessageTemplate> templates = purpose != null
                ? templateRepository.findByOrganizationIdAndChannelAndPurposeOrderByNameAsc(
                        organizationId, channel, purpose)
                : templateRepository.findByOrganizationIdAndChannelOrderByNameAsc(organizationId, channel);
        return templates.stream().map(this::toTemplateResponse).toList();
    }

    @Transactional
    public BroadcastMessageTemplateResponse createTemplate(
            Long organizationId,
            BroadcastChannel channel,
            BroadcastMessageTemplateRequest request) {
        requireConfigRole();
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));

        BroadcastMessageTemplate template = new BroadcastMessageTemplate();
        template.setOrganization(org);
        template.setChannel(channel);
        template.setName(request.name().trim());
        template.setBody(request.body().trim());
        template.setPurpose(resolvePurpose(request.purpose()));
        applyTemplateExtras(organizationId, template, request);
        return toTemplateResponse(templateRepository.save(template));
    }

    @Transactional
    public BroadcastMessageTemplateResponse updateTemplate(
            Long organizationId,
            Long templateId,
            BroadcastMessageTemplateRequest request) {
        requireConfigRole();
        BroadcastMessageTemplate template = templateRepository.findByIdAndOrganizationId(templateId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));
        template.setName(request.name().trim());
        template.setBody(request.body().trim());
        template.setPurpose(resolvePurpose(request.purpose()));
        applyTemplateExtras(organizationId, template, request);
        template.setUpdatedAt(Instant.now());
        return toTemplateResponse(templateRepository.save(template));
    }

    private void applyTemplateExtras(
            Long organizationId,
            BroadcastMessageTemplate template,
            BroadcastMessageTemplateRequest request) {
        template.setMembershipPackage(resolveMembershipPackage(organizationId, request.membershipPackageId()));
        template.setMediaLinksJson(serializeMediaLinks(request.mediaLinks()));
    }

    private MembershipPackage resolveMembershipPackage(Long organizationId, Long packageId) {
        if (packageId == null) {
            return null;
        }
        return membershipPackageRepository.findByIdAndOrganizationId(packageId, organizationId)
                .orElseThrow(() -> new BusinessException("Membresía no encontrada"));
    }

    @Transactional
    public void deleteTemplate(Long organizationId, Long templateId) {
        requireConfigRole();
        BroadcastMessageTemplate template = templateRepository.findByIdAndOrganizationId(templateId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));
        templateRepository.delete(template);
    }

    public String requireWelcomeTemplateWhatsappUrl(
            Long organizationId,
            String recipientPhone,
            Long templateId) {
        BroadcastMessageTemplate template = templateRepository.findByIdAndOrganizationId(templateId, organizationId)
                .orElseThrow(() -> new BusinessException("Plantilla de bienvenida no encontrada"));
        if (template.getPurpose() != BroadcastTemplatePurpose.WELCOME) {
            throw new BusinessException("La plantilla seleccionada no es de bienvenida");
        }
        return requireTemplateWhatsappUrl(organizationId, recipientPhone, template.getBody());
    }

    public String requireTemplateWhatsappUrl(
            Long organizationId,
            String recipientPhone,
            String messageBody) {
        BroadcastChannelSettings settings = getOrCreateSettings(organizationId, BroadcastChannel.WHATSAPP);
        if (!settings.isEnabled()) {
            throw new BusinessException("Activa WhatsApp en Configuración → Mensajes de difusión para enviar mensajes");
        }
        if (recipientPhone == null || recipientPhone.isBlank()) {
            throw new BusinessException("El usuario no tiene número de WhatsApp");
        }
        if (messageBody == null || messageBody.isBlank()) {
            throw new BusinessException("El mensaje no puede estar vacío");
        }
        return WhatsAppLinkHelper.buildChatUrl(recipientPhone, messageBody.trim());
    }

    public Optional<String> buildRegistrationFormWhatsappUrl(
            Long organizationId,
            String recipientPhone,
            String recipientFirstName,
            String formTitle,
            String formUrl) {
        BroadcastChannelSettings settings = getOrCreateSettings(organizationId, BroadcastChannel.WHATSAPP);
        if (!settings.isEnabled()) {
            return Optional.empty();
        }
        if (recipientPhone == null || recipientPhone.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(buildRegistrationFormWhatsappUrl(
                recipientPhone,
                recipientFirstName,
                formTitle,
                formUrl));
    }

    public String requireRegistrationFormWhatsappUrl(
            Long organizationId,
            String recipientPhone,
            String recipientFirstName,
            String formTitle,
            String formUrl) {
        BroadcastChannelSettings settings = getOrCreateSettings(organizationId, BroadcastChannel.WHATSAPP);
        if (!settings.isEnabled()) {
            throw new BusinessException(
                    "Activa WhatsApp en Configuración → Mensajes de difusión para enviar el formulario de registro");
        }
        if (recipientPhone == null || recipientPhone.isBlank()) {
            throw new BusinessException("El usuario no tiene número de WhatsApp");
        }
        return buildRegistrationFormWhatsappUrl(
                recipientPhone,
                recipientFirstName,
                formTitle,
                formUrl);
    }

    public String previewRegistrationFormMessage(
            String recipientFirstName,
            String formTitle,
            String formUrl) {
        return buildRegistrationFormMessage(recipientFirstName, formTitle, formUrl);
    }

    public boolean isCloudApiDelivery(Long organizationId) {
        BroadcastChannelSettings settings = getOrCreateSettings(organizationId, BroadcastChannel.WHATSAPP);
        return settings.isEnabled() && settings.getDeliveryMode() == WhatsAppDeliveryMode.CLOUD_API;
    }

    public boolean isWhatsAppEnabled(Long organizationId) {
        return getOrCreateSettings(organizationId, BroadcastChannel.WHATSAPP).isEnabled();
    }

    public record ComposedWhatsAppTemplate(String textBody, List<String> attachmentUrls, String waMeText) {}

    public String composeTemplateMessage(BroadcastMessageTemplate template, String firstName) {
        return composeTemplateMessage(template, firstName, null, null, null);
    }

    public String composeTemplateMessage(
            BroadcastMessageTemplate template,
            String firstName,
            String gymName) {
        Long orgId = template.getOrganization() != null ? template.getOrganization().getId() : null;
        return composeParts(template, firstName, gymName, orgId, null).waMeText();
    }

    public ComposedWhatsAppTemplate composeParts(
            BroadcastMessageTemplate template,
            String firstName,
            String gymName,
            Long organizationId,
            Long memberUserId) {
        String resolvedGym = gymName;
        if ((resolvedGym == null || resolvedGym.isBlank()) && template.getOrganization() != null) {
            resolvedGym = template.getOrganization().getName();
        }
        Long orgId = organizationId;
        if (orgId == null && template.getOrganization() != null) {
            orgId = template.getOrganization().getId();
        }
        final Long formOrgId = orgId;
        final String orgSlug = formOrgId != null
                ? organizationRepository.findById(formOrgId).map(Organization::getSlug).orElse(null)
                : null;

        WhatsAppMessageFormatter.FormattedWhatsAppMessage formatted =
                WhatsAppMessageFormatter.formatFully(
                        template.getBody(),
                        firstName,
                        resolvedGym,
                        slug -> resolveFormPublicUrl(formOrgId, orgSlug, slug, memberUserId));

        List<String> mediaLinks = new ArrayList<>(parseMediaLinks(template.getMediaLinksJson()));
        mediaLinks.addAll(formatted.mediaUrls());
        // Adjuntos (imagen/archivo) fuera del texto; en wa.me van como links azules al final
        List<String> attachments = mediaLinks.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
        String waMe = WhatsAppMessageFormatter.appendMediaLinks(formatted.body(), attachments);
        return new ComposedWhatsAppTemplate(formatted.body(), attachments, waMe);
    }

    private String composeTemplateMessage(
            BroadcastMessageTemplate template,
            String firstName,
            String gymName,
            Long organizationId,
            Long memberUserId) {
        return composeParts(template, firstName, gymName, organizationId, memberUserId).waMeText();
    }

    private String resolveFormPublicUrl(Long orgId, String orgSlug, String formSlug, Long memberUserId) {
        if (orgId == null || orgSlug == null || orgSlug.isBlank() || formSlug == null || formSlug.isBlank()) {
            return null;
        }
        Optional<CustomForm> form = customFormRepository.findByOrganizationIdAndSlug(orgId, formSlug);
        if (form.isEmpty()) {
            return null;
        }
        String base = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
        String url = base + "/f/" + orgSlug + "/" + form.get().getSlug();
        if (memberUserId != null) {
            url += "?m=" + memberUserId;
        }
        return url;
    }

    public Optional<BroadcastMessageTemplate> findWelcomeForPackage(Long orgId, Long packageId) {
        if (packageId == null) {
            return Optional.empty();
        }
        return templateRepository.findFirstByOrganizationIdAndChannelAndMembershipPackageIdAndPurpose(
                orgId, BroadcastChannel.WHATSAPP, packageId, BroadcastTemplatePurpose.WELCOME);
    }

    /**
     * Prepara mensajes de plantillas + formulario de registro para wa.me o Cloud API.
     */
    public WhatsappMessagesOutboundResponse prepareMemberWhatsappMessages(
            Long orgId,
            User user,
            boolean sendRegistrationForm,
            List<Long> templateIds,
            String registrationMessageOrNull) {
        String phone = user.getWhatsappPhone();
        if (phone == null || phone.isBlank()) {
            throw new BusinessException("El usuario no tiene número de WhatsApp");
        }
        return prepareWhatsappMessages(
                orgId,
                phone,
                user.getFirstName(),
                user.getId(),
                user,
                sendRegistrationForm,
                templateIds,
                registrationMessageOrNull);
    }

    /**
     * Igual que {@link #prepareMemberWhatsappMessages} pero a un número libre (prospecto / pre-inscripción).
     */
    public WhatsappMessagesOutboundResponse prepareGuestWhatsappMessages(
            Long orgId,
            String phone,
            String firstName,
            boolean sendRegistrationForm,
            List<Long> templateIds,
            String registrationMessageOrNull) {
        return prepareWhatsappMessages(
                orgId,
                phone,
                firstName,
                null,
                null,
                sendRegistrationForm,
                templateIds,
                registrationMessageOrNull);
    }

    private WhatsappMessagesOutboundResponse prepareWhatsappMessages(
            Long orgId,
            String phone,
            String firstName,
            Long memberUserId,
            User userOrNull,
            boolean sendRegistrationForm,
            List<Long> templateIds,
            String registrationMessageOrNull) {
        BroadcastChannelSettings settings = getOrCreateSettings(orgId, BroadcastChannel.WHATSAPP);
        if (!settings.isEnabled()) {
            throw new BusinessException(
                    "Activa WhatsApp en Configuración → Mensajes de difusión para enviar mensajes");
        }
        if (phone == null || phone.isBlank()) {
            throw new BusinessException("Indica un número de WhatsApp");
        }

        String gymName = organizationRepository.findById(orgId)
                .map(Organization::getName)
                .orElse(null);
        String resolvedName = (firstName != null && !firstName.isBlank()) ? firstName.trim() : "hola";
        List<String> previews = new ArrayList<>();
        List<ComposedWhatsAppTemplate> composedList = new ArrayList<>();
        for (BroadcastMessageTemplate template : orderSelectedTemplates(orgId, userOrNull, templateIds)) {
            ComposedWhatsAppTemplate composed = composeParts(
                    template, resolvedName, gymName, orgId, memberUserId);
            if (composed.waMeText() != null && !composed.waMeText().isBlank()) {
                previews.add(composed.waMeText());
                composedList.add(composed);
            }
        }
        if (sendRegistrationForm
                && registrationMessageOrNull != null
                && !registrationMessageOrNull.isBlank()) {
            String reg = WhatsAppMessageFormatter.isolateUrlsForWhatsApp(registrationMessageOrNull.trim());
            previews.add(reg);
            composedList.add(new ComposedWhatsAppTemplate(reg, List.of(), reg));
        }
        if (previews.isEmpty()) {
            throw new BusinessException("Selecciona al menos un mensaje para enviar");
        }

        if (settings.getDeliveryMode() == WhatsAppDeliveryMode.CLOUD_API) {
            String lastMessageId = null;
            for (ComposedWhatsAppTemplate composed : composedList) {
                if (composed.textBody() != null && !composed.textBody().isBlank()) {
                    lastMessageId = whatsAppCloudApiService.sendText(
                            orgId, phone, composed.textBody(), true);
                }
                for (String attachment : composed.attachmentUrls()) {
                    if (WhatsAppMessageFormatter.isImageUrl(attachment)) {
                        lastMessageId = whatsAppCloudApiService.sendImageByLink(
                                orgId, phone, attachment, null);
                    } else {
                        String filename = filenameFromUrl(attachment);
                        lastMessageId = whatsAppCloudApiService.sendDocumentByLink(
                                orgId, phone, attachment, filename, null);
                    }
                }
            }
            return new WhatsappMessagesOutboundResponse(null, previews, "CLOUD_API", lastMessageId);
        }

        // wa.me: texto + URLs sueltas (WhatsApp las muestra en azul / con vista previa)
        String combined = String.join(MESSAGE_SEPARATOR, previews);
        String url = WhatsAppLinkHelper.buildChatUrl(phone, combined);
        return new WhatsappMessagesOutboundResponse(url, previews, "WA_ME", null);
    }

    private static String filenameFromUrl(String url) {
        try {
            String path = java.net.URI.create(url).getPath();
            if (path == null || path.isBlank()) {
                return "archivo";
            }
            int slash = path.lastIndexOf('/');
            String name = slash >= 0 ? path.substring(slash + 1) : path;
            return name.isBlank() ? "archivo" : name;
        } catch (Exception ex) {
            return "archivo";
        }
    }

    private List<BroadcastMessageTemplate> orderSelectedTemplates(
            Long orgId,
            User user,
            List<Long> templateIds) {
        if (templateIds == null || templateIds.isEmpty()) {
            return List.of();
        }
        Set<Long> selectedIds = new LinkedHashSet<>();
        for (Long id : templateIds) {
            if (id != null) {
                selectedIds.add(id);
            }
        }
        List<BroadcastMessageTemplate> selected = new ArrayList<>();
        for (Long id : selectedIds) {
            templateRepository.findByIdAndOrganizationId(id, orgId).ifPresent(selected::add);
        }
        if (selected.isEmpty()) {
            return List.of();
        }

        Long packageId = resolveUserPackageId(user);
        Long welcomeId = findWelcomeForPackage(orgId, packageId)
                .map(BroadcastMessageTemplate::getId)
                .orElse(null);

        List<BroadcastMessageTemplate> ordered = new ArrayList<>();
        if (welcomeId != null) {
            selected.stream()
                    .filter(t -> Objects.equals(t.getId(), welcomeId))
                    .findFirst()
                    .ifPresent(ordered::add);
        }
        for (BroadcastMessageTemplate template : selected) {
            if (welcomeId != null && Objects.equals(template.getId(), welcomeId)) {
                continue;
            }
            if (template.getPurpose() == BroadcastTemplatePurpose.WELCOME) {
                ordered.add(template);
            }
        }
        for (BroadcastMessageTemplate template : selected) {
            if (welcomeId != null && Objects.equals(template.getId(), welcomeId)) {
                continue;
            }
            if (template.getPurpose() != BroadcastTemplatePurpose.WELCOME) {
                ordered.add(template);
            }
        }
        return ordered;
    }

    private Long resolveUserPackageId(User user) {
        if (user == null) {
            return null;
        }
        return memberSubscriptionRepository.findFirstByMemberIdOrderByStartDateDesc(user.getId())
                .map(sub -> sub.getMembershipPackage() != null ? sub.getMembershipPackage().getId() : null)
                .orElse(null);
    }

    private String serializeMediaLinks(List<String> mediaLinks) {
        if (mediaLinks == null || mediaLinks.isEmpty()) {
            return null;
        }
        List<String> cleaned = mediaLinks.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(cleaned);
        } catch (JsonProcessingException e) {
            throw new BusinessException("No se pudieron guardar los enlaces de media");
        }
    }

    private List<String> parseMediaLinks(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<String> parsed = objectMapper.readValue(json, new TypeReference<>() {});
            return parsed != null ? parsed : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private String buildRegistrationFormWhatsappUrl(
            String recipientPhone,
            String recipientFirstName,
            String formTitle,
            String formUrl) {
        return WhatsAppLinkHelper.buildChatUrl(
                recipientPhone,
                buildRegistrationFormMessage(recipientFirstName, formTitle, formUrl));
    }

    private String buildRegistrationFormMessage(
            String recipientFirstName,
            String formTitle,
            String formUrl) {
        String name = recipientFirstName != null && !recipientFirstName.isBlank()
                ? recipientFirstName.trim()
                : "miembro";
        return "Hola " + name + ", completa tu " + formTitle + ": " + formUrl;
    }

    private BroadcastTemplatePurpose resolvePurpose(BroadcastTemplatePurpose purpose) {
        return purpose != null ? purpose : BroadcastTemplatePurpose.GENERAL;
    }

    private BroadcastChannelSettings getOrCreateSettings(Long organizationId, BroadcastChannel channel) {
        return channelSettingsRepository.findByOrganizationIdAndChannel(organizationId, channel)
                .orElseGet(() -> {
                    Organization org = organizationRepository.findById(organizationId)
                            .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
                    BroadcastChannelSettings settings = new BroadcastChannelSettings();
                    settings.setOrganization(org);
                    settings.setChannel(channel);
                    settings.setEnabled(false);
                    settings.setDeliveryMode(WhatsAppDeliveryMode.WA_ME);
                    return channelSettingsRepository.save(settings);
                });
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        return phone.replaceAll("[\\s()-]", "").trim();
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void requireConfigRole() {
        var user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new BusinessException("No tienes permiso para configurar mensajes de difusión");
        }
    }

    private BroadcastChannelSettingsResponse toSettingsResponse(BroadcastChannelSettings settings) {
        boolean tokenConfigured = settings.getCloudApiAccessToken() != null
                && !settings.getCloudApiAccessToken().isBlank();
        boolean secretConfigured = settings.getCloudApiAppSecret() != null
                && !settings.getCloudApiAppSecret().isBlank();
        boolean verifyConfigured = settings.getCloudApiVerifyToken() != null
                && !settings.getCloudApiVerifyToken().isBlank();
        return new BroadcastChannelSettingsResponse(
                settings.getChannel(),
                settings.getSenderPhone(),
                settings.isEnabled(),
                settings.isWhatsappWebSessionConfirmed(),
                settings.getDeliveryMode(),
                settings.getCloudApiAppId(),
                settings.getCloudApiPhoneNumberId(),
                settings.getCloudApiWabaId(),
                settings.getCloudApiGraphVersion(),
                tokenConfigured,
                secretConfigured,
                verifyConfigured,
                settings.hasCloudApiCredentials(),
                secretsCryptoService.getTransitPublicKeyPem(),
                secretsCryptoService.getTransitKeyId(),
                secretsCryptoService.getTransitAlg(),
                settings.getUpdatedAt()
        );
    }

    private BroadcastMessageTemplateResponse toTemplateResponse(BroadcastMessageTemplate template) {
        MembershipPackage pkg = template.getMembershipPackage();
        return new BroadcastMessageTemplateResponse(
                template.getId(),
                template.getChannel(),
                template.getName(),
                template.getBody(),
                template.getPurpose(),
                pkg != null ? pkg.getId() : null,
                pkg != null ? pkg.getName() : null,
                parseMediaLinks(template.getMediaLinksJson()),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
