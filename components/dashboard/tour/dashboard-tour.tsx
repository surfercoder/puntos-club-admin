"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Tour, StepOptions } from "shepherd.js";

const TOUR_STORAGE_KEY_PREFIX = "puntos_club_tour_v1_";

interface DashboardTourProps {
  userRole: string | null;
  userEmail: string;
}

export function DashboardTour({ userRole, userEmail }: DashboardTourProps) {
  const t = useTranslations("Tour");
  const initialized = useRef(false);
  const tourRef = useRef<Tour | null>(null);

  useEffect(() => {
    if (userRole !== "owner") return;
    if (initialized.current) return;

    const storageKey = `${TOUR_STORAGE_KEY_PREFIX}${userEmail}`;

    try {
      if (localStorage.getItem(storageKey) === "completed") return;
    } catch {
      return;
    }

    initialized.current = true;

    const markCompleted = () => {
      try {
        localStorage.setItem(storageKey, "completed");
      } catch { /* ignore localStorage errors */ }
    };

    const initTour = async () => {
      const { Tour: ShepherdTour } = await import("shepherd.js");

      const tour = new ShepherdTour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: false },
          scrollTo: { behavior: "smooth", block: "center" },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 6,
        },
      });

      tourRef.current = tour;

      const nextButton = {
        text: t("next"),
        action() {
          tour.next();
        },
        classes: "shepherd-button-primary",
      };

      const backButton = {
        text: t("back"),
        action() {
          tour.back();
        },
        classes: "shepherd-button-secondary",
      };

      const doneButton = {
        text: t("done"),
        action() {
          markCompleted();
          tour.complete();
        },
        classes: "shepherd-button-primary",
      };

      const skipButton = {
        text: t("skip"),
        action() {
          markCompleted();
          tour.cancel();
        },
        classes: "shepherd-button-secondary",
      };

      const steps: StepOptions[] = [
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

      tour.addSteps(steps);

      const timer = setTimeout(() => {
        if (tourRef.current) {
          tourRef.current.start();
        }
      }, 800);

      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | undefined;

    initTour()
      .then((fn) => {
        cleanup = fn;
      })
      .catch(console.error);

    return () => {
      cleanup?.();
      if (tourRef.current) {
        try {
          tourRef.current.cancel();
        } catch { /* ignore localStorage errors */ }
        tourRef.current = null;
      }
    };
  }, [userRole, userEmail, t]);

  return null;
}
