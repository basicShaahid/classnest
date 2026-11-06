"use client";

export function Mascot({ celebrate = false, compact = false }: { celebrate?: boolean; compact?: boolean }) {
  return (
    <div className={`mascot-wrap ${compact ? "mascot-compact" : ""} ${celebrate ? "mascot-celebrate" : ""}`}>
      <span className="mascot-sparkle sparkle-one" aria-hidden="true">✦</span>
      <span className="mascot-sparkle sparkle-two" aria-hidden="true">✧</span>
      <svg className="mascot-svg" viewBox="0 0 280 232" fill="none" role="img" aria-label={celebrate ? "A happy capybara celebrating" : "A friendly waving capybara"}>
        <ellipse cx="144" cy="208" rx="100" ry="12" fill="#A2B8A1" opacity=".22" />
        <path d="M89 155C77 144 69 147 62 152C59 168 69 184 86 180" fill="#C58D59" stroke="#9F704A" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="140" cy="158" rx="78" ry="53" fill="#C98E5C" />
        <path d="M78 142c-20 1-28 14-27 26 0 15 13 24 28 25" fill="#BD8252" />
        <path d="M109 194v12M171 194v12" stroke="#936342" strokeWidth="16" strokeLinecap="round" />
        <path className="mascot-arm" d="M194 150c17-18 35-18 38-9 4 12-10 26-27 31" fill="#CA905F" stroke="#94623E" strokeWidth="5" strokeLinecap="round" />
        <path d="M83 98c-13-24-8-42 6-45 15-3 27 13 30 30M174 86c2-22 14-35 28-31 15 4 18 22 7 46" fill="#A6714A" stroke="#97633F" strokeWidth="6" />
        <path d="M98 84c-5-10-9-18-14-15M188 79c5-9 10-11 15-8" stroke="#EFC6A6" strokeWidth="8" strokeLinecap="round" />
        <path d="M73 130c-1-48 24-74 74-76 48-2 82 25 84 74 1 40-28 68-79 69-52 1-79-26-79-67Z" fill="#DCA474" stroke="#986642" strokeWidth="4" />
        <ellipse cx="94" cy="149" rx="13" ry="8" fill="#EFAE9D" opacity=".8" />
        <ellipse cx="211" cy="149" rx="13" ry="8" fill="#EFAE9D" opacity=".8" />
        <path className="mascot-eyes" d="M109 121v8M186 121v8" stroke="#4B392F" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="150" cy="150" rx="32" ry="22" fill="#EBC19D" />
        <ellipse cx="150" cy="142" rx="13" ry="9" fill="#6A4739" />
        <path d="M149 151c-4 9-12 11-18 6M150 151c3 9 11 11 17 6" stroke="#694638" strokeWidth="3" strokeLinecap="round" />
        <path d="M119 101c-8-5-16-5-22-1M177 100c8-5 16-5 22-1" stroke="#A06E49" strokeWidth="3" strokeLinecap="round" />
        <path d="M49 96l7-9 8 9-8 9-7-9Z" fill="#F3C47A" opacity=".8" />
        <path d="M235 62l5-8 5 8-5 8-5-8Z" fill="#EFBF83" opacity=".9" />
      </svg>
    </div>
  );
}
