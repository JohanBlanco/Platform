package com.gymplatform.service;

import com.gymplatform.domain.entity.*;
import com.gymplatform.domain.enums.CashCountPhase;
import com.gymplatform.domain.enums.CashDenominationKind;
import com.gymplatform.domain.enums.CashSessionStatus;
import com.gymplatform.domain.enums.StoreSaleType;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CashRegisterService {

    private static final int[] DEFAULT_COINS = {25, 50, 100, 500};
    private static final int[] DEFAULT_BILLS = {1000, 2000, 5000, 10000};
    private static final BigDecimal DEFAULT_OPENING_FLOAT = new BigDecimal("45000");
    private static final BigDecimal DEFAULT_SYSTEM_IVA_PERCENT = new BigDecimal("13");

    private final CashDenominationRepository denominationRepository;
    private final CashRegisterConfigRepository configRepository;
    private final CashSessionRepository sessionRepository;
    private final CashCountEntryRepository countEntryRepository;
    private final StoreSaleRepository storeSaleRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public CashRegisterService(
            CashDenominationRepository denominationRepository,
            CashRegisterConfigRepository configRepository,
            CashSessionRepository sessionRepository,
            CashCountEntryRepository countEntryRepository,
            StoreSaleRepository storeSaleRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository
    ) {
        this.denominationRepository = denominationRepository;
        this.configRepository = configRepository;
        this.sessionRepository = sessionRepository;
        this.countEntryRepository = countEntryRepository;
        this.storeSaleRepository = storeSaleRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CashSettingsResponse getSettings(Long organizationId) {
        ensureDefaults(organizationId);
        return new CashSettingsResponse(
                getOpeningFloat(organizationId),
                getSystemIvaPercent(organizationId),
                listDenominationResponses(organizationId, false));
    }

    @Transactional
    public CashSettingsResponse updateSettings(Long organizationId, CashSettingsUpdateRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        ensureDefaults(organizationId);

        BigDecimal floatAmount = request.openingFloatColones().setScale(2, java.math.RoundingMode.HALF_UP);
        if (floatAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("El fondo de caja no puede ser negativo");
        }
        BigDecimal ivaPercent = request.systemIvaPercent().setScale(2, java.math.RoundingMode.HALF_UP);
        if (ivaPercent.compareTo(BigDecimal.ZERO) < 0 || ivaPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessException("El I.V.A. del sistema debe estar entre 0 y 100");
        }
        CashRegisterConfig config = configRepository.findByOrganizationId(organizationId)
                .orElseGet(() -> {
                    CashRegisterConfig c = new CashRegisterConfig();
                    c.setOrganization(org);
                    return c;
                });
        config.setOpeningFloatColones(floatAmount);
        config.setSystemIvaPercent(ivaPercent);
        configRepository.save(config);

        replaceDenominationRows(org, request.denominations());
        return getSettings(organizationId);
    }

    @Transactional
    public List<CashDenominationResponse> listDenominations(Long organizationId) {
        ensureDefaults(organizationId);
        return listDenominationResponses(organizationId, false);
    }

    @Transactional
    public List<CashDenominationResponse> listActiveDenominations(Long organizationId) {
        ensureDefaults(organizationId);
        return listDenominationResponses(organizationId, true);
    }

    @Transactional
    public BigDecimal getSystemIvaPercent(Long organizationId) {
        ensureDefaults(organizationId);
        return configRepository.findByOrganizationId(organizationId)
                .map(CashRegisterConfig::getSystemIvaPercent)
                .filter(v -> v != null)
                .orElse(DEFAULT_SYSTEM_IVA_PERCENT)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    @Transactional
    public BigDecimal getOpeningFloat(Long organizationId) {
        ensureDefaults(organizationId);
        return configRepository.findByOrganizationId(organizationId)
                .map(CashRegisterConfig::getOpeningFloatColones)
                .orElse(DEFAULT_OPENING_FLOAT);
    }

    @Transactional
    public List<CashDenominationResponse> replaceDenominations(Long organizationId, CashDenominationsReplaceRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        ensureDefaults(organizationId);
        replaceDenominationRows(org, request.denominations());
        return listDenominationResponses(organizationId, false);
    }

    private List<CashDenominationResponse> listDenominationResponses(Long organizationId, boolean activeOnly) {
        List<CashDenomination> list = activeOnly
                ? denominationRepository.findByOrganizationIdAndActiveTrueOrderBySortOrderAscValueColonesAsc(organizationId)
                : denominationRepository.findByOrganizationIdOrderBySortOrderAscValueColonesAsc(organizationId);
        return list.stream().map(this::toDenominationResponse).toList();
    }

    private void replaceDenominationRows(Organization org, List<CashDenominationUpsertRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessException("Debes configurar al menos una denominación");
        }

        Set<Integer> seen = new HashSet<>();
        for (CashDenominationUpsertRequest item : items) {
            if (!seen.add(item.valueColones())) {
                throw new BusinessException("Hay valores de denominación repetidos");
            }
            if (item.valueColones() < 1) {
                throw new BusinessException("Cada denominación debe ser al menos ₡1");
            }
        }

        List<CashDenomination> existing = denominationRepository.findByOrganizationIdOrderBySortOrderAscValueColonesAsc(org.getId());
        denominationRepository.deleteAll(existing);
        denominationRepository.flush();

        int order = 0;
        for (CashDenominationUpsertRequest item : items) {
            CashDenomination den = new CashDenomination();
            den.setOrganization(org);
            den.setValueColones(item.valueColones());
            den.setKind(item.kind());
            den.setSortOrder(item.sortOrder() > 0 ? item.sortOrder() : order++);
            den.setActive(item.active());
            denominationRepository.save(den);
        }
    }

    @Transactional(readOnly = true)
    public CashSessionResponse getCurrentSession(Long organizationId) {
        return sessionRepository.findFirstByOrganizationIdAndStatusOrderByOpenedAtDesc(organizationId, CashSessionStatus.OPEN)
                .map(this::toSessionResponse)
                .orElse(null);
    }

    /**
     * Cajas del día calendario: las abiertas ese día, más cualquier caja
     * que tenga ventas registradas ese día (p. ej. turno que cruza medianoche).
     */
    @Transactional(readOnly = true)
    public List<CashSessionResponse> listSessionsForDay(Long organizationId, LocalDate date) {
        LocalDate anchor = date != null ? date : LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();
        Instant from = anchor.atStartOfDay(zone).toInstant();
        Instant to = anchor.plusDays(1).atStartOfDay(zone).toInstant();

        Map<Long, CashSession> byId = new LinkedHashMap<>();
        for (CashSession s : sessionRepository
                .findByOrganizationIdAndOpenedAtGreaterThanEqualAndOpenedAtLessThanOrderByOpenedAtAsc(
                        organizationId, from, to)) {
            byId.put(s.getId(), s);
        }
        for (CashSession s : sessionRepository.findWithSalesInPeriod(organizationId, from, to)) {
            byId.putIfAbsent(s.getId(), s);
        }

        return byId.values().stream()
                .sorted(Comparator.comparing(CashSession::getOpenedAt))
                .map(this::toSessionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CashSessionResponse getSession(Long organizationId, Long sessionId) {
        CashSession session = sessionRepository.findByIdAndOrganizationId(sessionId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión de caja no encontrada"));
        return toSessionResponse(session);
    }

    @Transactional
    public CashSessionResponse openSession(Long organizationId, Long userId, CashSessionOpenRequest request) {
        ensureDefaults(organizationId);
        if (sessionRepository.findFirstByOrganizationIdAndStatusOrderByOpenedAtDesc(organizationId, CashSessionStatus.OPEN).isPresent()) {
            throw new BusinessException("Ya hay una caja abierta. Ciérrala antes de abrir otra.");
        }
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User opener = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        List<CashCountLineRequest> counts = normalizeCounts(organizationId, request.counts());
        BigDecimal openingTotal = sumCounts(counts);
        BigDecimal expectedFloat = getOpeningFloat(organizationId);
        if (openingTotal.compareTo(expectedFloat) != 0) {
            throw new BusinessException(
                    "El conteo de apertura es " + formatColones(openingTotal)
                            + " pero el fondo de caja configurado es " + formatColones(expectedFloat)
                            + ". Verifica monedas y billetes."
            );
        }

        CashSession session = new CashSession();
        session.setOrganization(org);
        session.setOpenedBy(opener);
        session.setStatus(CashSessionStatus.OPEN);
        session.setOpenedAt(Instant.now());
        session.setOpeningTotal(openingTotal);
        session.setNotes(blankToNull(request.notes()));
        session = sessionRepository.save(session);
        saveCounts(session, CashCountPhase.OPENING, counts);
        return toSessionResponse(session);
    }

    @Transactional
    public CashSessionResponse closeSession(Long organizationId, Long userId, Long sessionId, CashSessionCloseRequest request) {
        CashSession session = sessionRepository.findByIdAndOrganizationId(sessionId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión de caja no encontrada"));
        if (session.getStatus() != CashSessionStatus.OPEN) {
            throw new BusinessException("Esta caja ya está cerrada");
        }
        User closer = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        List<CashCountLineRequest> counts = normalizeCounts(organizationId, request.counts());
        BigDecimal closingTotal = sumCounts(counts);
        BigDecimal salesNet = salesNetForSession(session.getId());
        BigDecimal expected = session.getOpeningTotal().add(salesNet);

        session.setClosedBy(closer);
        session.setClosedAt(Instant.now());
        session.setStatus(CashSessionStatus.CLOSED);
        session.setClosingTotal(closingTotal);
        session.setExpectedClosingTotal(expected);
        if (request.notes() != null && !request.notes().isBlank()) {
            session.setNotes(request.notes().trim());
        }
        saveCounts(session, CashCountPhase.CLOSING, counts);
        return toSessionResponse(sessionRepository.save(session));
    }

    @Transactional
    public CashSession requireOpenSession(Long organizationId) {
        return sessionRepository.findFirstByOrganizationIdAndStatusOrderByOpenedAtDesc(organizationId, CashSessionStatus.OPEN)
                .orElseThrow(() -> new BusinessException("Debes abrir la caja antes de registrar ventas"));
    }

    private void ensureDefaults(Long organizationId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        if (!configRepository.existsByOrganizationId(organizationId)) {
            CashRegisterConfig config = new CashRegisterConfig();
            config.setOrganization(org);
            config.setOpeningFloatColones(DEFAULT_OPENING_FLOAT);
            config.setSystemIvaPercent(DEFAULT_SYSTEM_IVA_PERCENT);
            configRepository.save(config);
        } else {
            // Migrar fondos default previos (40000 / 50000) → 45000
            configRepository.findByOrganizationId(organizationId).ifPresent(config -> {
                boolean changed = false;
                if (config.getOpeningFloatColones() != null) {
                    BigDecimal current = config.getOpeningFloatColones();
                    if (current.compareTo(new BigDecimal("40000")) == 0
                            || current.compareTo(new BigDecimal("50000")) == 0) {
                        config.setOpeningFloatColones(DEFAULT_OPENING_FLOAT);
                        changed = true;
                    }
                }
                if (config.getSystemIvaPercent() == null) {
                    config.setSystemIvaPercent(DEFAULT_SYSTEM_IVA_PERCENT);
                    changed = true;
                }
                if (changed) {
                    configRepository.save(config);
                }
            });
        }
        if (!denominationRepository.existsByOrganizationId(organizationId)) {
            int order = 0;
            for (int value : DEFAULT_COINS) {
                saveDefault(org, value, CashDenominationKind.COIN, order++);
            }
            for (int value : DEFAULT_BILLS) {
                saveDefault(org, value, CashDenominationKind.BILL, order++);
            }
        } else {
            syncCoinDenominations(org);
        }
    }

    /** Quita ₡5/₡10 y billete ₡20 000; asegura ₡50 y ordena monedas: 25, 50, 100, 500. */
    private void syncCoinDenominations(Organization org) {
        Long orgId = org.getId();
        List<CashDenomination> existing = denominationRepository
                .findByOrganizationIdOrderBySortOrderAscValueColonesAsc(orgId);
        List<CashDenomination> toRemove = existing.stream()
                .filter(d ->
                        (d.getKind() == CashDenominationKind.COIN
                                && (d.getValueColones() == 5 || d.getValueColones() == 10))
                                || (d.getKind() == CashDenominationKind.BILL && d.getValueColones() == 20000))
                .toList();
        if (!toRemove.isEmpty()) {
            denominationRepository.deleteAll(toRemove);
            denominationRepository.flush();
            existing = denominationRepository.findByOrganizationIdOrderBySortOrderAscValueColonesAsc(orgId);
        }
        if (!denominationRepository.existsByOrganizationIdAndValueColones(orgId, 50)) {
            saveDefault(org, 50, CashDenominationKind.COIN, 0);
            existing = denominationRepository.findByOrganizationIdOrderBySortOrderAscValueColonesAsc(orgId);
        }

        java.util.Map<Integer, CashDenomination> coinsByValue = new java.util.HashMap<>();
        for (CashDenomination d : existing) {
            if (d.getKind() == CashDenominationKind.COIN) {
                coinsByValue.put(d.getValueColones(), d);
            }
        }
        int order = 0;
        for (int value : DEFAULT_COINS) {
            CashDenomination coin = coinsByValue.remove(value);
            if (coin != null) {
                coin.setSortOrder(order++);
                denominationRepository.save(coin);
            }
        }
        for (CashDenomination extra : coinsByValue.values()) {
            extra.setSortOrder(order++);
            denominationRepository.save(extra);
        }
        List<CashDenomination> bills = existing.stream()
                .filter(d -> d.getKind() == CashDenominationKind.BILL)
                .sorted(java.util.Comparator.comparingInt(CashDenomination::getValueColones))
                .toList();
        for (CashDenomination bill : bills) {
            bill.setSortOrder(order++);
            denominationRepository.save(bill);
        }
    }

    private static String formatColones(BigDecimal amount) {
        return "₡" + amount.setScale(0, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private void saveDefault(Organization org, int value, CashDenominationKind kind, int order) {
        CashDenomination den = new CashDenomination();
        den.setOrganization(org);
        den.setValueColones(value);
        den.setKind(kind);
        den.setSortOrder(order);
        den.setActive(true);
        denominationRepository.save(den);
    }

    private List<CashCountLineRequest> normalizeCounts(Long organizationId, List<CashCountLineRequest> counts) {
        List<CashDenomination> active = denominationRepository
                .findByOrganizationIdAndActiveTrueOrderBySortOrderAscValueColonesAsc(organizationId);
        if (active.isEmpty()) {
            throw new BusinessException("No hay denominaciones activas. Configúralas en Ajustes → Caja.");
        }
        Set<Integer> allowed = new HashSet<>();
        for (CashDenomination d : active) allowed.add(d.getValueColones());

        if (counts == null) counts = List.of();
        List<CashCountLineRequest> normalized = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (CashCountLineRequest line : counts) {
            if (line == null || line.valueColones() == null) continue;
            int value = line.valueColones();
            if (!allowed.contains(value)) {
                throw new BusinessException("La denominación ₡" + value + " no está activa");
            }
            if (!seen.add(value)) {
                throw new BusinessException("Denominación duplicada en el conteo: ₡" + value);
            }
            int qty = Math.max(0, line.quantity());
            normalized.add(new CashCountLineRequest(value, qty));
        }
        for (CashDenomination d : active) {
            if (!seen.contains(d.getValueColones())) {
                normalized.add(new CashCountLineRequest(d.getValueColones(), 0));
            }
        }
        normalized.sort((a, b) -> Integer.compare(a.valueColones(), b.valueColones()));
        return normalized;
    }

    private void saveCounts(CashSession session, CashCountPhase phase, List<CashCountLineRequest> counts) {
        for (CashCountLineRequest line : counts) {
            CashCountEntry entry = new CashCountEntry();
            entry.setCashSession(session);
            entry.setPhase(phase);
            entry.setValueColones(line.valueColones());
            entry.setQuantity(line.quantity());
            countEntryRepository.save(entry);
        }
    }

    private BigDecimal sumCounts(List<CashCountLineRequest> counts) {
        BigDecimal total = BigDecimal.ZERO;
        for (CashCountLineRequest line : counts) {
            total = total.add(BigDecimal.valueOf(line.valueColones()).multiply(BigDecimal.valueOf(line.quantity())));
        }
        return total;
    }

    private BigDecimal salesNetForSession(Long sessionId) {
        BigDecimal net = BigDecimal.ZERO;
        for (StoreSale sale : storeSaleRepository.findByCashSessionIdWithPayments(sessionId)) {
            if (sale.isVoided()) {
                continue;
            }
            BigDecimal cash = sale.cashDrawerAmount();
            if (sale.getType() == StoreSaleType.MANUAL_EXPENSE) {
                net = net.subtract(cash);
            } else {
                net = net.add(cash);
            }
        }
        return net;
    }

    private CashSessionResponse toSessionResponse(CashSession session) {
        List<CashCountLineResponse> opening = mapCounts(session.getId(), CashCountPhase.OPENING);
        List<CashCountLineResponse> closing = session.getStatus() == CashSessionStatus.CLOSED
                ? mapCounts(session.getId(), CashCountPhase.CLOSING)
                : List.of();
        BigDecimal salesNet = salesNetForSession(session.getId());
        return new CashSessionResponse(
                session.getId(),
                session.getStatus(),
                session.getOpenedAt(),
                session.getClosedAt(),
                userName(session.getOpenedBy()),
                session.getClosedBy() != null ? userName(session.getClosedBy()) : null,
                session.getOpeningTotal(),
                session.getClosingTotal(),
                session.getExpectedClosingTotal() != null
                        ? session.getExpectedClosingTotal()
                        : session.getOpeningTotal().add(salesNet),
                salesNet,
                session.getNotes(),
                opening,
                closing
        );
    }

    private List<CashCountLineResponse> mapCounts(Long sessionId, CashCountPhase phase) {
        return countEntryRepository.findByCashSessionIdAndPhaseOrderByValueColonesAsc(sessionId, phase).stream()
                .map(e -> new CashCountLineResponse(
                        e.getValueColones(),
                        e.getQuantity(),
                        BigDecimal.valueOf(e.getValueColones()).multiply(BigDecimal.valueOf(e.getQuantity()))
                ))
                .toList();
    }

    private CashDenominationResponse toDenominationResponse(CashDenomination d) {
        return new CashDenominationResponse(d.getId(), d.getValueColones(), d.getKind(), d.getSortOrder(), d.isActive());
    }

    private static String userName(User user) {
        if (user == null) return "";
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
