package com.gymplatform.service;

import com.gymplatform.domain.entity.MembershipPackage;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.PackageAddon;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.MembershipPackageRepository;
import com.gymplatform.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class MembershipPackageService {

    private final MembershipPackageRepository packageRepository;
    private final OrganizationRepository organizationRepository;

    public MembershipPackageService(MembershipPackageRepository packageRepository,
                                    OrganizationRepository organizationRepository) {
        this.packageRepository = packageRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional
    public MembershipPackageResponse create(Long organizationId, MembershipPackageRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));

        MembershipPackage pkg = new MembershipPackage();
        pkg.setName(request.name());
        pkg.setDescription(request.description());
        pkg.setPrice(request.price());
        pkg.setDurationMonths(request.durationMonths());
        pkg.setFreeActivityQuota(request.freeActivityQuota());
        pkg.setOrganization(org);
        boolean applyIva = com.gymplatform.util.PriceAddonUtils.resolveApplyIva(request.applyIva(), request.priceAddons());
        BigDecimal ivaPercent = applyIva
                ? com.gymplatform.util.PriceAddonUtils.resolveIvaPercent(request.ivaPercent(), request.priceAddons())
                : null;
        com.gymplatform.util.PriceAddonUtils.validateIva(applyIva, ivaPercent);
        pkg.setApplyIva(applyIva);
        pkg.setIvaPercent(ivaPercent);

        if (request.addons() != null) {
            for (PackageAddonRequest addonReq : request.addons()) {
                PackageAddon addon = new PackageAddon();
                addon.setName(addonReq.name());
                addon.setDescription(addonReq.description());
                addon.setPrice(addonReq.price());
                addon.setMembershipPackage(pkg);
                pkg.getAddons().add(addon);
            }
        }

        return toResponse(packageRepository.save(pkg));
    }

    @Transactional(readOnly = true)
    public List<MembershipPackageResponse> findByOrganization(Long organizationId) {
        return packageRepository.findByOrganizationIdAndActiveTrue(organizationId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MembershipPackageResponse findById(Long organizationId, Long id) {
        return toResponse(requirePackage(organizationId, id));
    }

    @Transactional
    public MembershipPackageResponse update(Long organizationId, Long id, MembershipPackageRequest request) {
        MembershipPackage pkg = requirePackage(organizationId, id);
        pkg.setName(request.name());
        pkg.setDescription(request.description());
        pkg.setPrice(request.price());
        pkg.setDurationMonths(request.durationMonths());
        pkg.setFreeActivityQuota(request.freeActivityQuota());
        boolean applyIva = com.gymplatform.util.PriceAddonUtils.resolveApplyIva(request.applyIva(), request.priceAddons());
        BigDecimal ivaPercent = applyIva
                ? com.gymplatform.util.PriceAddonUtils.resolveIvaPercent(request.ivaPercent(), request.priceAddons())
                : null;
        com.gymplatform.util.PriceAddonUtils.validateIva(applyIva, ivaPercent);
        pkg.setApplyIva(applyIva);
        pkg.setIvaPercent(ivaPercent);

        pkg.getAddons().clear();
        if (request.addons() != null) {
            for (PackageAddonRequest addonReq : request.addons()) {
                PackageAddon addon = new PackageAddon();
                addon.setName(addonReq.name());
                addon.setDescription(addonReq.description());
                addon.setPrice(addonReq.price());
                addon.setMembershipPackage(pkg);
                pkg.getAddons().add(addon);
            }
        }

        return toResponse(packageRepository.save(pkg));
    }

    private MembershipPackage requirePackage(Long organizationId, Long id) {
        MembershipPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membresía no encontrada"));
        if (!pkg.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La membresía no pertenece a este gimnasio");
        }
        return pkg;
    }

    private MembershipPackageResponse toResponse(MembershipPackage pkg) {
        List<PackageAddonResponse> addons = pkg.getAddons().stream()
                .map(a -> new PackageAddonResponse(a.getId(), a.getName(), a.getDescription(), a.getPrice(), a.isActive()))
                .toList();
        return new MembershipPackageResponse(
                pkg.getId(), pkg.getName(), pkg.getDescription(), pkg.getPrice(),
                pkg.getDurationMonths(), pkg.getFreeActivityQuota(), pkg.isActive(), pkg.getCreatedAt(), addons,
                pkg.isApplyIva(),
                pkg.getIvaPercent(),
                com.gymplatform.util.PriceAddonUtils.toResponses(pkg.isApplyIva(), pkg.getIvaPercent()),
                com.gymplatform.util.PriceAddonUtils.applyIva(pkg.getPrice(), pkg.isApplyIva(), pkg.getIvaPercent())
        );
    }
}
