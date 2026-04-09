"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Engines() {
  const t = useTranslations("Landing.engines");

  useGSAP(
    () => {
      gsap.fromTo(
        ".landing-go-down",
        {
          y: "-100%",
        },
        {
          y: 0,
          duration: 1,
          delay: 1,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".landing-go-down",
            start: "bottom 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      const engines = document.querySelectorAll(".landing-engine");

      engines.forEach((engine, index) => {
        const isLeft = engine.classList.contains("landing-left-engines");
        gsap.to(engine, {
          scrollTrigger: {
            trigger: engines[0],
            start: "top 60%",
            end: "300% top",
            toggleActions: "play reverse play reverse",
          },
          rotate: isLeft ? -200 : 200,
          duration: 3,
          ease: "power1.inOut",
          delay: index * 0.4,
        });
      });

      const texts = document.querySelectorAll(".landing-text");
      texts.forEach((text, index) => {
        const isLeft = text.classList.contains("landing-left");
        gsap.fromTo(
          text,
          { x: isLeft ? 130 : -130, opacity: 0 },
          {
            scrollTrigger: {
              trigger: texts[0],
              start: "top 65%",
              end: "420% top",
              toggleActions: "play reverse play reverse",
            },
            x: isLeft ? 145 : -145,
            opacity: 1,
            duration: 2,
            ease: "power1.inOut",
            delay: index * 0.6,
          }
        );
      });
    },
    { scope: ".landing-engines-container" }
  );

  return (
    <div className="flex flex-col landing-engines-container w-full relative h-[960px] md:h-[900px] overflow-hidden -mt-4">
      <div
        className="w-full h-4 absolute top-0 z-[8]"
        style={{ backgroundColor: "#FF4573" }}
      />
      <div className="landing-go-down flex relative md:w-full justify-center items-center mb-5 h-36 md:h-40 lg:h-68 overflow-hidden">
        <div
          className="w-[250vw] h-[250vw] md:w-[400vw] md:h-[400vw] absolute bottom-0 rounded-full z-[8]"
          style={{ backgroundColor: "#FF4573" }}
        />
        <h1 className="h-fit text-white font-bold max-w-80 text-center text-2xl mb-2 md:text-3xl lg:text-5xl md:max-w-fit md:mt-3 z-10">
          {t("title")}
        </h1>
      </div>
      <div className="flex flex-1 relative md:justify-center mt-12 sm:mt-6">
        <Image
          src="/images/engines/blue-engine.png"
          alt=""
          className="w-[127px] h-[127px] md:w-32 md:h-32 lg:w-36 lg:h-36 landing-engine landing-right-engines absolute -ml-14 md:-ml-36 md:mt-0"
        width={127} height={127} />
        <div className="flex flex-col absolute md:items-end ml-64 md:mt-4 md:-ml-40 lg:-ml-80 landing-text landing-right opacity-0 gap-1">
          <h1 className="font-bold text-lg md:text-xl lg:text-3xl md:text-right">
            {t("updateData.title")}
          </h1>
          <p className="text-base md:text-lg lg:text-xl w-56 md:w-48 md:text-right">
            {t("updateData.description")}
          </p>
        </div>
        <Image
          src="/images/engines/pink-engine.png"
          alt=""
          className="w-[153px] h-[153px] md:w-44 md:h-44 lg:w-48 lg:h-48 landing-engine landing-left-engines absolute mt-[86px] ml-2 md:mt-[104px] md:-ml-10 lg:mt-[114px] lg:-ml-12"
        width={153} height={153} />
        <div className="flex flex-col absolute mt-40 ml-5 md:mt-32 md:ml-20 lg:ml-36 landing-text landing-left gap-1">
          <h1 className="font-bold text-lg md:text-xl lg:text-3xl md:-ml-2">
            {t("earnPoints.title")}
          </h1>
          <p className="text-base md:text-lg lg:text-xl w-52 lg:w-72">
            {t("earnPoints.description")}
          </p>
        </div>
        <Image
          src="/images/engines/orange-engine.png"
          alt=""
          className="w-[90px] h-[90px] md:w-24 md:h-24 landing-engine landing-right-engines md:landing-left-engines absolute mt-52 -ml-10 md:mt-[220px] md:mr-48 lg:mt-[240px] lg:mr-56"
        width={90} height={90} />
        <Image
          src="/images/engines/blue-engine.png"
          alt=""
          className="w-[100px] h-[100px] md:w-28 md:h-28 lg:w-32 lg:h-32 landing-engine landing-right-engines absolute mt-[230px] ml-10 md:mt-[250px] md:ml-20 lg:mt-[240px] lg:ml-48"
        width={100} height={100} />
        <Image
          src="/images/engines/orange-engine.png"
          alt=""
          className="w-[150px] h-[150px] md:w-[118px] md:h-[118px] lg:w-40 lg:h-40 landing-engine landing-left-engines absolute mt-[295px] ml-16 md:mt-[306px] md:ml-[210px] lg:mt-[300px] lg:ml-[360px]"
        width={150} height={150} />
        <div className="flex flex-col absolute mt-[300px] ml-16 md:mt-[320px] md:ml-[240px] lg:mt-[320px] lg:ml-[460px] landing-text landing-left opacity-0 gap-1">
          <h1 className="font-bold text-lg md:text-xl lg:text-3xl -ml-2">
            {t("checkBalance.title")}
          </h1>
          <p className="text-base md:text-lg lg:text-xl w-40 md:w-60">
            {t("checkBalance.description")}
          </p>
        </div>
        <Image
          src="/images/engines/pink-engine.png"
          alt=""
          className="w-[156px] h-[156px] md:w-40 md:h-40 lg:w-48 lg:h-48 landing-engine landing-left-engines absolute mt-[295px] -ml-20 md:mt-[340px] md:-ml-8 lg:mt-[325px]"
        width={156} height={156} />
        <div className="flex flex-col sm:w-64 md:w-96 gap-1 absolute md:items-end mt-[440px] ml-[285px] md:mt-[380px] md:ml-[-260px] lg:mt-[380px] lg:-ml-80 landing-text landing-right opacity-0">
          <h1 className="font-bold text-lg md:text-xl lg:text-3xl md:text-right lg:mr-2">
            {t("browseCatalog.title")}
          </h1>
          <p className="text-base md:text-lg lg:text-xl w-56 md:w-56 lg:w-[290px] md:text-right">
            {t("browseCatalog.description")}
          </p>
        </div>
        <Image
          src="/images/engines/blue-engine.png"
          alt=""
          className="md:w-[135px] md:h-[135px] w-[100px] h-[100px] landing-engine landing-right-engines absolute mt-[417px] ml-9 md:mt-[480px] md:-ml-16 lg:mt-[500px] lg:-ml-8"
        width={135} height={135} />
        <div className="flex flex-col absolute mt-[600px] ml-16 md:mt-[500px] md:ml-10 lg:mt-[520px] lg:ml-20 landing-text landing-left opacity-0 gap-1">
          <h1 className="font-bold text-lg md:text-xl lg:text-3xl">
            {t("claimReward.title")}
          </h1>
          <p className="text-base md:text-lg lg:text-xl w-40 md:w-64 md:ml-2">
            {t("claimReward.description")}
          </p>
        </div>
        <Image
          src="/images/engines/orange-engine.png"
          alt=""
          className="md:w-24 md:h-24 w-[170px] h-[170px] mt-[440px] -ml-[90px] landing-engine landing-left-engines absolute md:mt-[560px] md:mr-[120px]"
        width={170} height={170} />
        <Image
          src="/images/engines/pink-engine.png"
          alt=""
          className="md:w-32 md:h-32 mt-[540px] ml-3 w-[180px] h-[180px] landing-engine landing-right-engines absolute md:mt-[320px] md:ml-6 md:hidden"
        width={180} height={180} />
      </div>
    </div>
  );
}
