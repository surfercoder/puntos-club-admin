import { gsap } from "gsap";

export const registerSlideAnimation = () => {
  gsap.registerEffect({
    name: "slide",
    effect: (
      targets: gsap.TweenTarget,
      config: {
        direction: "left" | "right" | "top" | "bottom";
        location: "in" | "out";
        duration: number;
        delay?: number;
        onComplete?: gsap.Callback | undefined;
      }
    ) => {
      return gsap.fromTo(
        targets,
        {
          x:
            config.location === "in"
              ? config.direction === "left"
                ? "-100%"
                : config.direction === "right"
                ? "100%"
                : "0%"
              : 0,
          y:
            config.location === "in"
              ? config.direction === "top"
                ? "-100%"
                : config.direction === "bottom"
                ? "100%"
                : "0%"
              : 0,
        },
        {
          delay: config.delay ?? 0,
          duration: config.duration ?? /* c8 ignore next */ 1.5,
          x:
            config.location === "out"
              ? config.direction === "left"
                ? "-100%"
                : config.direction === "right"
                ? "100%"
                : "0%"
              : 0,
          y:
            config.location === "out"
              ? config.direction === "top"
                ? "-100%"
                : config.direction === "bottom"
                ? "100%"
                : "0%"
              : 0,
          onComplete: config.onComplete ?? undefined,
        }
      );
    },
    extendTimeline: true,
  });
};
