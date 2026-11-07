// runCommands against a fake fetch: chunking, rate limits, isolating a rejected command, and unknown outcomes.
import {test, afterEach} from "node:test";
import assert from "node:assert/strict";
import {runCommands, type FiberyCommand} from "../src/fiberyBatch.ts";
import {fetchAllPages} from "../src/paging.ts";

type Reply = {status: number; body?: unknown; headers?: Record<string, string>} | "network";
const realFetch = globalThis.fetch;
let requests: FiberyCommand[][] = [];

// Each request gets the next reply; a function reply builds it from the request's commands.
const fakeFetch = (...replies: (Reply | ((commands: FiberyCommand[]) => Reply))[]) => {
  requests = [];
  globalThis.fetch = (async (_url: string, init: {body: string}) => {
    const commands = JSON.parse(init.body) as FiberyCommand[];
    requests.push(commands);
    const next = replies.length > 1 ? replies.shift()! : replies[0];
    const reply = typeof next === "function" ? next(commands) : next;
    if (reply === "network") throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(reply.body ?? null), {status: reply.status, headers: reply.headers});
  }) as typeof fetch;
};
afterEach(() => {
  globalThis.fetch = realFetch;
});

const fast = {minIntervalMs: 0, backoffMs: () => 0};
const create = (n: number): FiberyCommand => ({command: "fibery.entity/create", args: {n}});
const update = (n: number): FiberyCommand => ({command: "fibery.entity/update", args: {n}});
const envelopes = (commands: FiberyCommand[]) => commands.map((c) => ({success: true, result: {"fibery/id": `id-${(c.args as {n: number}).n}`}}));

test("sends chunks in order and returns one result per command", async () => {
  fakeFetch((commands) => ({status: 200, body: envelopes(commands)}));
  const progress: number[] = [];
  const results = await runCommands([1, 2, 3, 4, 5].map(create), {...fast, chunkSize: 2, onProgress: (done) => progress.push(done)});
  assert.deepEqual(requests.map((r) => r.length), [2, 2, 1]);
  assert.deepEqual(results.map((r) => r.ok && (r.result as {"fibery/id": string})["fibery/id"]), ["id-1", "id-2", "id-3", "id-4", "id-5"]);
  assert.deepEqual(progress, [2, 4, 5]);
});

test("a refused command fails alone; the rest of its chunk succeeds", async () => {
  fakeFetch((commands) => ({
    status: 200,
    body: commands.map((c, i) => (i === 1 ? {success: false, result: {name: "entity.error", message: "bad value"}} : {success: true, result: c.args})),
  }));
  const results = await runCommands([1, 2, 3].map(update), fast);
  assert.deepEqual(results.map((r) => r.ok), [true, false, true]);
  assert.match(!results[1].ok ? results[1].error.message : "", /bad value/);
});

test("429 waits and repeats the same chunk", async () => {
  fakeFetch({status: 429, headers: {"retry-after": "0"}}, (commands) => ({status: 200, body: envelopes(commands)}));
  const results = await runCommands([create(1)], fast);
  assert.equal(requests.length, 2);
  assert.equal(results[0].ok, true);
});

test("a 400 for the whole chunk is split until the bad command is found", async () => {
  fakeFetch((commands) =>
    commands.some((c) => (c.args as {n: number}).n === 3) ? {status: 400, body: "bad"} : {status: 200, body: envelopes(commands)},
  );
  const results = await runCommands([1, 2, 3, 4].map(update), fast);
  assert.deepEqual(results.map((r) => r.ok), [true, true, false, true]);
  assert.equal(!results[2].ok && results[2].uncertain, false);
});

test("creates without an answer are not repeated and come back uncertain", async () => {
  fakeFetch({status: 504, body: "gateway"});
  const results = await runCommands([1, 2].map(create), fast);
  assert.equal(requests.length, 1);
  assert.deepEqual(results.map((r) => !r.ok && r.uncertain), [true, true]);
});

test("updates without an answer are repeated, then uncertain", async () => {
  fakeFetch("network");
  const results = await runCommands([update(1)], fast);
  assert.equal(requests.length, 5);
  assert.equal(!results[0].ok && results[0].uncertain, true);
});

test("updates recover when a repeat gets an answer", async () => {
  fakeFetch({status: 502}, (commands) => ({status: 200, body: envelopes(commands)}));
  const results = await runCommands([update(1)], fast);
  assert.equal(requests.length, 2);
  assert.equal(results[0].ok, true);
});

test("403 fails the chunk at once, not uncertain", async () => {
  fakeFetch({status: 403, body: "forbidden"});
  const results = await runCommands([create(1), create(2)], fast);
  assert.equal(requests.length, 1);
  assert.deepEqual(results.map((r) => !r.ok && !r.uncertain), [true, true]);
});

test("an answer with the wrong number of results makes creates uncertain", async () => {
  fakeFetch({status: 200, body: [{success: true, result: {}}]});
  const results = await runCommands([create(1), create(2)], fast);
  assert.deepEqual(results.map((r) => !r.ok && r.uncertain), [true, true]);
});

test("fetchAllPages reads pages until a short one", async () => {
  const data = Array.from({length: 7}, (_, i) => i);
  const offsets: number[] = [];
  const all = await fetchAllPages(async (offset, limit) => {
    offsets.push(offset);
    return data.slice(offset, offset + limit);
  }, 3);
  assert.deepEqual(all, data);
  assert.deepEqual(offsets, [0, 3, 6]);
  const exact = await fetchAllPages(async (offset, limit) => data.slice(0, 6).slice(offset, offset + limit), 3);
  assert.equal(exact.length, 6);
});
