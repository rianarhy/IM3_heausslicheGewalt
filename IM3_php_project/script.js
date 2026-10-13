/* ==========================================================
   VOICES — SCRIPT.JS
   Daten laden + Auswertung + Donut + Entwicklungsdiagramm
========================================================== */


/* ==========================================================
   HEADER — AKTIVE SECTION
========================================================== */

const startButton =
    document.querySelector('.nav-button[href="#start"]');

const aboutButton =
    document.querySelector('.nav-button[href="#about"]');

const aboutSection =
    document.querySelector("#about");


function updateActiveNavigation() {

    if (!startButton || !aboutButton || !aboutSection) {
        return;
    }

    const aboutTop =
        aboutSection.getBoundingClientRect().top;

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
   DONUT-ELEMENTE AUS HTML HOLEN
========================================================== */

const donutChart =
    document.getElementById("donut-chart");

const donutTotal =
    document.getElementById("donut-total");

const donutLegend =
    document.getElementById("donut-legend");

const donutTooltip =
    document.getElementById("donut-tooltip");

const donutTooltipTitle =
    document.getElementById("donut-tooltip-title");

const donutTooltipTotal =
    document.getElementById("donut-tooltip-total");

const donutTooltipList =
    document.getElementById("donut-tooltip-list");



/* ==========================================================
   CLUSTER
========================================================== */

const donutClusters = [

    {
        id: "physical",

        label:
            "KÖRPERLICHE GEWALT & TÖTUNG",

        color:
            "#ff0000",

        match:
            function (name) {

                return (
                    name.includes("Tötungsdelikte") ||
                    name.includes("Körperverletzung") ||
                    name.includes("Tätlichkeiten") ||
                    name.includes("Gefährdung des Lebens") ||
                    name.includes(
                        "Verabreichen gesundheitsgefährdender"
                    )
                );

            }
    },


    {
        id: "verbal",

        label:
            "VERBALE/DIGITALE GEWALT & EHRVERLETZUNG",

        color:
            "#ff3333",

        match:
            function (name) {

                return (
                    name.includes("Üble Nachrede") ||
                    name.includes("Verleumdung") ||
                    name.includes("Beschimpfung") ||
                    name.includes(
                        "Missbrauch einer Fernmeldeanlage"
                    )
                );

            }
    },


    {
        id: "threat",

        label:
            "DROHUNG, ZWANG & FREIHEITSENTZUG",

        color:
            "#ff6666",

        match:
            function (name) {

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

        label:
            "SEXUALDELIKTE",

        color:
            "#ff9999",

        match:
            function (name) {

                return (
                    name.includes("Sexuelle") ||
                    name.includes("Sexueller") ||
                    name.includes("Vergewaltigung") ||
                    name.includes("Schändung") ||
                    name.includes(
                        "Missbrauch einer urteilsunfähigen"
                    ) ||
                    name.includes(
                        "Unbefugtes Weiterleiten"
                    )
                );

            }
    },


    {
        id: "other",

        label:
            "ÜBRIGE STRAFTATEN",

        color:
            "#ffcccc",

        match:
            function (name) {

                return name.includes("übrige Art.");

            }
    }

];



/* ==========================================================
   TEXT NORMALISIEREN
========================================================== */

function normalizeText(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}



/* ==========================================================
   ZAHL NORMALISIEREN
========================================================== */

function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const cleaned =
        String(value)
            .replace(/'/g, "")
            .replace(/,/g, "")
            .trim();


    const number =
        Number(cleaned);


    if (Number.isFinite(number)) {

        return number;

    }


    return 0;

}



/* ==========================================================
   DATEN AUS PHP LADEN
========================================================== */

async function loadData() {

    try {

        const response =
            await fetch("unload.php");


        if (!response.ok) {

            throw new Error(
                "HTTP-Fehler: " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "Daten aus der API:",
            data
        );


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            console.warn(
                "Die API hat keine Daten geliefert."
            );

            return;

        }


        /* DEBUG */

        console.log(
            "Jahre:",
            [
                ...new Set(
                    data.map(
                        row => row.jahr
                    )
                )
            ].sort()
        );


        console.log(
            "Geschlechter:",
            [
                ...new Set(
                    data.map(
                        row => row.geschlecht
                    )
                )
            ]
        );


        console.log(
            "Altersgruppen:",
            [
                ...new Set(
                    data.map(
                        row => row.altersgruppe
                    )
                )
            ]
        );


        /*
         * Daten visualisieren
         */

        updateDataVisualisations(data);

        loadDonutData(data);

        /* NEU:
           Entwicklungsdiagramm laden
        */

        loadDevelopmentData(data);
        loadAgeComparisonData(data);


    } catch (error) {

        console.error(
            "Fehler beim Laden der Daten:",
            error
        );

    }

}



/* ==========================================================
   LETZTE 10 JAHRE ERMITTELN
========================================================== */

function getLastTenYears(data) {

    const years =
        data
            .map(
                function (row) {

                    return Number(row.jahr);

                }
            )
            .filter(
                function (year) {

                    return Number.isFinite(year);

                }
            );


    if (years.length === 0) {

        return null;

    }


    const latestYear =
        Math.max(...years);


    const firstYear =
        latestYear - 9;


    return {

        firstYear:
        firstYear,

        latestYear:
        latestYear

    };

}



/* ==========================================================
   DATEN FILTERN

   API-ZUORDNUNG:

   kids       = <10
   teens      = 10–14
   youngAdult = 15–17

   ALLE DREI = unter 18

   Das Geschlecht wird bewusst nicht
   gefiltert. Dadurch werden männlich
   und weiblich zusammengezählt.
========================================================== */

function filterRelevantData(data) {

    const period =
        getLastTenYears(data);


    if (!period) {

        return {

            rows: [],

            firstYear: null,

            latestYear: null

        };

    }


    console.log(
        "Filter-Zeitraum:",
        period.firstYear +
        "–" +
        period.latestYear
    );


    /*
     * Die drei Altersgruppen,
     * die zusammen bis 17 ergeben.
     */

    const relevantAges =
        new Set([
            "kids",
            "teens",
            "youngadult"
        ]);


    /*
     * Nur Zeitraum + Altersgruppe filtern.
     *
     * Geschlecht bleibt ungefiltert.
     */

    const relevantRows =
        data.filter(
            function (row) {

                const year =
                    Number(row.jahr);


                const age =
                    normalizeText(
                        row.altersgruppe
                    );


                const isCorrectYear =
                    Number.isFinite(year) &&
                    year >= period.firstYear &&
                    year <= period.latestYear;


                const isCorrectAge =
                    relevantAges.has(age);


                return (
                    isCorrectYear &&
                    isCorrectAge
                );

            }
        );


    console.log(
        "Relevante Rohdaten für unter 18:",
        relevantRows
    );


    /*
     * Nach Jahr + Straftat gruppieren.
     *
     * Dadurch werden automatisch:
     *
     * kids
     * teens
     * youngAdult
     *
     * sowie:
     *
     * männlich
     * weiblich
     *
     * zusammengezählt.
     */

    const grouped = {};


    relevantRows.forEach(
        function (row) {

            const year =
                Number(row.jahr);


            const name =
                String(
                    row.straftat ?? ""
                ).trim();


            if (!name) {

                return;

            }


            const amount =
                parseNumber(
                    row.anzahl
                );


            const key =
                year +
                "___" +
                name;


            if (!grouped[key]) {

                grouped[key] = {

                    jahr:
                    year,

                    straftat:
                    name,

                    altersgruppe:
                        "bis 17",

                    geschlecht:
                        "alle",

                    anzahl:
                        0

                };

            }


            grouped[key].anzahl +=
                amount;

        }
    );


    const result =
        Object.values(
            grouped
        );


    console.log(
        "Zusammengefasste Daten bis 17:",
        result
    );


    return {

        rows:
        result,

        firstYear:
        period.firstYear,

        latestYear:
        period.latestYear

    };

}



/* ==========================================================
   DATEN AUSWERTEN
========================================================== */

function updateDataVisualisations(data) {

    const filtered =
        filterRelevantData(data);


    const relevantRows =
        filtered.rows;


    if (
        !relevantRows ||
        relevantRows.length === 0
    ) {

        console.warn(
            "Keine passenden Daten für die letzten 10 Jahre gefunden."
        );

        return;

    }


    console.log(
        "Verwendeter Zeitraum:",
        filtered.firstYear +
        "–" +
        filtered.latestYear
    );


    /*
     * Gesamtzahl
     */

    const total =
        relevantRows.reduce(
            function (
                sum,
                row
            ) {

                return (
                    sum +
                    parseNumber(
                        row.anzahl
                    )
                );

            },
            0
        );


    console.log(
        "Gesamtzahl letzte 10 Jahre:",
        total
    );


    /*
     * Cluster
     */

    const clusters =
        createClusterData(
            relevantRows
        );


    console.log(
        "Cluster:",
        clusters
    );


    /*
     * Stationen aktualisieren
     */

    const physicalCluster =
        clusters.find(
            cluster =>
                cluster.id === "physical"
        );


    if (physicalCluster) {

        updateBigStat(
            ".station-family",
            physicalCluster.total,
            total
        );

    }


    const verbalCluster =
        clusters.find(
            cluster =>
                cluster.id === "verbal"
        );


    if (verbalCluster) {

        updateBigStat(
            ".station-school",
            verbalCluster.total,
            total
        );

    }


    const threatCluster =
        clusters.find(
            cluster =>
                cluster.id === "threat"
        );


    if (threatCluster) {

        updateBigStat(
            ".station-medical",
            threatCluster.total,
            total
        );

    }


    const sexualCluster =
        clusters.find(
            cluster =>
                cluster.id === "sexual"
        );


    if (sexualCluster) {

        updateBigStat(
            ".station-neighbourhood",
            sexualCluster.total,
            total
        );

    }


    const otherCluster =
        clusters.find(
            cluster =>
                cluster.id === "other"
        );


    if (otherCluster) {

        updateBigStat(
            ".station-authorities",
            otherCluster.total,
            total
        );

    }

}



/* ==========================================================
   CLUSTER ERSTELLEN
========================================================== */

function createClusterData(rows) {

    const clusterData =
        donutClusters.map(
            function (cluster) {

                return {

                    ...cluster,

                    total:
                        0,

                    subcategories:
                        {}

                };

            }
        );


    rows.forEach(
        function (row) {

            const name =
                String(
                    row.straftat ?? ""
                ).trim();


            const amount =
                parseNumber(
                    row.anzahl
                );


            const cluster =
                clusterData.find(
                    function (item) {

                        return item.match(name);

                    }
                );


            if (!cluster) {

                console.warn(
                    "Keinem Cluster zugeordnet:",
                    name
                );

                return;

            }


            cluster.total +=
                amount;


            const subcategory =
                getSubcategoryKey(
                    name
                );


            if (
                !cluster.subcategories[
                    subcategory
                    ]
            ) {

                cluster.subcategories[
                    subcategory
                    ] = 0;

            }


            cluster.subcategories[
                subcategory
                ] += amount;

        }
    );


    return clusterData.filter(
        function (cluster) {

            return cluster.total > 0;

        }
    );

}



/* ==========================================================
   BIG STAT AKTUALISIEREN
========================================================== */

function updateBigStat(
    stationSelector,
    categoryValue,
    total
) {

    const station =
        document.querySelector(
            stationSelector
        );


    if (!station) {

        return;

    }


    const bigStat =
        station.querySelector(
            ".big-stat"
        );


    if (!bigStat) {

        return;

    }


    const percentage =
        total > 0
            ? (
            categoryValue /
            total
        ) * 100
            : 0;


    const rounded =
        Math.round(
            percentage * 10
        ) / 10;


    bigStat.innerHTML =
        `${rounded}<span>%</span>`;

}



/* ==========================================================
   UNTERKATEGORIEN
========================================================== */

function getSubcategoryKey(name) {


    /* KÖRPERLICHE GEWALT */

    if (
        name.includes(
            "Tötungsdelikte vollendet"
        )
    ) {

        return "Tötungsdelikte vollendet";

    }


    if (
        name.includes(
            "Tötungsdelikte versucht"
        )
    ) {

        return "Tötungsdelikte versucht";

    }


    if (
        name.includes(
            "Schwere Körperverletzung"
        )
    ) {

        return "Schwere Körperverletzung";

    }


    if (
        name.includes(
            "Einfache Körperverletzung"
        )
    ) {

        return "Einfache Körperverletzung";

    }


    if (
        name.includes(
            "Tätlichkeiten"
        )
    ) {

        return "Tätlichkeiten";

    }


    if (
        name.includes(
            "Gefährdung des Lebens"
        )
    ) {

        return "Gefährdung des Lebens";

    }


    if (
        name.includes(
            "Verabreichen gesundheitsgefährdender"
        )
    ) {

        return (
            "Verabreichen gesundheitsgefährdender Stoffe"
        );

    }



    /* VERBALE / DIGITALE GEWALT */

    if (
        name.includes(
            "Üble Nachrede"
        )
    ) {

        return "Üble Nachrede";

    }


    if (
        name.includes(
            "Verleumdung"
        )
    ) {

        return "Verleumdung";

    }


    if (
        name.includes(
            "Beschimpfung"
        )
    ) {

        return "Beschimpfung";

    }


    if (
        name.includes(
            "Missbrauch einer Fernmeldeanlage"
        )
    ) {

        return (
            "Missbrauch einer Fernmeldeanlage"
        );

    }



    /* SEXUALDELIKTE */

    if (
        name.includes(
            "Sexuelle Handlungen mit Kindern"
        )
    ) {

        return (
            "Sexuelle Handlungen mit Kindern"
        );

    }


    if (
        name.includes(
            "Sexuelle Handlungen mit Abhängigen"
        )
    ) {

        return (
            "Sexuelle Handlungen mit Abhängigen"
        );

    }


    if (
        name.includes(
            "Sexuelle Nötigung"
        ) ||
        name.includes(
            "Sexueller Übergriff und sexuelle Nötigung"
        )
    ) {

        return (
            "Sexueller Übergriff / sexuelle Nötigung"
        );

    }


    if (
        name.includes(
            "Vergewaltigung"
        )
    ) {

        return "Vergewaltigung";

    }


    if (
        name.includes(
            "Missbrauch einer urteilsunfähigen"
        ) ||
        name.includes(
            "Schändung"
        )
    ) {

        return (
            "Schändung / Missbrauch einer urteilsunfähigen Person"
        );

    }


    if (
        name.includes(
            "Sexuelle Belästigungen"
        )
    ) {

        return "Sexuelle Belästigungen";

    }


    if (
        name.includes(
            "Unbefugtes Weiterleiten"
        )
    ) {

        return (
            "Unbefugtes Weiterleiten sexueller Inhalte"
        );

    }



    /* DROHUNG / ZWANG */

    if (
        name.includes(
            "Drohung"
        )
    ) {

        return "Drohung";

    }


    if (
        name.includes(
            "Nötigung"
        )
    ) {

        return "Nötigung";

    }


    if (
        name.includes(
            "Freiheitsberaubung"
        )
    ) {

        return (
            "Freiheitsberaubung und Entführung"
        );

    }



    /* ÜBRIGE STRAFTATEN */

    if (
        name.includes(
            "übrige Art."
        )
    ) {

        return (
            "Übrige Artikel des StGB"
        );

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

        console.warn(
            "Donut-Elemente im HTML nicht gefunden."
        );

        return;

    }


    const filtered =
        filterRelevantData(data);


    const relevantRows =
        filtered.rows;


    if (
        !relevantRows ||
        relevantRows.length === 0
    ) {

        console.warn(
            "Keine Daten für den Donut gefunden."
        );

        return;

    }


    const clusters =
        createClusterData(
            relevantRows
        );


    console.log(
        "Donut-Cluster:",
        clusters
    );


    renderDonut(
        clusters,
        filtered.firstYear,
        filtered.latestYear
    );

}



/* ==========================================================
   DONUT ZEICHNEN
========================================================== */

function renderDonut(
    clusters,
    firstYear,
    latestYear
) {

    if (
        !donutChart ||
        !donutLegend ||
        !donutTotal
    ) {

        return;

    }


    donutChart.innerHTML =
        "";

    donutLegend.innerHTML =
        "";


    const total =
        clusters.reduce(
            function (
                sum,
                cluster
            ) {

                return (
                    sum +
                    cluster.total
                );

            },
            0
        );


    if (total <= 0) {

        return;

    }


    /*
     * Gesamtzahl in der Mitte
     */

    donutTotal.textContent =
        total.toLocaleString(
            "de-CH"
        );


    /*
     * Zeitraum automatisch setzen
     */

    const periodLabel =
        document.querySelector(
            ".donut-label"
        );


    if (periodLabel) {

        periodLabel.textContent =
            firstYear +
            " — " +
            latestYear;

    }


    const center =
        300;

    const radius =
        190;

    const innerRadius =
        122;


    let currentAngle =
        -90;


    clusters.forEach(
        function (
            cluster,
            index
        ) {

            const percentage =
                cluster.total /
                total;


            const angle =
                percentage * 360;


            const startAngle =
                currentAngle;


            const endAngle =
                currentAngle +
                angle;


            /*
             * Donut-Segment
             */

            const path =
                createDonutPath(
                    center,
                    center,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle
                );


            path.classList.add(
                "donut-segment"
            );


            path.dataset.index =
                index;


            path.style.fill =
                cluster.color;


            /* ==========================================================
               KLICK → UNTERSEITE DES CLUSTERS
            ========================================================== */

            const clusterPages = {

                physical:
                    "koerperliche-gewalt.html",

                verbal:
                    "verbale-gewalt.html",

                threat:
                    "drohung-zwang.html",

                sexual:
                    "sexualdelikte.html",

                other:
                    "uebrige-straftaten.html"

            };


            path.addEventListener(
                "click",
                function () {

                    const targetPage =
                        clusterPages[
                            cluster.id
                            ];


                    if (targetPage) {

                        window.location.href =
                            targetPage;

                    }

                }
            );


            /*
             * Mouse Enter
             */

            path.addEventListener(
                "mouseenter",
                function (event) {

                    showDonutTooltip(
                        cluster,
                        percentage,
                        event
                    );


                    document
                        .querySelectorAll(
                            ".donut-segment"
                        )
                        .forEach(
                            function (other) {

                                if (
                                    other !== path
                                ) {

                                    other.classList.add(
                                        "is-dimmed"
                                    );

                                }

                            }
                        );

                }
            );


            /*
             * Mouse Move
             */

            path.addEventListener(
                "mousemove",
                function (event) {

                    moveDonutTooltip(
                        event
                    );

                }
            );


            /*
             * Mouse Leave
             */

            path.addEventListener(
                "mouseleave",
                function () {

                    hideDonutTooltip();


                    document
                        .querySelectorAll(
                            ".donut-segment"
                        )
                        .forEach(
                            function (other) {

                                other.classList.remove(
                                    "is-dimmed"
                                );

                            }
                        );

                }
            );


            donutChart.appendChild(
                path
            );


            /*
             * Prozentzahl im Segment
             */

            if (
                percentage >= 0.04
            ) {

                const labelAngle =
                    startAngle +
                    angle / 2;


                const labelRadius =
                    155;


                const position =
                    polarToCartesian(
                        center,
                        center,
                        labelRadius,
                        labelAngle
                    );


                const text =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "text"
                    );


                text.setAttribute(
                    "x",
                    position.x
                );


                text.setAttribute(
                    "y",
                    position.y
                );


                text.setAttribute(
                    "text-anchor",
                    "middle"
                );


                text.setAttribute(
                    "dominant-baseline",
                    "middle"
                );


                text.classList.add(
                    "donut-percentage"
                );


                text.textContent =
                    Math.round(
                        percentage * 100
                    ) +
                    "%";


                donutChart.appendChild(
                    text
                );

            }


            /*
             * Legende
             */

            createDonutLegendItem(
                cluster,
                percentage,
                index
            );


            currentAngle =
                endAngle;

        }
    );

}



/* ==========================================================
   POLAR KOORDINATEN
========================================================== */

function polarToCartesian(
    cx,
    cy,
    radius,
    angle
) {

    const radians =
        (
            angle - 90
        ) *
        Math.PI /
        180;


    return {

        x:
            cx +
            radius *
            Math.cos(radians),

        y:
            cy +
            radius *
            Math.sin(radians)

    };

}



/* ==========================================================
   DONUT PATH ERSTELLEN
========================================================== */

function createDonutPath(
    cx,
    cy,
    outerRadius,
    innerRadius,
    startAngle,
    endAngle
) {

    const outerStart =
        polarToCartesian(
            cx,
            cy,
            outerRadius,
            startAngle
        );


    const outerEnd =
        polarToCartesian(
            cx,
            cy,
            outerRadius,
            endAngle
        );


    const innerStart =
        polarToCartesian(
            cx,
            cy,
            innerRadius,
            endAngle
        );


    const innerEnd =
        polarToCartesian(
            cx,
            cy,
            innerRadius,
            startAngle
        );


    const largeArcFlag =
        endAngle - startAngle > 180
            ? 1
            : 0;


    const path =
        document.createElementNS(
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


    path.setAttribute(
        "d",
        d
    );


    return path;

}



/* ==========================================================
   TOOLTIP ANZEIGEN
========================================================== */

function showDonutTooltip(
    cluster,
    percentage,
    event
) {

    if (
        !donutTooltip ||
        !donutTooltipTitle ||
        !donutTooltipTotal ||
        !donutTooltipList
    ) {

        return;

    }


    donutTooltipTitle.textContent =
        cluster.label;


    donutTooltipTotal.textContent =
        cluster.total.toLocaleString(
            "de-CH"
        ) +
        " Fälle · " +
        (
            percentage * 100
        ).toFixed(1) +
        "%";


    donutTooltipList.innerHTML =
        "";


    const subcategories =
        Object.entries(
            cluster.subcategories
        )
            .sort(
                function (
                    a,
                    b
                ) {

                    return b[1] - a[1];

                }
            );


    subcategories.forEach(
        function (
            [name, value]
        ) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "donut-subcategory";


            row.innerHTML = `

                <span class="donut-subcategory-name">
                    ${name}
                </span>

                <span class="donut-subcategory-value">
                    ${value.toLocaleString("de-CH")}
                </span>

            `;


            donutTooltipList.appendChild(
                row
            );

        }
    );


    donutTooltip.classList.add(
        "is-visible"
    );


    moveDonutTooltip(
        event
    );

}



/* ==========================================================
   TOOLTIP POSITIONIEREN
========================================================== */

function moveDonutTooltip(event) {

    if (!donutTooltip) {

        return;

    }


    const offset =
        18;


    let x =
        event.clientX +
        offset;


    let y =
        event.clientY +
        offset;


    const rect =
        donutTooltip.getBoundingClientRect();


    if (
        x + rect.width >
        window.innerWidth
    ) {

        x =
            event.clientX -
            rect.width -
            offset;

    }


    if (
        y + rect.height >
        window.innerHeight
    ) {

        y =
            event.clientY -
            rect.height -
            offset;

    }


    donutTooltip.style.left =
        x + "px";


    donutTooltip.style.top =
        y + "px";

}



/* ==========================================================
   TOOLTIP AUSBLENDEN
========================================================== */

function hideDonutTooltip() {

    if (!donutTooltip) {

        return;

    }


    donutTooltip.classList.remove(
        "is-visible"
    );

}



/* ==========================================================
   LEGENDE ERSTELLEN
========================================================== */

function createDonutLegendItem(
    cluster,
    percentage,
    index
) {

    if (!donutLegend) {

        return;

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "donut-legend-item";


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


    /*
     * Hover über Legende
     */

    item.addEventListener(
        "mouseenter",
        function () {

            const segment =
                document.querySelector(
                    `.donut-segment[data-index="${index}"]`
                );


            if (segment) {

                segment.dispatchEvent(
                    new MouseEvent(
                        "mouseenter"
                    )
                );

            }

        }
    );


    item.addEventListener(
        "mouseleave",
        function () {

            hideDonutTooltip();


            document
                .querySelectorAll(
                    ".donut-segment"
                )
                .forEach(
                    function (other) {

                        other.classList.remove(
                            "is-dimmed"
                        );

                    }
                );

        }
    );


    donutLegend.appendChild(
        item
    );

}



/* ==========================================================
   ENTWICKLUNGSDIAGRAMM
   Letzte 10 Jahre / Mädchen & Jungen
   5 Cluster + Unterkategorien
========================================================== */

let developmentState = {
    data: [],
    firstYear: null,
    latestYear: null,
    activeCluster: "physical"
};


/* ==========================================================
   ENTWICKLUNGSDIAGRAMM — HTML SICHERSTELLEN
========================================================== */

function ensureDevelopmentChartHTML() {

    let chart =
        document.getElementById("development-chart");


    /*
     * Falls das SVG bereits im HTML vorhanden ist,
     * verwenden wir es direkt.
     */

    if (chart) {
        return chart;
    }


    /*
     * Falls eine ältere HTML-Version geladen wird,
     * erzeugen wir die komplette Section automatisch.
     */

    const categoryNav =
        document.querySelector(".category-end-nav");


    if (!categoryNav) {

        console.error(
            "Die Entwicklungssection konnte nicht erstellt werden: .category-end-nav fehlt."
        );

        return null;

    }


    const section =
        document.createElement("section");


    section.id =
        "ten-year-development";

    section.className =
        "ten-year-development";


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
                        <span class="development-legend-line development-legend-girl"></span>
                        <span>Mädchen</span>
                    </div>

                    <div class="development-legend-item">
                        <span class="development-legend-line development-legend-boy"></span>
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


    chart =
        document.getElementById("development-chart");


    return chart;

}


/* ==========================================================
   CLUSTER-NAVIGATION EINRICHTEN
========================================================== */

function setupDevelopmentClusterNavigation() {

    const buttons =
        document.querySelectorAll(
            ".development-cluster-button"
        );


    buttons.forEach(
        function (button) {

            /* Verhindert doppelte Event-Listener */
            if (button.dataset.developmentBound === "true") {
                return;
            }


            button.dataset.developmentBound = "true";


            button.addEventListener(
                "click",
                function () {

                    const clusterId =
                        button.dataset.cluster;


                    if (!clusterId) {
                        return;
                    }


                    developmentState.activeCluster =
                        clusterId;


                    buttons.forEach(
                        function (otherButton) {

                            otherButton.classList.toggle(
                                "active",
                                otherButton === button
                            );

                        }
                    );


                    renderActiveDevelopmentCluster();

                }
            );

        }
    );

}


/* ==========================================================
   ENTWICKLUNGSDATEN LADEN
========================================================== */

function loadDevelopmentData(data) {

    const chart =
        ensureDevelopmentChartHTML();


    if (!chart) {

        console.error(
            "Das Entwicklungsdiagramm konnte nicht erstellt werden."
        );

        return;

    }


    const period =
        getLastTenYears(data);


    if (!period) {

        console.warn(
            "Kein Zeitraum für das Entwicklungsdiagramm gefunden."
        );

        return;

    }


    /*
     * Die API verwendet je nach Datensatz entweder:
     *
     * <10 / 10-14 / 15-17
     *
     * oder die bereits normalisierten Begriffe:
     *
     * kids / teens / youngadult
     *
     * Wir akzeptieren deshalb beide Varianten.
     */

    const relevantAges =
        new Set([
            "<10",
            "10-14",
            "15-17",
            "kids",
            "teens",
            "youngadult"
        ]);


    const rows =
        data.filter(
            function (row) {

                const year =
                    Number(row.jahr);


                const age =
                    normalizeText(
                        row.altersgruppe
                    );


                const gender =
                    normalizeText(
                        row.geschlecht
                    );


                const amount =
                    parseNumber(
                        row.anzahl
                    );


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

            }
        );


    developmentState.data =
        rows;

    developmentState.firstYear =
        period.firstYear;

    developmentState.latestYear =
        period.latestYear;


    console.log(
        "Daten Entwicklungsdiagramm:",
        rows
    );


    setupDevelopmentClusterNavigation();

    renderActiveDevelopmentCluster();

}


/* ==========================================================
   AKTIVES CLUSTER RENDERN
========================================================== */

function renderActiveDevelopmentCluster() {

    const chart =
        document.getElementById(
            "development-chart"
        );


    if (!chart) {
        return;
    }


    const cluster =
        donutClusters.find(
            function (item) {
                return (
                    item.id ===
                    developmentState.activeCluster
                );
            }
        );


    if (!cluster) {
        return;
    }


    const title =
        document.getElementById(
            "development-chart-title"
        );


    if (title) {

        title.innerHTML =
            cluster.label
                .replace(
                    " & ",
                    "<br>&amp; "
                );

    }


    const label =
        document.querySelector(
            ".development-label"
        );


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


/* ==========================================================
   ENTWICKLUNGSDIAGRAMM ZEICHNEN

   PRO JAHR:
   - 1 Säule Mädchen
   - 1 Säule Jungen
   - KEINE zusätzliche Total-Säule
   - feine Linien innerhalb der Säulen
     markieren die Unterkategorien
========================================================== */

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


    /* ======================================================
       JAHRE
    ====================================================== */

    const years = [];


    for (
        let year = firstYear;
        year <= latestYear;
        year++
    ) {

        years.push(year);

    }


    /* ======================================================
       DATEN PRO JAHR / GESCHLECHT / UNTERKATEGORIE
    ====================================================== */

    const values = {};


    years.forEach(
        function (year) {

            values[year] = {
                maennlich: {},
                weiblich: {}
            };

        }
    );


    rows.forEach(
        function (row) {

            const year =
                Number(row.jahr);


            if (!values[year]) {
                return;
            }


            const name =
                String(
                    row.straftat ?? ""
                ).trim();


            if (!name) {
                return;
            }


            if (!activeCluster.match(name)) {
                return;
            }


            const gender =
                normalizeText(
                    row.geschlecht
                );


            const amount =
                parseNumber(
                    row.anzahl
                );


            if (amount <= 0) {
                return;
            }


            const subcategory =
                getSubcategoryKey(name);


            if (
                gender === "männlich"
            ) {

                values[year].maennlich[subcategory] =
                    (
                        values[year].maennlich[subcategory] ||
                        0
                    ) + amount;

            }


            if (
                gender === "weiblich"
            ) {

                values[year].weiblich[subcategory] =
                    (
                        values[year].weiblich[subcategory] ||
                        0
                    ) + amount;

            }

        }
    );


    /* ======================================================
       GESAMTWERTE PRO JAHR
    ====================================================== */

    let maxValue = 0;


    years.forEach(
        function (year) {

            const maleTotal =
                Object.values(
                    values[year].maennlich
                ).reduce(
                    function (sum, value) {
                        return sum + value;
                    },
                    0
                );


            const femaleTotal =
                Object.values(
                    values[year].weiblich
                ).reduce(
                    function (sum, value) {
                        return sum + value;
                    },
                    0
                );


            values[year].maleTotal =
                maleTotal;

            values[year].femaleTotal =
                femaleTotal;


            maxValue =
                Math.max(
                    maxValue,
                    maleTotal,
                    femaleTotal
                );

        }
    );


    if (maxValue <= 0) {

        const message =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );


        message.setAttribute(
            "x",
            width / 2
        );

        message.setAttribute(
            "y",
            height / 2
        );

        message.setAttribute(
            "text-anchor",
            "middle"
        );

        message.classList.add(
            "development-axis-label"
        );

        message.textContent =
            "Keine Daten für dieses Cluster vorhanden.";


        svg.appendChild(message);

        return;

    }


    /* ======================================================
       ZEICHENBEREICH
    ====================================================== */

    const chartWidth =
        width -
        margin.left -
        margin.right;


    const chartHeight =
        height -
        margin.top -
        margin.bottom;


    function yScale(value) {

        return (
            margin.top +
            chartHeight -
            (
                value /
                maxValue
            ) *
            chartHeight
        );

    }


    /* ======================================================
       GITTERLINIEN
    ====================================================== */

    const gridSteps = 5;


    for (
        let i = 0;
        i <= gridSteps;
        i++
    ) {

        const value =
            Math.round(
                maxValue *
                i /
                gridSteps
            );


        const y =
            yScale(value);


        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );


        line.setAttribute(
            "x1",
            margin.left
        );

        line.setAttribute(
            "x2",
            width - margin.right
        );

        line.setAttribute(
            "y1",
            y
        );

        line.setAttribute(
            "y2",
            y
        );

        line.classList.add(
            "development-grid-line"
        );


        svg.appendChild(line);


        const label =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );


        label.setAttribute(
            "x",
            margin.left - 12
        );

        label.setAttribute(
            "y",
            y + 4
        );

        label.setAttribute(
            "text-anchor",
            "end"
        );

        label.classList.add(
            "development-axis-label"
        );

        label.textContent =
            value.toLocaleString(
                "de-CH"
            );


        svg.appendChild(label);

    }


    /* ======================================================
       X-ACHSE
    ====================================================== */

    const axis =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );


    axis.setAttribute(
        "x1",
        margin.left
    );

    axis.setAttribute(
        "x2",
        width - margin.right
    );

    axis.setAttribute(
        "y1",
        margin.top + chartHeight
    );

    axis.setAttribute(
        "y2",
        margin.top + chartHeight
    );

    axis.classList.add(
        "development-axis"
    );


    svg.appendChild(axis);


    /* ======================================================
       BALKEN
    ====================================================== */

    const yearWidth =
        chartWidth /
        years.length;


    const barWidth =
        Math.min(
            24,
            yearWidth * 0.23
        );


    years.forEach(
        function (year, index) {

            const centerX =
                margin.left +
                (
                    index + 0.5
                ) *
                yearWidth;


            const maleData =
                values[year].maennlich;

            const femaleData =
                values[year].weiblich;


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


            /* ==================================================
               JAHR
            ================================================== */

            const yearLabel =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );


            yearLabel.setAttribute(
                "x",
                centerX
            );

            yearLabel.setAttribute(
                "y",
                height - 20
            );

            yearLabel.setAttribute(
                "text-anchor",
                "middle"
            );

            yearLabel.classList.add(
                "development-year-label"
            );

            yearLabel.textContent =
                year;


            svg.appendChild(
                yearLabel
            );

        }
    );


    console.log(
        "Entwicklungsdiagramm:",
        values
    );

}


