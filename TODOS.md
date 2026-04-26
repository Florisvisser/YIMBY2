# TODOS

## Voice: Reson8 integration

**What:** Wire up the mic button in `BurgerForm.tsx` to Reson8 speech-to-text API. Currently the button toggles a `recording` state but no audio is captured.

**Why:** Accessibility — citizens who can't type can speak their concern. Also a demo differentiator. Reson8 partnership is active.

**How to apply:** `MediaRecorder` → Reson8 API → transcript populates `concernText` textarea. Keep fallback graceful: if Reson8 fails or browser lacks mic permission, fall back to typing. Remove the misleading "(Reson8)" label from the loading state until actually connected.

**Depends on:** Reson8 free tier API key + docs URL from partner.

**Effort:** human ~1 day / CC ~1h
