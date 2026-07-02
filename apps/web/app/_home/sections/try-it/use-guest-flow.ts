"use client";

import { useCallback, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { GuestTranscribeResponse, GuestSkillResponse } from "@whisper/api";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { guestApiClient, type GuestErrorKind } from "./guest-api";
import { AUTO_LANGUAGE_CODE, detectInitialLanguage } from "./languages";
import { useDetectedOs, useHoverDevice, type DetectedOs } from "./shared";
import type { GuestPhase } from "./types";
import { useGuestRecorder, type UseGuestRecorderResult } from "./use-guest-recorder";
import { useGuestSkills, type GuestTransformer } from "./use-guest-skills";
import { useGuestWarmup } from "./use-guest-agent-boot";

export interface UseGuestFlowResult {
  transcript: string;
  error: string | null;
  recording: boolean;
  busy: boolean;
  phase: GuestPhase;
  hasText: boolean;
  recorder: UseGuestRecorderResult;
  transformers: GuestTransformer[];
  skillId: string;
  skillLabel: string;
  skillsLoading: boolean;
  skillsError: string | null;
  setPickedSkillId: (id: string) => void;
  spokenLanguage: string;
  setSpokenLanguage: (code: string) => void;
  displayedOs: DetectedOs;
  toggleRecord: () => void;
  cancel: () => void;
  applySkill: () => void;
  clear: () => void;
  showOverlay: boolean;
  dismissOverlay: () => void;
}

// ── error messaging ──────────────────────────────────────────────────────────

function classifyHttpError(message: string): GuestErrorKind {
  if (message.startsWith("http_429")) return "rate_limit";
  if (message.startsWith("http_413")) return "payload_too_large";
  if (message.startsWith("http_403")) return "origin";
  return "generic";
}

function errorMessageFor(kind: GuestErrorKind, locale: Locale): string {
  if (kind === "rate_limit") return m.home_demo_error_rate_limit({}, { locale });
  if (kind === "payload_too_large") return m.home_demo_error_payload_too_large({}, { locale });
  if (kind === "origin") return m.home_demo_error_origin({}, { locale });
  return m.home_demo_error_generic({}, { locale });
}

// ── network helpers ──────────────────────────────────────────────────────────

interface ErrorPayload {
  error_code?: string;
  message?: string;
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `http_${res.status}`;
  try {
    const p = JSON.parse(text) as ErrorPayload;
    if (p.error_code) return `http_${res.status}:${p.error_code}`;
    if (p.message) return `http_${res.status}:${p.message}`;
  } catch {
    /* not JSON */
  }
  return `http_${res.status}:${text}`;
}

function buildTranscribeFile(blob: Blob): File {
  // VAD emits trimmed WAV; the MediaRecorder fallback emits webm.
  const isWav = blob.type.includes("wav");
  const type = blob.type || "audio/webm";
  const name = isWav ? "audio.wav" : "audio.webm";
  return new File([blob], name, { type });
}

// ── skill helpers ────────────────────────────────────────────────────────────

function selectSkillId(picked: string, transformers: GuestTransformer[]): string {
  if (picked) return picked;
  return transformers[0]?.id ?? "";
}

function findSkillLabel(transformers: GuestTransformer[], id: string): string {
  return transformers.find((t) => t.id === id)?.label ?? "";
}

// ── hook ─────────────────────────────────────────────────────────────────────

interface FlowState {
  phase: GuestPhase;
  rawText: string | null;
  cleanText: string | null;
  errorMsg: string | null;
}

const INITIAL_FLOW_STATE: FlowState = {
  phase: "idle",
  rawText: null,
  cleanText: null,
  errorMsg: null,
};

function isBusy(recorderStatus: string, phase: GuestPhase): boolean {
  return (
    recorderStatus === "recording" ||
    recorderStatus === "requesting" ||
    recorderStatus === "stopping" ||
    phase === "transcribing" ||
    phase === "cleaning" ||
    phase === "applying"
  );
}

function useSpokenLanguage() {
  const [lang, setLang] = useState<string>(AUTO_LANGUAGE_CODE);
  useEffect(() => {
    queueMicrotask(() => setLang(detectInitialLanguage()));
  }, []);
  return [lang, setLang] as const;
}

function deriveTranscript(flow: FlowState): string {
  return flow.cleanText ?? flow.rawText ?? "";
}

function deriveError(errorMsg: string | null, locale: Locale): string | null {
  return errorMsg ? errorMessageFor(classifyHttpError(errorMsg), locale) : null;
}

function useFlowState() {
  const [state, setState] = useState<FlowState>(INITIAL_FLOW_STATE);
  const reset = useCallback(() => setState(INITIAL_FLOW_STATE), []);
  return { state, setState, reset };
}

export function useGuestFlow(locale: Locale): UseGuestFlowResult {
  const [pickedSkillId, setPickedSkillId] = useState("");
  const [spokenLanguage, setSpokenLanguage] = useSpokenLanguage();

  const recorder = useGuestRecorder();
  const skills = useGuestSkills();
  const os = useDetectedOs();
  const hoverDevice = useHoverDevice();
  const warmup = useGuestWarmup();
  const [dismissed, setDismissed] = useState(false);
  const { state: flow, setState: setFlow, reset: resetFlow } = useFlowState();

  const transformers = skills.data?.transformers ?? [];
  const skillId = selectSkillId(pickedSkillId, transformers);
  const skillLabel = findSkillLabel(transformers, skillId);
  const transcript = deriveTranscript(flow);
  const recording = recorder.status === "recording";
  const busy = isBusy(recorder.status, flow.phase);
  const error = deriveError(flow.errorMsg, locale);

  const stopAndTranscribe = useCallback(async () => {
    const sessionId = warmup.sessionId;
    if (!sessionId) {
      setFlow({ ...INITIAL_FLOW_STATE, phase: "error", errorMsg: "generic" });
      return;
    }

    const blob = await recorder.stop();
    if (!blob || blob.size === 0) {
      setFlow({ ...INITIAL_FLOW_STATE, phase: "error", errorMsg: "generic" });
      return;
    }

    setFlow({ ...INITIAL_FLOW_STATE, phase: "transcribing" });

    try {
      const res = await guestApiClient.api.guest.sessions[":sessionId"].transcribe.$post(
        {
          param: { sessionId },
          form: { audio: buildTranscribeFile(blob), locale: spokenLanguage },
        },
        { init: { credentials: "include" } }
      );

      if (!res.ok) {
        setFlow({ ...INITIAL_FLOW_STATE, phase: "error", errorMsg: await readErrorMessage(res) });
        return;
      }

      const result = (await res.json()) as GuestTranscribeResponse;
      setFlow({
        phase: "complete",
        rawText: result.rawText,
        cleanText: result.cleanText,
        errorMsg: null,
      });
    } catch {
      setFlow({ ...INITIAL_FLOW_STATE, phase: "error", errorMsg: "generic" });
    }
  }, [recorder, spokenLanguage, setFlow, warmup.sessionId]);

  const toggleRecord = useCallback(async () => {
    if (recording) {
      await stopAndTranscribe();
      return;
    }
    if (busy || !warmup.ready) return;
    resetFlow();
    await recorder.start();
  }, [warmup.ready, busy, recorder, recording, resetFlow, stopAndTranscribe]);

  const cancel = useCallback(() => {
    recorder.reset();
    setFlow({ ...INITIAL_FLOW_STATE, phase: "cancelled" });
  }, [recorder, setFlow]);

  const applySkillFlow = useCallback(async () => {
    const sessionId = warmup.sessionId;
    const text = transcript.trim();
    if (!text || !skillId || !sessionId) return;

    setFlow((prev) => ({ ...prev, phase: "applying", errorMsg: null }));

    try {
      const res = await guestApiClient.api.guest.sessions[":sessionId"].skills.$post(
        { param: { sessionId }, json: { text: transcript, skillId, locale: spokenLanguage } },
        { init: { credentials: "include" } }
      );

      if (!res.ok) {
        setFlow((prev) => ({ ...prev, phase: "error", errorMsg: `http_${res.status}` }));
        return;
      }

      const result = (await res.json()) as GuestSkillResponse;
      setFlow((prev) => ({ ...prev, cleanText: result.cleanText, phase: "complete" }));
    } catch {
      setFlow((prev) => ({ ...prev, phase: "error", errorMsg: "generic" }));
    }
  }, [warmup.sessionId, skillId, spokenLanguage, transcript, setFlow]);

  const clear = useCallback(() => {
    recorder.reset();
    resetFlow();
  }, [recorder, resetFlow]);

  useHotkeys(
    ["alt+space", "ctrl+shift+space"],
    () => {
      void toggleRecord();
    },
    { keydown: true, preventDefault: true, enableOnFormTags: false, enabled: hoverDevice },
    [toggleRecord, hoverDevice]
  );

  const dismissOverlay = useCallback(() => setDismissed(true), []);

  return {
    transcript,
    error,
    recording,
    busy,
    phase: flow.phase,
    hasText: transcript.trim() !== "",
    recorder,
    transformers,
    skillId,
    skillLabel,
    skillsLoading: skills.loading,
    skillsError: skills.error,
    setPickedSkillId,
    spokenLanguage,
    setSpokenLanguage,
    displayedOs: hoverDevice ? os : "other",
    toggleRecord: () => void toggleRecord(),
    cancel,
    applySkill: () => void applySkillFlow(),
    clear,
    showOverlay: !dismissed,
    dismissOverlay,
  };
}
