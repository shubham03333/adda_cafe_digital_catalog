"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogCustomer } from "@/lib/admin-customers";

const DEFAULT_OFFER =
  "Hi {name}, this is Adda Cafe. We have a special offer waiting for you — come by this week and show this message. We would love to see you again.";

function displayPhone(phone: string) {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

function when(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function personalize(template: string, name: string) {
  return template.replaceAll("{name}", name.split(" ")[0] || name || "there");
}

function whatsappUrl(phone: string, text: string) {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

export function CustomersPanel({ customers }: { customers: CatalogCustomer[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState(DEFAULT_OFFER);
  const [copied, setCopied] = useState<string | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.phone.includes(q.replace(/\D/g, "")) ||
        (row.email || "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  const selectedRows = customers.filter((row) => selected[row.phone]);
  const selectedCount = selectedRows.length;
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected[row.phone]);

  function toggle(phone: string) {
    setSelected((prev) => ({ ...prev, [phone]: !prev[phone] }));
  }

  function toggleVisible() {
    setSelected((prev) => {
      const next = { ...prev };
      const turnOn = !allVisibleSelected;
      for (const row of visible) next[row.phone] = turnOn;
      return next;
    });
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 2000);
  }

  function downloadCsv() {
    const rows = (selectedCount ? selectedRows : visible).map((row) => [
      row.name,
      row.phone,
      `+91${row.phone}`,
      row.email || "",
      row.registered ? "registered" : "order only",
      String(row.orderCount),
      String(Math.round(row.spent)),
      row.lastOrderAt || "",
      row.dateOfBirth || "",
      row.offersOptIn ? "yes" : "no",
    ]);
    const csv = [
      ["Name", "Phone", "WhatsApp", "Email", "Source", "Orders", "Spent", "Last order", "Birthday", "Offers opt-in"],
      ...rows,
    ]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "adda-customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const queue = selectedCount ? selectedRows : visible;
  const current = queue[queueIndex] || null;

  useEffect(() => {
    setQueueIndex(0);
  }, [query]);

  function openWhatsApp(row: CatalogCustomer) {
    window.open(whatsappUrl(row.phone, personalize(message, row.name)), "_blank", "noopener,noreferrer");
  }

  function openNextInQueue() {
    if (!current) return;
    openWhatsApp(current);
    setQueueIndex((index) => Math.min(index + 1, Math.max(0, queue.length - 1)));
  }

  const withEmail = customers.filter((row) => row.email).length;
  const ordered = customers.filter((row) => row.orderCount > 0).length;

  return (
    <div className="space-y-5 pb-16">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customers</p>
          <p className="mt-2 text-3xl font-black text-gray-800 dark:text-white">{customers.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Registered</p>
          <p className="mt-2 text-3xl font-black text-gray-800 dark:text-white">
            {customers.filter((row) => row.registered).length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Placed an order</p>
          <p className="mt-2 text-3xl font-black text-gray-800 dark:text-white">{ordered}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">With email</p>
          <p className="mt-2 text-3xl font-black text-gray-800 dark:text-white">{withEmail}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-black text-gray-800 dark:text-white">Offer / WhatsApp message</h2>
        <p className="text-sm text-gray-500">
          Use <code className="rounded bg-gray-100 px-1 dark:bg-zinc-800">{"{name}"}</code> for first name. WhatsApp
          opens in a new tab with this text. For a large list, copy numbers into WhatsApp Business broadcast.
        </p>
        <Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-28" />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyText("message", message)}
          >
            Copy message
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!selectedCount}
            onClick={() => copyText("numbers", selectedRows.map((row) => `+91${row.phone}`).join("\n"))}
          >
            Copy selected numbers
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!selectedRows.some((row) => row.email)}
            onClick={() =>
              copyText(
                "emails",
                selectedRows
                  .map((row) => row.email)
                  .filter(Boolean)
                  .join(", ")
              )
            }
          >
            Copy selected emails
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadCsv}>
            Download CSV
          </Button>
          <Button type="button" size="sm" disabled={!current} onClick={openNextInQueue}>
            WhatsApp next ({Math.min(queueIndex + 1, queue.length)}/{queue.length || 0})
          </Button>
        </div>
        {copied ? <p className="text-sm text-emerald-700">Copied {copied}.</p> : null}
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, or email"
            className="max-w-md"
          />
          <p className="text-sm text-gray-500">
            {selectedCount} selected · {visible.length} shown
          </p>
        </div>
        {customers.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No guest phones yet. They appear after someone enters a number on the QR menu.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-2">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label="Select visible" />
                  </th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Birthday</th>
                  <th className="pb-2">Offers</th>
                  <th className="pb-2">Orders</th>
                  <th className="pb-2">Last visit</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.phone} className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[row.phone])}
                        onChange={() => toggle(row.phone)}
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">
                      {row.name}
                      <span className="mt-0.5 block text-xs font-medium text-gray-400">
                        {row.registered ? "Registered" : "From an order"}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-700 dark:text-gray-200">{displayPhone(row.phone)}</td>
                    <td className="py-3 text-gray-500">{row.email || "—"}</td>
                    <td className="py-3 text-gray-500">{row.dateOfBirth || "—"}</td>
                    <td className="py-3 text-gray-500">{row.offersOptIn ? "Yes" : "—"}</td>
                    <td className="py-3">
                      {row.orderCount}
                      {row.spent > 0 ? (
                        <span className="mt-0.5 block text-xs text-gray-400">₹{Math.round(row.spent)}</span>
                      ) : null}
                    </td>
                    <td className="py-3 text-gray-500">{when(row.lastOrderAt || row.createdAt)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                        onClick={() => openWhatsApp(row)}
                      >
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
