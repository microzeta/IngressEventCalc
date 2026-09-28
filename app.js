const EVENT_DAYS = 92;

const dailyOptions = [
  { count: 1, label: "1 bounty", percent: 15 },
  { count: 2, label: "2 bounties", percent: 30 },
  { count: 3, label: "3 bounties", percent: 25 },
  { count: 4, label: "4 bounties", percent: 20 },
];

const firstSaturdays = [
  { id: "ifs-oct", month: "October", date: "Oct 3" },
  { id: "ifs-nov", month: "November", date: "Nov 7" },
  { id: "ifs-dec", month: "December", date: "Dec 5" },
];

const dispatchOps = [
  { name: "Día de los Muertos", max: 2000, dates: "Oct 12 – Nov 11" },
  { name: "Leonids: Through the Ages", max: 2000, dates: "Nov 5 – Nov 30" },
  { name: "Operation Crystal Horizon", max: 2000, dates: "Dec 2 – Dec 21" },
];

const shardStorms = [
  { id: "shard-oct17", day: "Day 1", date: "Oct 17" },
  { id: "shard-oct24", day: "Day 2", date: "Oct 24" },
  { id: "shard-nov21", day: "Day 3", date: "Nov 21" },
];

const tiers = [
  { name: "Gold", tokens: 24000 },
  { name: "Silver", tokens: 12000 },
  { name: "Bronze", tokens: 6000 },
];

const currency = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const elements = {
  dailySliders: document.querySelector("#dailySliders"),
  dailyTotalPercent: document.querySelector("#dailyTotalPercent"),
  ifsChecks: document.querySelector("#ifsChecks"),
  dispatchSliders: document.querySelector("#dispatchSliders"),
  globalBattles: document.querySelector("#globalBattles"),
  battlesValue: document.querySelector("#battlesValue"),
  globalDeploy: document.querySelector("#globalDeploy"),
  deployValue: document.querySelector("#deployValue"),
  shardChecks: document.querySelector("#shardChecks"),
  totalTokens: document.querySelector("#totalTokens"),
  tierName: document.querySelector("#tierName"),
  tierProgress: document.querySelector("#tierProgress"),
  nextTier: document.querySelector("#nextTier"),
  dailySummary: document.querySelector("#dailySummary"),
  ifsSummary: document.querySelector("#ifsSummary"),
  dispatchSummary: document.querySelector("#dispatchSummary"),
  battlesSummary: document.querySelector("#battlesSummary"),
  deploySummary: document.querySelector("#deploySummary"),
  shardSummary: document.querySelector("#shardSummary"),
};

function dailyTokensFor(completed) {
  const bountyTokens = completed * 10;
  const milestoneTokens = (completed >= 2 ? 10 : 0) + (completed >= 4 ? 10 : 0);
  return bountyTokens + milestoneTokens;
}

function renderDailySliders() {
  const noneRow = document.createElement("div");
  noneRow.className = "computed-row";
  noneRow.innerHTML = `
    <span>No bounties <small>(0 tokens/day)</small></span>
    <output id="daily-none-output">10%</output>
  `;
  elements.dailySliders.append(noneRow);

  dailyOptions.forEach((option, index) => {
    const row = document.createElement("label");
    row.className = "slider-row";
    row.innerHTML = `
      <span class="slider-label">
        <span>${option.label} <small>(${dailyTokensFor(option.count)} tokens/day)</small></span>
        <output id="daily-output-${index}">${option.percent}%</output>
      </span>
      <input type="range" min="0" max="100" step="1" value="${option.percent}" data-daily-index="${index}">
    `;
    elements.dailySliders.append(row);
  });
}

function renderFirstSaturdays() {
  firstSaturdays.forEach((event) => {
    const label = document.createElement("label");
    label.className = "check-card";
    label.innerHTML = `
      <input id="${event.id}" type="checkbox" data-ifs>
      <span><strong>${event.month}</strong>${event.date}</span>
    `;
    elements.ifsChecks.append(label);
  });
}

function renderDispatchSliders() {
  dispatchOps.forEach((op, index) => {
    const row = document.createElement("label");
    row.className = "slider-row";
    row.innerHTML = `
      <span class="slider-label">
        <span>${op.name} <small>(${op.dates})</small></span>
        <output id="dispatch-output-${index}">0</output>
      </span>
      <input type="range" min="0" max="${op.max}" step="100" value="0" data-dispatch>
    `;
    elements.dispatchSliders.append(row);
  });
}

function renderShardStorms() {
  shardStorms.forEach((storm) => {
    const label = document.createElement("label");
    label.className = "check-card";
    label.innerHTML = `
      <input id="${storm.id}" type="checkbox" data-shard>
      <span><strong>${storm.day}</strong>${storm.date}</span>
    `;
    elements.shardChecks.append(label);
  });
}

