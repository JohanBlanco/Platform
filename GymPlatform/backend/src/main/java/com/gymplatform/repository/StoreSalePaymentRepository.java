package com.gymplatform.repository;

import com.gymplatform.domain.entity.StoreSalePayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreSalePaymentRepository extends JpaRepository<StoreSalePayment, Long> {
    List<StoreSalePayment> findByStoreSaleIdOrderByIdAsc(Long storeSaleId);
}
