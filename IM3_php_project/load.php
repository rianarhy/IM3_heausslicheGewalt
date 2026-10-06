<?php

$data = include __DIR__ . "/transform.php";

require_once __DIR__ . "/config.php";

// versuche, eine Verbindung herzustellen
try {
    //Verbindung zu Datenbank herstellen
    $pdo = new PDO($dsn, $username, $password, $options);
    echo 'Verbindung zur Datenbank erfolgreich hergestellt! </br>';
} catch (PDOException $e) {
    throw new PDOException($e->getMessage(), (int)$e->getCode());
}

//sql statement
$sql = "INSERT INTO häusslicheGewalt (jahr, straftat, geschlecht, altersgruppe, anzahl) VALUES (:jahr, :straftat, :geschlecht, :altersgruppe, :anzahl) ON DUPLICATE KEY UPDATE  anzahl = VALUES(anzahl)";

//prepare statement (ready for lunch)
$stmt = $pdo->prepare($sql);

//execute statement for each row on the result array
foreach ($data as $row) {
    $stmt->execute($row);
}

echo count($data);
echo 'Erfolgreich in DB eingefügt';

