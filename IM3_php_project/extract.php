<?php


// 1. Datei zum Lesen öffnen
$handle = fopen(__DIR__ . '/Daten.csv', 'r');

// 2. Kopfzeile lesen und Leerzeichen entfernen ("Species " kommt echt so vor)
$header = array_map(
    fn($name) => strtolower(trim(str_replace("\xEF\xBB\xBF", '', $name))),
    fgetcsv($handle, null, ',', '"', '')
);

// 3. Zeile für Zeile lesen, bis die Datei zu Ende ist
$data = [];
while (($row = fgetcsv($handle, null, ',', '"', '')) !== false) {
    if ($row[0] === '') {
        continue;   // leere Zeile überspringen
    }
    $data[] = array_combine($header, $row);
}
fclose($handle);

return $data;