/* ==========================================================
   EINZELNE SÄULE ERSTELLEN
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

    const bottomY =
        margin.top +
        chartHeight;


    const topY =
        yScale(total);


    const barHeight =
        bottomY - topY;


    /* ======================================================
       HAUPTSÄULE
    ====================================================== */

    const bar =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );


    bar.setAttribute(
        "x",
        x
    );

    bar.setAttribute(
        "y",
        topY
    );

    bar.setAttribute(
        "width",
        barWidth
    );

    bar.setAttribute(
        "height",
        Math.max(0, barHeight)
    );


    bar.classList.add(
        "development-bar"
    );


    if (gender === "weiblich") {

        bar.classList.add(
            "development-bar-girl"
        );

    } else {

        bar.classList.add(
            "development-bar-boy"
        );

    }


    /* ======================================================
       NATIVE TOOLTIP
    ====================================================== */

    const title =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
        );


    const genderLabel =
        gender === "weiblich"
            ? "Mädchen"
            : "Jungen";


    const detailText =
        Object.entries(subcategories)
            .sort(
                function (a, b) {
                    return b[1] - a[1];
                }
            )
            .map(
                function ([name, value]) {
                    return (
                        name +
                        ": " +
                        value.toLocaleString("de-CH")
                    );
                }
            )
            .join("\n");


    title.textContent =
        year +
        " · " +
        genderLabel +
        " · " +
        total.toLocaleString("de-CH") +
        " Fälle" +
        (
            detailText
                ? "\n" + detailText
                : ""
        );


    bar.appendChild(title);
    svg.appendChild(bar);


    /* ======================================================
       UNTERKATEGORIEN ALS FEINE LINIEN

       Die Linien sitzen auf den kumulierten Grenzen
       der Unterkategorien innerhalb der Säule.
    ====================================================== */

    if (total <= 0) {
        return;
    }


    const sortedSubcategories =
        Object.entries(subcategories)
            .filter(
                function ([, value]) {
                    return value > 0;
                }
            )
            .sort(
                function (a, b) {
                    return b[1] - a[1];
                }
            );


    let cumulative = 0;


    sortedSubcategories.forEach(
        function ([name, value]) {

            cumulative += value;


            /* Keine Linie direkt am oberen oder unteren Rand */
            if (
                cumulative >= total ||
                cumulative <= 0
            ) {
                return;
            }


            const lineValue =
                total - cumulative;


            const lineY =
                yScale(lineValue);


            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.setAttribute(
                "x1",
                x
            );

            line.setAttribute(
                "x2",
                x + barWidth
            );

            line.setAttribute(
                "y1",
                lineY
            );

            line.setAttribute(
                "y2",
                lineY
            );

            line.classList.add(
                "development-subcategory-line"
            );


            const lineTitle =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "title"
                );


            lineTitle.textContent =
                name +
                ": " +
                value.toLocaleString("de-CH") +
                " Fälle";


            line.appendChild(
                lineTitle
            );

            svg.appendChild(line);

        }
    );

}


