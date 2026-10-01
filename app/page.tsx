import Link from "next/link";
import { ArrowRightIcon, StorefrontIcon } from "@/components/icons";
import { FlowStory } from "@/components/landing/flow-story";
import { HeroCollage } from "@/components/landing/hero-collage";
import { Reveal } from "@/components/landing/reveal";
import { Market } from "@/components/landing/market";
import { Problem } from "@/components/landing/problem";
import { StoriesCarousel } from "@/components/landing/stories-carousel";
import { ToolsTabs } from "@/components/landing/tools-tabs";
import { LanguageToggle } from "@/components/language-toggle";
import { RazorpayLogo } from "@/components/razorpay-logo";
import type { Translate } from "@/lib/i18n/dictionaries";
import { getT } from "@/lib/i18n/server";

const PAY_METHODS = ["UPI", "Google Pay", "PhonePe", "Paytm", "BHIM", "RuPay", "Visa", "Mastercard", "Netbanking", "WhatsApp", "SMS"];

function DemoButton({ t, large = false, inverse = false }: { t: Translate; large?: boolean; inverse?: boolean }) {
  return (
    <Link
      href="/app"
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors duration-200 ease-standard focus-visible:outline-2 ${
        inverse ? "bg-white text-primary hover:bg-primary-faded" : "bg-primary text-white hover:bg-primary-hover"
      } focus-visible:outline-offset-2 focus-visible:outline-primary ${
        large ? "h-12 px-6 text-[15px]" : "h-10 px-4 text-sm"
      }`}
    >
      {t("landing.demo")}
      {large && <ArrowRightIcon size={18} />}
    </Link>
  );
}

/** Centred section heading, like razorpay.com/x. */
function SectionTitle({ eyebrow, title, sub, dark = false }: { eyebrow: string; title: string; sub?: string; dark?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className={`text-xs font-semibold tracking-widest uppercase ${dark ? "text-primary-on-dark" : "text-primary"}`}>{eyebrow}</p>
      <h2 className={`mt-2 font-heading text-[28px] leading-9 font-semibold tracking-tight md:text-[42px] md:leading-[50px] ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      {sub && <p className={`mt-3 text-[15px] leading-6 md:text-base ${dark ? "text-white/65" : "text-ink-subtle"}`}>{sub}</p>}
    </Reveal>
  );
}

/**
 * UD-28, UD-36 and UD-38 Landing page in the razorpay.com/x style. Five sections, one job each:
 * hero collage, the flow as a scroll story, tools as stacked cards with looping demos, a shop carousel
 * and a closing call to action.
 */
