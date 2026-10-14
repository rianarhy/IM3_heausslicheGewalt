/* ==========================================================
   VOICES — VOLLSTÄNDIGE SCRIPT.JS
   Inklusive Linien-Hover und Infofeld im Donut-Stil
========================================================== */

(function installAgeHoverStyles() {
    let style = document.getElementById("age-comparison-hover-styles");

    if (!style) {
        style = document.createElement("style");
        style.id = "age-comparison-hover-styles";
        document.head.appendChild(style);
    }

    style.textContent = `
    #age-comparison-chart .age-series-visual {
      opacity: 1;
      pointer-events: none;
      transition: opacity 220ms ease;
    }

    #age-comparison-chart .age-series-visual * {
      pointer-events: none;
    }

    #age-comparison-chart .age-data-line {
      stroke-width: 4;
      transition: stroke-width 220ms ease;
    }

    #age-comparison-chart .age-data-point {
      transform-box: fill-box;
      transform-origin: center;
      transform: scale(1);
      transition: transform 220ms ease;
    }

    #age-comparison-chart .age-line-hitarea {
      fill: none;
      stroke: transparent;
      stroke-width: 22;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
      pointer-events: stroke;
      cursor: pointer;
    }

    #age-comparison-chart .age-point-hitarea {
      fill: transparent;
      pointer-events: all;
      cursor: pointer;
    }

    #age-comparison-chart.has-age-hover .age-series-visual {
      opacity: 0.25;
    }

    #age-comparison-chart.has-age-hover
    .is-active .age-series-visual {
      opacity: 1;
    }

    #age-comparison-chart .is-active .age-data-line {
      stroke-width: 7;
    }

    #age-comparison-chart .is-active .age-data-point {
      transform: scale(1.35);
    }

    #age-comparison-chart
    .age-series:focus-visible .age-data-line {
      filter: drop-shadow(0 0 3px #fff);
    }

    #age-comparison-tooltip {
      width: 340px;
      max-width: calc(100vw - 20px);
      max-height: calc(100vh - 20px);
      overflow-y: auto;
      pointer-events: auto;
      z-index: 10000;
    }

    #age-comparison-tooltip .age-tooltip-context {
      margin-top: 8px;
      color: #aaa;
      font-size: 12px;
    }

    #age-comparison-tooltip .donut-tooltip-total {
      font-size: 18px;
    }

    #age-comparison-tooltip .age-tooltip-note {
      margin: -5px 0 18px;
      color: #888;
      font-size: 11px;
      line-height: 1.4;
    }

    #age-comparison-tooltip .donut-subcategory-name {
      flex: 1;
      min-width: 0;
      max-width: none;
    }

    #age-comparison-tooltip .donut-subcategory-value {
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      #age-comparison-chart .age-series-visual,
      #age-comparison-chart .age-data-line,
      #age-comparison-chart .age-data-point {
        transition: none;
      }
    }
  `;
})();


/* ==========================================================
   HEADER — AKTIVE SECTION
========================================================== */

const startButton = document.querySelector(
    '.nav-button[href="#start"]'
);

const aboutButton = document.querySelector(
    '.nav-button[href="#about"]'
);

const aboutSection = document.querySelector("#about");

function updateActiveNavigation() {
    if (!startButton || !aboutButton || !aboutSection) {
        return;
    }

    const aboutTop = aboutSection.getBoundingClientRect().top;

    if (aboutTop < window.innerHeight * 0.45) {
        startButton.classList.remove("active");
        aboutButton.classList.add("active");
    } else {
        aboutButton.classList.remove("active");
        startButton.classList.add("active");
    }
}

window.addEventListener(
    "scroll",
    updateActiveNavigation,
    { passive: true }
);

updateActiveNavigation();


/* ==========================================================
   DONUT-ELEMENTE
========================================================== */

const donutChart = document.getElementById("donut-chart");
const donutTotal = document.getElementById("donut-total");
const donutLegend = document.getElementById("donut-legend");
const donutTooltip = document.getElementById("donut-tooltip");

const donutTooltipTitle = document.getElementById(
    "donut-tooltip-title"
);

const donutTooltipTotal = document.getElementById(
    "donut-tooltip-total"
);

const donutTooltipList = document.getElementById(
    "donut-tooltip-list"
);


/* ==========================================================
   CLUSTER
========================================================== */

const donutClusters = [
    {
        id: "physical",
        label: "KÖRPERLICHE GEWALT & TÖTUNG",
        color: "#ff0000",

        match: function (name) {
            return (
                name.includes("Tötungsdelikte") ||
                name.includes("Körperverletzung") ||
                name.includes("Tätlichkeiten") ||
                name.includes("Gefährdung des Lebens") ||
                name.includes("Verabreichen gesundheitsgefährdender")
            );
        }
    },
    {
        id: "verbal",
        label: "VERBALE/DIGITALE GEWALT & EHRVERLETZUNG",
        color: "#ff3333",

        match: function (name) {
            return (
                name.includes("Üble Nachrede") ||
                name.includes("Verleumdung") ||
                name.includes("Beschimpfung") ||
                name.includes("Missbrauch einer Fernmeldeanlage")
            );
        }
    },
    {
        id: "threat",
        label: "DROHUNG, ZWANG & FREIHEITSENTZUG",
        color: "#ff6666",

        match: function (name) {
            return (
                name.includes("Drohung") ||
                (
                    name.includes("Nötigung") &&
                    !name.includes("Sexuelle") &&
                    !name.includes("Sexueller")
                ) ||
                name.includes("Freiheitsberaubung")
            );
        }
    },
    {
        id: "sexual",
        label: "SEXUALDELIKTE",
        color: "#ff9999",

        match: function (name) {
            return (
                name.includes("Sexuelle") ||
                name.includes("Sexueller") ||
                name.includes("Vergewaltigung") ||
                name.includes("Schändung") ||
                name.includes("Missbrauch einer urteilsunfähigen") ||
                name.includes("Unbefugtes Weiterleiten")
            );
        }
    },
    {
        id: "other",
        label: "ÜBRIGE STRAFTATEN",
        color: "#ffcccc",

        match: function (name) {
            return name.includes("übrige Art.");
        }
    }
];


/* ==========================================================
   HILFSFUNKTIONEN
========================================================== */

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function parseNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const cleaned = String(value)
        .replace(/'/g, "")
        .replace(/,/g, "")
        .trim();

    const number = Number(cleaned);

    if (Number.isFinite(number)) {
        return number;
    }

    return 0;
}


/* ==========================================================
   DATEN LADEN
========================================================== */

async function loadData() {
    try {
        const response = await fetch("unload.php");

        if (!response.ok) {
            throw new Error("HTTP-Fehler: " + response.status);
        }

        const data = await response.json();

        console.log("Daten aus der API:", data);

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("Die API hat keine Daten geliefert.");
            return;
        }

        console.log(
            "Jahre:",
            [...new Set(data.map(row => row.jahr))].sort()
        );

        console.log(
            "Geschlechter:",
            [...new Set(data.map(row => row.geschlecht))]
        );

        console.log(
            "Altersgruppen:",
            [...new Set(data.map(row => row.altersgruppe))]
        );

        updateDataVisualisations(data);
        loadDonutData(data);
        loadDevelopmentData(data);
        loadAgeComparisonData(data);
    } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
    }
}


/* ==========================================================
   LETZTE 10 JAHRE ERMITTELN
========================================================== */

