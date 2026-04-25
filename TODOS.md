# TODOS

## Voice: Reson8 integration

**What:** Wire up the mic button in `BurgerForm.tsx` to Reson8 speech-to-text API. Currently the button toggles a `recording` state but no audio is captured.

**Why:** Accessibility — citizens who can't type can speak their concern. Also a demo differentiator. Reson8 partnership is active.

**How to apply:** `MediaRecorder` → Reson8 API → transcript populates `concernText` textarea. Keep fallback graceful: if Reson8 fails or browser lacks mic permission, fall back to typing. Remove the misleading "(Reson8)" label from the loading state until actually connected.

**Depends on:** Reson8 free tier API key + docs URL from partner.

**Effort:** human ~1 day / CC ~1h

---

## DRY: export averageSeverity() from lib/data/concerns.ts

**What:** The private `averageSeverity()` in [lib/data/concerns.ts:38](lib/data/concerns.ts#L38) is re-implemented identically as a local function in [RecenteInzendingen.tsx:50](app/gemeente/RecenteInzendingen.tsx#L50).

**Why:** If the rounding formula changes (e.g., floor vs round), two places need updating. Export once, import everywhere.

**How to apply:** Add `export` to the function in `concerns.ts`, remove the local copy from `RecenteInzendingen.tsx`, update import.

**Effort:** CC ~2min

---

## Fix: /api/vraag history schema cap mismatch

**What:** UI limits users to 5 Q&A turns = max 10 messages, but `vraag/route.ts` accepts `z.array(ChatMessageSchema).max(20)`.

**Why:** A direct POST with 20 messages pumps double the context through Claude per call. Low risk for a controlled demo URL, becomes meaningful if the app is ever exposed publicly.

**How to apply:** Change `max(20)` to `max(10)` in [app/api/vraag/route.ts:22](app/api/vraag/route.ts#L22). Remove the now-redundant `.slice(-10)` on line 50.

**Effort:** CC ~1min
