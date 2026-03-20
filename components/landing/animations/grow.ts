import { gsap } from "gsap";

export const registerGrowAnimation = () => {
  gsap.registerEffect({
    name: "grow",
    effect: (targets: gsap.TweenTarget, config?: { delay: number }) => {
      return gsap.fromTo(
        targets,
        {
          scale: 0,
        },
        {
          scale: 1,
          duration: 2,
          delay: config?.delay ?? 0,
        }
      );
    },
    extendTimeline: true,
  });
};