function normalizeDailyPercent(changedInput) {
  const inputs = [...document.querySelectorAll("[data-daily-index]")];
  const changedIndex = Number(changedInput.dataset.dailyIndex);
  let total = inputs.reduce((sum, input) => sum + Number(input.value), 0);

  if (total <= 100) {
    return;
  }

  let overflow = total - 100;
  const otherInputs = inputs.filter((input) => Number(input.dataset.dailyIndex) !== changedIndex);

  otherInputs.forEach((input) => {
    const available = Number(input.value);
    const reduction = Math.min(available, overflow);
    input.value = available - reduction;
    overflow -= reduction;
  });

  if (overflow > 0) {
    changedInput.value = Math.max(0, Number(changedInput.value) - overflow);
  }
}

function getDailyTokens() {
  return [...document.querySelectorAll("[data-daily-index]")].reduce((sum, input) => {
    const option = dailyOptions[Number(input.dataset.dailyIndex)];
    const days = EVENT_DAYS * (Number(input.value) / 100);
    return sum + days * dailyTokensFor(option.count);
  }, 0);
}

function getCheckedTotal(selector, tokenValue) {
  return [...document.querySelectorAll(selector)].filter((input) => input.checked).length * tokenValue;
}

function getRangeTotal(selector) {
  return [...document.querySelectorAll(selector)].reduce((sum, input) => sum + Number(input.value), 0);
}

function getTier(total) {
  return tiers.find((tier) => total >= tier.tokens);
}

function getNextTier(total) {
  return [...tiers].reverse().find((tier) => total < tier.tokens);
}

function updateOutputs() {
  const dailyInputs = [...document.querySelectorAll("[data-daily-index]")];
  const completedPercent = dailyInputs.reduce((sum, input) => sum + Number(input.value), 0);
  const nonePercent = 100 - completedPercent;

  document.querySelector("#daily-none-output").textContent = `${nonePercent}%`;
  dailyInputs.forEach((input) => {
    document.querySelector(`#daily-output-${input.dataset.dailyIndex}`).textContent = `${input.value}%`;
  });
  elements.dailyTotalPercent.textContent = `${completedPercent + nonePercent}%`;

  [...document.querySelectorAll("[data-dispatch]")].forEach((input, index) => {
    document.querySelector(`#dispatch-output-${index}`).textContent = currency.format(Number(input.value));
  });

  const battlesTokens = Number(elements.globalBattles.value);
  const deployTokens = Number(elements.globalDeploy.value);
  elements.battlesValue.textContent = currency.format(battlesTokens);
  elements.deployValue.textContent = currency.format(deployTokens);

  const daily = getDailyTokens();
  const ifs = getCheckedTotal("[data-ifs]", 2500);
  const dispatch = getRangeTotal("[data-dispatch]");
  const shards = getCheckedTotal("[data-shard]", 2500);
  const total = Math.round(daily + ifs + dispatch + battlesTokens + deployTokens + shards);
  const currentTier = getTier(total);
  const nextTier = getNextTier(total);

  elements.dailySummary.textContent = currency.format(Math.round(daily));
  elements.ifsSummary.textContent = currency.format(ifs);
  elements.dispatchSummary.textContent = currency.format(dispatch);
  elements.battlesSummary.textContent = currency.format(battlesTokens);
  elements.deploySummary.textContent = currency.format(deployTokens);
  elements.shardSummary.textContent = currency.format(shards);
  elements.totalTokens.textContent = currency.format(total);
  elements.tierName.textContent = currentTier ? `${currentTier.name} medal` : "No medal yet";
  elements.tierName.dataset.tier = currentTier ? currentTier.name.toLowerCase() : "none";

  const progressTarget = nextTier ? nextTier.tokens : tiers[0].tokens;
  elements.tierProgress.style.width = `${Math.min(100, (total / progressTarget) * 100)}%`;
  elements.nextTier.textContent = nextTier
    ? `${currency.format(nextTier.tokens - total)} tokens to ${nextTier.name}`
    : `Gold reached with ${currency.format(total - tiers[0].tokens)} tokens to spare`;

  document.title = `${currentTier ? currentTier.name : "Cygnus"} - ${currency.format(total)} tokens`;
}

function bindEvents() {
  elements.dailySliders.addEventListener("input", (event) => {
    if (!event.target.matches("[data-daily-index]")) return;
    normalizeDailyPercent(event.target);
    updateOutputs();
  });

  document.body.addEventListener("input", updateOutputs);
  document.body.addEventListener("change", updateOutputs);
}

renderDailySliders();
renderFirstSaturdays();
renderDispatchSliders();
renderShardStorms();
bindEvents();
updateOutputs();
