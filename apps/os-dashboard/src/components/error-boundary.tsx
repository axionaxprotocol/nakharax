"use client";

import { Component, type ReactNode } from "react";
import { RotateCcw, Skull } from "lucide-react";

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class OErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("OS module crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="surface-panel flex min-h-[320px] w-full flex-col items-center justify-center rounded-os-2xl border-rose-500/35 p-os-8 text-center">
          <div className="mb-os-4 grid h-14 w-14 place-items-center rounded-os-xl border border-rose-500/25 bg-rose-500/10 text-[var(--accent-danger)]">
            <Skull size={26} strokeWidth={1.8} />
          </div>
          <h2 className="text-title font-semibold text-[var(--text-strong)]">
            Module crashed
          </h2>
          <p className="mt-os-2 max-w-md text-body leading-relaxed text-[var(--text-muted)]">
            {this.props.moduleName
              ? `The ${this.props.moduleName} module failed and was isolated from the OS shell.`
              : "A system module failed and was isolated from the OS shell."}
          </p>

          <div className="mt-os-5 w-full max-w-md overflow-x-auto rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] p-os-3 text-left">
            <code className="whitespace-pre-wrap break-all font-mono text-caption text-[var(--accent-danger)]">
              {this.state.error?.message || "Unknown exception"}
            </code>
          </div>

          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-os-5 inline-flex items-center gap-os-2 rounded-full bg-[var(--text-strong)] px-os-5 py-os-3 text-[12px] font-semibold text-[var(--canvas)] transition-all hover:-translate-y-0.5 hover:shadow-raise"
          >
            <RotateCcw size={14} />
            Restart module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
