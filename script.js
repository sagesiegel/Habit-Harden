const STORAGE = {
  categories: "habit-garden-categories-v1",
  logs: "habit-garden-logs-v1"
};

const colors = [
  "#cec7df",
  "#c8d6c0",
  "#e7c8cb",
  "#c5d5dd",
  "#ead0bc",
  "#e8dfbf"
];

const plantOptions = [
  ["🌸", "Lavender"],
  ["🌿", "Fern"],
  ["🌼", "Daisy"],
  ["🌱", "Herb"],
  ["🌹", "Rose"],
  ["🌻", "Sunflower"],
  ["🌷", "Tulip"],
  ["🪻", "Hyacinth"]
];

const defaultCategories = [
  {
    name: "Fitness",
    plant: "🌿",
    goal: 4,
    activities: ["Stretching", "Yoga", "Go for a walk", "Workout"]
  },
  {
    name: "Creative",
    plant: "🪻",
    goal: 4,
    activities: ["Paint", "Sew", "Crochet", "Write"]
  },
  {
    name: "Nourishment",
    plant: "🌱",
    goal: 4,
    activities: ["Meal prep", "Cook a meal", "Find a new recipe"]
  },
  {
    name: "School",
    plant: "🌼",
    goal: 5,
    activities: ["Study", "Complete an assignment", "Review notes"]
  },
  {
    name: "Self-Care",
    plant: "🌸",
    goal: 4,
    activities: ["Journal", "Read", "Skincare", "Intentional rest"]
  },
  {
    name: "Home",
    plant: "🌷",
    goal: 4,
    activities: ["Clean", "Do laundry", "Organize one area"]
  }
];

let categories =
  JSON.parse(localStorage.getItem(STORAGE.categories)) ||
  defaultCategories.map((category, index) => ({
    id: crypto.randomUUID(),
    color: colors[index % colors.length],
    ...category,
    activities: category.activities.map(name => ({
      id: crypto.randomUUID(),
      name
    }))
  }));

let logs = JSON.parse(localStorage.getItem(STORAGE.logs)) || [];

const garden = document.getElementById("garden");
const categoryForm = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categoryPlant = document.getElementById("categoryPlant");
const categoryGoal = document.getElementById("categoryGoal");
const todayList = document.getElementById("todayList");
const historyList = document.getElementById("historyList");

function save() {
  localStorage.setItem(STORAGE.categories, JSON.stringify(categories));
  localStorage.setItem(STORAGE.logs, JSON.stringify(logs));
}

function dateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function mondayFor(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + distance);

  return result;
}

function weekKey(date = new Date()) {
  return dateKey(mondayFor(date));
}

function sundayFor(date = new Date()) {
  const sunday = mondayFor(date);
  sunday.setDate(sunday.getDate() + 6);
  return sunday;
}

function currentWeekLogs() {
  const currentWeek = weekKey();

  return logs.filter(log => {
    return weekKey(parseLocalDate(log.date)) === currentWeek;
  });
}

function categoryWeekLogs(categoryId) {
  return currentWeekLogs().filter(log => log.categoryId === categoryId);
}

function stageFor(category) {
  const completed = categoryWeekLogs(category.id).length;

  if (completed === 0) return 0;

  return Math.min(5, Math.ceil((completed / category.goal) * 5));
}

function stageName(stage) {
  return ["Seed", "Sprout", "Growing", "Leafy", "Budding", "Blooming"][stage];
}

function plantSelectHTML(selectedPlant) {
  return plantOptions
    .map(([emoji, name]) => {
      const selected = emoji === selectedPlant ? "selected" : "";
      return `<option value="${emoji}" ${selected}>${emoji} ${name}</option>`;
    })
    .join("");
}

