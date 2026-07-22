package com.gymplatform.repository;

import com.gymplatform.domain.entity.StoreSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreSaleItemRepository extends JpaRepository<StoreSaleItem, Long> {
    List<StoreSaleItem> findByStoreSaleIdOrderByIdAsc(Long storeSaleId);
}
