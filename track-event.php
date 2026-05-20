<?php
date_default_timezone_set("America/New_York");

header("Content-Type: application/json");

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data || !isset($data["event_type"])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid event"]);
    exit;
}

$allowedEvents = [
    "seminar_slide_click",
    "seminar_video_interaction"
];

$eventType = $data["event_type"];

if (!in_array($eventType, $allowedEvents, true)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Unsupported event type"]);
    exit;
}

$logFile = __DIR__ . "/seminar_event_log.csv";

$timestampServer = date("Y-m-d H:i:s");
$timestampClient = $data["timestamp_client"] ?? "";

$talkTitle = $data["talk_title"] ?? "";
$fileName = $data["file_name"] ?? "";
$fileType = $data["file_type"] ?? "";
$fileUrl = $data["file_url"] ?? "";
$videoUrl = $data["video_url"] ?? "";
$pageUrl = $data["page_url"] ?? "";

$ipAddress = $_SERVER["REMOTE_ADDR"] ?? "";
$userAgent = $_SERVER["HTTP_USER_AGENT"] ?? "";
$referer = $_SERVER["HTTP_REFERER"] ?? "";

$isNewFile = !file_exists($logFile);

$fp = fopen($logFile, "a");

if (!$fp) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Could not open log file"]);
    exit;
}

if ($isNewFile) {
    fputcsv($fp, [
        "timestamp_server",
        "timestamp_client",
        "event_type",
        "talk_title",
        "file_name",
        "file_type",
        "file_url",
        "video_url",
        "page_url",
        "ip_address",
        "user_agent",
        "referer"
    ]);
}

fputcsv($fp, [
    $timestampServer,
    $timestampClient,
    $eventType,
    $talkTitle,
    $fileName,
    $fileType,
    $fileUrl,
    $videoUrl,
    $pageUrl,
    $ipAddress,
    $userAgent,
    $referer
]);

fclose($fp);

http_response_code(204);
exit;
?>
