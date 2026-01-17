// Swap to the production webhook when the workflow is activated.
const N8N_WEBHOOK_URL = "https://<your-n8n-host>/webhook/<your-webhook-id>";
function safeJsonParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function extractTextFromN8n(bodyText) {
  if (!bodyText) return null;
  const asJson = safeJsonParse(bodyText);
  if (!asJson) return bodyText.trim(); // plain text response
  if (typeof asJson.text === "string") return asJson.text;
  if (Array.isArray(asJson) && asJson.length && typeof asJson[0]?.text === "string") {
    return asJson[0].text;
  }
  if (Array.isArray(asJson) && asJson.length && asJson[0]?.json) {
    const j = asJson[0].json;
    if (typeof j.text === "string") return j.text;
    if (typeof j.message === "string") return j.message;
  }
  if (asJson?.data?.text && typeof asJson.data.text === "string") return asJson.data.text;
  return JSON.stringify(asJson).slice(0, 3000); // last-resort fallback
}

function callN8n(payload) {
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const resp = UrlFetchApp.fetch(N8N_WEBHOOK_URL, options);
  const code = resp.getResponseCode();
  const body = resp.getContentText() || "";
  console.log("n8n status: " + code);
  console.log("n8n body: " + body);
  if (code < 200 || code >= 300) {
    return "n8n error " + code + ": " + body.slice(0, 800);
  }
  return extractTextFromN8n(body);
}

/**
 * Responds to a MESSAGE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onMessage(event) {
  const userText = event?.message?.text ? String(event.message.text).trim() : "";
  const payload = {
    source: "gchat",
    messageText: userText,
    user: {
      displayName: event?.user?.displayName || "",
      name: event?.user?.name || "",
      email: event?.user?.email || ""
    },
    space: {
      name: event?.space?.name || "",
      type: event?.space?.type || "",
      displayName: event?.space?.displayName || ""
    },
    eventTime: event?.eventTime || "",
    rawEvent: event // handy during testing
  };

  const replyText = callN8n(payload);
  if (replyText && String(replyText).trim()) {
    return { text: String(replyText) };
  }
  return { text: "No response from n8n. Check webhook URL and whether the workflow is listening/activated." };
}

/**
 * Responds to an ADDED_TO_SPACE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onAddToSpace(event) {
  let message = "";
  if (event.space.singleUserBotDm) {
    message = "Thank you for adding me to a DM, " + event.user.displayName + "!";
  } else {
    message = "Thank you for adding me to " +
      (event.space.displayName ? event.space.displayName : "this chat");
  }
  if (event.message) {
    message = message + ' and you said: "' + event.message.text + '"';
  }
  return { text: message };
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onRemoveFromSpace(event) {
  console.info("Bot removed from " + (event.space.name ? event.space.name : "this chat"));
}
