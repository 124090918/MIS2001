const { useState, useEffect } = React;

/* ---------- formatting helpers ---------- */
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const shortMoney = (n) => (n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + Math.round(n));
const num = (n) => Math.round(n).toLocaleString("en-US");

/* =========================================================
   Charts - plain CSS/SVG so no chart library is required
   ========================================================= */

function BarChart({ data, labelKey, valueKey }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((d) => d[valueKey]));

  return (
    <div className="bars" onMouseLeave={() => setActive(null)}>
      {data.map((d, i) => (
        <div
          key={d[labelKey]}
          className={"bars__col" + (active === i ? " is-active" : "")}
          onMouseEnter={() => setActive(i)}
        >
          <div className="bars__tip">{active === i ? shortMoney(d[valueKey]) : ""}</div>
          <div className="bars__track">
            <div className="bars__bar" style={{ height: (d[valueKey] / max) * 100 + "%" }} />
          </div>
          <div className="bars__label">{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

function RankBars({ items, colors, format = money }) {
  const max = Math.max(...items.map((d) => d.value));
  return (
    <ul className="rank">
      {items.map((d, i) => (
        <li key={d.label}>
          <div className="rank__head">
            <span className="rank__label">
              {d.label}
              {d.sub ? <span className="rank__sub"> · {d.sub}</span> : null}
            </span>
            <span className="rank__value">{format(d.value)}</span>
          </div>
          <div className="rank__track">
            <div
              className="rank__bar"
              style={{ width: (d.value / max) * 100 + "%", background: colors[i % colors.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Donut({ items, colors }) {
  const total = items.reduce((sum, d) => sum + d.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut">
      <div className="donut__chart">
        <svg viewBox="0 0 140 140">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="18" />
            {items.map((d, i) => {
              const length = (d.value / total) * circumference;
              const segment = (
                <circle
                  key={d.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="18"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return segment;
            })}
          </g>
        </svg>
        <div className="donut__center">
          <strong>{num(total)}</strong>
          <span>笔订单</span>
        </div>
      </div>

      <ul className="legend">
        {items.map((d, i) => (
          <li key={d.label}>
            <span className="dot" style={{ background: colors[i % colors.length] }} />
            {d.label}
            <b>{Math.round((d.value / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================
   Dashboard
   ========================================================= */

const COLORS = ["#6366f1", "#2dd4bf", "#fbbf24", "#fb7185", "#a855f7", "#38bdf8"];

function Kpi({ label, value, note }) {
  return (
    <div className="card kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <i>{note}</i>
    </div>
  );
}

function Dashboard({ data }) {
  const best = data.monthlySales.reduce((a, b) => (b.revenue > a.revenue ? b : a));

  return (
    <div className="wrap">
      <header className="head">
        <div>
          <h1>销售数据看板</h1>
          <p>营收、商品表现与客户画像 · 2026 年</p>
        </div>
        <div className="badge">最佳月份：{best.month} · {shortMoney(best.revenue)}</div>
      </header>

      <section className="kpis">
        <Kpi label="总营收" value={money(data.kpis.revenue)} note="近 12 个月" />
        <Kpi label="订单数" value={num(data.kpis.orders)} note="全部渠道" />
        <Kpi label="销售件数" value={num(data.kpis.units)} note="全部商品" />
        <Kpi label="客单价" value={"$" + data.kpis.avgOrder.toFixed(2)} note="每笔订单" />
      </section>

      <section className="card">
        <h2>月度销售</h2>
        <p className="sub">各月营收</p>
        <BarChart data={data.monthlySales} labelKey="month" valueKey="revenue" />
      </section>

      <div className="grid">
        <section className="card">
          <h2>热销商品</h2>
          <p className="sub">按营收排名</p>
          <RankBars
            colors={COLORS}
            items={data.topProducts.map((p) => ({
              label: p.name,
              sub: p.category + " · " + num(p.units) + " 件",
              value: p.revenue,
            }))}
          />
        </section>

        <div className="stack">
          <section className="card">
            <h2>年龄分布</h2>
            <p className="sub">各年龄段的订单量</p>
            <RankBars colors={["#6366f1"]} format={num} items={data.demographics.age} />
          </section>

          <section className="card">
            <h2>性别构成</h2>
            <p className="sub">订单占比</p>
            <Donut items={data.demographics.gender} colors={["#2dd4bf", "#6366f1", "#fbbf24"]} />
          </section>

          <section className="card">
            <h2>地区分布</h2>
            <p className="sub">各地区的订单量</p>
            <RankBars colors={["#a855f7"]} format={num} items={data.demographics.region} />
          </section>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="state">数据加载失败（{error}）。Python 服务是否已启动？</div>;
  if (!data) return <div className="state">看板加载中…</div>;
  return <Dashboard data={data} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
