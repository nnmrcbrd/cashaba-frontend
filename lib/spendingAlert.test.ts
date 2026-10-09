import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SpendingAlert from "../app/components/SpendingAlert";

const notifications = [
  { id: "budget-exceeded", type: "danger" as const, title: "Budget detail", message: "Recorded spending exceeds the budget." },
  { id: "overspent", type: "danger" as const, title: "Overspent this period", message: "Recorded commitments exceed income." },
];

test("dismissing the generated budget alert leaves each notification available", () => {
  const html = renderToStaticMarkup(createElement(SpendingAlert, {
    status: "EXCEEDED_100", notifications, dismissedIds: ["budget-status"],
  }));
  assert.doesNotMatch(html, /Pause discretionary spending/);
  assert.match(html, /Budget detail/);
  assert.match(html, /Overspent this period/);
});

test("dismissing the notifications does not dismiss the generated alert", () => {
  const html = renderToStaticMarkup(createElement(SpendingAlert, {
    status: "EXCEEDED_100", notifications, dismissedIds: ["budget-exceeded", "overspent"],
  }));
  assert.match(html, /Pause discretionary spending/);
  assert.doesNotMatch(html, /Budget detail|Overspent this period/);
});

test("all three exceeded-budget alerts can be dismissed", () => {
  const html = renderToStaticMarkup(createElement(SpendingAlert, {
    status: "EXCEEDED_100", notifications,
    dismissedIds: ["overspent", "budget-exceeded", "budget-status"],
  }));
  assert.equal(html, "");
});

test("the generated approaching-limit alert can also be dismissed", () => {
  assert.equal(renderToStaticMarkup(createElement(SpendingAlert, {
    status: "WARNING_80", dismissedIds: ["budget-status"],
  })), "");
});

test("non-budget notifications remain available without a budget status", () => {
  for (const status of [null, undefined, "NORMAL"] as const) {
    const visible = renderToStaticMarkup(createElement(SpendingAlert, {
      status, notifications: [notifications[1]],
    }));
    assert.match(visible, /Overspent this period/);
    const dismissed = renderToStaticMarkup(createElement(SpendingAlert, {
      status, notifications: [notifications[1]], dismissedIds: ["overspent"],
    }));
    assert.equal(dismissed, "");
  }
});
