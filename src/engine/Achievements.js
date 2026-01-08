// Achievements definitions and evaluator

const ACHIEVEMENTS = [
  { id: 'first_workout', title: 'First Workout', desc: 'Complete your first logged workout' },
  { id: 'seven_day_streak', title: '7-Day Streak', desc: 'Train at least once per day for 7 consecutive days' },
  { id: 'consistent_3_per_week', title: '3x/Week Consistency', desc: 'Average 3 sessions per week over 4 weeks' },
  { id: 'strength_milestone', title: 'Strength Milestone', desc: 'Achieve a high strength score on any muscle' }
];

function daysBetween(d1, d2 = new Date()) {
  const a = new Date(d1).setHours(0,0,0,0);
  const b = new Date(d2).setHours(0,0,0,0);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function evaluateAchievements(logs = [], metrics = {}) {
  const earned = {};
  const sorted = logs.slice().map(l => ({ date: new Date(l.finishedAt || l.startedAt || l.createdAt) })).sort((a,b)=>a.date-b.date);

  // First workout
  earned.first_workout = sorted.length >= 1;

  // 7-day streak: check if there's at least one session each day for 7 consecutive days
  earned.seven_day_streak = (() => {
    if (sorted.length < 7) return false;
    const days = sorted.map(s => s.date.setHours(0,0,0,0));
    const uniq = Array.from(new Set(days)).sort();
    let streak = 1, maxStreak = 1;
    for (let i=1;i<uniq.length;i++) {
      if (uniq[i] - uniq[i-1] === 24*60*60*1000) streak++; else streak = 1;
      if (streak > maxStreak) maxStreak = streak;
    }
    return maxStreak >= 7;
  })();

  // 3x/week consistency over last 28 days
  earned.consistent_3_per_week = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 28);
    const recent = logs.filter(l => new Date(l.finishedAt || l.startedAt || l.createdAt) >= cutoff);
    const sessions = recent.length; const weeks = 28/7;
    return (sessions / weeks) >= 3;
  })();

  // Strength milestone: any muscle score >= 80
  earned.strength_milestone = (() => {
    const ms = metrics?.muscleScores || {};
    return Object.values(ms).some(v => v >= 80);
  })();

  // Map to detailed list
  const results = ACHIEVEMENTS.map(a => ({ ...a, earned: !!earned[a.id] }));
  return results;
}
