import { evaluateAchievements } from '../src/engine/Achievements';

test('evaluates first workout achievement', () => {
  const logs = [{ finishedAt: new Date().toISOString() }];
  const results = evaluateAchievements(logs, {});
  const first = results.find(r => r.id === 'first_workout');
  expect(first.earned).toBe(true);
});
