import { useLanguage } from "@/lib/i18n/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Introduction = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#151922] via-[#0b0d10] to-[#0b0d10]">
      <Header />
      <div className="container max-w-[1200px] mx-auto px-4 sm:px-5 md:px-6 py-10 sm:py-14 md:py-20 lg:py-24 xl:py-28 mt-[88px] sm:mt-20">
        {/* HERO */}
        <section className="text-center mb-10 sm:mb-14 md:mb-20 lg:mb-24">
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-3 sm:mb-4 tracking-tight px-2"
            dangerouslySetInnerHTML={{ __html: t.introduction.hero.title }}
          />
          <p className="max-w-[920px] mx-auto text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] leading-relaxed px-1">
            {t.introduction.hero.p1}
          </p>
          <p className="max-w-[920px] mx-auto text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] leading-relaxed mt-2 sm:mt-3 px-1">
            {t.introduction.hero.p2}
          </p>
        </section>

        {/* WHY */}
        <section className="mb-10 sm:mb-12 md:mb-16 lg:mb-20">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4 tracking-tight">
            <span className="text-[#f2b94b]">{t.introduction.why.h}</span>
          </h2>
          <p className="max-w-[920px] text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc]">
            {t.introduction.why.p1}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-5 sm:mt-6">
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.why.c1h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.why.c1p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.why.c2h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.why.c2p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.why.c3h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.why.c3p}
              </p>
            </div>
          </div>

          <p className="max-w-[920px] text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] mt-4 sm:mt-5" dangerouslySetInnerHTML={{ __html: t.introduction.why.p2 }} />
          <p className="max-w-[920px] text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.why.p3 }} />
        </section>

        {/* LIFECYCLE / LEADERS */}
        <section className="mb-10 sm:mb-12 md:mb-16 lg:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.life.c1h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.life.c1p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.life.c2h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.life.c2p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.life.c3h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.life.c3p}
              </p>
            </div>
          </div>
        </section>

        {/* CORE DIRECTION */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.core.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]">
            {t.introduction.core.p1}
          </p>
          <ul className="list-none mt-3 sm:mt-4">
            {[t.introduction.core.li1, t.introduction.core.li2, t.introduction.core.li3, t.introduction.core.li4, t.introduction.core.li5].map((item, index) => (
              <li key={index} className="relative pl-4 sm:pl-5 mb-2 sm:mb-2.5 text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                <span className="absolute left-0 top-1 sm:top-1.5 text-[10px] text-[#f2b94b]">●</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </section>

        {/* COMMUNITY STRATEGY */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.com.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]" dangerouslySetInnerHTML={{ __html: t.introduction.com.p1 }} />
          <ul className="list-none mt-3 sm:mt-4">
            {[t.introduction.com.li1, t.introduction.com.li2, t.introduction.com.li3].map((item, index) => (
              <li key={index} className="relative pl-4 sm:pl-5 mb-2 sm:mb-2.5 text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                <span className="absolute left-0 top-1 sm:top-1.5 text-[10px] text-[#f2b94b]">●</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3 sm:mt-4" dangerouslySetInnerHTML={{ __html: t.introduction.com.p2 }} />
          <ul className="list-none mt-3 sm:mt-4">
            {[t.introduction.com.li4, t.introduction.com.li5, t.introduction.com.li6].map((item, index) => (
              <li key={index} className="relative pl-4 sm:pl-5 mb-2 sm:mb-2.5 text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                <span className="absolute left-0 top-1 sm:top-1.5 text-[10px] text-[#f2b94b]">●</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3 sm:mt-4" dangerouslySetInnerHTML={{ __html: t.introduction.com.p3 }} />
        </section>

        {/* POSITION */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.pos.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]" dangerouslySetInnerHTML={{ __html: t.introduction.pos.p1 }} />

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.pos.c1h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.pos.c1p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.pos.c2h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.pos.c2p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.pos.c3h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.pos.c3p}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-4 sm:mt-5" dangerouslySetInnerHTML={{ __html: t.introduction.pos.p2 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.pos.p3 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.pos.p4 }} />

          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4 mt-6 sm:mt-7 md:mt-8">
            <span className="text-[#f2b94b]">{t.introduction.pos.mapH}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]">
            {t.introduction.pos.mapP}
          </p>
          <pre className="bg-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 overflow-x-auto text-[#b8c0cc] text-[10px] sm:text-xs md:text-sm mt-3 sm:mt-4 whitespace-pre-wrap font-mono">
            {t.introduction.pos.mapPre}
          </pre>
        </section>

        {/* GLOBAL VISION */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.g.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]" dangerouslySetInnerHTML={{ __html: t.introduction.g.p1 }} />
          <ul className="list-none mt-3 sm:mt-4">
            {[t.introduction.g.li1, t.introduction.g.li2, t.introduction.g.li3].map((item, index) => (
              <li key={index} className="relative pl-4 sm:pl-5 mb-2 sm:mb-2.5 text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                <span className="absolute left-0 top-1 sm:top-1.5 text-[10px] text-[#f2b94b]">●</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3 sm:mt-4" dangerouslySetInnerHTML={{ __html: t.introduction.g.p2 }} />
          <ul className="list-none mt-3 sm:mt-4">
            {[t.introduction.g.li4, t.introduction.g.li5, t.introduction.g.li6].map((item, index) => (
              <li key={index} className="relative pl-4 sm:pl-5 mb-2 sm:mb-2.5 text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                <span className="absolute left-0 top-1 sm:top-1.5 text-[10px] text-[#f2b94b]">●</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3 sm:mt-4" dangerouslySetInnerHTML={{ __html: t.introduction.g.p3 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.g.p4 }} />
        </section>

        {/* BAG SYSTEM */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.bag.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]" dangerouslySetInnerHTML={{ __html: t.introduction.bag.p1 }} />

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-4 sm:mt-5">
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">ABAG (Airbag)</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed" dangerouslySetInnerHTML={{ __html: t.introduction.bag.abag }} />
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">BBAG (Plan B)</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed" dangerouslySetInnerHTML={{ __html: t.introduction.bag.bbag }} />
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">CBAG (Capital Protection)</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed" dangerouslySetInnerHTML={{ __html: t.introduction.bag.cbag }} />
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">SBAG (Super Bag)</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed" dangerouslySetInnerHTML={{ __html: t.introduction.bag.sbag }} />
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-4" dangerouslySetInnerHTML={{ __html: t.introduction.bag.p2 }} />
        </section>

        {/* LEADER STRUCTURE */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.lead.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]">
            {t.introduction.lead.p1}
          </p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.lead.p2 }} />

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.lead.c1h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.lead.c1p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.lead.c2h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.lead.c2p}
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-[#f2b94b] mb-2 sm:mb-2.5 tracking-tight">
                {t.introduction.lead.c3h}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#b8c0cc] leading-relaxed">
                {t.introduction.lead.c3p}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-4" dangerouslySetInnerHTML={{ __html: t.introduction.lead.p3 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-2 sm:mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.lead.p4 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-2 sm:mt-3">
            {t.introduction.lead.p5}
          </p>
        </section>

        {/* INVESTMENT REALITY */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-6 sm:mt-8 md:mt-10 lg:mt-14 xl:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.inv.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]" dangerouslySetInnerHTML={{ __html: t.introduction.inv.p1 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.inv.p2 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.inv.p3 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.inv.p4 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.inv.p5 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.inv.p6 }} />
        </section>

        {/* FINAL */}
        <section className="bg-gradient-to-b from-[#141822] to-[#0f1218] border border-white/8 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 xl:p-16 mt-10 sm:mt-12 md:mt-16 lg:mt-20">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3 sm:mb-4">
            <span className="text-[#f2b94b]">{t.introduction.fin.h}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px]">
            {t.introduction.fin.p1}
          </p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3" dangerouslySetInnerHTML={{ __html: t.introduction.fin.p2 }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#b8c0cc] max-w-[920px] mt-3">
            {t.introduction.fin.p3}
          </p>
        </section>

        <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-28 text-center text-[#6c7380] text-xs sm:text-sm">
          {t.introduction.foot}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Introduction;
