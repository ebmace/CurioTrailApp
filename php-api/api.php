<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
$config = require('./secret-cfg/config.php');
$link = new mysqli($config['host'], $config['username'], $config['password'], $config['database']);



if ($link->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to connect to MySQL: ' . $link->connect_error]);
    exit;
}

// Helper: get POST or GET param safely
function get_param($name) {
    return $_POST[$name] ?? $_GET[$name] ?? null;
}

// Get action param (e.g., create, read, update)
$action = get_param('action');

switch ($action) {
    case 'create':
        create_entry($link);
        break;
    case 'read':
        read_entry($link);
        break;
    case 'update':
        update_entry($link);
        break;
    default:
        echo json_encode(['error' => 'Invalid or missing action parameter']);
        break;
}

// Create a new entry
function create_entry($link) {
    $latitude = $_POST['latitude'] ?? null;
    $longitude = $_POST['longitude'] ?? null;
    $user_question = $_POST['user_question'] ?? null;
    $context_tag = $_POST['context_tag'] ?? null;

    if (!$latitude || !$longitude || !$user_question || !$context_tag) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    $stmt = $link->prepare("INSERT INTO trail_queries (latitude, longitude, user_question, context_tag, status) VALUES (?, ?, ?, ?, 'ready')");
    $stmt->bind_param("ddss", $latitude, $longitude, $user_question, $context_tag);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Insert failed: ' . $stmt->error]);
    }

    $stmt->close();
}

// Read an entry by id
function read_entry($link) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id parameter']);
        return;
    }

    $stmt = $link->prepare("SELECT * FROM trail_queries WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if ($row) {
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Entry not found']);
    }

    $stmt->close();
}

// Update the response and status by id
function update_entry($link) {
    $id = $_POST['id'] ?? null;
    $llm_response = $_POST['llm_response'] ?? null;
    $status = $_POST['status'] ?? null;

    if (!$id || !$llm_response || !$status) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    // Sanity check status
    $allowed_statuses = ['not_ready','ready','processing','responded','complete','error'];

    if (!in_array($status, $allowed_statuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status value']);
        return;
    }

    $stmt = $link->prepare("UPDATE trail_queries SET llm_response = ?, status = ? WHERE id = ?");
    $stmt->bind_param("ssi", $llm_response, $status, $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $stmt->error]);
    }

    $stmt->close();
}