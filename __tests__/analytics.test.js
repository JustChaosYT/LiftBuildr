import { computeMuscleStrengthScores, computeConsistency, computeRecoveryIndicators, computeOverallFitnessScore } from '../src/engine/Analytics';

test('computes muscle scores from logs', () => {
  const logs = [
    { finishedAt: new Date().toISOString(), log: [{ name: 'Test', weight: '50', reps: '8', sets: '3' }], workout: { exercises: [{ name: 'Test', muscle: 'Chest' }] } }
  ];
  const profile = { weightKg: 70 };
  const { muscleScores } = computeMuscleStrengthScores(logs, profile);
  expect(muscleScores['Chest']).toBeGreaterThanOrEqual(0);
});

test('computes consistency score', () => {
  const today = new Date();
  const logs = [];
  for (let i=0;i<4;i++) logs.push({ finishedAt: new Date(today.getTime() - i*24*60*60*1000).toISOString() });
  const profile = { preferredDays: [1,3,5] };
  const c = computeConsistency(logs, profile);
  expect(c.sessions).toBe(4);
});

test('computes overall fitness', () => {
  const muscleScores = { Chest: 50, Back: 40 };
  const overall = computeOverallFitnessScore(muscleScores, 80, [], {});
  expect(overall.overall).toBeGreaterThanOrEqual(0);
});
