"use client";

import { useEffect, useRef, useState } from "react";
import {
  CryptoUnavailableError,
  encryptAndVerifyArtifact,
  type VerifiedArtifact,
  type WorkflowArtifact,
} from "@/lib/crypto/workflow-encryption";
import { Button } from "./ui/button";

type PreviewState =
  | { status: "idle" | "busy" }
  | { status: "success"; result: VerifiedArtifact }
  | { status: "error"; message: string };

/** Mount for one prepared draft/sample; remount when that source is reset. */
export function EncryptionPreview({
  artifact,
}: {
  artifact: WorkflowArtifact;
}) {
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  const operation = useRef(0);
  const pending = useRef(false);
  useEffect(
    () => () => {
      operation.current += 1;
    },
    [],
  );

  const isDraft = artifact.kind === "live-draft";
  const label = isDraft ? "draft" : "sample review";
  async function verify() {
    if (pending.current) return;
    pending.current = true;
    const currentOperation = ++operation.current;
    setState({ status: "busy" });
    try {
      const result = await encryptAndVerifyArtifact(artifact);
      if (currentOperation === operation.current) {
        setState({ status: "success", result });
      }
    } catch (error) {
      if (currentOperation === operation.current) {
        setState({
          status: "error",
          message:
            error instanceof CryptoUnavailableError
              ? error.message
              : "Verification failed. No verified result is available. Try again.",
        });
      }
    } finally {
      if (currentOperation === operation.current) pending.current = false;
    }
  }

  return (
    <section
      aria-label={
        isDraft ? "Draft encryption demo" : "Sample review encryption demo"
      }
      className="mt-6 min-w-0 rounded-xl border border-slate-300 bg-slate-50 p-5 text-sm leading-6"
    >
      <h3 className="font-semibold">Try local encryption · Demo</h3>
      <p className="mt-2 text-slate-600">
        {isDraft
          ? "Test encryption of this prepared title, context, and capture preferences."
          : "Test encryption of the synthetic review only, independently of your selected file."}{" "}
        The text stays visible. Nothing is saved or locked.
      </p>
      <Button
        type="button"
        className="mt-4"
        disabled={state.status === "busy"}
        onClick={verify}
      >
        Encrypt and verify {label}
      </Button>
      <p className="mt-3 text-xs leading-5 text-slate-600">
        A temporary key checks that the text can be recovered correctly, then is
        released. This demo cannot reopen its encrypted result later.
      </p>
      {state.status === "busy" && (
        <p role="status" className="mt-3">
          Demo verification in progress…
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="mt-3 text-red-800">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <>
          <p role="status" className="mt-3 font-semibold text-teal-800">
            Demo verified — decrypted content matches the {label}.
          </p>
          <details key={state.result.artifactId} className="mt-3">
            <summary className="cursor-pointer font-semibold">
              Inspect encrypted demo result
            </summary>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="font-semibold">Artifact ID</dt>
                <dd className="break-all font-mono">
                  {state.result.artifactId}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Algorithm / format</dt>
                <dd>
                  {state.result.envelope.algorithm} · version{" "}
                  {state.result.envelope.version}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Nonce (hex)</dt>
                <dd className="break-all font-mono">
                  {state.result.envelope.nonceHex}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">
                  Ciphertext + authentication tag (hex)
                </dt>
                <dd className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono">
                  {state.result.envelope.ciphertextHex}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              These details contain no key. Hex is an encoding; AES-GCM performs
              encryption and authentication.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
