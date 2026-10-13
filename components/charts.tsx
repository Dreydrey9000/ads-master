"use client";
/** Small, animated charts. All take tiny props so they drop in anywhere. */
import { useEffect, useState, useId } from "react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, PolarAngleAxis, Tooltip } from "recharts";

export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / ms); setV(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function MiniArea({ data, color, h = 36 }: { data: number[]; color: string; h?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.5} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniDonut({ data, size = 96 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="62%" outerRadius="100%" paddingAngle={3} stroke="none" isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#141722", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniBars({ data, color = "#a0e5c9", h = 56 }: { data: number[]; color?: string; h?: number }) {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
        <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GoalRing({ value, goal, size = 110, color = "#22c55e" }: { value: number; goal: number; size?: number; color?: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <RadialBarChart innerRadius="78%" outerRadius="100%" data={[{ v: pct }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="v" cornerRadius={10} fill={color} background={{ fill: "#1d2130" }} isAnimationActive={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-xl font-bold">{pct}%</div><div className="text-micro text-zinc-500">of goal</div></div></div>
    </div>
  );
}

/** Funnel as animated horizontal bars that grow in on mount. */
export function Funnel({ stages, color = "#a0e5c9" }: { stages: { name: string; value: number }[]; color?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 50); return () => clearTimeout(t); }, [stages]);
  const max = stages[0]?.value || 1;
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.name}>
          <div className="mb-1 flex justify-between text-xs"><span className="text-zinc-400">{s.name}</span><span className="font-semibold">{s.value}{i > 0 && <span className="ml-2 text-zinc-500">{stages[i - 1].value ? Math.round((s.value / stages[i - 1].value) * 100) : 0}%</span>}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: on ? `${(s.value / max) * 100}%` : "0%", background: color, opacity: 1 - i * 0.15, transitionDelay: `${i * 120}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
