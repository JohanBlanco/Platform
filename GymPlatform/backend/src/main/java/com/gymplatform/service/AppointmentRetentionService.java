package com.gymplatform.service;

import com.gymplatform.repository.AppointmentRequestRepository;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentRetentionService {

    private final AppointmentRequestRepository appointmentRequestRepository;

    public AppointmentRetentionService(AppointmentRequestRepository appointmentRequestRepository) {
        this.appointmentRequestRepository = appointmentRequestRepository;
    }

    /** Elimina únicamente citas con hora de fin anterior a un mes. */
    @Transactional
    public int purgePassedAppointments() {
        return appointmentRequestRepository.deletePassedBefore(
                ZonedDateTime.now(ZoneId.systemDefault()).minusMonths(1).toInstant());
    }
}
