# Contributing to FoodLoop

We welcome contributions to FoodLoop! To ensure stability and adherence to our Redis-only architecture:

1. **Redis is the Only Database**:
   - Do not propose adding SQL databases or MongoDB.
   - Maintain atomicity using custom Lua scripts in `server/src/redis/scripts.ts`.
   - Update secondary index sets whenever hash records change.

2. **Branching & Commits**:
   - Create a feature branch: `git checkout -b feature/my-new-feature`.
   - Write unit and concurrency tests for your changes in `server/src/tests/`.
   - Ensure `npm test` passes before submitting pull requests.

3. **Style Guidelines**:
   - Clean light theme UI matching Tailwind forest/mint/charcoal palette.
   - Strict TypeScript everywhere.