/* ==========================================================
   ALTERSDIAGRAMM — MÄDCHEN UND JUNGEN
   Summe aller Delikte über die letzten 10 verfügbaren Jahre

   API-Altersgruppen:
   kids       = Unter 10
   teens      = 10–14
   youngAdult = 15–17
========================================================== */

function loadAgeComparisonData(data) {

    let svg = document.getElementById("age-comparison-chart");

    // Wenn das SVG noch nicht im HTML vorhanden ist, Abschnitt erzeugen.
    if (!svg) {
        let section = document.getElementById("age-comparison");
        const categoryNav = document.querySelector(".category-end-nav");

        if (!section && categoryNav && categoryNav.parentNode) {
            section = document.createElement("section");
            section.id = "age-comparison";
            section.className = "age-comparison";
            section.innerHTML = `
                <div class="age-comparison-heading">
                    <span class="age-comparison-kicker" id="age-comparison-period">LETZTE 10 JAHRE · ALLE DELIKTE</span>
                    <h2>DISKREPANZ MÄDCHEN UND JUNGEN NACH ALTER</h2>
                </div>
                <div class="age-comparison-layout">
                    <div class="age-chart-wrap">
                        <svg id="age-comparison-chart" viewBox="0 0 1000 560" role="img" aria-label="Vergleich registrierter Delikte bei Mädchen und Jungen nach Altersgruppe"></svg>
                    </div>
                    <div class="age-comparison-copy">
                        <div class="age-chart-legend-item"><span class="age-chart-legend-dot girls"></span><span>MÄDCHEN</span></div>
                        <div class="age-chart-legend-item"><span class="age-chart-legend-dot boys"></span><span>JUNGEN</span></div>
                        <p>Wie verändert sich die Anzahl registrierter Delikte bei Mädchen und Jungen mit zunehmendem Alter? Verglichen werden die drei Altersgruppen anhand aller Delikte der letzten zehn Jahre.</p>
                    </div>
                </div>`;
            categoryNav.parentNode.insertBefore(section, categoryNav);
        } else if (section && !section.querySelector("#age-comparison-chart")) {
            const chartWrap = section.querySelector(".age-chart-wrap") || section;
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.id = "age-comparison-chart";
            svg.setAttribute("viewBox", "0 0 1000 560");
            svg.setAttribute("role", "img");
            svg.setAttribute("aria-label", "Vergleich registrierter Delikte bei Mädchen und Jungen nach Altersgruppe");
            chartWrap.appendChild(svg);
        }

        svg = document.getElementById("age-comparison-chart");
    }

    if (!svg || !Array.isArray(data) || data.length === 0) {
        console.warn("Altersdiagramm: SVG oder Daten fehlen.");
        return;
    }

    const period = getLastTenYears(data);
    if (!period) {
        console.warn("Altersdiagramm: keine gültigen Jahreszahlen gefunden.");
        return;
    }

    const ageGroups = [
        { key: "kids", label: "Unter 10" },
        { key: "teens", label: "10–14" },
        { key: "youngadult", label: "15–17" }
    ];

    const totals = {
        weiblich: { kids: 0, teens: 0, youngadult: 0 },
        männlich: { kids: 0, teens: 0, youngadult: 0 }
    };

    const normalize = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    const parseAmount = value => {
        if (typeof value === "number") return Number.isFinite(value) ? value : 0;
        const cleaned = String(value ?? "").trim().replace(/[’']/g, "").replace(/\s/g, "").replace(/,/g, ".");
        const number = Number(cleaned);
        return Number.isFinite(number) ? number : 0;
    };

    data.forEach(row => {
        const year = Number(row.jahr);
        const gender = normalize(row.geschlecht);
        const age = normalize(row.altersgruppe);

        if (!Number.isFinite(year) || year < period.firstYear || year > period.latestYear) return;
        if (gender !== "weiblich" && gender !== "männlich") return;

        // Akzeptiert sowohl die normalisierten API-Namen als auch ältere Beschriftungen.
        const ageAliases = {
            kids: "kids", "<10": "kids", "unter 10": "kids",
            teens: "teens", "10-14": "teens", "10–14": "teens",
            youngadult: "youngadult", "15-17": "youngadult", "15–17": "youngadult"
        };
        const ageKey = ageAliases[age];
        if (!ageKey) return;

        totals[gender][ageKey] += parseAmount(row.anzahl);
    });

    console.log("Altersdiagramm Zeitraum:", period);
    console.log("Altersdiagramm Summen:", totals);

    const periodLabel = document.getElementById("age-comparison-period");
    if (periodLabel) periodLabel.textContent = `${period.firstYear}–${period.latestYear} · ALLE DELIKTE`;

    svg.innerHTML = "";

    const width = 1000;
    const height = 560;
    const margin = { top: 45, right: 40, bottom: 90, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const values = [
        ...Object.values(totals.weiblich),
        ...Object.values(totals.männlich)
    ].filter(Number.isFinite);
    const maxValue = Math.max(0, ...values);
    const yMax = maxValue > 0 ? maxValue * 1.15 : 10;
    const x = index => margin.left + index * chartWidth / (ageGroups.length - 1);
    const y = value => margin.top + chartHeight - (value / yMax) * chartHeight;

    const add = (tag, attrs, textContent) => {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
        if (textContent !== undefined) element.textContent = textContent;
        svg.appendChild(element);
        return element;
    };

    // Achsen und Gitternetz
    for (let i = 0; i <= 4; i++) {
        const value = yMax * i / 4;
        const yy = y(value);
        add("line", { x1: margin.left, x2: width - margin.right, y1: yy, y2: yy, stroke: "#333", "stroke-width": 1 });
        add("text", { x: margin.left - 15, y: yy + 5, fill: "#aaa", "font-size": 16, "text-anchor": "end" }, Math.round(value).toLocaleString("de-CH"));
    }

    ageGroups.forEach((group, index) => {
        add("text", { x: x(index), y: height - 45, fill: "#fff", "font-size": 20, "text-anchor": "middle" }, group.label);
    });

    add("text", {
        x: 28, y: height / 2, fill: "#aaa", "font-size": 17,
        "text-anchor": "middle", transform: `rotate(-90 28 ${height / 2})`
    }, "Anzahl registrierter Delikte");

    [
        { key: "weiblich", color: "#FF1D25", label: "Mädchen" },
        { key: "männlich", color: "#FF7777", label: "Jungen" }
    ].forEach(series => {
        const points = ageGroups.map((group, index) => ({
            x: x(index), y: y(totals[series.key][group.key]),
            value: totals[series.key][group.key], label: group.label
        }));

        add("polyline", {
            points: points.map(point => `${point.x},${point.y}`).join(" "),
            fill: "none", stroke: series.color, "stroke-width": 4,
            "stroke-linejoin": "round", "stroke-linecap": "round"
        });

        points.forEach(point => {
            const circle = add("circle", { cx: point.x, cy: point.y, r: 7, fill: series.color });
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `${series.label} · ${point.label}: ${point.value.toLocaleString("de-CH")} Fälle`;
            circle.appendChild(title);
        });
    });
}


/* ==========================================================
   START
========================================================== */

loadData();


document.addEventListener("DOMContentLoaded", function () {
    const chart = document.querySelector("#age-comparison-chart");

    if (!chart) {
        console.error("Das Altersdiagramm wurde nicht gefunden.");
        return;
    }

    // Verhindert, dass der Text mehrfach eingefügt wird.
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
        console.log("Erklärungstext wurde eingefügt.");
    } else {
        console.error("Die Diagramm-Section wurde nicht gefunden.");
    }
});
