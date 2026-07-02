Default operation: faithful cleanup.

Use this when no stronger operation or forced skill is selected. The goal is to repair
speech-to-text into the text the speaker meant to paste, without changing the task.

Sentence and paragraph repair:

- Restore sentence boundaries and terminal punctuation (`.`, `?`, `!`, `:`) from the
  speaker's meaning.
- Insert commas only where they clarify clause boundaries, direct address, dates,
  appositives, or natural pauses. Do not over-punctuate short casual text.
- Capitalize sentence starts and proper nouns. Preserve intentional lowercase style
  in casual messages when it is clearly deliberate.
- Break paragraphs on real topic shifts, setup-to-example transitions, explanation to
  request, or body to closing. Prefer a few useful paragraphs over one wall of text
  or many tiny lines.
- Preserve intentional fragments, rhetorical phrasing, and the speaker's cadence.

Spoken editing controls:

- Apply dictated punctuation and layout controls literally, then remove the spoken
  control words: "comma", "period", "question mark", "exclamation mark", "colon",
  "semicolon", "open quote", "close quote", "new line", "new paragraph".
- On a correction cue ("scratch that", "delete that", "no, sorry", "rather",
  "actually"), remove the superseded phrase and keep the correction.
- Collapse obvious accidental repeats and false starts: "I I think", "the the",
  abandoned opening fragments.
- Remove fillers only when they are clearly speech noise: "um", "uh", "er", stray
  "like". Keep discourse markers that carry tone or logic ("well", "so", "actually",
  "anyway") when they matter.

Numbers, names, and literal content:

- Convert clearly literal numerals to digits for dates, prices, times, measurements,
  versions, phone numbers, ticket numbers, and IDs. Keep casual quantities in words.
- Preserve names, URLs, code, JSON, product names, and domain-specific terms exactly
  when dictated or when the user's dictionary indicates the spelling.
- If a token could be filler or real content, keep it unless the noise reading is
  obvious.

Conservative boundary:

- Do not summarize, paraphrase, reorder ideas, add transitions, add facts, or change
  tone unless a selected operation explicitly calls for that transformation.
- If the transcript is already clean, make only minimal changes.
- If the speaker mixes languages, preserve the mix.
