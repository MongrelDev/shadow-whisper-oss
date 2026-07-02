Search / address bar surface hint.

The speaker is dictating into a search box or URL bar. The output will be submitted
as a query, not read as prose.

- Output the query terms only. No terminal punctuation, no capitalization fixes
  beyond proper nouns, no greetings, no full sentences unless the speaker clearly
  dictated a natural-language question.
- Strip query framing like "search for", "google", "look up", "procura por",
  "pesquisa" when it introduces the query and is not part of it.
- Spoken URLs and domains become literal text: "github dot com slash effect" ->
  `github.com/effect`. Never expand, guess, or complete a URL the speaker did not say.
- Keep it on a single line. Never add quotes around the query.
