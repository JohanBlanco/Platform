package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.InstructorRoutinesPage;
import com.gymplatform.e2e.pages.MemberRoutinesPage;
import com.gymplatform.e2e.pages.StaffAppointmentsPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import com.gymplatform.e2e.support.TestData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** TC-INST-* — instructor atiende citas y completa rutinas. */
class InstructorWorkflowSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-INST-FLOW: ver agenda de citas y completar solicitud de rutina")
    void instructorViewsAppointmentsAndFulfillsRoutine() {
        loginAs(TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);

        shell().switchToProfile("Miembro");
        MemberRoutinesPage memberRoutines = new MemberRoutinesPage(driver, wait);
        memberRoutines.open(webBase());
        if (!memberRoutines.pageShowsPendingRequest()) {
            memberRoutines.requestRoutine(
                    "Solicitud para instructor E2E " + TestData.suffix(),
                    "Hipertrofia y movilidad");
        }

        shell().switchToProfile("Instructor");

        StaffAppointmentsPage staffCitas = new StaffAppointmentsPage(driver, wait);
        staffCitas.open(webBase());
        assertTrue(staffCitas.calendarLoaded(), "El calendario de citas debe cargar");

        InstructorRoutinesPage instructor = new InstructorRoutinesPage(driver, wait);
        instructor.open(webBase());
        instructor.openRequestsTab();
        boolean assigned = instructor.assignTemplateToFirstRequest();
        assumeTrue(assigned, "No hay solicitudes pendientes ni plantillas demo");
        assertTrue(instructor.hasCompletedTabContent(), "La rutina debe quedar completada");
    }
}
