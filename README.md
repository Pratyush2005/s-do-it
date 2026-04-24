# SRM Full Stack Engineering Challenge — Round 1

This repository contains the solution for the SRM Full Stack Engineering Challenge. It is a full-stack web application built using **TanStack Start** and **React**, deployed on **Vercel**.

## Features

* **REST API (`POST /bfhl`)**: A highly optimized endpoint that processes an array of node strings (e.g., `["A->B", "B->C"]`) and constructs hierarchical relationships.
* **Tree Construction**: Accurately builds independent trees from valid, non-duplicate edges.
* **Cycle Detection**: Detects cyclic groups (e.g., `A->B`, `B->A`) and flags them without calculating depth.
* **Depth Calculation**: Calculates the deepest root-to-leaf path for valid non-cyclic trees.
* **Intelligent Validation**: Handles whitespace trimming, duplicate edge tracking, multi-parent (diamond) resolution, and invalid entry filtering.
* **Interactive Frontend**: A single-page application (SPA) where users can submit node edges and visualize the parsed trees, cycles, and summary statistics.

## Tech Stack

* **Framework**: TanStack Start (React)
* **Language**: TypeScript
* **Styling**: Tailwind CSS & Radix UI primitives
* **Hosting**: Vercel

## API Specification

**Endpoint:** `POST /bfhl`
**Content-Type:** `application/json`

**Example Request:**
```json
{
  "data": [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "hello", "1->2", "A->"
  ]
}
```

**Example Response:**
```json
{
  "user_id": "pratyushpradhan_24072005",
  "email_id": "pp5020@srmist.edu.in",
  "college_roll_number": "RA2311047010095",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` (or the port provided by Vite) in your browser.
