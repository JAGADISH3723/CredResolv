# Expense Sharing Backend

> A polished backend for managing shared expenses. Designed and implemented as a company-assignment-style project with clear validations, test coverage, and a focused demo.

---

## Project summary

This repository contains a backend implementation of an Expense Sharing Application, inspired by Splitwise.
The primary objective of this project is to demonstrate backend system design, problem decomposition, and clear architectural decision-making, rather than frontend UI development.

This is a compact Express + MongoDB backend for tracking shared expenses inside groups. It computes per-user splits (EQUAL / EXACT / PERCENT), updates simplified balances so clients can display who owes whom, and persists expense records for auditability.

Why this matters to a product team:
- Clear, deterministic split calculations reduce disputes in UIs.
- Server-side validation prevents inconsistent or malicious input.
- Balances are simplified to a single directional amount for straightforward display and settlement.

---

## Features

- Accepts user references by ID, email, or name (server resolves to canonical user ID).
- Split types: **EQUAL**, **EXACT**, **PERCENT**.
- Rigorous validation: group membership, amount/percent totals, and non-negative values.
- Per-split balance updates with reverse-balance simplification.
- Persists `Expense` records and returns clear HTTP 201 responses with computed splits.
- Lightweight test runner using an in-memory MongoDB for repeatable demos.

---

## Tech stack

- Node.js, Express
- MongoDB (Mongoose)
- mongodb-memory-server and supertest for isolated tests

---

## Quick start (developer)

1. Install dependencies

```bash
npm install
```

2. Start the server

```bash
npm start
# or
node server.js
```

3. Run the manual test suite (in-memory DB)

```bash
node tests/manual-expense-tests.js
```

---

## API — key endpoint

POST /expenses
- Body (example):

```json
{
  "paidBy": "sudhu@gmail.com",
  "amount": 1000,
  "splitType": "PERCENT",
  "splits": [
    { "userId": "<id1>", "percent": 50 },
    { "userId": "<id2>", "percent": 50 }
  ],
  "groupId": "<groupId>"
}
```

- Successful response (201):

```json
{
  "message": "Expense added successfully",
  "paidBy": { "userId": "...", "email": "sudhu@gmail.com", "name": "Sudhu" },
  "groupId": "...",
  "total": 1000,
  "splits": [
    { "userId": "...", "email": "...", "name": "User A", "amount": 500.00 },
    { "userId": "...", "email": "...", "name": "User B", "amount": 500.00 }
  ],
  "expenseId": "..."
}
```

Errors return HTTP 400 with a descriptive `{ message }` when validation fails.

---

## Design decisions & trade-offs

Input normalization
- Accepting `email`/`name` improves developer ergonomics for demos and tests; production should rely on authenticated user IDs.

Rounding policy
- Shares are rounded to 2 decimals and any small rounding difference is applied to the first participant to guarantee the summed shares equal the total. This is deterministic and easy to audit. If desired, we can change the policy (apply diff to last participant, smallest share, or distribute pro-rata).

Split calculation details
## Split rules (simple)
- EQUAL: divide amount evenly, round to 2 decimals, apply any tiny rounding diff to the first participant.
- EXACT: client provides exact amounts; server validates the sum (tolerance 0.01).
- PERCENT: compute `(amount * percent) / 100`, round to 2 decimals, apply rounding diff to the first participant.

## Who owes whom — examples
- Alice pays 100 for Bob & Charlie → Bob→Alice 50, Charlie→Alice 50.
- If Bob already owed Alice 20, and then owes 50 more, final Bob→Alice = 70.
- If Alice owed Bob 30 and now Bob owes Alice 20, net = Alice→Bob 10.

EQUAL
- Compute: perShareRaw = amount / N
- Round each share: share = parseFloat(perShareRaw.toFixed(2))
- totalAssigned = sum(shares)
- diff = amount - totalAssigned
- Apply: shares[0] = parseFloat((shares[0] + diff).toFixed(2)) to make total exact

EXACT
- Each split entry must include an explicit `amount` (non-negative numeric).
- Normalize: amt = parseFloat(Number(amount).toFixed(2)) for each split.
- Validate: sum(amt) ≈ total (tolerance 0.01); reject otherwise.
- No automatic redistribution is performed for exact splits — client must provide precise amounts.

PERCENT
- Each split entry must include a `percent` (non-negative numeric).
- Compute raw share: share = parseFloat(((amount * percent) / 100).toFixed(2))
- totalAssigned = sum(shares)
- diff = amount - totalAssigned
- Apply: shares[0] = parseFloat((shares[0] + diff).toFixed(2)) to make total exact

Examples
- EQUAL: amount=100, N=3 → raw=33.333..., shares=[33.33, 33.33, 33.33], total=99.99, diff=0.01 → final shares=[33.34, 33.33, 33.33]
- PERCENT: amount=200, percents=[50,50] → shares=[100.00, 100.00]

Implementation notes (JS pseudocode)

- EQUAL
```
const perShare = amount / N;
const shares = participants.map(() => parseFloat(perShare.toFixed(2)));
const diff = parseFloat((amount - shares.reduce((s,x) => s + x, 0)).toFixed(2));
if (Math.abs(diff) > 0.001) shares[0] = parseFloat((shares[0] + diff).toFixed(2));
```

- PERCENT
```
const shares = participants.map(p => parseFloat(((amount * p.percent) / 100).toFixed(2)));
const diff = parseFloat((amount - shares.reduce((s,x) => s + x, 0)).toFixed(2));
if (Math.abs(diff) > 0.001) shares[0] = parseFloat((shares[0] + diff).toFixed(2));
```

Balance model
- Balances are stored in a directional manner. When an opposite-direction balance exists, the code reduces or removes it instead of keeping both directions — keeps queries and UI logic simple.

Validation location
- Validation is implemented in the route handler for clarity and testability. For scaling, move validation to middleware or schema-level hooks.

A compact, easy-to-understand backend for tracking shared expenses in groups.

## What it does (TL;DR)
- Computes per-user splits (EQUAL, EXACT, PERCENT).
- Updates directional balances: `{ from, to, amount }` meaning "from owes to".
- Persists `Expense` and returns a clear JSON response with computed splits.

## Quick start
1. Install deps: `npm install`
2. Start server: `npm start` (http://localhost:3000)
3. Run demo tests: `node tests/manual-expense-tests.js` (in-memory MongoDB)

## POST /expenses — quick example
Request body:
```json
{
  "paidBy": "sudhu@gmail.com",
  "amount": 1000,
  "splitType": "PERCENT",
  "splits": [ { "userId": "<id1>", "percent": 50 }, { "userId": "<id2>", "percent": 50 } ],
  "groupId": "<groupId>"
}
```
Response (201):
```json
{ "message":"Expense added successfully", "paidBy":{ "userId":"...","email":"sudhu@gmail.com","name":"Sudhu"}, "total":1000, "splits":[{"userId":"...","amount":500.00}], "expenseId":"..." }
```

 

## Notes & next steps
- Add authentication (use the authenticated user as `paidBy`).
- Consider integer cents or a decimal library for production precision.
- Add CI and more unit/integration tests.
 
