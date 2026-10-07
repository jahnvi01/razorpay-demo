import Image from "next/image";
import type { MessageKey, Translate } from "@/lib/i18n/dictionaries";
import { Reveal } from "./reveal";

// Photos: Unsplash License (free for commercial use). Credits in public/landing/shops/CREDITS.txt
const SEGMENTS: { photo: string; title: MessageKey; body: MessageKey; alt: MessageKey }[] = [
  { photo: "/landing/shops/kirana.webp", title: "lp.seg.kirana", body: "lp.seg.kiranaB", alt: "lp.seg.kiranaAlt" },
  { photo: "/landing/shops/dairy.webp", title: "lp.seg.dairy", body: "lp.seg.dairyB", alt: "lp.seg.dairyAlt" },
  { photo: "/landing/shops/wholesale.webp", title: "lp.seg.wholesale", body: "lp.seg.wholesaleB", alt: "lp.seg.wholesaleAlt" },
];

/**
 * UD-57 Who it is for: three real shop photos, like OkCredit's segment cards. Each photo fills its card,
 * with the name and one line on how udhaar works there over a dark fade. A swipe row on phones.
 */
export function Segments({ t }: { t: Translate }) {
  return (
    <Reveal
      stagger
      className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {SEGMENTS.map((s) => (
        <figure key={s.title} className="relative aspect-4/5 w-[78%] shrink-0 snap-center overflow-hidden rounded-xl bg-gray-faded shadow-mid sm:w-[46%] md:w-auto">
          <Image src={s.photo} alt={t(s.alt)} fill sizes="(min-width: 768px) 33vw, 78vw" className="object-cover transition-transform duration-700 ease-standard hover:scale-105" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/85 via-black/45 to-transparent" aria-hidden="true" />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h3 className="font-heading text-xl font-semibold">{t(s.title)}</h3>
            <p className="mt-1 text-sm leading-5 text-white/85">{t(s.body)}</p>
          </figcaption>
        </figure>
      ))}
    </Reveal>
  );
}
