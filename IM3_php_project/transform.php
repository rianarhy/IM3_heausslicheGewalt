<?php

$data = include __DIR__ . '/extract.php';

$altersgruppenMap = [
    '<10'   => 'kids',
    '10-14' => 'teens',
    '15-17' => 'youngAdults',
];

$straftatenMap = [
    'Sexuelle Nötigung (Art. 189)' => 'Sexueller Übergriff und sexuelle Nötigung (Art. 189)',
    'Schändung (Art. 191)'         => 'Missbrauch einer urteilsunfähigen oder zum Widerstand unfähigen Person (Art. 191)',
];

$ausschliessen = [
    'Unbefugtes Weiterleiten von nicht öffentlichen sexuellen Inhalten (Art. 197a)',
];

foreach ($data as &$zeile) {

    //aus dem Wert X ein 2 machen
    if (($zeile['anzahl'] ?? null) === 'X') {
        $zeile['anzahl'] = '2';
    }

    //der Wert der altergruppen umbennen zu kids, teens, youngAdults
    $alt = trim($zeile['altersgruppe'] ?? '');
    if (isset($altersgruppenMap[$alt])) {
        $zeile['altersgruppe'] = $altersgruppenMap[$alt];
    }

        //die zahl hinten bei der straftat entfernen, damit nicht als zwei unterschiedliche Straftaten erkennt werden
    $zeile['straftat'] = preg_replace('/(?<=\)|[A-Za-z])\d+\)$/u', '', $zeile['straftat']);


    if (isset($straftatenMap[$zeile['straftat']])) {
        $zeile['straftat'] = $straftatenMap[$zeile['straftat']];
    }
}

unset($zeile);

//die straftat welche nur um jahr 2025 erscheint, herausnehmen
$data = array_values(array_filter(
    $data,
    fn($zeile) => !in_array($zeile['straftat'], $ausschliessen, true)
));


//ZUM TESTEN:

//nach allen straftaten filtern und zählen
$straftaten = array_count_values(array_column($data, 'straftat'));
ksort($straftaten);

//Fälle pro Straftat aufsummieren
$faelle = [];
foreach ($data as $zeile) {
    $faelle[$zeile['straftat']] = ($faelle[$zeile['straftat']] ?? 0) + (int) $zeile['anzahl'];
}
arsort($faelle);

//hinweis: print_r braucht es nur zum debuggen nicht wenn ich return angebe
echo '<pre>';
//print_r($data);
//print_r($straftaten);
//print_r($faelle);
echo '</pre>';


return $data;