function getLastTenYears(data) {
    const years = data
        .map(function (row) {
            return Number(row.jahr);
        })
        .filter(function (year) {
            return Number.isFinite(year);
        });

    if (years.length === 0) {
        return null;
    }

    const latestYear = Math.max(...years);
    const firstYear = latestYear - 9;

    return {
        firstYear: firstYear,
        latestYear: latestYear
    };
}


/* ==========================================================
   DATEN FILTERN
========================================================== */

function filterRelevantData(data) {
    const period = getLastTenYears(data);

    if (!period) {
        return {
            rows: [],
            firstYear: null,
            latestYear: null
        };
    }

    console.log(
        "Filter-Zeitraum:",
        period.firstYear + "–" + period.latestYear
    );

    const relevantAges = new Set([
        "kids",
        "teens",
        "youngadult"
    ]);

    const relevantRows = data.filter(function (row) {
        const year = Number(row.jahr);
        const age = normalizeText(row.altersgruppe);

        const isCorrectYear =
            Number.isFinite(year) &&
            year >= period.firstYear &&
            year <= period.latestYear;

        const isCorrectAge = relevantAges.has(age);

        return isCorrectYear && isCorrectAge;
    });

    console.log(
        "Relevante Rohdaten für unter 18:",
        relevantRows
    );

    const grouped = {};

    relevantRows.forEach(function (row) {
        const year = Number(row.jahr);
        const name = String(row.straftat ?? "").trim();

        if (!name) {
            return;
        }

        const amount = parseNumber(row.anzahl);
        const key = year + "___" + name;

        if (!grouped[key]) {
            grouped[key] = {
                jahr: year,
                straftat: name,
                altersgruppe: "bis 17",
                geschlecht: "alle",
                anzahl: 0
            };
        }

        grouped[key].anzahl += amount;
    });

    const result = Object.values(grouped);

    console.log(
        "Zusammengefasste Daten bis 17:",
        result
    );

    return {
        rows: result,
        firstYear: period.firstYear,
        latestYear: period.latestYear
    };
}


/* ==========================================================
   GROSSE PROZENTZAHLEN AKTUALISIEREN
========================================================== */

function updateDataVisualisations(data) {
    const filtered = filterRelevantData(data);
    const relevantRows = filtered.rows;

    if (!relevantRows || relevantRows.length === 0) {
        console.warn(
            "Keine passenden Daten für die letzten 10 Jahre gefunden."
        );
        return;
    }

    console.log(
        "Verwendeter Zeitraum:",
        filtered.firstYear + "–" + filtered.latestYear
    );

    const total = relevantRows.reduce(function (sum, row) {
        return sum + parseNumber(row.anzahl);
    }, 0);

    console.log("Gesamtzahl letzte 10 Jahre:", total);

    const clusters = createClusterData(relevantRows);

    console.log("Cluster:", clusters);

    const physicalCluster = clusters.find(
        cluster => cluster.id === "physical"
    );

    if (physicalCluster) {
        updateBigStat(
            ".station-family",
            physicalCluster.total,
            total
        );
    }

    const verbalCluster = clusters.find(
        cluster => cluster.id === "verbal"
    );

    if (verbalCluster) {
        updateBigStat(
            ".station-school",
            verbalCluster.total,
            total
        );
    }

    const threatCluster = clusters.find(
        cluster => cluster.id === "threat"
    );

    if (threatCluster) {
        updateBigStat(
            ".station-medical",
            threatCluster.total,
            total
        );
    }

    const sexualCluster = clusters.find(
        cluster => cluster.id === "sexual"
    );

    if (sexualCluster) {
        updateBigStat(
            ".station-neighbourhood",
            sexualCluster.total,
            total
        );
    }

    const otherCluster = clusters.find(
        cluster => cluster.id === "other"
    );

    if (otherCluster) {
        updateBigStat(
            ".station-authorities",
            otherCluster.total,
            total
        );
    }
}

function createClusterData(rows) {
    const clusterData = donutClusters.map(function (cluster) {
        return {
            ...cluster,
            total: 0,
            subcategories: {}
        };
    });

    rows.forEach(function (row) {
        const name = String(row.straftat ?? "").trim();
        const amount = parseNumber(row.anzahl);

        const cluster = clusterData.find(function (item) {
            return item.match(name);
        });

        if (!cluster) {
            console.warn("Keinem Cluster zugeordnet:", name);
            return;
        }

        cluster.total += amount;

        const subcategory = getSubcategoryKey(name);

        if (!cluster.subcategories[subcategory]) {
            cluster.subcategories[subcategory] = 0;
        }

        cluster.subcategories[subcategory] += amount;
    });

    return clusterData.filter(function (cluster) {
        return cluster.total > 0;
    });
}

function updateBigStat(stationSelector, categoryValue, total) {
    const station = document.querySelector(stationSelector);

    if (!station) {
        return;
    }

    const bigStat = station.querySelector(".big-stat");

    if (!bigStat) {
        return;
    }

    const percentage =
        total > 0 ? categoryValue / total * 100 : 0;

    const rounded = Math.round(percentage * 10) / 10;

    bigStat.innerHTML = `${rounded}<span>%</span>`;
}


/* ==========================================================
   UNTERKATEGORIEN ZUORDNEN
========================================================== */

function getSubcategoryKey(name) {
    if (name.includes("Tötungsdelikte vollendet")) {
        return "Tötungsdelikte vollendet";
    }

    if (name.includes("Tötungsdelikte versucht")) {
        return "Tötungsdelikte versucht";
    }

    if (name.includes("Schwere Körperverletzung")) {
        return "Schwere Körperverletzung";
    }

    if (name.includes("Einfache Körperverletzung")) {
        return "Einfache Körperverletzung";
    }

    if (name.includes("Tätlichkeiten")) {
        return "Tätlichkeiten";
    }

    if (name.includes("Gefährdung des Lebens")) {
        return "Gefährdung des Lebens";
    }

    if (name.includes("Verabreichen gesundheitsgefährdender")) {
        return "Verabreichen gesundheitsgefährdender Stoffe";
    }

    if (name.includes("Üble Nachrede")) {
        return "Üble Nachrede";
    }

    if (name.includes("Verleumdung")) {
        return "Verleumdung";
    }

    if (name.includes("Beschimpfung")) {
        return "Beschimpfung";
    }

    if (name.includes("Missbrauch einer Fernmeldeanlage")) {
        return "Missbrauch einer Fernmeldeanlage";
    }

    if (name.includes("Sexuelle Handlungen mit Kindern")) {
        return "Sexuelle Handlungen mit Kindern";
    }

    if (name.includes("Sexuelle Handlungen mit Abhängigen")) {
        return "Sexuelle Handlungen mit Abhängigen";
    }

    if (
        name.includes("Sexuelle Nötigung") ||
        name.includes("Sexueller Übergriff und sexuelle Nötigung")
    ) {
        return "Sexueller Übergriff / sexuelle Nötigung";
    }

    if (name.includes("Vergewaltigung")) {
        return "Vergewaltigung";
    }

    if (
        name.includes("Missbrauch einer urteilsunfähigen") ||
        name.includes("Schändung")
    ) {
        return "Schändung / Missbrauch einer urteilsunfähigen Person";
    }

    if (name.includes("Sexuelle Belästigungen")) {
        return "Sexuelle Belästigungen";
    }

    if (name.includes("Unbefugtes Weiterleiten")) {
        return "Unbefugtes Weiterleiten sexueller Inhalte";
    }

    if (name.includes("Drohung")) {
        return "Drohung";
    }

    if (name.includes("Nötigung")) {
        return "Nötigung";
    }

    if (name.includes("Freiheitsberaubung")) {
        return "Freiheitsberaubung und Entführung";
    }

    if (name.includes("übrige Art.")) {
        return "Übrige Artikel des StGB";
    }

    return name;
}


