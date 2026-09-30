import { describe, expect, it } from "vitest";
import { addDays, atIST, dateInIST, todayIST } from "@/lib/dates";

describe("IST dates", () => {
  it("uses the IST calendar day, not UTC", () => {
    // 20:00 UTC on 29 Sep is 01:30 IST on 30 Sep
    expect(todayIST(new Date("2026-09-29T20:00:00Z"))).toBe("2026-09-30");
    expect(todayIST(new Date("2026-09-29T18:29:59Z"))).toBe("2026-09-29");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("round-trips an IST wall-clock time", () => {
    expect(dateInIST(atIST("2026-09-30", "23:59"))).toBe("2026-09-30");
    expect(dateInIST(atIST("2026-09-30", "00:00"))).toBe("2026-09-30");
  });
});