export default async function LandingPage() {
  const t = await getT();

  return (
    <div className="min-h-dvh bg-surface">
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
            <RazorpayLogo tone="dark" />
            <span className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden="true" />
            <span className="hidden text-sm font-semibold text-primary sm:block">{t("app.name")}</span>
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-5 text-sm font-medium text-ink-subtle lg:flex">
            <a href="#problem" className="hover:text-ink">{t("lp.nav.problem")}</a>
            <a href="#market" className="hover:text-ink">{t("lp.nav.market")}</a>
            <a href="#flow" className="hover:text-ink">{t("lp.nav.how")}</a>
            <a href="#tools" className="hover:text-ink">{t("lp.nav.tools")}</a>
            <a href="#stories" className="hover:text-ink">{t("lp.nav.stories")}</a>
          </nav>
          <LanguageToggle />
          <DemoButton t={t} />
        </div>
      </header>

      <main>
        {/* 1. Hero: centred headline over the app, with what it does floating around it */}
        <section className="relative overflow-hidden bg-linear-to-b from-[#EAF1FF] via-[#F5F8FF] to-surface">
          <div className="mx-auto max-w-6xl px-4 pt-10 text-center md:pt-16">
            <div>
              <p style={{ animationDelay: "0ms" }} className="lp-rise inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-low ring-1 ring-primary/15">
                <StorefrontIcon size={14} />
                {t("landing.tagline")}
              </p>
              <h1 style={{ animationDelay: "120ms" }} className="lp-rise mx-auto mt-4 max-w-3xl font-heading text-[34px] leading-10 font-semibold tracking-tight text-ink md:text-[56px] md:leading-15.5">
                {t("lp.hero.title1")} <span className="text-primary">{t("lp.hero.title2")}</span>
              </h1>
              <p style={{ animationDelay: "240ms" }} className="lp-rise mx-auto mt-4 max-w-xl text-[15px] leading-6 text-ink-subtle md:text-base">{t("landing.subtitle")}</p>
              <div style={{ animationDelay: "360ms" }} className="lp-rise mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <DemoButton t={t} large />
                <a href="#flow" className="inline-flex h-12 items-center justify-center rounded-sm px-5 text-[15px] font-semibold text-primary hover:bg-primary-faded">
                  {t("lp.hero.see")}
                </a>
              </div>
              <p className="mt-2 text-xs text-ink-muted">{t("landing.demoHint")}</p>
            </div>
            <HeroCollage t={t} />
          </div>

          <div aria-label={t("lp.strip")} role="group" className="border-y border-line bg-surface/80 py-4">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
              <p className="shrink-0 text-xs font-semibold tracking-wide text-ink-muted uppercase">{t("lp.strip")}</p>
              <div className="relative min-w-0 flex-1 overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div className="lp-marquee flex w-max gap-3">
                  {[...PAY_METHODS, ...PAY_METHODS].map((m, i) => (
                    <span key={i} aria-hidden={i >= PAY_METHODS.length} className="rounded-full border border-line bg-page px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-subtle">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. The problem */}
        <section id="problem" className="scroll-mt-16 bg-surface py-16 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle eyebrow={t("lp.pb.eyebrow")} title={t("lp.pb.title")} sub={t("lp.pb.sub")} />
            <Problem t={t} />
          </div>
        </section>

        {/* 3. The market, in numbers */}
        <section id="market" className="relative scroll-mt-16 overflow-hidden bg-[#0A1630] py-16 md:py-28">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4">
            <SectionTitle dark eyebrow={t("lp.mk.eyebrow")} title={t("lp.mk.title")} sub={t("lp.mk.sub")} />
            <Market t={t} />
          </div>
        </section>

        {/* 4. The fix, as a scroll story */}
        <section id="flow" className="scroll-mt-16 bg-surface pt-16 pb-10 md:pt-28 md:pb-16">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle eyebrow={t("lp.nav.how")} title={t("lp.flow.title")} sub={t("lp.flow.sub")} />
            <div className="mt-8 md:mt-4">
              <FlowStory />
            </div>
          </div>
        </section>

        {/* 5. Tools, as stacked cards with looping demos */}
        <section id="tools" className="scroll-mt-16 bg-page py-16 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle eyebrow={t("lp.tools.eyebrow")} title={t("lp.tools.title")} />
            <div className="mt-8">
              <ToolsTabs />
            </div>
          </div>
        </section>

        {/* 6. Merchant stories */}
        <section id="stories" className="relative scroll-mt-16 overflow-hidden bg-[#060D1F] py-16 md:py-28">
          <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4">
            <SectionTitle dark eyebrow={t("lp.st.eyebrow")} title={t("lp.st.title")} sub={t("lp.st.note")} />
            <Reveal className="mt-10">
              <StoriesCarousel />
            </Reveal>
          </div>
        </section>

        {/* 7. Closing call to action */}
        <section className="px-4 py-14 md:py-20">
          <Reveal variant="scale" className="relative mx-auto max-w-6xl overflow-hidden rounded-xl bg-primary px-6 py-10 text-center text-white md:py-14">
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[#0A1630]/30 blur-3xl" aria-hidden="true" />
            <h2 className="relative font-heading text-[28px] leading-9 font-semibold tracking-tight md:text-[36px]">{t("landing.ctaTitle")}</h2>
            <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-white/85">{t("landing.ctaBody")}</p>
            <div className="relative mt-6">
              <DemoButton t={t} large inverse />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="pb-safe border-t border-line px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-ink-muted sm:flex-row">
          <RazorpayLogo tone="dark" className="scale-90" />
          <span>{t("landing.footer")}</span>
        </div>
      </footer>
    </div>
  );
}