/* ==========================================================
   DONUT-DATEN LADEN
========================================================== */

function loadDonutData(data) {
    if (
        !donutChart ||
        !donutTotal ||
        !donutLegend ||
        !donutTooltip ||
        !donutTooltipTitle ||
        !donutTooltipTotal ||
        !donutTooltipList
    ) {
        console.warn("Donut-Elemente im HTML nicht gefunden.");
        return;
    }

    const filtered = filterRelevantData(data);
    const relevantRows = filtered.rows;

    if (!relevantRows || relevantRows.length === 0) {
        console.warn("Keine Daten für den Donut gefunden.");
        return;
    }

    const clusters = createClusterData(relevantRows);

    console.log("Donut-Cluster:", clusters);

    renderDonut(
        clusters,
        filtered.firstYear,
        filtered.latestYear
    );
}


/* ==========================================================
   DONUT ZEICHNEN
========================================================== */

function renderDonut(clusters, firstYear, latestYear) {
    if (!donutChart || !donutLegend || !donutTotal) {
        return;
    }

    donutChart.innerHTML = "";
    donutLegend.innerHTML = "";

    const total = clusters.reduce(function (sum, cluster) {
        return sum + cluster.total;
    }, 0);

    if (total <= 0) {
        return;
    }

    donutTotal.textContent = total.toLocaleString("de-CH");

    const periodLabel = document.querySelector(".donut-label");

    if (periodLabel) {
        periodLabel.textContent =
            firstYear + " — " + latestYear;
    }

    const center = 300;
    const radius = 190;
    const innerRadius = 122;

    let currentAngle = -90;

    clusters.forEach(function (cluster, index) {
        const percentage = cluster.total / total;
        const angle = percentage * 360;

        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        const path = createDonutPath(
            center,
            center,
            radius,
            innerRadius,
            startAngle,
            endAngle
        );

        path.classList.add("donut-segment");
        path.dataset.index = index;
        path.style.fill = cluster.color;

        const clusterPages = {
            physical: "koerperliche-gewalt.html",
            verbal: "verbale-gewalt.html",
            threat: "drohung-zwang.html",
            sexual: "sexualdelikte.html",
            other: "uebrige-straftaten.html"
        };

        path.addEventListener("click", function () {
            const targetPage = clusterPages[cluster.id];

            if (targetPage) {
                window.location.href = targetPage;
            }
        });

        path.addEventListener("mouseenter", function (event) {
            showDonutTooltip(cluster, percentage, event);

            document
                .querySelectorAll(".donut-segment")
                .forEach(function (other) {
                    if (other !== path) {
                        other.classList.add("is-dimmed");
                    }
                });
        });

        path.addEventListener("mousemove", function (event) {
            moveDonutTooltip(event);
        });

        path.addEventListener("mouseleave", function () {
            hideDonutTooltip();

            document
                .querySelectorAll(".donut-segment")
                .forEach(function (other) {
                    other.classList.remove("is-dimmed");
                });
        });

        donutChart.appendChild(path);

        if (percentage >= 0.04) {
            const labelAngle = startAngle + angle / 2;
            const labelRadius = 155;

            const position = polarToCartesian(
                center,
                center,
                labelRadius,
                labelAngle
            );

            const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            text.setAttribute("x", position.x);
            text.setAttribute("y", position.y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");

            text.classList.add("donut-percentage");

            text.textContent =
                Math.round(percentage * 100) + "%";

            donutChart.appendChild(text);
        }

        createDonutLegendItem(cluster, percentage, index);

        currentAngle = endAngle;
    });
}

function polarToCartesian(cx, cy, radius, angle) {
    const radians = (angle - 90) * Math.PI / 180;

    return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians)
    };
}

function createDonutPath(
    cx,
    cy,
    outerRadius,
    innerRadius,
    startAngle,
    endAngle
) {
    const outerStart = polarToCartesian(
        cx,
        cy,
        outerRadius,
        startAngle
    );

    const outerEnd = polarToCartesian(
        cx,
        cy,
        outerRadius,
        endAngle
    );

    const innerStart = polarToCartesian(
        cx,
        cy,
        innerRadius,
        endAngle
    );

    const innerEnd = polarToCartesian(
        cx,
        cy,
        innerRadius,
        startAngle
    );

    const largeArcFlag =
        endAngle - startAngle > 180 ? 1 : 0;

    const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    const d = [
        "M",
        outerStart.x,
        outerStart.y,
        "A",
        outerRadius,
        outerRadius,
        0,
        largeArcFlag,
        1,
        outerEnd.x,
        outerEnd.y,
        "L",
        innerStart.x,
        innerStart.y,
        "A",
        innerRadius,
        innerRadius,
        0,
        largeArcFlag,
        0,
        innerEnd.x,
        innerEnd.y,
        "Z"
    ].join(" ");

    path.setAttribute("d", d);

    return path;
}


/* ==========================================================
   DONUT-INFOFELD
========================================================== */

function showDonutTooltip(cluster, percentage, event) {
    if (
        !donutTooltip ||
        !donutTooltipTitle ||
        !donutTooltipTotal ||
        !donutTooltipList
    ) {
        return;
    }

    donutTooltipTitle.textContent = cluster.label;

    donutTooltipTotal.textContent =
        cluster.total.toLocaleString("de-CH") +
        " Fälle · " +
        (percentage * 100).toFixed(1) +
        "%";

    donutTooltipList.innerHTML = "";

    const subcategories = Object.entries(cluster.subcategories)
        .sort(function (a, b) {
            return b[1] - a[1];
        });

    subcategories.forEach(function ([name, value]) {
        const row = document.createElement("div");

        row.className = "donut-subcategory";

        row.innerHTML = `
      <span class="donut-subcategory-name">
        ${name}
      </span>
      <span class="donut-subcategory-value">
        ${value.toLocaleString("de-CH")}
      </span>
    `;

        donutTooltipList.appendChild(row);
    });

    donutTooltip.classList.add("is-visible");

    moveDonutTooltip(event);
}

function moveDonutTooltip(event) {
    if (!donutTooltip) {
        return;
    }

    const offset = 18;

    let x = event.clientX + offset;
    let y = event.clientY + offset;

    const rect = donutTooltip.getBoundingClientRect();

    if (x + rect.width > window.innerWidth) {
        x = event.clientX - rect.width - offset;
    }

    if (y + rect.height > window.innerHeight) {
        y = event.clientY - rect.height - offset;
    }

    donutTooltip.style.left = x + "px";
    donutTooltip.style.top = y + "px";
}

function hideDonutTooltip() {
    if (!donutTooltip) {
        return;
    }

    donutTooltip.classList.remove("is-visible");
}

function createDonutLegendItem(cluster, percentage, index) {
    if (!donutLegend) {
        return;
    }

    const item = document.createElement("div");

    item.className = "donut-legend-item";

    item.innerHTML = `
    <span
      class="donut-legend-number"
      style="
        border-color:${cluster.color};
        color:${cluster.color};
      "
    >
      ${String(index + 1).padStart(2, "0")}
    </span>
    <span class="donut-legend-text">
      ${cluster.label}
      <span class="donut-legend-percent">
        ${(percentage * 100).toFixed(1)}%
        ·
        ${cluster.total.toLocaleString("de-CH")}
      </span>
    </span>
  `;

    item.addEventListener("mouseenter", function () {
        const segment = document.querySelector(
            `.donut-segment[data-index="${index}"]`
        );

        if (segment) {
            segment.dispatchEvent(
                new MouseEvent("mouseenter")
            );
        }
    });

    item.addEventListener("mouseleave", function () {
        hideDonutTooltip();

        document
            .querySelectorAll(".donut-segment")
            .forEach(function (other) {
                other.classList.remove("is-dimmed");
            });
    });

    donutLegend.appendChild(item);
}


