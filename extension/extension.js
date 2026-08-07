const vscode = require("vscode");

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PROMPT_COUNT = 2;

const REVIEW_URL =
  "https://marketplace.visualstudio.com/items?itemName=AyushmaanSingh.blazetheme&ssr=false#review-details";

async function checkReviewPrompt(context) {
  if (context.globalState.get("reviewPromptDisabled", false)) {
    return;
  }

  const promptCount = context.globalState.get("reviewPromptCount", 0);

  if (promptCount >= MAX_PROMPT_COUNT) {
    await context.globalState.update("reviewPromptDisabled", true);
    return;
  }

  const now = Date.now();
  const firstActivationDate = context.globalState.get(
    "reviewPromptFirstActivationDate",
  );

  if (!firstActivationDate) {
    await context.globalState.update("reviewPromptFirstActivationDate", now);
    return;
  }

  if (now - firstActivationDate < SEVEN_DAYS_MS) {
    return;
  }

  const snoozedUntil = context.globalState.get("reviewPromptSnoozedUntil", 0);

  if (now < snoozedUntil) {
    return;
  }

  const newPromptCount = promptCount + 1;

  await context.globalState.update("reviewPromptCount", newPromptCount);

  if (newPromptCount >= MAX_PROMPT_COUNT) {
    await context.globalState.update("reviewPromptDisabled", true);
  }

  const selection = await vscode.window.showInformationMessage(
    "Enjoying Ice Theme?\nA quick ★★★★★ review helps more developers discover it.",
    "⭐ Leave a Review",
    "Later",
    "Don't Ask Again",
  );

  switch (selection) {
    case "⭐ Leave a Review":
      await context.globalState.update("reviewPromptDisabled", true);
      await vscode.env.openExternal(vscode.Uri.parse(REVIEW_URL));
      break;

    case "Don't Ask Again":
      await context.globalState.update("reviewPromptDisabled", true);
      break;

    case "Later":
      if (newPromptCount < MAX_PROMPT_COUNT) {
        await context.globalState.update(
          "reviewPromptSnoozedUntil",
          now + THIRTY_DAYS_MS,
        );
      }
      break;
  }
}

function activate(context) {
  checkReviewPrompt(context).catch(console.error);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