function renderGarden() {
  garden.innerHTML = "";

  if (!categories.length) {
    garden.innerHTML = `
      <div class="empty">Add a category to begin growing your garden.</div>
    `;
    return;
  }

  categories.forEach(category => {
    const completed = categoryWeekLogs(category.id).length;
    const progress = Math.min(100, (completed / category.goal) * 100);
    const stage = stageFor(category);

    const card = document.createElement("article");
    card.className = "garden-card";
    card.style.setProperty("--category-color", category.color);

    card.innerHTML = `
      <div class="card-accent"></div>

      <div class="card-content">
        <div class="card-top">
          <div>
            <p class="eyebrow">Life category</p>
            <h3>${escapeHTML(category.name)}</h3>
          </div>

          <button class="remove-category" title="Delete category">×</button>
        </div>

        <div class="plant-scene">
          <div
            class="plant"
            data-stage="${stage}"
            style="--stage:${stage}"
          >
            <div class="seed"></div>
            <div class="stem"></div>
            <div class="leaf leaf-left"></div>
            <div class="leaf leaf-right"></div>
            <div class="leaf leaf-upper-left"></div>
            <div class="bud"></div>
            <div class="bloom">${category.plant}</div>
            <div class="soil"></div>
            <div class="pot"></div>
          </div>

          <span class="stage-label">${stageName(stage)}</span>
        </div>

        <div class="progress-heading">
          <span>${completed} of ${category.goal} activities</span>
          <span>${Math.round(progress)}%</span>
        </div>

        <div class="progress-track">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>

        <div class="settings-row">
          <select class="plant-select" aria-label="Plant selection">
            ${plantSelectHTML(category.plant)}
          </select>

          <div class="goal-control">
            <button class="goal-minus" title="Decrease goal">−</button>
            <span class="goal-value">${category.goal}</span>
            <button class="goal-plus" title="Increase goal">+</button>
          </div>
        </div>

        <form class="activity-form">
          <input
            class="activity-input"
            type="text"
            placeholder="Add an activity"
            required
          >
          <button class="add-activity" type="submit">Add</button>
        </form>

        <div class="activity-list"></div>
      </div>
    `;

    const activityList = card.querySelector(".activity-list");

    if (!category.activities.length) {
      activityList.innerHTML = `
        <div class="empty">Add an activity for this plant.</div>
      `;
    }

    category.activities.forEach(activity => {
      const completedToday = logs.some(log => {
        return (
          log.activityId === activity.id &&
          log.date === dateKey()
        );
      });

      const row = document.createElement("div");
      row.className = "activity-row";

      row.innerHTML = `
        <button class="activity-button ${completedToday ? "done" : ""}">
          ${completedToday ? "✓ " : ""}
          ${escapeHTML(activity.name)}
        </button>

        <button class="delete-activity" title="Delete activity">×</button>
      `;

      row.querySelector(".activity-button").addEventListener("click", () => {
        toggleActivity(category, activity);
      });

      row.querySelector(".delete-activity").addEventListener("click", () => {
        category.activities = category.activities.filter(
          existing => existing.id !== activity.id
        );

        save();
        render();
      });

      activityList.appendChild(row);
    });

    card.querySelector(".activity-form").addEventListener("submit", event => {
      event.preventDefault();

      const input = card.querySelector(".activity-input");
      const name = input.value.trim();

      if (!name) return;

      category.activities.push({
        id: crypto.randomUUID(),
        name
      });

      save();
      render();
    });

    card.querySelector(".plant-select").addEventListener("change", event => {
      category.plant = event.target.value;
      save();
      render();
    });

    card.querySelector(".goal-minus").addEventListener("click", () => {
      category.goal = Math.max(1, category.goal - 1);
      save();
      render();
    });

    card.querySelector(".goal-plus").addEventListener("click", () => {
      category.goal = Math.min(30, category.goal + 1);
      save();
      render();
    });

    card.querySelector(".remove-category").addEventListener("click", () => {
      const shouldDelete = confirm(
        `Delete ${category.name} and its activities?`
      );

      if (!shouldDelete) return;

      categories = categories.filter(
        existing => existing.id !== category.id
      );

      save();
      render();
    });

    garden.appendChild(card);
  });
}