/* ==========================================================
   ENTWICKLUNGSDIAGRAMM
========================================================== */

let developmentState = {
    data: [],
    firstYear: null,
    latestYear: null,
    activeCluster: "physical"
};

function ensureDevelopmentChartHTML() {
    let chart = document.getElementById("development-chart");

    if (chart) {
        return chart;
    }

    const categoryNav = document.querySelector(".category-end-nav");

    if (!categoryNav) {
        console.error(
            "Die Entwicklungssection konnte nicht erstellt werden: " +
            ".category-end-nav fehlt."
        );
        return null;
    }

    const section = document.createElement("section");

    section.id = "ten-year-development";
    section.className = "ten-year-development";

    section.innerHTML = `
    <div class="development-chart-area">
      <div class="development-chart-column">
        <div class="development-chart-header">
          <span class="development-label">
            ENTWICKLUNG 2016 — 2025 nach Cluster
          </span>
          <h3 id="development-chart-title">
            KÖRPERLICHE GEWALT<br>
            &amp; TÖTUNG
          </h3>
        </div>

        <div
          class="development-cluster-nav"
          id="development-cluster-nav"
        >
          <button
            type="button"
            class="development-cluster-button"
            data-cluster="physical"
          >01</button>

          <button
            type="button"
            class="development-cluster-button"
            data-cluster="verbal"
          >02</button>

          <button
            type="button"
            class="development-cluster-button"
            data-cluster="threat"
          >03</button>

          <button
            type="button"
            class="development-cluster-button"
            data-cluster="sexual"
          >04</button>

          <button
            type="button"
            class="development-cluster-button"
            data-cluster="other"
          >05</button>
        </div>

        <div class="development-chart-wrapper">
          <svg
            id="development-chart"
            class="development-chart"
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Entwicklung der registrierten Fälle nach Geschlecht und Jahr"
          ></svg>
        </div>

        <div class="development-legend">
          <div class="development-legend-item">
            <span
              class="development-legend-line development-legend-girl"
            ></span>
            <span>Mädchen</span>
          </div>

          <div class="development-legend-item">
            <span
              class="development-legend-line development-legend-boy"
            ></span>
            <span>Jungen</span>
          </div>
        </div>
      </div>

      <div class="development-intro">
        <span class="development-intro-number">
          10 JAHRE
        </span>

        <h3>
          WIE ENTWICKELN<br>
          SICH DIE FÄLLE?
        </h3>

        <p>
          Die Entwicklung zeigt, wie sich die registrierten
          Fälle über die vergangenen zehn Jahre verändert haben.
        </p>

        <p>
          Pro Jahr werden zwei Säulen dargestellt:
          Mädchen und Jungen. Die feinen Linien innerhalb
          der Säulen zeigen die einzelnen Deliktgruppen.
        </p>
      </div>
    </div>
  `;

    categoryNav.parentNode.insertBefore(
        section,
        categoryNav
    );

    chart = document.getElementById("development-chart");

    return chart;
}

function setupDevelopmentClusterNavigation() {
    const buttons = document.querySelectorAll(
        ".development-cluster-button"
    );

    buttons.forEach(function (button) {
        if (button.dataset.developmentBound === "true") {
            return;
        }

        button.dataset.developmentBound = "true";

        button.addEventListener("click", function () {
            const clusterId = button.dataset.cluster;

            if (!clusterId) {
                return;
            }

            developmentState.activeCluster = clusterId;

            buttons.forEach(function (otherButton) {
                otherButton.classList.toggle(
                    "active",
                    otherButton === button
                );
            });

            renderActiveDevelopmentCluster();
        });
    });
}

function loadDevelopmentData(data) {
    const chart = ensureDevelopmentChartHTML();

    if (!chart) {
        console.error(
            "Das Entwicklungsdiagramm konnte nicht erstellt werden."
        );
        return;
    }

    const period = getLastTenYears(data);

    if (!period) {
        console.warn(
            "Kein Zeitraum für das Entwicklungsdiagramm gefunden."
        );
        return;
    }

    const relevantAges = new Set([
        "<10",
        "10-14",
        "15-17",
        "kids",
        "teens",
        "youngadult"
    ]);

    const rows = data.filter(function (row) {
        const year = Number(row.jahr);
        const age = normalizeText(row.altersgruppe);
        const gender = normalizeText(row.geschlecht);
        const amount = parseNumber(row.anzahl);

        return (
            Number.isFinite(year) &&
            year >= period.firstYear &&
            year <= period.latestYear &&
            relevantAges.has(age) &&
            (
                gender === "männlich" ||
                gender === "weiblich"
            ) &&
            amount > 0
        );
    });

    developmentState.data = rows;
    developmentState.firstYear = period.firstYear;
    developmentState.latestYear = period.latestYear;

    console.log("Daten Entwicklungsdiagramm:", rows);

    setupDevelopmentClusterNavigation();
    renderActiveDevelopmentCluster();
}

function renderActiveDevelopmentCluster() {
    const chart = document.getElementById("development-chart");

    if (!chart) {
        return;
    }

    const cluster = donutClusters.find(function (item) {
        return item.id === developmentState.activeCluster;
    });

    if (!cluster) {
        return;
    }

    const title = document.getElementById(
        "development-chart-title"
    );

    if (title) {
        title.innerHTML = cluster.label.replace(
            " & ",
            "<br>&amp; "
        );
    }

    const label = document.querySelector(".development-label");

    if (label) {
        label.textContent =
            developmentState.firstYear +
            " — " +
            developmentState.latestYear;
    }

    renderDevelopmentChart(
        chart,
        developmentState.data,
        developmentState.firstYear,
        developmentState.latestYear,
        cluster
    );
}

