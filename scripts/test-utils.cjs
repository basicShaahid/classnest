// Test the pure calculation helpers without adding a separate test framework.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../lib/utils.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
});
const moduleShim = { exports: {} };
new Function("require", "module", "exports", compiled.outputText)(require, moduleShim, moduleShim.exports);
const u = moduleShim.exports;

assert.equal(u.formatTime("00:00"), "12:00 AM");
assert.equal(u.formatTime("12:00"), "12:00 PM");
assert.equal(u.formatTime("14:07"), "2:07 PM");
assert.equal(u.from12HourParts("12", "00", "AM"), "00:00");
assert.equal(u.from12HourParts("12", "00", "PM"), "12:00");
assert.equal(u.from12HourParts("2", "30", "PM"), "14:30");
assert.equal(u.durationMinutes("12:00", "14:00"), 120);
assert.equal(u.durationMinutes("09:15", "10:45"), 90);
assert.equal(u.durationMinutes("22:00", "08:00"), 0);
assert.equal(u.calculateAmount({ startTime: "09:15", endTime: "10:45", hourlyRate: 50 }), 75);
assert.equal(u.calculateAmount({ startTime: "12:00", endTime: "12:50", hourlyRate: 33 }), 27.5);
assert.equal(u.isValidLocalDate("2026-02-30"), false);
assert.equal(u.isValidLocalDate("2026-10-29"), true);
const sample = { date: "2026-10-29", startTime: "12:00", endTime: "14:00", hourlyRate: 50, paid: false };
assert.deepEqual(
  [u.getSummary([sample]).totalClasses, u.getSummary([sample]).totalMinutes, u.getSummary([sample]).totalEarnings, u.getSummary([sample]).moneyOwed, u.getSummary([sample]).paymentsReceived],
  [1, 120, 100, 100, 0],
);
assert.deepEqual(
  [u.getSummary([{ ...sample, paid: true }]).moneyOwed, u.getSummary([{ ...sample, paid: true }]).paymentsReceived],
  [0, 100],
);
console.log("15 calculation and date/time checks passed.");
