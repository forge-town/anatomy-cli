import { ArrowUpRight, GitBranch, ShieldCheck, FolderTree } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MonoBlockCanvas } from "@/components/mono-block-canvas";

const entries = [
  { index: "01", key: "define", href: "/docs/definition", Icon: FolderTree },
  { index: "02", key: "check", href: "/docs/anatomy", Icon: ShieldCheck },
  { index: "03", key: "ship", href: "/docs/ci", Icon: GitBranch },
] as const;

const PixelMark = ({ index }: { index: number }) => (
  <span aria-hidden="true" className="grid size-12 grid-cols-3 grid-rows-3 gap-px bg-[#26352e] p-px">
    {Array.from({ length: 9 }, (_, cell) => (
      <i className={cell === (index * 2) % 9 ? "bg-[#d9654b]" : (cell + index) % 3 === 0 ? "bg-[#26352e]" : "bg-[#f2efe8]"} key={cell} />
    ))}
  </span>
);

const StructureIndexRail = () => {
  const { t } = useTranslation();
  return <nav aria-label={t("homePage.monoRailLabel")} className="relative z-20 grid grid-cols-3 border-t-2 border-[#26352e] bg-[#f2efe8]">
    {entries.map(({ index, key, href, Icon }, entryIndex) => (
      <Link className="group relative min-w-0 border-r border-[#26352e] last:border-r-0 focus-visible:z-30 focus-visible:outline-4 focus-visible:outline-[#d9654b]" key={key} to={href as never}>
        <span className="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end bg-[#f2efe8] p-3 transition-[height,background-color] duration-300 ease-out group-hover:z-20 group-hover:h-[15rem] group-hover:bg-[#d5ef91] group-focus-visible:z-20 group-focus-visible:h-[15rem] group-focus-visible:bg-[#d5ef91] motion-reduce:transition-none">
          <span className="absolute inset-x-3 top-4 opacity-0 transition-opacity delay-75 duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-100">
            <PixelMark index={entryIndex} />
            <span className="mt-4 block line-clamp-3 text-xs font-medium leading-5 text-[#26352e]/65">{t(`homePage.features.${key}.copy`)}</span>
            <span className="mt-3 flex items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#9b4637]"><span>{t(`homePage.features.${key}.link`)}</span><ArrowUpRight size={14} /></span>
          </span>
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 font-mono text-xs font-bold tracking-[0.08em] text-[#9b4637]">{index}</span>
            <strong className="block truncate text-sm font-bold tracking-[-0.025em]">{t(`homePage.features.${key}.title`)}</strong>
            <Icon aria-hidden="true" className="ml-auto size-3.5 shrink-0 opacity-45" />
          </span>
        </span>
      </Link>
    ))}
  </nav>;
};

export const MonoLaunchHero = () => {
  const { t } = useTranslation();
  return <section className="relative isolate grid min-h-[calc(100svh-4rem)] overflow-visible bg-[#f2efe8] text-[#26352e] lg:grid-cols-[minmax(0,1fr)_minmax(27rem,42vw)]">
    <section className="grid min-h-[650px] min-w-0 grid-rows-[minmax(0,1fr)_7.5rem] border-b-2 border-[#26352e] lg:min-h-0 lg:border-b-0 lg:border-r-2">
      <header className="relative flex min-h-0 flex-col justify-between overflow-hidden p-7 sm:p-9 lg:p-11">
        <div className="relative z-10 flex items-start justify-between gap-6">
          <p className="whitespace-nowrap font-mono text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-[#9b4637]">{t("homePage.monoEyebrow")}</p>
          <div className="grid grid-cols-2 border border-[#26352e] bg-[#dbe5dd] font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] tabular-nums max-[560px]:hidden"><span className="border-r border-[#26352e] px-3 py-2">{t("homePage.monoModules")}</span><span className="px-3 py-2">{t("homePage.monoRules")}</span></div>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-[0.17em] right-5 font-mono text-[17rem] font-black leading-none tracking-[-0.12em] text-[#26352e]/[0.035]">01</span>
        <div className="relative z-10 max-w-[44rem]">
          <div className="mb-6 flex max-w-[40rem] items-center gap-3 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-[#26352e]/55"><span aria-hidden="true" className="flex h-4 items-end gap-1"><i className="h-2 w-1 bg-[#26352e]" /><i className="h-3 w-1 bg-[#26352e]" /><i className="h-4 w-1 bg-[#d9654b]" /></span><span className="whitespace-nowrap">{t("homePage.monoMeta")}</span><span aria-hidden="true" className="h-px min-w-4 flex-1 bg-[#26352e]/30" /><span className="whitespace-nowrap tabular-nums">{t("homePage.monoUnit")}</span></div>
          <h1 className="text-balance font-mono font-normal tracking-[-0.06em]"><span className="flex items-baseline whitespace-nowrap text-[clamp(4rem,10vw,10.5rem)] leading-[0.78]"><span>ANATOMY</span><span className="ml-[0.02em] text-[#d9654b]">.</span></span><span className="mt-5 flex max-w-[12ch] items-center text-[clamp(2.7rem,4.7vw,5rem)] font-semibold leading-[1.02] tracking-[-0.065em]">{t("homePage.monoTitle")}<i aria-hidden="true" className="ml-[0.18em] size-[0.18em] shrink-0 bg-[#d9654b]" /></span></h1>
          <p className="mt-7 max-w-[39ch] border-l-2 border-[#d9654b] pl-4 text-pretty text-base font-medium leading-[1.65] text-[#26352e]/70">{t("homePage.monoDescription")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Button nativeButton={false} render={<Link to={"/docs/installation" as never} />} size="lg" className="rounded-none border-2 border-[#d9654b] bg-[#d9654b] px-6 text-white shadow-[5px_5px_0_#26352e] hover:bg-[#b94f3b]">{t("homePage.monoPrimaryCta")} <ArrowUpRight size={16} /></Button><Button nativeButton={false} render={<a href="https://github.com/forge-town/anatomy-cli" target="_blank" rel="noreferrer" />} size="lg" variant="outline" className="rounded-none border-2 border-[#26352e] bg-transparent px-6 text-[#26352e] hover:bg-[#dbe5dd]">{t("homePage.monoSecondaryCta")} <ArrowUpRight size={16} /></Button></div>
        </div>
      </header>
      <StructureIndexRail />
    </section>

    <aside className="grid min-h-[560px] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-[#dbe5dd] text-[#26352e]">
      <header className="flex items-center justify-between border-b-2 border-[#26352e] bg-[#d5ef91] px-5 py-4 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em]"><span>{t("homePage.monoConsoleTitle")}</span><span>{t("homePage.monoConsoleMode")}</span></header>
      <div className="min-h-0 bg-[#dbe5dd] p-5 sm:p-7"><div className="grid h-full min-h-[340px] grid-rows-[auto_minmax(0,1fr)] border-2 border-[#26352e] bg-[#f2efe8] shadow-[8px_8px_0_#d9654b]"><div className="flex items-center justify-between border-b-2 border-[#26352e] px-3 py-2 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.1em]"><span>ANATOMY.BMP / STRUCTURE</span><span>36 × 26</span></div><MonoBlockCanvas /></div></div>
      <footer className="border-t-2 border-[#26352e] bg-[#cbd8d0] p-5 sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-[#9b4637]">{t("homePage.monoConsoleEyebrow")}</p><h2 className="mt-3 text-balance text-[1.65rem] font-bold leading-[1.05] tracking-[-0.05em]">{t("homePage.monoConsoleTitle2")}</h2><p className="mt-3 max-w-[42ch] text-sm leading-[1.6] text-[#26352e]/70">{t("homePage.monoConsoleDescription")}</p></div><div className="shrink-0 border-2 border-[#26352e] bg-[#d5ef91] px-3 py-2 text-right"><span className="block font-mono text-[9px] font-bold uppercase tracking-[0.12em]">CONFORMS</span><strong className="mt-1 block text-2xl leading-none">{t("homePage.statusPass")}</strong></div></div><Link className="mt-5 flex items-center justify-between border-t border-[#26352e]/35 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#9b4637] hover:text-[#d9654b]" to={"/docs/anatomy" as never}>{t("homePage.monoConsoleLink")}<ArrowUpRight size={15} /></Link></footer>
    </aside>
  </section>;
};
