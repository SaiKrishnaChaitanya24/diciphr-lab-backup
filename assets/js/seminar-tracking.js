document.addEventListener("DOMContentLoaded", function () {
    const TRACKING_ENDPOINT = "track-event.php";

    function sendSeminarEvent(eventType, details) {
        const payload = {
            event_type: eventType,
            page_url: window.location.href,
            timestamp_client: new Date().toISOString(),
            ...details
        };

        const jsonPayload = JSON.stringify(payload);

        if (navigator.sendBeacon) {
            const blob = new Blob([jsonPayload], { type: "application/json" });
            navigator.sendBeacon(TRACKING_ENDPOINT, blob);
        } else {
            fetch(TRACKING_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: jsonPayload,
                keepalive: true
            }).catch(function (error) {
                console.warn("Tracking failed:", error);
            });
        }
    }

    /*
     * Track PDF/PPTX slide clicks.
     */
    document.querySelectorAll(".slides-links a").forEach(function (link) {
        link.addEventListener("click", function () {
            const card = link.closest(".talk-card");
            const talkTitle = card && card.querySelector("h3")
                ? card.querySelector("h3").innerText.trim()
                : "Unknown talk";

            const fileUrl = new URL(link.getAttribute("href"), window.location.href).href;
            const fileName = decodeURIComponent(fileUrl.split("/").pop() || "");
            const fileType = fileName.includes(".")
                ? fileName.split(".").pop().toLowerCase()
                : "unknown";

            sendSeminarEvent("seminar_slide_click", {
                talk_title: talkTitle,
                file_name: fileName,
                file_type: fileType,
                file_url: fileUrl
            });
        });
    });

    /*
     * Track interaction with Mediasite iframe.
     * Note: this is not exact "video played"; it means the user clicked/interacted
     * with the iframe area. Exact video play/watch duration should come from Mediasite.
     */
    document.querySelectorAll(".talk-video iframe").forEach(function (iframe) {
        const card = iframe.closest(".talk-card");
        const talkTitle = card && card.querySelector("h3")
            ? card.querySelector("h3").innerText.trim()
            : "Unknown talk";

        const videoUrl = iframe.getAttribute("src") || "";

        let mouseInsideIframe = false;
        let eventAlreadySent = false;

        iframe.addEventListener("mouseenter", function () {
            mouseInsideIframe = true;
        });

        iframe.addEventListener("mouseleave", function () {
            mouseInsideIframe = false;
        });

        window.addEventListener("blur", function () {
            if (mouseInsideIframe && !eventAlreadySent) {
                eventAlreadySent = true;

                sendSeminarEvent("seminar_video_interaction", {
                    talk_title: talkTitle,
                    video_url: videoUrl
                });
            }
        });
    });
});