function renderDevelopmentChart(
    svg,
    rows,
    firstYear,
    latestYear,
    activeCluster
) {
    if (!svg) {
        return;
    }

    svg.innerHTML = "";

    const width = 1000;
    const height = 500;

    const margin = {
        top: 35,
        right: 35,
        bottom: 65,
        left: 75
    };

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    const years = [];

    for (let year = firstYear; year <= latestYear; year++) {
        years.push(year);
    }

    const values = {};

    years.forEach(function (year) {
        values[year] = {
            maennlich: {},
            weiblich: {}
        };
    });

    rows.forEach(function (row) {
        const year = Number(row.jahr);

        if (!values[year]) {
            return;
        }

        const name = String(row.straftat ?? "").trim();

        if (!name || !activeCluster.match(name)) {
            return;
        }

        const gender = normalizeText(row.geschlecht);
        const amount = parseNumber(row.anzahl);

        if (amount <= 0) {
            return;
        }

        const subcategory = getSubcategoryKey(name);

        if (gender === "männlich") {
            values[year].maennlich[subcategory] =
                (
                    values[year].maennlich[subcategory] ||
                    0
                ) + amount;
        }

        if (gender === "weiblich") {
            values[year].weiblich[subcategory] =
                (
                    values[year].weiblich[subcategory] ||
                    0
                ) + amount;
        }
    });

    let maxValue = 0;

    years.forEach(function (year) {
        const maleTotal = Object.values(
            values[year].maennlich
        ).reduce(function (sum, value) {
            return sum + value;
        }, 0);

        const femaleTotal = Object.values(
            values[year].weiblich
        ).reduce(function (sum, value) {
            return sum + value;
        }, 0);

        values[year].maleTotal = maleTotal;
        values[year].femaleTotal = femaleTotal;

        maxValue = Math.max(
            maxValue,
            maleTotal,
            femaleTotal
        );
    });

    if (maxValue <= 0) {
        const message = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        message.setAttribute("x", width / 2);
        message.setAttribute("y", height / 2);
        message.setAttribute("text-anchor", "middle");

        message.classList.add("development-axis-label");

        message.textContent =
            "Keine Daten für dieses Cluster vorhanden.";

        svg.appendChild(message);
        return;
    }

    const chartWidth =
        width - margin.left - margin.right;

    const chartHeight =
        height - margin.top - margin.bottom;

    function yScale(value) {
        return (
            margin.top +
            chartHeight -
            value / maxValue * chartHeight
        );
    }

    const gridSteps = 5;

    for (let i = 0; i <= gridSteps; i++) {
        const value = Math.round(
            maxValue * i / gridSteps
        );

        const y = yScale(value);

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.setAttribute("x1", margin.left);
        line.setAttribute("x2", width - margin.right);
        line.setAttribute("y1", y);
        line.setAttribute("y2", y);

        line.classList.add("development-grid-line");

        svg.appendChild(line);

        const label = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        label.setAttribute("x", margin.left - 12);
        label.setAttribute("y", y + 4);
        label.setAttribute("text-anchor", "end");

        label.classList.add("development-axis-label");

        label.textContent = value.toLocaleString("de-CH");

        svg.appendChild(label);
    }

    const axis = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    axis.setAttribute("x1", margin.left);
    axis.setAttribute("x2", width - margin.right);
    axis.setAttribute("y1", margin.top + chartHeight);
    axis.setAttribute("y2", margin.top + chartHeight);

    axis.classList.add("development-axis");

    svg.appendChild(axis);

    const yearWidth = chartWidth / years.length;

    const barWidth = Math.min(
        24,
        yearWidth * 0.23
    );

    years.forEach(function (year, index) {
        const centerX =
            margin.left +
            (index + 0.5) * yearWidth;

        const maleData = values[year].maennlich;
        const femaleData = values[year].weiblich;

        createDevelopmentBar(
            svg,
            centerX - barWidth - 3,
            barWidth,
            maleData,
            values[year].maleTotal,
            year,
            "männlich",
            maxValue,
            yScale,
            margin,
            chartHeight,
            activeCluster
        );

        createDevelopmentBar(
            svg,
            centerX + 3,
            barWidth,
            femaleData,
            values[year].femaleTotal,
            year,
            "weiblich",
            maxValue,
            yScale,
            margin,
            chartHeight,
            activeCluster
        );

        const yearLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        yearLabel.setAttribute("x", centerX);
        yearLabel.setAttribute("y", height - 20);
        yearLabel.setAttribute("text-anchor", "middle");

        yearLabel.classList.add("development-year-label");
        yearLabel.textContent = year;

        svg.appendChild(yearLabel);
    });

    console.log("Entwicklungsdiagramm:", values);
}


/* ==========================================================
   SÄULEN UND INFOFELDER
========================================================== */

function createDevelopmentBar(
    svg,
    x,
    barWidth,
    subcategories,
    total,
    year,
    gender,
    maxValue,
    yScale,
    margin,
    chartHeight,
    activeCluster
) {
    if (total <= 0) {
        return;
    }

    setupDevelopmentHover(svg);

    const ns = "http://www.w3.org/2000/svg";

    const bottomY = margin.top + chartHeight;
    const topY = yScale(total);

    const genderLabel =
        gender === "weiblich" ? "Mädchen" : "Jungen";

    const entries = Object.entries(subcategories)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1]);

    const group = document.createElementNS(ns, "g");

    group.classList.add("development-bar-group");

    group.dataset.year = String(year);
    group.dataset.total = String(total);

    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "img");

    group.setAttribute(
        "aria-label",
        `${activeCluster.label} · ${year} · ${genderLabel}: ` +
        `${total.toLocaleString("de-CH")} Fälle. ` +
        entries.map(([name, value]) =>
            `${name}: ${value.toLocaleString("de-CH")}`
        ).join(". ")
    );

    const visual = document.createElementNS(ns, "g");

    visual.classList.add("development-bar-visual");

    visual.style.transformOrigin =
        `${x + barWidth / 2}px ${bottomY}px`;

    const bar = document.createElementNS(ns, "rect");

    bar.setAttribute("x", x);
    bar.setAttribute("y", topY);
    bar.setAttribute("width", barWidth);

    bar.setAttribute(
        "height",
        Math.max(0, bottomY - topY)
    );

    bar.classList.add(
        "development-bar",
        gender === "weiblich"
            ? "development-bar-girl"
            : "development-bar-boy"
    );

    visual.appendChild(bar);

    let cumulative = 0;

    entries.forEach(([, value]) => {
        cumulative += value;

        if (cumulative >= total) {
            return;
        }

        const line = document.createElementNS(ns, "line");
        const lineY = yScale(total - cumulative);

        line.setAttribute("x1", x);
        line.setAttribute("x2", x + barWidth);
        line.setAttribute("y1", lineY);
        line.setAttribute("y2", lineY);

        line.classList.add("development-subcategory-line");

        visual.appendChild(line);
    });

    group.appendChild(visual);

    const hitArea = document.createElementNS(ns, "rect");

    hitArea.setAttribute("x", x);

    hitArea.setAttribute(
        "y",
        Math.min(topY, bottomY - 8)
    );

    hitArea.setAttribute("width", barWidth);

    hitArea.setAttribute(
        "height",
        Math.max(8, bottomY - topY)
    );

    hitArea.classList.add("development-bar-hitarea");

    group.appendChild(hitArea);
    svg.appendChild(group);

    const show = event => {
        const tooltip = getDevelopmentTooltip();

        resetDevelopmentHover(svg);

        svg.classList.add("has-hover");
        svg._developmentActiveGroup = group;

        group.classList.add("is-active");

        const yearTotal = Array.from(
            svg.querySelectorAll(".development-bar-group")
        )
            .filter(
                item => item.dataset.year === String(year)
            )
            .reduce(
                (sum, item) =>
                    sum + Number(item.dataset.total),
                0
            );

        const percentage =
            yearTotal > 0 ? total / yearTotal * 100 : 0;

        tooltip.querySelector(
            ".donut-tooltip-title"
        ).textContent = activeCluster.label;

        tooltip.querySelector(
            ".development-tooltip-context"
        ).textContent = `${year} · ${genderLabel}`;

        tooltip.querySelector(
            ".donut-tooltip-total"
        ).textContent =
            `${total.toLocaleString("de-CH")} Fälle · ` +
            `${percentage.toLocaleString("de-CH", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })}%`;

        tooltip.querySelector(
            ".development-tooltip-note"
        ).textContent =
            `Anteil an dieser Kategorie im Jahr ${year} ` +
            "(Mädchen und Jungen).";

        const list = tooltip.querySelector(
            ".donut-tooltip-list"
        );

        list.replaceChildren();

        entries.forEach(([name, value]) => {
            const row = document.createElement("div");

            row.className = "donut-subcategory";

            const label = document.createElement("span");

            label.className = "donut-subcategory-name";
            label.textContent = name;

            const number = document.createElement("span");

            number.className = "donut-subcategory-value";
            number.textContent = value.toLocaleString("de-CH");

            row.append(label, number);
            list.appendChild(row);
        });

        tooltip.classList.add("is-visible");
        tooltip.setAttribute("aria-hidden", "false");

        moveDevelopmentTooltip(event, group);
    };

    group.addEventListener("pointerenter", event => {
        if (event.pointerType !== "touch") {
            show(event);
        }
    });

    group.addEventListener("pointermove", event => {
        if (svg._developmentActiveGroup === group) {
            moveDevelopmentTooltip(event, group);
        }
    });

    group.addEventListener("pointerleave", event => {
        const tooltip = document.getElementById(
            "development-tooltip"
        );

        if (
            tooltip &&
            tooltip.contains(event.relatedTarget)
        ) {
            return;
        }

        if (
            document.activeElement !== group &&
            svg._developmentActiveGroup === group
        ) {
            resetDevelopmentHover(svg);
        }
    });

    group.addEventListener("focus", () => {
        show(null);
    });

    group.addEventListener("blur", () => {
        if (svg._developmentActiveGroup === group) {
            resetDevelopmentHover(svg);
        }
    });

    group.addEventListener("pointerup", event => {
        if (event.pointerType === "touch") {
            show(event);
        }
    });
}

