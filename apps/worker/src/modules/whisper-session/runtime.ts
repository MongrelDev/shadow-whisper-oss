import type { Layer } from "effect";
import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { WhisperSessionLive } from "./infra/live";
import { _whisperAgentTestSeam } from "../../durable-objects/whisper-agent/infra/live";
import type { SpeechToText } from "../transcription/application/ports/speech-to-text";
import type { TextGenerator } from "../transcription/application/ports/text-generator";

export const runWhisperSessionHandler = makeDomainRunner((env) => WhisperSessionLive(env));

export interface WhisperSessionTestOverrides {
  readonly speechToTextLayer?: Layer.Layer<SpeechToText>;
  readonly textGeneratorLayer?: Layer.Layer<TextGenerator>;
}

// STT and the text improver execute inside the WhisperAgent, so the fake engines
// have to be installed on the agent's layer rather than the worker handler's. Kept
// under the same `_testRuntime` shape so existing integration tests need no changes.
export const _testRuntime = {
  setOverrides: (opts: WhisperSessionTestOverrides) => {
    if (opts.speechToTextLayer) {
      _whisperAgentTestSeam.setSpeechToText(opts.speechToTextLayer);
    }
    if (opts.textGeneratorLayer) {
      _whisperAgentTestSeam.setTextGenerator(opts.textGeneratorLayer);
    }
  },
  reset: () => {
    _whisperAgentTestSeam.reset();
  },
};
