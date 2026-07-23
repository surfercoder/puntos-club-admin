"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { completeTour } from "@/actions/dashboard/tour/actions";
import type { Tour, StepOptions } from "shepherd.js";

async function loadShepherd() {
  return (await import("shepherd.js")).default;
}

function safeCancelTour(tour: Tour | null) {
  if (!tour) return;
  try {
    tour.cancel();
  } catch {
    // ignore
  }
}

interface DashboardTourProps {
  userRole: string | null;
  userId: string;
  tourCompleted: boolean;
}

export function DashboardTour({ userRole, userId, tourCompleted }: DashboardTourProps) {
  const t = useTranslations("Tour");
  const initialized = useRef(false);

  useEffect(() => {
    if (userRole !== "owner") return;
    if (tourCompleted) return;
    if (initialized.current) return;

    initialized.current = true;

    let tour: Tour | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const markCompleted = () => {
      completeTour(userId).catch(console.error);
    };

    const initTour = async () => {
      const Shepherd = await loadShepherd();

      const localTour: Tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: false },
          scrollTo: { behavior: "smooth", block: "center" },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 6,
        },
      });

      const nextButton = {
        text: t("next"),
        action() {
          localTour.next();
        },
        classes: "shepherd-button-primary",
      };

      const backButton = {
        text: t("back"),
        action() {
          localTour.back();
        },
        classes: "shepherd-button-secondary",
      };

      const doneButton = {
        text: t("done"),
        action() {
          markCompleted();
          localTour.complete();
        },
        classes: "shepherd-button-primary",
      };

      const skipButton = {
        text: t("skip"),
        action() {
          localTour.cancel();
        },
        classes: "shepherd-button-secondary",
      };

      const stepDefs: StepOptions[] = [
        {
          id: "welcome",
          title: t("welcome.title"),
          text: t("welcome.text"),
          buttons: [skipButton, { ...nextButton, text: t("startTour") }],
        },
        {
          id: "qr-code",
          title: t("qrCode.title"),
          text: t("qrCode.text"),
          attachTo: {
            element: 'a[href="/dashboard/qr"]',
            on: "right",
          },
          buttons: [backButton, nextButton],
        },
        {
          id: "points-rules",
          title: t("pointsRules.title"),
          text: t("pointsRules.text"),
          attachTo: {
            element: 'a[href="/dashboard/points-rules"]',
            on: "right",
          },
          buttons: [backButton, nextButton],
        },
        {
          id: "branches",
          title: t("branches.title"),
          text: t("branches.text"),
          attachTo: {
            element: 'a[href="/dashboard/branch"]',
            on: "right",
          },
          buttons: [backButton, nextButton],
        },
        {
          id: "products",
          title: t("products.title"),
          text: t("products.text"),
          attachTo: {
            element: 'a[href="/dashboard/product"]',
            on: "right",
          },
          buttons: [backButton, nextButton],
        },
        {
          id: "beneficiaries",
          title: t("beneficiaries.title"),
          text: t("beneficiaries.text"),
          attachTo: {
            element: 'a[href="/dashboard/beneficiary"]',
            on: "right",
          },
          buttons: [backButton, nextButton],
        },
        {
          id: "notifications",
          title: t("notifications.title"),
          text: t("notifications.text"),
          attachTo: {
            element: 'a[href="/dashboard/notifications"]',
            on: "right",
          },
          buttons: [backButton, nextButton],
        },
        {
          id: "complete",
          title: t("complete.title"),
          text: t("complete.text"),
          buttons: [doneButton],
        },
      ];

      const totalSteps = stepDefs.length;
      const steps: StepOptions[] = stepDefs.map((step, idx) => {
        const dots = Array.from({ length: totalSteps }, (_, i) =>
          `<span class="shepherd-progress-dot${i === idx ? " shepherd-progress-dot--active" : ""}"></span>`
        ).join("");
        const progress = `<div class="shepherd-progress">${dots}<span class="shepherd-progress-text">${idx + 1} / ${totalSteps}</span></div>`;
        return { ...step, text: `${step.text /* c8 ignore next */ ?? ""}${progress}` };
      });

      localTour.addSteps(steps);
      tour = localTour;

      /* c8 ignore next 3 */
      timer = setTimeout(() => {
        localTour.start();
      }, 800);
    };

    initTour().catch(console.error);

    return () => {
      clearTimeout(timer);
      safeCancelTour(tour);
    };
  }, [userRole, userId, tourCompleted, t]);

  return null;
}