function getDevelopmentTooltip() {
    let tooltip = document.getElementById(
        "development-tooltip"
    );

    if (tooltip) {
        return tooltip;
    }

    tooltip = document.createElement("div");

    tooltip.id = "development-tooltip";

    tooltip.className =
        "donut-tooltip development-tooltip";

    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");

    tooltip.innerHTML = `
    <div class="donut-tooltip-title"></div>
    <div class="development-tooltip-context"></div>
    <div class="donut-tooltip-total"></div>
    <div class="development-tooltip-note"></div>
    <div class="donut-tooltip-list"></div>
  `;

    document.body.appendChild(tooltip);

    tooltip.addEventListener("pointerleave", event => {
        const svg = document.getElementById(
            "development-chart"
        );

        const active =
            svg && svg._developmentActiveGroup;

        if (
            !active ||
            active.contains(event.relatedTarget) ||
            document.activeElement === active
        ) {
            return;
        }

        resetDevelopmentHover(svg);
    });

    return tooltip;
}

function moveDevelopmentTooltip(event, group) {
    const tooltip = document.getElementById(
        "development-tooltip"
    );

    if (!tooltip) {
        return;
    }

    const anchor = group.getBoundingClientRect();

    const clientX =
        event ? event.clientX : anchor.right;

    const clientY =
        event ? event.clientY : anchor.top;

    const rect = tooltip.getBoundingClientRect();
    const gap = 18;

    let left = clientX + gap;
    let top = clientY + gap;

    if (left + rect.width > window.innerWidth - 10) {
        left = clientX - rect.width - gap;
    }

    if (top + rect.height > window.innerHeight - 10) {
        top = clientY - rect.height - gap;
    }

    tooltip.style.left = Math.max(
        10,
        Math.min(
            left,
            window.innerWidth - rect.width - 10
        )
    ) + "px";

    tooltip.style.top = Math.max(
        10,
        Math.min(
            top,
            window.innerHeight - rect.height - 10
        )
    ) + "px";
}

function resetDevelopmentHover(svg) {
    svg.classList.remove("has-hover");

    svg.querySelectorAll(
        ".development-bar-group.is-active"
    ).forEach(group => {
        group.classList.remove("is-active");
    });

    svg._developmentActiveGroup = null;

    const tooltip = document.getElementById(
        "development-tooltip"
    );

    if (tooltip) {
        tooltip.classList.remove("is-visible");
        tooltip.setAttribute("aria-hidden", "true");
    }
}

function setupDevelopmentHover(svg) {
    if (svg._developmentHoverReady) {
        return;
    }

    svg._developmentHoverReady = true;

    svg.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            resetDevelopmentHover(svg);
        }
    });

    window.addEventListener(
        "scroll",
        () => resetDevelopmentHover(svg),
        { passive: true }
    );

    window.addEventListener(
        "resize",
        () => resetDevelopmentHover(svg)
    );

    document.addEventListener("pointerdown", event => {
        const tooltip = document.getElementById(
            "development-tooltip"
        );

        if (
            !svg.contains(event.target) &&
            !(tooltip && tooltip.contains(event.target))
        ) {
            resetDevelopmentHover(svg);
        }
    });

    new MutationObserver(() => {
        resetDevelopmentHover(svg);
    }).observe(svg, {
        childList: true
    });
}


/* ==========================================================
   ALTERSDIAGRAMM — MÄDCHEN UND JUNGEN
========================================================== */

