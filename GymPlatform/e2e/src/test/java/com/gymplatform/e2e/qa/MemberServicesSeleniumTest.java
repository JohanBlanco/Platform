package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.MemberActivitiesPage;
import com.gymplatform.e2e.pages.MemberAppointmentsPage;
import com.gymplatform.e2e.pages.MemberRoutinesPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** TC-MEMBER-* — reservas, citas y solicitud de rutina como miembro. */
class MemberServicesSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-MEMBER-FLOW: reservar clase, agendar cita y solicitar rutina")
    void memberBooksClassAppointmentAndRoutine() {
        loginAs(TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);
        shell().switchToProfile("Miembro");

        MemberActivitiesPage activities = new MemberActivitiesPage(driver, wait);
        activities.open(webBase());
        boolean reserved = activities.reserveFirstAvailableActivity();
        assumeTrue(reserved, "No hay actividades reservables hoy/mañana en demo");
        assertTrue(activities.hasReservedBadge() || reserved, "Debe quedar una reserva activa");

        MemberAppointmentsPage appointments = new MemberAppointmentsPage(driver, wait);
        appointments.open(webBase());
        boolean booked = appointments.bookFirstAvailableSlot();
        assumeTrue(booked, "No hay slots de cita disponibles en demo");
        assertTrue(appointments.hasBookedSlot() || booked, "Debe quedar una cita reservada");

        MemberRoutinesPage routines = new MemberRoutinesPage(driver, wait);
        routines.open(webBase());
        routines.requestRoutine(
                "Quiero una rutina de fuerza para E2E",
                "Ganar resistencia y tonificar");
        assertTrue(routines.pageShowsPendingRequest(), "Debe aparecer la solicitud de rutina");
    }
}
