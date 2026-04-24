import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { BfhlResponse, TreeNode } from "@/lib/bfhl";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BFHL Hierarchy Explorer" },
      {
        name: "description",
        content:
          "Submit node edges and visualize hierarchical trees, cycles and summaries via the /bfhl API.",
      },
    ],
  }),
  component: Index,
});

const SAMPLE = `A->B
A->C
B->D
C->E
E->F
X->Y
Y->Z
Z->X
P->Q
Q->R
G->H
G->H
G->I
hello
1->2
A->`;

function TreeView({ tree, level = 0 }: { tree: TreeNode; level?: number }) {
  const entries = Object.entries(tree);
  if (entries.length === 0) return null;
  return (
    <ul
      className={
        level === 0
          ? "space-y-1"
          : "ml-5 border-l border-border pl-4 space-y-1"
      }
    >
      {entries.map(([node, children]) => (
        <li key={node}>
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-secondary px-2 font-mono text-sm font-medium text-secondary-foreground">
            {node}
          </span>
          <TreeView tree={children} level={level + 1} />
        </li>
      ))}
    </ul>
  );
}

function Index() {
  const [input, setInput] = useState(SAMPLE);
  const [response, setResponse] = useState<BfhlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const data = input
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const res = await fetch("/api/public/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = (await res.json()) as BfhlResponse;
      setResponse(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            SRM Full Stack Challenge — Round 1
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            BFHL Hierarchy Explorer
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Enter edges in <code className="font-mono">X-&gt;Y</code> format
            (one per line). Submit to POST them to{" "}
            <code className="font-mono">/bfhl</code> and see the parsed trees,
            cycles, invalid entries and summary.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <label className="text-sm font-medium text-foreground">
            Node list
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="mt-2 h-56 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            placeholder="A->B&#10;B->C"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Submit to /bfhl"}
            </button>
            <button
              onClick={() => {
                setInput(SAMPLE);
                setResponse(null);
                setError(null);
              }}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Load sample
            </button>
            <button
              onClick={() => {
                setInput("");
                setResponse(null);
                setError(null);
              }}
              className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {response && (
          <section className="mt-8 space-y-6">
            {/* Identity + Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Total trees" value={response.summary.total_trees} />
              <Stat label="Total cycles" value={response.summary.total_cycles} />
              <Stat
                label="Largest tree root"
                value={response.summary.largest_tree_root || "—"}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Identity
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="user_id" value={response.user_id} />
                <Field label="email_id" value={response.email_id} />
                <Field
                  label="college_roll_number"
                  value={response.college_roll_number}
                />
              </dl>
            </div>

            {/* Hierarchies */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Hierarchies ({response.hierarchies.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {response.hierarchies.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Root
                        </span>
                        <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-sm text-primary-foreground">
                          {h.root}
                        </span>
                      </div>
                      {h.has_cycle ? (
                        <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          cycle
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          depth {h.depth}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      {h.has_cycle ? (
                        <p className="text-sm text-muted-foreground">
                          Cyclic group — tree omitted.
                        </p>
                      ) : (
                        <TreeView tree={h.tree} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lists */}
            <div className="grid gap-4 md:grid-cols-2">
              <ListCard
                title="Invalid entries"
                items={response.invalid_entries}
                tone="destructive"
              />
              <ListCard
                title="Duplicate edges"
                items={response.duplicate_edges}
                tone="muted"
              />
            </div>

            {/* Raw JSON */}
            <details className="rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                Raw JSON response
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-secondary p-4 font-mono text-xs text-secondary-foreground">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-sm text-foreground">
        {value}
      </dd>
    </div>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "destructive" | "muted";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}{" "}
        <span className="ml-1 font-mono text-xs text-muted-foreground/70">
          ({items.length})
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className={
                "rounded-md px-2 py-1 font-mono text-xs " +
                (tone === "destructive"
                  ? "border border-destructive/30 bg-destructive/10 text-destructive"
                  : "border border-border bg-secondary text-secondary-foreground")
              }
            >
              {it || "(empty)"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
