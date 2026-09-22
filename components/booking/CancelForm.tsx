"use client";

import { useActionState } from "react";
import { cancelAppointment, type CancelActionState } from "@/lib/actions/cancellation";

const initialState: CancelActionState = { status: "idle" };

export function CancelForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(cancelAppointment, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl bg-charcoal p-6 text-cream" role="status">
        <p className="font-condensed text-2xl uppercase tracking-wide">Cancelled</p>
        <p className="mt-2 text-cream/80">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full border border-charcoal text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-cream disabled:opacity-60"
      >
        {isPending ? "Cancelling…" : "Cancel this appointment"}
      </button>
    </form>
  );
}