function loadAgeComparisonData(data) {
    let svg = document.getElementById(
        "age-comparison-chart"
    );

    if (!svg) {
        let section = document.getElementById(
            "age-comparison"
        );

        const categoryNav = document.querySelector(
            ".category-end-nav"
        );

        if (
            !section &&
            categoryNav &&
            categoryNav.parentNode
        ) {
            section = document.createElement("section");

            section.id = "age-comparison";
            section.className = "age-comparison";

            section.innerHTML = `
        <div class="age-comparison-heading">
          <span
            class="age-comparison-kicker"
            id="age-comparison-period"
          >
            LETZTE 10 JAHRE · ALLE DELIKTE
          </span>

          <h2>
            DISKREPANZ MÄDCHEN UND JUNGEN NACH ALTER
          </h2>
        </div>

        <div class="age-comparison-layout">
          <div class="age-chart-wrap">
            <svg
              id="age-comparison-chart"
              viewBox="0 0 1000 560"
              role="img"
              aria-label="Vergleich registrierter Delikte bei Mädchen und Jungen nach Altersgruppe"
            ></svg>
          </div>

          <div class="age-comparison-copy">
            <div class="age-chart-legend-item">
              <span
                class="age-chart-legend-dot girls"
              ></span>
              <span>MÄDCHEN</span>
            </div>

            <div class="age-chart-legend-item">
              <span
                class="age-chart-legend-dot boys"
              ></span>
              <span>JUNGEN</span>
            </div>

            <p>
              Wie verändert sich die Anzahl registrierter
              Delikte bei Mädchen und Jungen mit zunehmendem
              Alter? Verglichen werden die drei Altersgruppen
              anhand aller Delikte der letzten zehn Jahre.
            </p>
          </div>
        </div>
      `;

            categoryNav.parentNode.insertBefore(
                section,
                categoryNav
            );
        } else if (
            section &&
            !section.querySelector("#age-comparison-chart")
        ) {
            const chartWrap =
                section.querySelector(".age-chart-wrap") ||
                section;

            svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            svg.id = "age-comparison-chart";

            svg.setAttribute(
                "viewBox",
                "0 0 1000 560"
            );

            svg.setAttribute("role", "img");

            svg.setAttribute(
                "aria-label",
                "Vergleich registrierter Delikte bei Mädchen und Jungen nach Altersgruppe"
            );

            chartWrap.appendChild(svg);
        }

        svg = document.getElementById(
            "age-comparison-chart"
        );
    }

    if (
        !svg ||
        !Array.isArray(data) ||
        data.length === 0
    ) {
        console.warn(
            "Altersdiagramm: SVG oder Daten fehlen."
        );
        return;
    }

    const period = getLastTenYears(data);

    if (!period) {
        console.warn(
            "Altersdiagramm: keine gültigen Jahreszahlen gefunden."
        );
        return;
    }

    const ageGroups = [
        { key: "kids", label: "Unter 10" },
        { key: "teens", label: "10–14" },
        { key: "youngadult", label: "15–17" }
    ];

    const totals = {
        weiblich: {
            kids: 0,
            teens: 0,
            youngadult: 0
        },
        männlich: {
            kids: 0,
            teens: 0,
            youngadult: 0
        }
    };

    const normalize = value =>
        String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    const parseAmount = value => {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : 0;
        }

        const cleaned = String(value ?? "")
            .trim()
            .replace(/[’']/g, "")
            .replace(/\s/g, "")
            .replace(/,/g, ".");

        const number = Number(cleaned);

        return Number.isFinite(number) ? number : 0;
    };

    data.forEach(row => {
        const year = Number(row.jahr);
        const gender = normalize(row.geschlecht);
        const age = normalize(row.altersgruppe);

        if (
            !Number.isFinite(year) ||
            year < period.firstYear ||
            year > period.latestYear
        ) {
            return;
        }

        if (
            gender !== "weiblich" &&
            gender !== "männlich"
        ) {
            return;
        }

        const ageAliases = {
            kids: "kids",
            "<10": "kids",
            "unter 10": "kids",

            teens: "teens",
            "10-14": "teens",
            "10–14": "teens",

            youngadult: "youngadult",
            "15-17": "youngadult",
            "15–17": "youngadult"
        };

        const ageKey = ageAliases[age];

        if (!ageKey) {
            return;
        }

        totals[gender][ageKey] += parseAmount(row.anzahl);
    });

    console.log("Altersdiagramm Zeitraum:", period);
    console.log("Altersdiagramm Summen:", totals);

    const periodLabel = document.getElementById(
        "age-comparison-period"
    );

    if (periodLabel) {
        periodLabel.textContent =
            `${period.firstYear}–${period.latestYear}` +
            " · ALLE DELIKTE";
    }

    svg.innerHTML = "";

    const width = 1000;
    const height = 560;

    const margin = {
        top: 45,
        right: 40,
        bottom: 90,
        left: 100
    };

    const chartWidth =
        width - margin.left - margin.right;

    const chartHeight =
        height - margin.top - margin.bottom;

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    const values = [
        ...Object.values(totals.weiblich),
        ...Object.values(totals.männlich)
    ].filter(Number.isFinite);

    const maxValue = Math.max(0, ...values);
    const yMax = maxValue > 0 ? maxValue * 1.15 : 10;

    const x = index =>
        margin.left +
        index * chartWidth / (ageGroups.length - 1);

    const y = value =>
        margin.top +
        chartHeight -
        value / yMax * chartHeight;

    const add = (tag, attrs, textContent) => {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );

        Object.entries(attrs).forEach(([key, value]) => {
            element.setAttribute(key, String(value));
        });

        if (textContent !== undefined) {
            element.textContent = textContent;
        }

        svg.appendChild(element);

        return element;
    };

    /* Achsen und Gitternetz */

    for (let i = 0; i <= 4; i++) {
        const value = yMax * i / 4;
        const yy = y(value);

        add("line", {
            class: "age-grid-line",
            x1: margin.left,
            x2: width - margin.right,
            y1: yy,
            y2: yy,
            stroke: "#333",
            "stroke-width": 1
        });

        add(
            "text",
            {
                x: margin.left - 15,
                y: yy + 5,
                fill: "#aaa",
                "font-size": 16,
                "text-anchor": "end"
            },
            Math.round(value).toLocaleString("de-CH")
        );
    }

    ageGroups.forEach((group, index) => {
        add(
            "text",
            {
                x: x(index),
                y: height - 45,
                fill: "#fff",
                "font-size": 20,
                "text-anchor": "middle"
            },
            group.label
        );
    });

    add(
        "text",
        {
            x: 28,
            y: height / 2,
            fill: "#aaa",
            "font-size": 17,
            "text-anchor": "middle",
            transform: `rotate(-90 28 ${height / 2})`
        },
        "Anzahl registrierter Delikte"
    );

    /* Datenlinien und stabile unsichtbare Mausflächen */

    const ns = "http://www.w3.org/2000/svg";

    const seriesData = [
        {
            key: "weiblich",
            color: "#FF1D25",
            label: "Mädchen"
        },
        {
            key: "männlich",
            color: "#FF7777",
            label: "Jungen"
        }
    ].map(series => {
        const points = ageGroups.map((age, index) => ({
            x: x(index),
            y: y(totals[series.key][age.key]),
            value: totals[series.key][age.key],
            label: age.label
        }));

        const group = document.createElementNS(ns, "g");

        group.classList.add("age-series");
        group.dataset.gender = series.key;

        const visual = document.createElementNS(ns, "g");

        visual.classList.add("age-series-visual");

        const line = document.createElementNS(ns, "polyline");

        line.classList.add("age-data-line");

        line.setAttribute(
            "points",
            points
                .map(point => `${point.x},${point.y}`)
                .join(" ")
        );

        line.setAttribute("fill", "none");
        line.setAttribute("stroke", series.color);
        line.setAttribute("stroke-width", "4");
        line.setAttribute("stroke-linejoin", "round");
        line.setAttribute("stroke-linecap", "round");

        visual.appendChild(line);

        points.forEach(point => {
            const circle = document.createElementNS(ns, "circle");

            circle.classList.add("age-data-point");

            circle.setAttribute("cx", point.x);
            circle.setAttribute("cy", point.y);
            circle.setAttribute("r", "7");
            circle.setAttribute("fill", series.color);

            visual.appendChild(circle);
        });

        group.appendChild(visual);

        const hitArea = line.cloneNode(false);

        hitArea.setAttribute("class", "age-line-hitarea");
        hitArea.removeAttribute("stroke-width");
        hitArea.setAttribute("stroke", "transparent");

        group.appendChild(hitArea);

        points.forEach(point => {
            const hitPoint = document.createElementNS(ns, "circle");

            hitPoint.classList.add("age-point-hitarea");

            hitPoint.setAttribute("cx", point.x);
            hitPoint.setAttribute("cy", point.y);
            hitPoint.setAttribute("r", "14");

            group.appendChild(hitPoint);
        });

        svg.appendChild(group);

        return {
            ...series,
            points,
            group
        };
    });

    svg.setAttribute("role", "group");

    setupAgeComparisonHover(svg, seriesData, period);
}


/* ==========================================================
   ALTERSDIAGRAMM — HOVER UND INFOBOX
========================================================== */

