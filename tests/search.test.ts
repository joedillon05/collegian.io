import { describe, expect, it } from "vitest";
import { normalize, editDistance, searchSchools } from "@/lib/search";
import { SCHOOLS, SCHOOL_BY_ID } from "@/data/schools";

const top = (q: string) => searchSchools(q, SCHOOLS).map((h) => h.school.id);

describe("normalize", () => {
  it("strips punctuation, diacritics and filler words", () => {
    expect(normalize("St. John's")).toBe("st john s");
    expect(normalize("Texas A&M")).toBe("texas a and m");
    expect(normalize("University of Hawaiʻi at Mānoa")).toBe("hawaiʻi at manoa");
  });
});

describe("editDistance", () => {
  it("counts transpositions as one edit", () => {
    expect(editDistance("michgian", "michigan")).toBe(1);
    expect(editDistance("abc", "abc")).toBe(0);
    expect(editDistance("", "abc")).toBe(3);
  });
});

describe("searchSchools", () => {
  it("exact and prefix matches win", () => {
    expect(top("michigan")[0]).toBe("michigan");
    expect(top("mich").slice(0, 3)).toEqual(expect.arrayContaining(["michigan", "michigan-state"]));
  });
  it("ambiguous USC shows both schools so the player must pick", () => {
    const ids = top("usc");
    expect(ids).toContain("usc");
    expect(ids).toContain("south-carolina");
  });
  it("aliases and mascots resolve", () => {
    expect(top("ole miss")[0]).toBe("ole-miss");
    expect(top("wolverines")[0]).toBe("michigan");
    expect(top("uconn")[0]).toBe("uconn");
    expect(top("pitt")[0]).toBe("pittsburgh");
    expect(top("texas a&m")[0]).toBe("texas-am");
  });
  it("tolerates typos", () => {
    expect(top("michgan")).toContain("michigan");
    expect(top("stanfrod")).toContain("stanford");
    expect(top("kentucy")).toContain("kentucky");
  });
  it("multi-word prefixes work", () => {
    expect(top("mich st")[0]).toBe("michigan-state");
    expect(top("flor st")[0]).toBe("florida-state");
    expect(top("st johns")[0]).toBe("st-johns");
    expect(top("saint johns")[0]).toBe("st-johns");
  });
  it("returns nothing for empty input", () => {
    expect(top("   ")).toEqual([]);
  });
  it("every school has a unique id", () => {
    expect(SCHOOL_BY_ID.size).toBe(SCHOOLS.length);
  });
});
