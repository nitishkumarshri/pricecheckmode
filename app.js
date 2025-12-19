const cities = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Jaipur",
  "Pune",
  "siwan",
];

const routeDistances = {
  "Delhi|Mumbai": 1400,
  "Delhi|Bengaluru": 2150,
  "Delhi|Chennai": 2190,
  "Delhi|Hyderabad": 1550,
  "Delhi|Kolkata": 1500,
  "Mumbai|Bengaluru": 980,
  "Mumbai|Chennai": 1330,
  "Mumbai|Hyderabad": 710,
  "Mumbai|Kolkata": 2020,
  "Bengaluru|Chennai": 400,
  "Bengaluru|Hyderabad": 570,
  "Bengaluru|Kolkata": 1870,
  "Chennai|Hyderabad": 630,
  "Chennai|Kolkata": 1650,
  "Hyderabad|Kolkata": 1480,
  "Delhi|Jaipur": 270,
  "Delhi|Pune": 1450,
  "Mumbai|Pune": 150,
  "Bengaluru|Pune": 840,
  "Hyderabad|Pune": 560,
  "Delhi|siwan": 990,
  "Mumbai|siwan": 1700,
  "Bengaluru|siwan": 2000,
  "Chennai|siwan": 1800,
  "Hyderabad|siwan": 1500,
};

const modePricing = {
  bus: {
    basePerKm: 1.5,
    surgePerFlexDay: 0.02,
    label: "Volvo Seater Bus",
    color: "#f97316",
  },
  busSleeper: {
    basePerKm: 1.8,
    surgePerFlexDay: 0.025,
    label: "Premium Sleeper Coach",
    color: "#fb7185",
  },
  trainAC3: {
    basePerKm: 0.95,
    surgePerFlexDay: 0.012,
    label: "Train · AC 3-Tier",
    color: "#14b8a6",
  },
  trainAC2: {
    basePerKm: 1.1,
    surgePerFlexDay: 0.01,
    label: "Train · AC 2-Tier",
    color: "#0ea5e9",
  },
  flight: {
    basePerKm: 4.2,
    surgePerFlexDay: 0.05,
    label: "Economy Flight",
    color: "#22c55e",
  },
};

const sourceSelect = document.getElementById("source");
const destinationSelect = document.getElementById("destination");

function populateSelects() {
  const fragment = document.createDocumentFragment();
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    fragment.appendChild(option);
  });
  sourceSelect.appendChild(fragment.cloneNode(true));
  destinationSelect.appendChild(fragment);
  destinationSelect.selectedIndex = 1;
}

function getDistanceKey(a, b) {
  const sorted = [a, b].sort();
  return `${sorted[0]}|${sorted[1]}`;
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateCosts({ source, destination, travelers, flexDays }) {
  const routeKey = getDistanceKey(source, destination);
  const distance = routeDistances[routeKey];
  if (!distance) {
    return null;
  }

  const roundTripDistance = distance * 2;
  return Object.entries(modePricing).map(([mode, config]) => {
    const surgeMultiplier = 1 + flexDays * config.surgePerFlexDay;
    const subtotal =
      roundTripDistance * config.basePerKm * surgeMultiplier * travelers;
    return {
      mode,
      title: config.label,
      color: config.color,
      total: Math.round(subtotal),
      perPerson: Math.round(subtotal / travelers),
    };
  });
}

function renderResults(resultArray, context) {
  const resultsEl = document.getElementById("results");
  resultsEl.innerHTML = "";

  if (!resultArray) {
    resultsEl.innerHTML = `
      <div class="empty">
        Sorry, we do not have pricing data for ${context.source} ↔ ${context.destination} yet.
      </div>
    `;
    return;
  }

  const sorted = [...resultArray].sort((a, b) => a.total - b.total);
  const cheapest = sorted[0];
  const highest = sorted[sorted.length - 1].total;

  const highlight = document.createElement("div");
  highlight.className = "highlight";
  highlight.innerHTML = `
    <h2>Best option · ${context.source} → ${context.destination}</h2>
    <div class="price">${formatINR(cheapest.total)}</div>
    <div>
      <span class="mode-tag">${cheapest.title}</span>
      <span style="margin-left:8px;color:var(--muted);font-weight:500;">
        ${context.travelers} traveller${context.travelers > 1 ? "s" : ""}
        · ${context.roundTripLabel}
      </span>
    </div>
  `;

  const list = document.createElement("div");
  list.className = "list";

  sorted.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "card";
    const percentage = Math.round((entry.total / highest) * 100);
    card.innerHTML = `
      <div>
        <strong>${entry.title}</strong>
        <div style="color:var(--muted);font-size:0.9rem;">
          ${formatINR(entry.total)} total · ${formatINR(entry.perPerson)} / person
        </div>
        <div class="bar" style="margin-top:10px;">
          <span style="width:${percentage}%;background:${entry.color};"></span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.4rem;font-weight:700;">${percentage}%</div>
        <div style="color:var(--muted);font-size:0.85rem;">of highest fare</div>
      </div>
    `;
    list.appendChild(card);
  });

  resultsEl.appendChild(highlight);
  resultsEl.appendChild(list);
}

document.getElementById("trip-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const source = sourceSelect.value;
  const destination = destinationSelect.value;
  const depart = document.getElementById("depart").value;
  const returnDate = document.getElementById("return").value;
  const travelers = Number(document.getElementById("travelers").value);
  const flexDays = Number(document.getElementById("flex").value);

  if (source === destination) {
    renderResults(null, { source, destination });
    return;
  }

  if (!depart || !returnDate) {
    alert("Please select both depart and return dates.");
    return;
  }

  if (new Date(returnDate) <= new Date(depart)) {
    alert("Return date must be later than depart date.");
    return;
  }

  const resultArray = calculateCosts({
    source,
    destination,
    travelers,
    flexDays,
  });

  const roundTripLabel = `${depart} → ${returnDate}`;

  renderResults(resultArray, {
    source,
    destination,
    travelers,
    roundTripLabel,
  });
});

populateSelects();

