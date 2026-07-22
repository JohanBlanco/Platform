package com.gymplatform.config;

import com.gymplatform.service.ActivityService;
import com.gymplatform.service.AppointmentRetentionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ActivityExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ActivityExpirationScheduler.class);

    private final ActivityService activityService;
    private final AppointmentRetentionService appointmentRetentionService;

    public ActivityExpirationScheduler(
            ActivityService activityService,
            AppointmentRetentionService appointmentRetentionService) {
        this.activityService = activityService;
        this.appointmentRetentionService = appointmentRetentionService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void purgeExpiredOnStartup() {
        int activityCount = activityService.purgeAllExpiredActivities();
        int appointmentCount = appointmentRetentionService.purgePassedAppointments();
        if (activityCount > 0 || appointmentCount > 0) {
            log.info(
                    "Al iniciar: {} actividades y {} citas con más de un mes eliminadas",
                    activityCount,
                    appointmentCount);
        }
    }

    /** Elimina actividades y citas que terminaron hace más de un mes. */
    @Scheduled(cron = "0 0 1 * * *")
    public void purgeExpiredActivitiesDaily() {
        int activityCount = activityService.purgeAllExpiredActivities();
        int appointmentCount = appointmentRetentionService.purgePassedAppointments();
        if (activityCount > 0 || appointmentCount > 0) {
            log.info(
                    "Retención automática: {} actividades y {} citas eliminadas",
                    activityCount,
                    appointmentCount);
        }
    }
}
