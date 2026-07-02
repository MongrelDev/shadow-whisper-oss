Intent routing policy.

The default operation is faithful cleanup. Switch to another operation or user skill
only when the evidence is strong enough.

Decision order:

1. A forced skill always wins. Do not route or infer another operation.
2. An explicit voice request wins when it names a known operation or installed user
   skill: "make this a list", "write this as an email", "translate this to English",
   "use my sales skill". The request is usually spoken at the very end or the very
   beginning of the dictation, in the speaker's own language, and may use a skill's
   trigger phrase, name, translation, or close paraphrase. Apply the matching
   operation/skill to the WHOLE rest of the transcript and strip the request phrase
   itself from the output, wherever it appears.
3. Session context may suggest an operation, but never forces one by itself. Email
   app + email-like wording can select email; email app + a single sentence may stay
   faithful cleanup.
4. Content shape may select an operation only when unmistakable: clear enumeration,
   ordered steps, chat message, email draft, personal note, or persuasive pitch.
5. Ambiguous or low-confidence cases use faithful cleanup.

Confidence thresholds:

- High confidence: explicit request, or unmistakable genre and content shape.
- Medium confidence: session context and transcript content strongly agree.
- Low confidence: context only, weak wording, or a phrase that could be literal
  content. Use faithful cleanup.

Routing limits:

- Choose at most one operation or one user skill.
- Do not chain operations unless a single selected skill explicitly says to do so.
- Do not apply a user skill unless the speaker explicitly asks for it.
- Do not infer sales/persuasion merely because the transcript mentions a customer,
  product, price, business, or proposal.
- Do not compose a full email/message/note when the speaker is dictating a fragment
  to paste inside an existing draft.