function setupAgeComparisonHover(svg, seriesData, period) {
    let tooltip = document.getElementById(
        "age-comparison-tooltip"
    );

    if (!tooltip) {
        tooltip = document.createElement("div");

        tooltip.id = "age-comparison-tooltip";

        tooltip.className =
            "donut-tooltip age-comparison-tooltip";

        tooltip.setAttribute("role", "tooltip");
        tooltip.setAttribute("aria-hidden", "true");

        tooltip.innerHTML = `
      <div class="donut-tooltip-title"></div>
      <div class="age-tooltip-context"></div>
      <div class="donut-tooltip-total"></div>
      <div class="age-tooltip-note"></div>
      <div class="donut-tooltip-list"></div>
    `;

        document.body.appendChild(tooltip);
    }

    if (svg._ageHover) {
        svg._ageHover.reset();
    }

    let active = null;
    let hideTimer;

    const combinedTotal = seriesData.reduce(
        (sum, series) =>
            sum + series.points.reduce(
                (total, point) => total + point.value,
                0
            ),
        0
    );

    const cancelHide = () => {
        window.clearTimeout(hideTimer);
    };

    const reset = () => {
        cancelHide();

        svg.classList.remove("has-age-hover");

        seriesData.forEach(series => {
            series.group.classList.remove("is-active");
        });

        active = null;

        tooltip.classList.remove("is-visible");
        tooltip.setAttribute("aria-hidden", "true");
    };

    const move = (event, group) => {
        const anchor = group.getBoundingClientRect();

        const clientX = event
            ? event.clientX
            : anchor.left + anchor.width / 2;

        const clientY = event
            ? event.clientY
            : anchor.top;

        const rect = tooltip.getBoundingClientRect();
        const gap = 18;

        let left = clientX + gap;
        let top = clientY + gap;

        if (left + rect.width > window.innerWidth - 10) {
            left = clientX - rect.width - gap;
        }

        if (top + rect.height > window.innerHeight - 10) {
            top = clientY - rect.height - gap;
        }

        tooltip.style.left = Math.max(
            10,
            Math.min(
                left,
                window.innerWidth - rect.width - 10
            )
        ) + "px";

        tooltip.style.top = Math.max(
            10,
            Math.min(
                top,
                window.innerHeight - rect.height - 10
            )
        ) + "px";
    };

    const show = (series, event) => {
        reset();

        active = series.group;

        svg.classList.add("has-age-hover");
        active.classList.add("is-active");

        const total = series.points.reduce(
            (sum, point) => sum + point.value,
            0
        );

        const share = combinedTotal > 0
            ? total / combinedTotal * 100
            : 0;

        tooltip.querySelector(
            ".donut-tooltip-title"
        ).textContent = series.label.toUpperCase();

        tooltip.querySelector(
            ".age-tooltip-context"
        ).textContent =
            `${period.firstYear}–${period.latestYear} · ALLE DELIKTE`;

        const totalLabel = tooltip.querySelector(
            ".donut-tooltip-total"
        );

        totalLabel.style.color = series.color;

        totalLabel.textContent =
            `${total.toLocaleString("de-CH")} Fälle · ` +
            `${share.toLocaleString("de-CH", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })}%`;

        tooltip.querySelector(
            ".age-tooltip-note"
        ).textContent =
            "Anteil an den Fällen bei Mädchen und Jungen " +
            "in allen drei Altersgruppen.";

        const list = tooltip.querySelector(
            ".donut-tooltip-list"
        );

        list.replaceChildren();

        series.points.forEach(point => {
            const row = document.createElement("div");

            row.className = "donut-subcategory";

            const name = document.createElement("span");

            name.className = "donut-subcategory-name";
            name.textContent = point.label;

            const number = document.createElement("span");

            number.className = "donut-subcategory-value";

            number.textContent =
                point.value.toLocaleString("de-CH");

            row.append(name, number);
            list.appendChild(row);
        });

        tooltip.classList.add("is-visible");
        tooltip.setAttribute("aria-hidden", "false");

        move(event, active);
    };

    const scheduleHide = () => {
        cancelHide();

        hideTimer = window.setTimeout(() => {
            if (
                active &&
                document.activeElement !== active
            ) {
                reset();
            }
        }, 120);
    };

    seriesData.forEach(series => {
        const group = series.group;

        group.setAttribute("tabindex", "0");
        group.setAttribute("role", "img");
        group.setAttribute("aria-describedby", tooltip.id);

        group.setAttribute(
            "aria-label",
            `${series.label}: ` +
            series.points.map(point =>
                `${point.label}: ` +
                `${point.value.toLocaleString("de-CH")} Fälle`
            ).join("; ")
        );

        group.addEventListener("pointerenter", event => {
            if (event.pointerType !== "touch") {
                show(series, event);
            }
        });

        group.addEventListener("pointermove", event => {
            if (active === group) {
                cancelHide();
                move(event, group);
            }
        });

        group.addEventListener("pointerleave", event => {
            if (
                active === group &&
                !tooltip.contains(event.relatedTarget)
            ) {
                scheduleHide();
            }
        });

        group.addEventListener("focus", () => {
            show(series, null);
        });

        group.addEventListener("blur", () => {
            if (active === group) {
                reset();
            }
        });

        group.addEventListener("pointerup", event => {
            if (event.pointerType === "touch") {
                show(series, event);
            }
        });
    });

    svg._ageHover = {
        reset,
        cancelHide,
        scheduleHide
    };

    if (!svg._ageHoverReady) {
        svg._ageHoverReady = true;

        svg.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                svg._ageHover.reset();
            }
        });

        tooltip.addEventListener("pointerenter", () => {
            svg._ageHover.cancelHide();
        });

        tooltip.addEventListener("pointerleave", () => {
            svg._ageHover.scheduleHide();
        });

        window.addEventListener(
            "scroll",
            () => svg._ageHover.reset(),
            { passive: true }
        );

        window.addEventListener("resize", () => {
            svg._ageHover.reset();
        });

        document.addEventListener("pointerdown", event => {
            if (
                !svg.contains(event.target) &&
                !tooltip.contains(event.target)
            ) {
                svg._ageHover.reset();
            }
        });
    }
}


/* ==========================================================
   START
========================================================== */

loadData();


/* ==========================================================
   ERKLÄRUNGSTEXT DES ALTERSDIAGRAMMS
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const chart = document.querySelector(
        "#age-comparison-chart"
    );

    if (!chart) {
        console.error(
            "Das Altersdiagramm wurde nicht gefunden."
        );
        return;
    }

    if (document.querySelector(".chart-explanation")) {
        return;
    }

    const explanation = document.createElement("div");

    explanation.className = "chart-explanation";

    explanation.innerHTML = `
    <p>
      Mit zunehmendem Alter steigen die registrierten Opferzahlen
      bei Mädchen, während sie bei Jungen sinken. In unseren Daten
      zeigt sich, dass der Anstieg bei Mädchen insbesondere
      sexualisierte Gewalt betrifft. Das deckt sich mit
      Forschungsergebnissen von UNICEF, die zeigen, dass Mädchen
      überproportional von sexueller Gewalt betroffen sind und das
      Risiko in der Adoleszenz eine besondere Rolle spielt.
    </p>

    <p>
      Bei Jungen stellt sich die Frage, ob sie sich mit zunehmendem
      Alter besser gegen körperliche Gewalt schützen können –
      beispielsweise durch ihre körperliche Entwicklung, mehr
      Selbstständigkeit oder veränderte Handlungsmöglichkeiten.
      Diese Vermutung ist jedoch wissenschaftlich nicht ausreichend
      belegt. Auch andere Faktoren, etwa Veränderungen der
      Gewaltformen oder der familiären Situation, könnten eine
      Rolle spielen.
    </p>

    <p>
      Die Daten zeigen somit unterschiedliche Entwicklungen bei
      Mädchen und Jungen. Warum diese Unterschiede entstehen,
      lässt sich daraus allein nicht abschliessend erklären.
      Die Ergebnisse machen aber deutlich, wie wichtig es ist,
      Gewalt nach Alter, Geschlecht und Art des Delikts
      differenziert zu betrachten.
    </p>
  `;

    const section = chart.closest(".age-comparison");

    if (section) {
        section.appendChild(explanation);

        console.log(
            "Erklärungstext wurde eingefügt."
        );
    } else {
        console.error(
            "Die Diagramm-Section wurde nicht gefunden."
        );
    }
});