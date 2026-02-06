// ---------- Demo Data Generator ----------
function rand(min, max){ return Math.random() * (max - min) + min; }
function randi(min, max){ return Math.floor(rand(min, max + 1)); }
function money(n){ return "₹" + n.toLocaleString("en-IN"); }
function pct(n){ return (n*100).toFixed(1) + "%"; }
function nowStamp(){
  const d = new Date();
  return d.toLocaleString("en-IN", { hour12:true });
}

const state = {
  days: 7,
  live: true,
  series: [], // {label, revenue, orders, conv}
  channels: { web: 0, mobile: 0, store: 0 },
  products: [
    { name:"Wireless Earbuds", units: 0, revenue: 0, trend:"▲" },
    { name:"Smart Watch", units: 0, revenue: 0, trend:"▲" },
    { name:"Gaming Mouse", units: 0, revenue: 0, trend:"▲" },
    { name:"Backpack", units: 0, revenue: 0, trend:"▲" },
    { name:"Power Bank", units: 0, revenue: 0, trend:"▲" }
  ],
  events: []
};

function buildDays(n){
  const out = [];
  const today = new Date();
  for(let i=n-1;i>=0;i--){
    const d = new Date(today);
    d.setDate(today.getDate()-i);
    out.push(d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}));
  }
  return out;
}

function seedData(){
  const labels = buildDays(state.days);
  state.series = labels.map((lab, idx) => {
    const baseRev = 45000 + idx*1800 + randi(-4000, 4000);
    const orders = randi(120, 260);
    const conv = rand(0.018, 0.042);
    return { label: lab, revenue: Math.max(12000, baseRev), orders, conv };
  });

  state.channels = {
    web: randi(220, 420),
    mobile: randi(260, 520),
    store: randi(80, 180)
  };

  state.products.forEach(p => {
    p.units = randi(80, 220);
    p.revenue = p.units * randi(499, 2499);
    p.trend = Math.random() > 0.5 ? "▲" : "▼";
  });

  state.events = [];
}
seedData();

// ---------- KPI Render ----------
const el = (id) => document.getElementById(id);

function computeKPIs(){
  const totalRev = state.series.reduce((s,x)=>s+x.revenue,0);
  const totalOrders = state.series.reduce((s,x)=>s+x.orders,0);
  const avgConv = state.series.reduce((s,x)=>s+x.conv,0) / state.series.length;
  const aov = totalOrders ? totalRev/totalOrders : 0;

  // compare last day vs previous day
  const last = state.series[state.series.length-1];
  const prev = state.series[state.series.length-2] || last;

  const revDelta = (last.revenue - prev.revenue) / (prev.revenue || 1);
  const ordDelta = (last.orders - prev.orders) / (prev.orders || 1);
  const convDelta = (last.conv - prev.conv) / (prev.conv || 1);
  const aovLast = last.orders ? last.revenue/last.orders : 0;
  const aovPrev = prev.orders ? prev.revenue/prev.orders : 0;
  const aovDelta = (aovLast - aovPrev) / (aovPrev || 1);

  return { totalRev, totalOrders, avgConv, aov, revDelta, ordDelta, convDelta, aovDelta };
}

function meta(delta){
  const up = delta >= 0;
  const arrow = up ? "▲" : "▼";
  return `${arrow} ${(Math.abs(delta)*100).toFixed(1)}% vs yesterday`;
}

function renderKPIs(){
  const k = computeKPIs();
  el("kpiRevenue").textContent = money(Math.round(k.totalRev));
  el("kpiOrders").textContent = k.totalOrders.toLocaleString("en-IN");
  el("kpiConv").textContent = pct(k.avgConv);
  el("kpiAov").textContent = money(Math.round(k.aov));

  el("kpiRevenueMeta").textContent = meta(k.revDelta);
  el("kpiOrdersMeta").textContent = meta(k.ordDelta);
  el("kpiConvMeta").textContent = meta(k.convDelta);
  el("kpiAovMeta").textContent = meta(k.aovDelta);

  el("lastUpdated").textContent = "Updated: " + nowStamp();
}