function toggleActivity(category, activity) {
  const existingLog = logs.find(log => {
    return (
      log.activityId === activity.id &&
      log.date === dateKey()
    );
  });

  if (existingLog) {
    logs = logs.filter(log => log.id !== existingLog.id);
  } else {
    logs.push({
      id: crypto.randomUUID(),
      categoryId: category.id,
      categoryName: category.name,
      activityId: activity.id,
      activityName: activity.name,
      color: category.color,
      date: dateKey(),
      timestamp: Date.now()
    });
  }

  save();
  render();
}

function renderToday() {
  const todayLogs = logs
    .filter(log => log.date === dateKey())
    .sort((a, b) => b.timestamp - a.timestamp);

  todayList.innerHTML = "";

  if (!todayLogs.length) {
    todayList.innerHTML = `
      <div class="empty">
        Nothing recorded yet.<br>
        Choose an activity from your garden.
      </div>
    `;
    return;
  }

  todayLogs.forEach(log => {
    const item = document.createElement("div");
    item.className = "log-item";
    item.style.setProperty("--item-color", log.color);

    item.innerHTML = `
      <span class="log-color"></span>

      <div class="log-info">
        <div class="log-name">${escapeHTML(log.activityName)}</div>
        <div class="log-category">${escapeHTML(log.categoryName)}</div>
      </div>

      <button class="undo-button">Undo</button>
    `;

    item.querySelector(".undo-button").addEventListener("click", () => {
      logs = logs.filter(existing => existing.id !== log.id);
      save();
      render();
    });

    todayList.appendChild(item);
  });
}

function renderHistory() {
  const currentWeek = weekKey();

  const pastWeeks = [...new Set(
    logs
      .map(log => weekKey(parseLocalDate(log.date)))
      .filter(key => key !== currentWeek)
  )]
    .sort()
    .reverse()
    .slice(0, 4);

  historyList.innerHTML = "";

  if (!pastWeeks.length) {
    historyList.innerHTML = `
      <div class="empty">
        Previous gardens will appear here after your first week.
      </div>
    `;
    return;
  }

  pastWeeks.forEach(key => {
    const weekLogs = logs.filter(log => {
      return weekKey(parseLocalDate(log.date)) === key;
    });

    const categoryCount = new Set(
      weekLogs.map(log => log.categoryId)
    ).size;

    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
      <div class="history-info">
        <div class="history-week">${formatWeekLabel(key)}</div>
        <div class="history-summary">
          ${weekLogs.length} activities across ${categoryCount} categories
        </div>
      </div>
      <span>${weekLogs.length ? "🌿" : "🌰"}</span>
    `;

    historyList.appendChild(item);
  });
}

function renderSummary() {
  const weekLogs = currentWeekLogs();

  document.getElementById("weeklyActions").textContent = weekLogs.length;

  document.getElementById("bloomCount").textContent =
    categories.filter(category => stageFor(category) === 5).length;

  const today = new Date();
  const sunday = sundayFor(today);
  const difference = Math.ceil(
    (sunday.setHours(23, 59, 59, 999) - today) / 86400000
  );

  document.getElementById("daysRemaining").textContent =
    Math.max(0, difference);

  const monday = mondayFor(today);

  document.getElementById("weekDates").textContent =
    `${formatShortDate(monday)} – ${formatShortDate(sundayFor(today))}`;

  document.getElementById("todayDate").textContent =
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(today);
}

function render() {
  renderGarden();
  renderToday();
  renderHistory();
  renderSummary();
}

categoryForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = categoryName.value.trim();
  const goal = Number(categoryGoal.value);

  if (!name || !goal) return;

  categories.push({
    id: crypto.randomUUID(),
    name,
    plant: categoryPlant.value,
    goal: Math.min(30, Math.max(1, goal)),
    color: colors[categories.length % colors.length],
    activities: []
  });

  categoryName.value = "";
  categoryGoal.value = 4;

  save();
  render();
});

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatWeekLabel(key) {
  const monday = parseLocalDate(key);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  return `${formatShortDate(monday)} – ${formatShortDate(sunday)}`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

save();
render();
