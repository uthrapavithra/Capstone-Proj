import React, { useMemo, useState } from "react";
import { Link, redirect, type ClientLoaderFunctionArgs } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { userContext } from "~/context";



export async function clientLoader({ params, context }: ClientLoaderFunctionArgs) {
  const me = context.get(userContext);
  const isAdmin = me && me.is_admin;
  if (!isAdmin){
    throw redirect("/home");
  }

  const res = await fetch(`/api/past-query/${params.username}`);
  const pastDataForUser = await res.json();

  return { pastDataForUser, isAdmin, username: params.username };
}

function toDateOnly(value: any): string {
  if (!value) return "";
  // Accept ISO strings and date-like strings
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  // fallback: try first 10 chars if it’s already "YYYY-MM-DD..."
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : "";
}

export default function PastQueries({ loaderData }: any) {
  const username = loaderData?.username ?? "";

  // Ensure we always work with an array (prevents `.map is not a function`)
  const rows = Array.isArray(loaderData?.pastDataForUser)
    ? loaderData.pastDataForUser
    : [];

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    console.log("img---",rows)

    return rows.filter((r: any) => {
      const created = toDateOnly(r.created_at);

      // Date range filter (inclusive)
      if (startDate && (!created || created < startDate)) return false;
      if (endDate && (!created || created > endDate)) return false;

      // Search filter (question + answer)
      if (!q) return true;
      const question = String(r.question ?? "").toLowerCase();
      const answer = String(r.answer_summary ?? "").toLowerCase();

      return question.includes(q) || answer.includes(q);
    });
  }, [rows, search, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="rounded-2xl">
                <Link to={`/identify-weed/${username}`}>← Back</Link>
              </Button>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
                  Past Queries
                </h1>
                
              </div>
            </div>

            <div className="text-xs text-neutral-500">
              Showing <span className="font-medium text-neutral-900">{filteredRows.length}</span>{" "}
              of <span className="font-medium text-neutral-900">{rows.length}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Search a keyword
              </label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a keyword…"
                className="rounded-2xl border-black/10 bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Start date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-2xl border-black/10 bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                End date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-2xl border-black/10 bg-white"
              />
            </div>
          </div>

          {(search || startDate || endDate) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500">Active filters:</span>
              {search ? (
                <span className="rounded-full border border-black/10 bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
                  Search: “{search}”
                </span>
              ) : null}
              {startDate ? (
                <span className="rounded-full border border-black/10 bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
                  From: {startDate}
                </span>
              ) : null}
              {endDate ? (
                <span className="rounded-full border border-black/10 bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
                  To: {endDate}
                </span>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="ml-auto rounded-2xl"
                onClick={() => {
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Table container */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                  <TableHead className="min-w-[260px]">Question</TableHead>
                  <TableHead className="whitespace-nowrap">Concern</TableHead>
                  <TableHead className="whitespace-nowrap">Image</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Confidence
                  </TableHead>

                  {/* Summary column: user can resize width */}
                  <TableHead className="min-w-[360px]">
                    <div className="inline-block resize-x overflow-auto max-w-[900px] min-w-[320px]">
                      Answer Summary
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRows.map((pastData: any, idx: number) => {
                  const created = pastData.created_at ?? "";
                  const question = pastData.question ?? "";
                  const summary = pastData.answer_summary ?? "";

                  const hasImage =
                    pastData?.image_url &&
                    pastData.image_url !== "No image" &&
                    pastData.image_url !== "No Image";

                    console.log("has img----",pastData.image_url)

                  return (
                    <TableRow key={pastData.id ?? `${created}-${idx}`}>
                      <TableCell className="whitespace-nowrap text-sm text-neutral-700">
                        {String(created)}
                      </TableCell>

                      <TableCell className="min-w-[260px] align-center">
                        <div className="max-w-[520px] whitespace-pre-wrap text-sm text-neutral-900">
                          {String(question)}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-neutral-700">
                        {String(pastData.concern ?? "")}
                      </TableCell>

                      <TableCell className="align-center">
                        {hasImage ? (
                            <img src={pastData.image_url} width="80" height = "80" ></img>
                        //   <Avatar className="h-10 w-10 border border-black/10">
                        //     <AvatarImage
                        //       src={pastData.image_url}
                        //       alt="Uploaded weed image"
                        //       referrerPolicy="no-referrer"
                        //     />
                            
                        //   </Avatar>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-neutral-700">
                        {pastData.confidence_score ?? "—"}
                      </TableCell>

                      {/* Summary: scrollable within the cell */}
                      <TableCell className="align-top">
                        <div className="max-w-[900px] min-w-[320px]">
                          <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-black/10 bg-neutral-50 p-3 text-sm text-neutral-800">
                            {String(summary)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <p className="text-sm text-neutral-600">
                        No results match your filters.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        
      </div>
    </div>
  );
}
