import { CheckCircleIcon, MessageCircleIcon } from "@/components/icons";
import type { Translate } from "@/lib/i18n/dictionaries";
import { HomeScreen, Phone } from "./phone";

/**
 * UD-38 Hero visual in the RazorpayX style: the app in the centre, with the things it does floating
 * around it on dotted connectors. On phones there is no room beside the phone, so the two cards sit
 * in a row under it, over its empty bottom edge, and never cover the screen. Server rendered. The
 * drift is CSS and stops for reduced motion.
 */
export function HeroCollage({ t }: { t: Translate }) {
  const card = "lp-float relative rounded-lg bg-white p-3 text-left shadow-high ring-1 ring-line md:absolute md:z-10";

  return (
    <div className="relative mx-auto mt-10 w-full max-w-4xl pb-8 md:mt-14 md:h-130 md:pb-0">
      {/* Soft glow and dotted connectors behind the phone */}
      <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <svg className="absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 896 520" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <path d="M250 110 C 330 110, 360 170, 448 200" stroke="#B8CCF5" strokeWidth="1.5" strokeDasharray="4 6" />
        <path d="M646 370 C 566 370, 536 320, 448 300" stroke="#B8CCF5" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>

      <div className="lp-rise relative flex justify-center md:absolute md:top-0 md:left-1/2 md:-translate-x-1/2" style={{ animationDelay: "450ms" }}>
        <Phone label={t("lp.hero.visual")}>
          <HomeScreen t={t} />
        </Phone>
      </div>

      {/* Phones: a row under the phone. Desktop: the wrapper disappears and the cards float beside it. */}
      <div className="relative z-10 -mt-12 grid grid-cols-2 gap-3 md:contents">
        <div className={`${card} md:top-12 md:left-4 md:w-56`}>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-[#1DA851]">
            <MessageCircleIcon size={12} /> WhatsApp
          </p>
          <p className="mt-1 rounded-md rounded-tl-none bg-[#DCF8C6] px-2 py-1.5 text-[11px] leading-4 text-ink md:text-xs">{t("lp.hero.c1")}</p>
        </div>

        <div className={`${card} flex items-center gap-2 md:right-4 md:bottom-28 md:w-56`} style={{ animationDelay: "-1.2s" }}>
          <CheckCircleIcon size={22} className="shrink-0 text-positive-intense" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-ink md:text-xs">{t("lp.phone.received")}</p>
            <p className="text-[10px] text-positive md:text-[11px]">{t("lp.phone.cleared")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
