import assert from "node:assert/strict";
import {
  analyzeDaycareLabels,
  daycareSamples
} from "../src/app/lib/daycare-labels.ts";

const ready = analyzeDaycareLabels(daycareSamples.infantBottleDay);
assert.equal(ready.status, "ready");
assert.equal(ready.sheetsNeeded, 1);
assert.ok(ready.checklist.some((item) => item.includes("plain-paper alignment check")));
assert.ok(ready.report.includes("Do not enter a real child name"));

const missing = analyzeDaycareLabels(daycareSamples.missingFields);
assert.equal(missing.status, "fix");
assert.ok(missing.warnings.some((warning) => warning.includes("date field")));
assert.ok(missing.warnings.some((warning) => warning.includes("2 inch round labels")));

const backupReview = analyzeDaycareLabels({
  ...daycareSamples.toddlerCupDay,
  backupLabels: 0
});
assert.equal(backupReview.status, "review");
assert.ok(backupReview.warnings.some((warning) => warning.includes("backup labels")));
assert.ok(!backupReview.report.includes("Emma"));

console.log("Daycare labels tests passed");
