import type { Route } from "./+types/home";

const audit = Object.freeze({
	trades: 40,
	netPnl: -191.16,
	endingEquity: 9808.84,
	fees: 289.71,
	maxDrawdown: 2.13,
	truthCoreEvents: 467,
});

const gates = [
	"G01 Environment", "G02 Global kill", "G03 Market freshness", "G04 Sequence integrity",
	"G05 Session policy", "G06 Broker health", "G07 Audit availability", "G08 Spread",
	"G09 Liquidity", "G10 Slippage", "G11 Volatility", "G12 Macro / news",
	"G13 Strategy health", "G14 Confidence / evidence", "G15 Net edge", "G16 Stop integrity",
	"G17 Position sizing", "G18 Leverage", "G19 Daily loss", "G20 Drawdown",
	"G21 VaR / CVaR", "G22 Correlation / open risk",
] as const;

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "ΩMEGA PRIME Δ · Phoenix Edge" },
		{ name: "description", content: "PAPER/SHADOW evidence-first trading control plane." },
	];
}

export default function Home() {
	return (
		<main className="min-h-screen bg-[#05070b] text-slate-300">
			<div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
				<header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
					<div>
						<div className="font-mono text-[10px] uppercase tracking-[.28em] text-cyan-300">ΩMEGA PRIME Δ · CLOUDFLARE EDGE</div>
						<h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Phoenix Edge Command Surface</h1>
					</div>
					<div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-emerald-300">
						<span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.8)]" /> PAPER · LIVE LOCKED
					</div>
				</header>

				<section className="grid gap-5 py-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
					<div>
						<div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-cyan-300">prove edge fast · kill weak ideas fast · scale only survivors</div>
						<h2 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-.04em] text-white md:text-7xl">Evidence before <span className="text-cyan-300">capital.</span></h2>
						<p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">Cloudflare is the global UI/API/AI edge. It is not a broker authority. Agents research, EdgeForge and MIDAS reject weak evidence, AEGIS sizes and approves, VULTURE executes privately, and TruthCore preserves the record.</p>
					</div>
					<div className="rounded-2xl border border-amber-300/20 bg-gradient-to-b from-white/[.06] to-white/[.025] p-5 shadow-2xl">
						<div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">CURRENT VERDICT</div>
						<div className="mt-2 text-xl font-black text-amber-300">HOLD · EDGE NOT PROVEN</div>
						<div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full w-1/3 rounded-full bg-gradient-to-r from-rose-500 to-amber-300" /></div>
						<div className="mt-5 space-y-2 text-xs"><Row a="Software safety evidence" b="ESTABLISHED" ok/><Row a="Economic edge" b="NOT PROVEN"/><Row a="LIVE_SAFE" b="LOCKED"/></div>
					</div>
				</section>

				<section className="border-t border-white/10 py-8">
					<SectionHead kicker="LAST AUDITED PAPER CAMPAIGN" title="Measure the machine, not the story" />
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
						<Metric label="Trades" value={String(audit.trades)} />
						<Metric label="Net P&L" value={money(audit.netPnl)} danger />
						<Metric label="Ending equity" value={money(audit.endingEquity)} />
						<Metric label="Fees" value={money(audit.fees)} />
						<Metric label="Max drawdown" value={`${audit.maxDrawdown.toFixed(2)}%`} />
						<Metric label="TruthCore events" value={String(audit.truthCoreEvents)} />
					</div>
					<p className="mt-4 font-mono text-[10px] leading-5 text-slate-500">The 40-trade campaign exercised deterministic safety controls but lost money. It is not represented as profitability or LIVE certification evidence.</p>
				</section>

				<section className="border-t border-white/10 py-8">
					<SectionHead kicker="EDGEFORGE" title="Five numbers decide promotion" />
					<div className="grid gap-3 md:grid-cols-5">
						<Score title="Net expectancy after costs" value="-$4.78 / trade" state="FAIL" />
						<Score title="Profit factor" value="UNAVAILABLE" state="HOLD" />
						<Score title="Maximum drawdown" value="2.13%" state="PASS" />
						<Score title="Regime stability" value="UNAVAILABLE" state="HOLD" />
						<Score title="Execution degradation" value="UNAVAILABLE" state="HOLD" />
					</div>
					<div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-xs leading-6 text-amber-100"><strong className="text-amber-300">NO CAPITAL PROMOTION.</strong> Missing or failed evidence is a hard hold. Candidates must survive realistic fees, slippage, spread widening, latency, partial fills, parameter perturbation, anchored walk-forward, untouched out-of-sample testing, and Monte Carlo stress.</div>
				</section>

				<section className="border-t border-white/10 py-8">
					<SectionHead kicker="AEGIS 22" title="Default-deny authority wall" />
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{gates.map((gate) => <div key={gate} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold text-white">{gate}</div><div className="mt-2 font-mono text-[8px] font-bold uppercase tracking-widest text-amber-300">required · default deny</div></div>)}</div>
				</section>

				<section className="grid gap-5 border-t border-white/10 py-8 lg:grid-cols-2">
					<div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><SectionHead kicker="PUBLIC EDGE" title="Cloudflare responsibilities"/><div className="space-y-3 text-xs leading-6 text-slate-400"><p><strong className="text-white">Allowed:</strong> TLS, WAF, Access, rate limiting, static UI, status APIs, Workers AI research assistance.</p><p><strong className="text-white">Forbidden:</strong> AEGIS signing keys, unrestricted broker credentials, withdrawal credentials, treasury secrets, or broker-bound execution bypasses.</p></div></div>
					<div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><SectionHead kicker="AUTHORITY CHAIN" title="Private execution stays private"/><div className="font-mono text-[11px] leading-7 text-cyan-200">Agents / AI → EdgeForge / MIDAS → AEGIS 22 → signed approval → VULTURE → Kraken → reconciliation → TruthCore</div></div>
				</section>

				<footer className="border-t border-white/10 py-6 font-mono text-[10px] text-slate-600">ΩMEGA PRIME Δ · Cloudflare public edge · PAPER/SHADOW only · LIVE authority external</footer>
			</div>
		</main>
	);
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) { return <div className="mb-5"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan-300">{kicker}</div><h3 className="mt-2 text-xl font-bold text-white">{title}</h3></div>; }
function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) { return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{label}</div><div className={`mt-3 font-mono text-lg font-bold ${danger ? "text-rose-400" : "text-white"}`}>{value}</div></div>; }
function Score({ title, value, state }: { title: string; value: string; state: "PASS" | "FAIL" | "HOLD" }) { const c=state==="PASS"?"text-emerald-300 bg-emerald-300/10":state==="FAIL"?"text-rose-400 bg-rose-400/10":"text-amber-300 bg-amber-300/10"; return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className={`rounded-full px-2 py-1 font-mono text-[8px] font-bold ${c}`}>{state}</span><div className="mt-4 text-xs font-semibold text-white">{title}</div><div className="mt-3 font-mono text-sm text-white">{value}</div></div>; }
function Row({ a, b, ok=false }: { a:string; b:string; ok?:boolean }) { return <div className="flex justify-between gap-4"><span className="text-slate-500">{a}</span><b className={ok?"text-emerald-300":"text-amber-300"}>{b}</b></div>; }
function money(value:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);}
