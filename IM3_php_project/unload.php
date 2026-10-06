<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    throw new PDOException($e->getMessage(), (int)$e->getCode());
}

// Grundabfrage
$sql = "SELECT id, jahr, straftat, altersgruppe, geschlecht, anzahl FROM häusslicheGewalt WHERE 1 = 1";
$params = [];

// Filter: nur eine Straftat
if (!empty($_GET['straftat'])) {
    $sql .= " AND straftat = :straftat";
    $params[':straftat'] = $_GET['straftat'];
}

//prepare statement
$stmt = $pdo->prepare($sql);
//execute statement
$stmt->execute($params);
//fetch all results
$data = $stmt->fetchAll();

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
