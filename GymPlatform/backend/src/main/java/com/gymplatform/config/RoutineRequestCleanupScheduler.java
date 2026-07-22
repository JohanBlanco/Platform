package com.gymplatform.config;

import com.gymplatform.service.RoutineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RoutineRequestCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(RoutineRequestCleanupScheduler.class);

    private final RoutineService routineService;

    public RoutineRequestCleanupScheduler(RoutineService routineService) {
        this.routineService = routineService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void purgeCompletedOnStartup() {
        int count = routineService.purgeCompletedRoutineRequests();
        if (count > 0) {
            log.info("Al iniciar: {} solicitudes de rutina completadas eliminadas", count);
        }
    }

    /** Elimina solicitudes completadas hace más de 24 horas. */
    @Scheduled(cron = "0 0 * * * *")
    public void purgeCompletedHourly() {
        int count = routineService.purgeCompletedRoutineRequests();
        if (count > 0) {
            log.info("Solicitudes de rutina completadas eliminadas automáticamente: {}", count);
        }
    }
}
