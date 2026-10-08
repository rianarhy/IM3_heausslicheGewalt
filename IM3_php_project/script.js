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
========================================================== */

function loadDevelopmentData(data) {

    const chart =
        document.getElementById(
            "development-chart"
        );


    if (!chart) {

        console.warn(
            "development-chart wurde im HTML nicht gefunden."
        );

        return;

    }


    const period =
        getLastTenYears(data);


    if (!period) {

        return;

    }


    /*
     * Unter 18:
     *
     * <10
     * 10-14
     * 15-17
     */

    const relevantAges =
        new Set([
            "<10",
            "10-14",
            "15-17"
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


    console.log(
        "Daten Entwicklungsdiagramm:",
        rows
    );


    renderDevelopmentChart(
        chart,
        rows,
        period.firstYear,
        period.latestYear
    );

}



/* ==========================================================
   ENTWICKLUNGSDIAGRAMM ZEICHNEN
========================================================== */

function renderDevelopmentChart(
    svg,
    rows,
    firstYear,
    latestYear
) {

    svg.innerHTML =
        "";


    const width =
        1000;

    const height =
        500;


    const margin = {

        top:
            30,

        right:
            30,

        bottom:
            60,

        left:
            70

    };


    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );


    /*
     * JAHRE
     */

    const years = [];


    for (
        let year = firstYear;
        year <= latestYear;
        year++
    ) {

        years.push(
            year
        );

    }


    /*
     * DATEN PRO JAHR
     */

    const values = {};


    years.forEach(
        function (year) {

            values[year] = {

                maennlich:
                    0,

                weiblich:
                    0

            };

        }
    );


    rows.forEach(
        function (row) {

            const year =
                Number(row.jahr);


            const amount =
                parseNumber(
                    row.anzahl
                );


            const gender =
                normalizeText(
                    row.geschlecht
                );


            if (!values[year]) {

                return;

            }


            if (
                gender ===
                "männlich"
            ) {

                values[year].maennlich +=
                    amount;

            }


            if (
                gender ===
                "weiblich"
            ) {

                values[year].weiblich +=
                    amount;

            }

        }
    );


    /*
     * MAXIMALWERT
     */

    let maxValue =
        0;


    years.forEach(
        function (year) {

            maxValue =
                Math.max(
                    maxValue,

                    values[
                        year
                        ].maennlich,

                    values[
                        year
                        ].weiblich
                );

        }
    );


    if (
        maxValue === 0
    ) {

        console.warn(
            "Keine Werte für das Entwicklungsdiagramm."
        );

        return;

    }


    /*
     * ZEICHENBEREICH
     */

    const chartWidth =
        width -
        margin.left -
        margin.right;


    const chartHeight =
        height -
        margin.top -
        margin.bottom;


    /*
     * Y-SKALIERUNG
     */

    function yScale(
        value
    ) {

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


    /*
     * GITTERLINIEN
     */

    const gridSteps =
        5;


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
            yScale(
                value
            );


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
            width -
            margin.right
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


        svg.appendChild(
            line
        );


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


        svg.appendChild(
            label
        );

    }


    /*
     * X-ACHSE
     */

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
        width -
        margin.right
    );


    axis.setAttribute(
        "y1",
        margin.top +
        chartHeight
    );


    axis.setAttribute(
        "y2",
        margin.top +
        chartHeight
    );


    axis.classList.add(
        "development-axis"
    );


    svg.appendChild(
        axis
    );


    /*
     * BALKEN
     */

    const yearWidth =
        chartWidth /
        years.length;


    const barWidth =
        Math.min(
            22,
            yearWidth *
            0.25
        );


    years.forEach(
        function (
            year,
            index
        ) {

            const centerX =
                margin.left +
                (
                    index +
                    0.5
                ) *
                yearWidth;


            const male =
                values[
                    year
                    ].maennlich;


            const female =
                values[
                    year
                    ].weiblich;


            /*
             * MÄNNLICH
             */

            const maleY =
                yScale(
                    male
                );


            const maleBar =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );


            maleBar.setAttribute(
                "x",
                centerX -
                barWidth -
                3
            );


            maleBar.setAttribute(
                "y",
                maleY
            );


            maleBar.setAttribute(
                "width",
                barWidth
            );


            maleBar.setAttribute(
                "height",
                margin.top +
                chartHeight -
                maleY
            );


            maleBar.classList.add(
                "development-bar",
                "development-bar-boy"
            );


            svg.appendChild(
                maleBar
            );


            /*
             * WEIBLICH
             */

            const femaleY =
                yScale(
                    female
                );


            const femaleBar =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );


            femaleBar.setAttribute(
                "x",
                centerX + 3
            );


            femaleBar.setAttribute(
                "y",
                femaleY
            );


            femaleBar.setAttribute(
                "width",
                barWidth
            );


            femaleBar.setAttribute(
                "height",
                margin.top +
                chartHeight -
                femaleY
            );


            femaleBar.classList.add(
                "development-bar",
                "development-bar-girl"
            );


            svg.appendChild(
                femaleBar
            );


            /*
             * JAHR
             */

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
   START
========================================================== */

loadData();