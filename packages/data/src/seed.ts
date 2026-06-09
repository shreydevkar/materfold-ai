export async function seed() {
  return {
    bestPractices: [
      'Store campaign history as append-only records.',
      'Keep client scopes isolated at request and persistence layers.',
      'Log token usage on every agent call.',
    ],
    benchmarks: [
      '5-10 ideation concepts per campaign brief.',
      'Confidence threshold of 0.7 for scoring retries.',
      'High-confidence learnings only for future prompt enrichment.',
    ],
  };
}

if (process.argv[1]?.endsWith('seed.js')) {
  void seed();
}