// ---------- Charts ----------
const revCtx = document.getElementById("revChart");
const channelCtx = document.getElementById("channelChart");

// UI Enhancement: Add gradient to line chart
function createRevenueGradient(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(67, 97, 238, 0.4)');
  gradient.addColorStop(1, 'rgba(67, 97, 238, 0.05)');
  return gradient;
}

const revChart = new Chart(revCtx, {
  type: "line",
  data: {
    labels: state.series.map(x=>x.label),
    datasets: [{
      label: "Revenue",
      data: state.series.map(x=>Math.round(x.revenue)),
      tension: 0.35,
      fill: true,
      backgroundColor: function(context) {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        return createRevenueGradient(ctx);
      },
      borderColor: '#4361ee',
      borderWidth: 3,
      pointBackgroundColor: '#4361ee',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8f9fa',
        bodyColor: '#cbd5e1',
        borderColor: '#4361ee',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `Revenue: ${money(context.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: { 
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false
        },
        ticks: { 
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (v)=>"₹"+Number(v).toLocaleString("en-IN") 
        }
      }
    }
  }
});

const channelChart = new Chart(channelCtx, {
  type: "doughnut",
  data: {
    labels: ["Web","Mobile","Store"],
    datasets: [{
      data: [state.channels.web, state.channels.mobile, state.channels.store],
      backgroundColor: [
        'rgba(67, 97, 238, 0.8)',
        'rgba(6, 214, 160, 0.8)',
        'rgba(255, 209, 102, 0.8)'
      ],
      borderColor: [
        'rgba(67, 97, 238, 1)',
        'rgba(6, 214, 160, 1)',
        'rgba(255, 209, 102, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 15
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { 
      legend: { 
        position: "bottom",
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 20,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8f9fa',
        bodyColor: '#cbd5e1',
        borderColor: '#4361ee',
        borderWidth: 1,
        cornerRadius: 8
      }
    }
  }
});

function refreshCharts(){
  revChart.data.labels = state.series.map(x=>x.label);
  revChart.data.datasets[0].data = state.series.map(x=>Math.round(x.revenue));
  revChart.update('none');
  
  channelChart.data.datasets[0].data = [state.channels.web, state.channels.mobile, state.channels.store];
  channelChart.update('none');
}

// ---------- Top Products & Events ----------
function renderProducts(){
  const tbody = el("topProducts");
  tbody.innerHTML = "";

  // sort by revenue
  const prods = [...state.products].sort((a,b)=>b.revenue-a.revenue);
  prods.forEach(p => {
    const tr = document.createElement("tr");
    tr.className = 'fade-in'; // Added for animation
    const trendClass = p.trend === "▲" ? 'text-success' : 'text-danger';
    tr.innerHTML = `
      <td><b>${p.name}</b></td>
      <td>${p.units.toLocaleString("en-IN")}</td>
      <td>${money(Math.round(p.revenue))}</td>
      <td><span class="badge ${trendClass}">${p.trend} ${(randi(1,9))}%</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function pushEvent(title, detail){
  state.events.unshift({ title, detail, at: nowStamp() });
  state.events = state.events.slice(0, 8);
  const ul = el("events");
  ul.innerHTML = "";
  state.events.forEach(e => {
    const li = document.createElement("li");
    li.className = "event fade-in pulse"; // Added animations
    li.innerHTML = `<small>${e.at}</small><b>${e.title}</b><div>${e.detail}</div>`;
    ul.appendChild(li);
  });
}

// ---------- Live Tick (simulate realtime) ----------
function liveTick(){
  if(!state.live) return;

  // last point changes a bit
  const last = state.series[state.series.length-1];
  last.revenue = Math.max(8000, last.revenue + randi(-1200, 2200));
  last.orders = Math.max(10, last.orders + randi(-6, 10));
  last.conv = Math.min(0.09, Math.max(0.005, last.conv + rand(-0.0012, 0.0015)));

  // channels shift
  state.channels.web = Math.max(0, state.channels.web + randi(-3, 6));
  state.channels.mobile = Math.max(0, state.channels.mobile + randi(-3, 6));
  state.channels.store = Math.max(0, state.channels.store + randi(-2, 4));

  // products random updates
  const p = state.products[randi(0, state.products.length-1)];
  const addUnits = randi(0, 6);
  p.units += addUnits;
  p.revenue += addUnits * randi(499, 2499);
  p.trend = Math.random() > 0.5 ? "▲" : "▼";

  // event log
  const kinds = [
    ["New order", `+${money(randi(499, 8999))} from Mobile`],
    ["Traffic spike", `Web sessions up ${randi(2,9)}%`],
    ["Refund processed", `-${money(randi(499, 3999))}`],
    ["Campaign update", `CTR improved by ${randi(1,6)}%`],
    ["Inventory alert", `${["Earbuds","Watch","Mouse"][randi(0,2)]} low stock`]
  ];
  const k = kinds[randi(0, kinds.length-1)];
  pushEvent(k[0], k[1]);

  renderKPIs();
  refreshCharts();
  renderProducts();
  
  // UI Enhancement: Visual feedback for live updates
  const pauseBtn = document.getElementById("pauseBtn");
  if (state.live) {
    pauseBtn.classList.add('pulse');
    setTimeout(() => pauseBtn.classList.remove('pulse'), 500);
  }
}

let timer = setInterval(liveTick, 2500);

// ---------- Range Change ----------
document.getElementById("rangeSelect").addEventListener("change", (e)=>{
  state.days = Number(e.target.value);
  seedData();
  renderKPIs();
  refreshCharts();
  renderProducts();
  pushEvent("Range changed", `Showing last ${state.days} days`);
});

// ---------- Pause / Resume ----------
const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("click", ()=>{
  state.live = !state.live;
  pauseBtn.innerHTML = state.live ? 
    '<i class="fas fa-pause me-1"></i>Pause Live' : 
    '<i class="fas fa-play me-1"></i>Resume Live';
    
  // UI Enhancement: Toggle button style
  if (state.live) {
    pauseBtn.classList.remove('btn-primary');
    pauseBtn.classList.add('ghost');
  } else {
    pauseBtn.classList.remove('ghost');
    pauseBtn.classList.add('btn-primary');
  }
  
  pushEvent(state.live ? "Live resumed" : "Live paused", "Realtime updates toggled");
});

// ---------- Export CSV ----------
document.getElementById("exportBtn").addEventListener("click", ()=>{
  const rows = [["Date","Revenue","Orders","Conversion"]];
  state.series.forEach(x => rows.push([x.label, Math.round(x.revenue), x.orders, x.conv.toFixed(4)]));
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics_${state.days}days.csv`;
  a.click();
  URL.revokeObjectURL(url);
  pushEvent("Exported CSV", `Downloaded analytics_${state.days}days.csv`);
  
  // UI Enhancement: Visual feedback for export
  const exportBtn = document.getElementById("exportBtn");
  exportBtn.innerHTML = '<i class="fas fa-check me-1"></i>Exported!';
  exportBtn.disabled = true;
  setTimeout(() => {
    exportBtn.innerHTML = '<i class="fas fa-file-export me-1"></i>Export CSV';
    exportBtn.disabled = false;
  }, 1500);
});

// ---------- Initial Render ----------
renderKPIs();
refreshCharts();
renderProducts();
pushEvent("Dashboard ready", "Realtime updates are running");

// ---------- UI Enhancement: Mobile Nav Toggle ----------
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      const header = document.querySelector('.top');
      header.style.display = header.style.display === 'none' ? 'block' : 'none';
      this.innerHTML = this.innerHTML.includes('fa-bars') ? 
        '<i class="fas fa-times"></i>' : 
        '<i class="fas fa-bars"></i>';
    });
  }
  
  // Add CSS classes for trend colors
  const style = document.createElement('style');
  style.textContent = `
    .text-success { color: var(--success) !important; }
    .text-danger { color: var(--danger) !important; }
  `;
  document.head.appendChild(style);
});