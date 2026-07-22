package com.gymplatform.service;

import com.gymplatform.domain.entity.*;
import com.gymplatform.domain.enums.PaymentMethod;
import com.gymplatform.domain.enums.StoreSaleItemKind;
import com.gymplatform.domain.enums.StoreSaleType;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StoreSaleService {

    private final StoreSaleRepository storeSaleRepository;
    private final StoreSaleItemRepository storeSaleItemRepository;
    private final StoreSalePaymentRepository storeSalePaymentRepository;
    private final ProductRepository productRepository;
    private final MembershipPackageRepository packageRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final CashRegisterService cashRegisterService;
    private final MemberSubscriptionService memberSubscriptionService;

    public StoreSaleService(
            StoreSaleRepository storeSaleRepository,
            StoreSaleItemRepository storeSaleItemRepository,
            StoreSalePaymentRepository storeSalePaymentRepository,
            ProductRepository productRepository,
            MembershipPackageRepository packageRepository,
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            CashRegisterService cashRegisterService,
            MemberSubscriptionService memberSubscriptionService
    ) {
        this.storeSaleRepository = storeSaleRepository;
        this.storeSaleItemRepository = storeSaleItemRepository;
        this.storeSalePaymentRepository = storeSalePaymentRepository;
        this.productRepository = productRepository;
        this.packageRepository = packageRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.cashRegisterService = cashRegisterService;
        this.memberSubscriptionService = memberSubscriptionService;
    }

    @Transactional
    public StoreSaleResponse checkout(Long organizationId, Long cashierId, StoreCheckoutRequest request) {
        CashSession session = cashRegisterService.requireOpenSession(organizationId);
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        User member = null;
        if (request.memberId() != null) {
            member = requireMember(organizationId, request.memberId());
        }

        List<StoreSaleItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        boolean hasMembership = false;

        for (StoreCheckoutItemRequest line : request.items()) {
            StoreSaleItemKind kind = line.kind();
            if (kind == StoreSaleItemKind.MEMBERSHIP) {
                if (hasMembership) {
                    throw new BusinessException("Solo se puede vender una membresía por cobro");
                }
                hasMembership = true;
                if (member == null) {
                    throw new BusinessException("Selecciona el miembro para renovar la membresía");
                }
                if (line.membershipPackageId() == null) {
                    throw new BusinessException("Falta el plan de membresía");
                }
                if (line.quantity() > 1) {
                    throw new BusinessException("Solo se puede asignar una membresía a la vez");
                }
                MembershipPackage pkg = packageRepository.findById(line.membershipPackageId())
                        .orElseThrow(() -> new ResourceNotFoundException("Membresía no encontrada"));
                if (!pkg.getOrganization().getId().equals(organizationId) || !pkg.isActive()) {
                    throw new BusinessException("La membresía no está disponible");
                }
                // Valida cola / programa inicio (lanza si ya hay renovación pendiente)
                MemberSubscription assigned = memberSubscriptionService.assignMembership(
                        organizationId, member.getId(), pkg.getId());

                BigDecimal basePrice = pkg.getPrice() != null ? pkg.getPrice() : BigDecimal.ZERO;
                BigDecimal unitPrice = com.gymplatform.util.PriceAddonUtils.applyIva(
                        basePrice, pkg.isApplyIva(), pkg.getIvaPercent());
                String desc = "Membresía " + pkg.getName();
                String addonLabel = com.gymplatform.util.PriceAddonUtils.describe(pkg.isApplyIva(), pkg.getIvaPercent());
                if (!addonLabel.isBlank()) {
                    desc += " (+ " + addonLabel + ")";
                }
                if (assigned.getStartDate().isAfter(LocalDate.now())) {
                    desc += " (inicia " + assigned.getStartDate() + ")";
                }

                StoreSaleItem item = new StoreSaleItem();
                item.setKind(StoreSaleItemKind.MEMBERSHIP);
                item.setMembershipPackage(pkg);
                item.setMemberSubscriptionId(assigned.getId());
                item.setDescription(desc);
                item.setQuantity(1);
                item.setUnitPrice(unitPrice);
                item.setLineTotal(unitPrice);
                items.add(item);
                total = total.add(unitPrice);
                continue;
            }

            if (kind != StoreSaleItemKind.UNIT && kind != StoreSaleItemKind.PACKAGE) {
                throw new BusinessException("Tipo de ítem no válido en el cobro");
            }
            if (line.productId() == null) {
                throw new BusinessException("Falta el producto");
            }
            Product product = productRepository.findByIdAndOrganizationIdAndActiveTrue(line.productId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

            int qty = Math.max(1, line.quantity());
            boolean asPackage = kind == StoreSaleItemKind.PACKAGE;
            if (asPackage && !product.isSellByPackage()) {
                throw new BusinessException("«" + product.getName() + "» no se vende por contenedor");
            }
            if (!asPackage && !product.isSellByUnit()) {
                throw new BusinessException("«" + product.getName() + "» no se vende por unidad");
            }

            int stockNeeded = asPackage
                    ? qty * Math.max(1, product.getUnitsPerPackage())
                    : qty;
            if (product.getStockUnits() < stockNeeded) {
                throw new BusinessException("Stock insuficiente de «" + product.getName() + "»");
            }

            BigDecimal basePrice = asPackage ? product.getPackagePrice() : product.getUnitPrice();
            if (basePrice == null) basePrice = BigDecimal.ZERO;
            boolean offerActive = com.gymplatform.util.ProductOfferUtils.isOfferActive(product);
            BigDecimal offeredBase = com.gymplatform.util.ProductOfferUtils.applyOffer(basePrice, product);
            boolean applyIva = product.isApplyIva()
                    || (!product.isApplyIva() && Boolean.TRUE.equals(line.applyIva()));
            BigDecimal ivaPercent = product.isApplyIva()
                    ? product.getIvaPercent()
                    : (applyIva ? cashRegisterService.getSystemIvaPercent(organizationId) : null);
            BigDecimal unitPrice = com.gymplatform.util.PriceAddonUtils.applyIva(
                    offeredBase, applyIva, ivaPercent);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);

            product.setStockUnits(product.getStockUnits() - stockNeeded);
            productRepository.save(product);

            String desc = product.getName() + (asPackage ? " (contenedor)" : " (unidad)");
            if (offerActive) {
                String badge = com.gymplatform.util.ProductOfferUtils.resolveBadge(product);
                desc += " (" + (badge != null ? badge : product.getOfferPercent() + "% OFF") + ")";
            }
            String addonLabel = com.gymplatform.util.PriceAddonUtils.describe(applyIva, ivaPercent);
            if (!addonLabel.isBlank()) {
                desc += " (+ " + addonLabel + ")";
            }

            StoreSaleItem item = new StoreSaleItem();
            item.setKind(kind);
            item.setProduct(product);
            item.setDescription(desc);
            item.setQuantity(qty);
            item.setStockUnitsDeducted(stockNeeded);
            item.setUnitPrice(unitPrice);
            item.setLineTotal(lineTotal);
            items.add(item);
            total = total.add(lineTotal);
        }

        if (items.isEmpty()) {
            throw new BusinessException("El carrito está vacío");
        }

        BigDecimal saleTotal = total.setScale(2, RoundingMode.HALF_UP);
        List<StoreCheckoutPaymentRequest> paymentRequests = normalizePaymentRequests(request, saleTotal);

        StoreSale sale = new StoreSale();
        sale.setOrganization(org);
        sale.setCashSession(session);
        sale.setCreatedBy(cashier);
        sale.setMember(member);
        sale.setType(StoreSaleType.SALE);
        sale.setTotal(saleTotal);
        sale.setNotes(blankToNull(request.notes()));
        // Compatibilidad: primer método
        sale.setPaymentMethod(paymentRequests.get(0).method());
        if (paymentRequests.size() == 1 && paymentRequests.get(0).method() == PaymentMethod.SINPE) {
            sale.setPaymentProofData(sanitizeProofData(paymentRequests.get(0).paymentProofData()));
        }
        sale = storeSaleRepository.save(sale);

        for (StoreSaleItem item : items) {
            item.setStoreSale(sale);
            storeSaleItemRepository.save(item);
        }

        for (StoreCheckoutPaymentRequest payReq : paymentRequests) {
            StoreSalePayment payment = new StoreSalePayment();
            payment.setStoreSale(sale);
            payment.setMethod(payReq.method());
            payment.setAmount(payReq.amount().setScale(2, RoundingMode.HALF_UP));
            if (payReq.method() == PaymentMethod.SINPE) {
                payment.setPaymentProofData(sanitizeProofData(payReq.paymentProofData()));
            }
            storeSalePaymentRepository.save(payment);
            sale.addPayment(payment);
        }

        return toResponse(sale);
    }

    private List<StoreCheckoutPaymentRequest> normalizePaymentRequests(
            StoreCheckoutRequest request,
            BigDecimal saleTotal
    ) {
        List<StoreCheckoutPaymentRequest> raw = request.payments();
        if (raw == null || raw.isEmpty()) {
            if (request.paymentMethod() == null) {
                throw new BusinessException("Indica cómo se paga (efectivo, tarjeta y/o SINPE)");
            }
            return List.of(new StoreCheckoutPaymentRequest(
                    request.paymentMethod(),
                    saleTotal,
                    request.paymentProofData()
            ));
        }

        Map<PaymentMethod, BigDecimal> byMethod = new LinkedHashMap<>();
        Map<PaymentMethod, String> proofByMethod = new LinkedHashMap<>();
        for (StoreCheckoutPaymentRequest line : raw) {
            if (line.method() == null || line.amount() == null) {
                throw new BusinessException("Cada pago debe tener método y monto");
            }
            BigDecimal amount = line.amount().setScale(2, RoundingMode.HALF_UP);
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            byMethod.merge(line.method(), amount, BigDecimal::add);
            if (line.method() == PaymentMethod.SINPE && line.paymentProofData() != null) {
                proofByMethod.put(PaymentMethod.SINPE, line.paymentProofData());
            }
        }
        if (byMethod.isEmpty()) {
            throw new BusinessException("Indica al menos un monto de pago");
        }

        BigDecimal paid = byMethod.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (paid.compareTo(saleTotal) != 0) {
            throw new BusinessException(
                    "La suma de los pagos (" + paid.toPlainString()
                            + ") debe ser igual al total (" + saleTotal.toPlainString() + ")");
        }

        List<StoreCheckoutPaymentRequest> normalized = new ArrayList<>();
        for (Map.Entry<PaymentMethod, BigDecimal> e : byMethod.entrySet()) {
            normalized.add(new StoreCheckoutPaymentRequest(
                    e.getKey(),
                    e.getValue(),
                    e.getKey() == PaymentMethod.SINPE ? proofByMethod.get(PaymentMethod.SINPE) : null
            ));
        }
        return normalized;
    }

    @Transactional
    public StoreSaleResponse createManualEntry(Long organizationId, Long cashierId, StoreManualEntryRequest request) {
        if (request.type() != StoreSaleType.MANUAL_INCOME && request.type() != StoreSaleType.MANUAL_EXPENSE) {
            throw new BusinessException("Tipo de movimiento no válido");
        }
        CashSession session = cashRegisterService.requireOpenSession(organizationId);
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        StoreSale sale = new StoreSale();
        sale.setOrganization(org);
        sale.setCashSession(session);
        sale.setCreatedBy(cashier);
        sale.setType(request.type());
        sale.setPaymentMethod(PaymentMethod.CASH);
        sale.setTotal(amount);
        sale.setNotes(request.notes().trim());
        sale = storeSaleRepository.save(sale);

        StoreSalePayment cashPay = new StoreSalePayment();
        cashPay.setStoreSale(sale);
        cashPay.setMethod(PaymentMethod.CASH);
        cashPay.setAmount(amount);
        storeSalePaymentRepository.save(cashPay);
        sale.addPayment(cashPay);

        StoreSaleItem item = new StoreSaleItem();
        item.setStoreSale(sale);
        item.setKind(StoreSaleItemKind.MANUAL);
        item.setDescription(request.type() == StoreSaleType.MANUAL_INCOME ? "Ingreso manual" : "Gasto manual");
        item.setQuantity(1);
        item.setUnitPrice(amount);
        item.setLineTotal(amount);
        storeSaleItemRepository.save(item);
        return toResponse(sale);
    }

    @Transactional(readOnly = true)
    public List<StoreSaleResponse> listSales(Long organizationId, String period, LocalDate date) {
        LocalDate anchor = date != null ? date : LocalDate.now();
        Instant from;
        Instant to;
        ZoneId zone = ZoneId.systemDefault();
        String p = period == null ? "day" : period.toLowerCase();
        switch (p) {
            case "month" -> {
                YearMonth ym = YearMonth.from(anchor);
                from = ym.atDay(1).atStartOfDay(zone).toInstant();
                to = ym.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();
            }
            case "year" -> {
                from = LocalDate.of(anchor.getYear(), 1, 1).atStartOfDay(zone).toInstant();
                to = LocalDate.of(anchor.getYear() + 1, 1, 1).atStartOfDay(zone).toInstant();
            }
            default -> {
                from = anchor.atStartOfDay(zone).toInstant();
                to = anchor.plusDays(1).atStartOfDay(zone).toInstant();
            }
        }
        return storeSaleRepository.findByOrganizationAndPeriod(organizationId, from, to).stream()
                .filter(sale -> !sale.isVoided())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StoreSaleResponse voidSale(Long organizationId, Long saleId, Long userId) {
        StoreSale sale = storeSaleRepository.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento no encontrado"));
        if (sale.getOrganization() == null || !sale.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El movimiento no pertenece a este gimnasio");
        }
        if (sale.isVoided()) {
            throw new BusinessException("Este movimiento ya fue eliminado");
        }
        CashSession session = sale.getCashSession();
        if (session == null) {
            throw new BusinessException("Solo se pueden eliminar movimientos vinculados a una caja");
        }
        if (session.getStatus() != com.gymplatform.domain.enums.CashSessionStatus.OPEN) {
            throw new BusinessException("Solo se pueden eliminar movimientos mientras la caja esté abierta");
        }
        CashSession open = cashRegisterService.requireOpenSession(organizationId);
        if (!open.getId().equals(session.getId())) {
            throw new BusinessException("Solo se pueden eliminar movimientos de la caja abierta actual");
        }

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        List<StoreSaleItem> items = storeSaleItemRepository.findByStoreSaleIdOrderByIdAsc(sale.getId());
        for (StoreSaleItem item : items) {
            if (item.getKind() == StoreSaleItemKind.UNIT || item.getKind() == StoreSaleItemKind.PACKAGE) {
                if (item.getProduct() != null && item.getStockUnitsDeducted() > 0) {
                    Product product = item.getProduct();
                    product.setStockUnits(product.getStockUnits() + item.getStockUnitsDeducted());
                    productRepository.save(product);
                }
            } else if (item.getKind() == StoreSaleItemKind.MEMBERSHIP) {
                if (item.getMemberSubscriptionId() != null) {
                    memberSubscriptionService.deactivateSubscriptionFromSale(
                            organizationId, item.getMemberSubscriptionId());
                } else if (sale.getMember() != null && item.getMembershipPackage() != null) {
                    memberSubscriptionService.deactivateMatchingSaleSubscription(
                            organizationId,
                            sale.getMember().getId(),
                            item.getMembershipPackage().getId(),
                            sale.getCreatedAt());
                }
            }
        }

        sale.setVoidedAt(Instant.now());
        sale.setVoidedBy(actor);
        sale.setVoidReason("Eliminado con caja abierta");
        storeSaleRepository.save(sale);
        return toResponse(sale);
    }

    @Transactional(readOnly = true)
    public StoreSalesSummaryResponse summarize(Long organizationId, String period, LocalDate date) {
        List<StoreSaleResponse> sales = listSales(organizationId, period, date);
        return summarizeSales(sales);
    }

    /**
     * Día calendario: cada apertura de caja por separado; el total del día es la suma.
     */
    @Transactional(readOnly = true)
    public CashDayReportResponse dayReport(Long organizationId, LocalDate date) {
        LocalDate anchor = date != null ? date : LocalDate.now();
        List<StoreSaleResponse> daySales = listSales(organizationId, "day", anchor);
        List<CashSessionResponse> sessions = cashRegisterService.listSessionsForDay(organizationId, anchor);

        Map<Long, List<StoreSaleResponse>> bySession = new LinkedHashMap<>();
        for (CashSessionResponse session : sessions) {
            bySession.put(session.id(), new ArrayList<>());
        }
        List<StoreSaleResponse> unassigned = new ArrayList<>();
        for (StoreSaleResponse sale : daySales) {
            Long sid = sale.cashSessionId();
            if (sid != null && bySession.containsKey(sid)) {
                bySession.get(sid).add(sale);
            } else if (sid != null) {
                bySession.computeIfAbsent(sid, k -> new ArrayList<>()).add(sale);
            } else {
                unassigned.add(sale);
            }
        }

        // Cargar cajas referenciadas por ventas pero no detectadas (edge)
        for (Long sid : new ArrayList<>(bySession.keySet())) {
            if (sessions.stream().noneMatch(s -> s.id().equals(sid))) {
                sessions = new ArrayList<>(sessions);
                sessions.add(cashRegisterService.getSession(organizationId, sid));
                sessions.sort(Comparator.comparing(CashSessionResponse::openedAt));
            }
        }

        List<CashSessionDayBlockResponse> blocks = new ArrayList<>();
        for (CashSessionResponse session : sessions) {
            List<StoreSaleResponse> sales = bySession.getOrDefault(session.id(), List.of());
            blocks.add(new CashSessionDayBlockResponse(session, summarizeSales(sales), sales));
        }
        if (!unassigned.isEmpty()) {
            CashSessionResponse phantom = new CashSessionResponse(
                    null,
                    null,
                    null,
                    null,
                    "Sin caja",
                    null,
                    BigDecimal.ZERO,
                    null,
                    null,
                    summarizeSales(unassigned).netTotal(),
                    "Movimientos sin sesión de caja",
                    List.of(),
                    List.of()
            );
            blocks.add(new CashSessionDayBlockResponse(phantom, summarizeSales(unassigned), unassigned));
        }

        return new CashDayReportResponse(anchor, summarizeSales(daySales), blocks);
    }

    @Transactional
    public StoreSaleResponse attachPaymentProof(Long organizationId, Long saleId, StoreSalePaymentProofRequest request) {
        StoreSale sale = storeSaleRepository.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada"));
        if (sale.getOrganization() == null || !sale.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La venta no pertenece a este gimnasio");
        }
        if (sale.getType() != StoreSaleType.SALE) {
            throw new BusinessException("Solo las ventas pueden tener comprobante de pago");
        }
        if (sale.isVoided()) {
            throw new BusinessException("No se puede adjuntar comprobante a un movimiento eliminado");
        }
        String proof = sanitizeProofData(request.paymentProofData());
        if (proof == null) {
            throw new BusinessException("Sube una imagen válida del comprobante");
        }

        List<StoreSalePayment> payments = storeSalePaymentRepository.findByStoreSaleIdOrderByIdAsc(saleId);
        StoreSalePayment sinpe = payments.stream()
                .filter(p -> p.getMethod() == PaymentMethod.SINPE)
                .findFirst()
                .orElse(null);
        if (sinpe == null && sale.getPaymentMethod() == PaymentMethod.SINPE) {
            sale.setPaymentProofData(proof);
            return toResponse(storeSaleRepository.save(sale));
        }
        if (sinpe == null) {
            throw new BusinessException("Esta venta no tiene un pago SINPE");
        }
        sinpe.setPaymentProofData(proof);
        storeSalePaymentRepository.save(sinpe);
        sale.setPaymentProofData(proof);
        storeSaleRepository.save(sale);
        return toResponse(sale);
    }

    @Transactional(readOnly = true)
    public String getPaymentProofData(Long organizationId, Long saleId) {
        StoreSale sale = storeSaleRepository.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada"));
        if (sale.getOrganization() == null || !sale.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La venta no pertenece a este gimnasio");
        }
        List<StoreSalePayment> payments = storeSalePaymentRepository.findByStoreSaleIdOrderByIdAsc(saleId);
        for (StoreSalePayment p : payments) {
            if (p.getMethod() == PaymentMethod.SINPE
                    && p.getPaymentProofData() != null
                    && !p.getPaymentProofData().isBlank()) {
                return p.getPaymentProofData();
            }
        }
        if (sale.getPaymentProofData() != null && !sale.getPaymentProofData().isBlank()) {
            return sale.getPaymentProofData();
        }
        throw new ResourceNotFoundException("Esta venta no tiene comprobante");
    }

    private StoreSalesSummaryResponse summarizeSales(List<StoreSaleResponse> sales) {
        BigDecimal salesTotal = BigDecimal.ZERO;
        BigDecimal incomeTotal = BigDecimal.ZERO;
        BigDecimal expenseTotal = BigDecimal.ZERO;
        for (StoreSaleResponse sale : sales) {
            if (sale.type() == StoreSaleType.SALE) {
                salesTotal = salesTotal.add(sale.total());
            } else if (sale.type() == StoreSaleType.MANUAL_INCOME) {
                incomeTotal = incomeTotal.add(sale.total());
            } else if (sale.type() == StoreSaleType.MANUAL_EXPENSE) {
                expenseTotal = expenseTotal.add(sale.total());
            }
        }
        BigDecimal net = salesTotal.add(incomeTotal).subtract(expenseTotal);
        return new StoreSalesSummaryResponse(salesTotal, incomeTotal, expenseTotal, net, sales.size());
    }

    private User requireMember(Long organizationId, Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El miembro no pertenece a este gimnasio");
        }
        return member;
    }

    private StoreSaleResponse toResponse(StoreSale sale) {
        List<StoreSaleItemResponse> items = storeSaleItemRepository.findByStoreSaleIdOrderByIdAsc(sale.getId()).stream()
                .map(i -> new StoreSaleItemResponse(
                        i.getId(),
                        i.getKind(),
                        i.getProduct() != null ? i.getProduct().getId() : null,
                        i.getMembershipPackage() != null ? i.getMembershipPackage().getId() : null,
                        i.getDescription(),
                        i.getQuantity(),
                        i.getStockUnitsDeducted(),
                        i.getUnitPrice(),
                        i.getLineTotal()
                ))
                .toList();

        List<StoreSalePayment> paymentEntities = storeSalePaymentRepository.findByStoreSaleIdOrderByIdAsc(sale.getId());
        List<StoreSalePaymentResponse> payments;
        if (paymentEntities.isEmpty() && sale.getPaymentMethod() != null) {
            payments = List.of(new StoreSalePaymentResponse(
                    null,
                    sale.getPaymentMethod(),
                    sale.getTotal(),
                    sale.getPaymentProofData() != null && !sale.getPaymentProofData().isBlank()
            ));
        } else {
            payments = paymentEntities.stream()
                    .map(p -> new StoreSalePaymentResponse(
                            p.getId(),
                            p.getMethod(),
                            p.getAmount(),
                            p.getPaymentProofData() != null && !p.getPaymentProofData().isBlank()
                    ))
                    .toList();
        }

        boolean hasProof = payments.stream().anyMatch(StoreSalePaymentResponse::hasPaymentProof)
                || (sale.getPaymentProofData() != null && !sale.getPaymentProofData().isBlank());
        PaymentMethod primary = payments.isEmpty()
                ? sale.getPaymentMethod()
                : payments.get(0).method();
        BigDecimal cashAmount = payments.stream()
                .filter(p -> p.method() == PaymentMethod.CASH)
                .map(StoreSalePaymentResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (payments.isEmpty()) {
            cashAmount = sale.cashDrawerAmount();
        }

        User member = sale.getMember();
        CashSession session = sale.getCashSession();
        boolean deletable = !sale.isVoided()
                && session != null
                && session.getStatus() == com.gymplatform.domain.enums.CashSessionStatus.OPEN;
        return new StoreSaleResponse(
                sale.getId(),
                sale.getType(),
                sale.getCreatedAt(),
                sale.getTotal(),
                sale.getNotes(),
                member != null ? member.getId() : null,
                member != null ? (member.getFirstName() + " " + member.getLastName()).trim() : null,
                (sale.getCreatedBy().getFirstName() + " " + sale.getCreatedBy().getLastName()).trim(),
                session != null ? session.getId() : null,
                primary,
                hasProof,
                cashAmount,
                payments,
                items,
                sale.isVoided(),
                deletable
        );
    }

    private static String sanitizeProofData(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        if (!trimmed.startsWith("data:image/")) {
            throw new BusinessException("El comprobante debe ser una imagen");
        }
        if (trimmed.length() > 3_500_000) {
            throw new BusinessException("El comprobante es demasiado grande (máx. ~2 MB)");
        }
        return trimmed;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
