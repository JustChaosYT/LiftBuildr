// Analytics for LiftBuildr: fitness score, per-muscle strength, consistency, recovery, peer percentiles

function clamp(v, a=0, b=100) { return Math.max(a, Math.min(b, v)); }

function daysBetween(d1, d2 = new Date()) {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function normalCdf(x, mean=0, std=1) {
  // approximate cdf using error function
  const z = (x - mean) / (std * Math.SQRT2);
  return 0.5 * (1 + Math.erf ? Math.erf(z) : erf(z));
}

function erf(x) {
  // numerical approximation of error function
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1.0/(1.0 + p*x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
  return sign*y;
}

function parseNumber(v, fallback = null) {
  if (v == null || v === '') return fallback;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export function computeMuscleStrengthScores(logs = [], profile = {}) {
  // Sum volume per muscle over recent window (90 days)
  const windowDays = 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const muscleVolume = {};
  const bodyWeight = parseNumber(profile.weightKg, 70);

  logs.forEach(entry => {
    const date = entry.finishedAt || entry.startedAt || entry.createdAt;
    if (!date) return;
    if (new Date(date) < cutoff) return;
    const sets = entry.log || entry.workout?.exercises || [];
    // if entry.log exists, use recorded weights; else use planned exercises
    if (entry.log && Array.isArray(entry.log)) {
      entry.log.forEach(l => {
        const exName = l.name;
        const weight = parseNumber(l.weight, bodyWeight);
        const reps = parseNumber(l.reps, 0) || 0;
        const setsCount = parseNumber(l.sets, 1) || 1;
        // attempt to infer muscle from workout exercises
        const matched = (entry.workout?.exercises || []).find(e => e.name === exName);
        const muscle = matched?.muscle || 'General';
        muscleVolume[muscle] = (muscleVolume[muscle] || 0) + weight * reps * setsCount;
      });
    } else if (Array.isArray(sets)) {
      sets.forEach(e => {
        const reps = parseNumber(e.reps, 8) || 8;
        const setsCount = parseNumber(e.sets, 2) || 2;
        const weight = parseNumber(e.weight, bodyWeight) || bodyWeight;
        const muscle = e.muscle || 'General';
        muscleVolume[muscle] = (muscleVolume[muscle] || 0) + weight * reps * setsCount;
      });
    }
  });

  // Convert volumes to 0-100 scores using a log scale for stability
  const muscleScores = {};
  Object.entries(muscleVolume).forEach(([m, vol]) => {
    const score = clamp(Math.round(20 + 18 * Math.log10(vol + 1)), 0, 100);
    muscleScores[m] = score;
  });

  // Ensure all common muscles present with default low score
  const common = ['Chest','Back','Shoulders','Quads','Hamstrings','Glutes','Biceps','Triceps','Calves','Core','General'];
  common.forEach(m => { if (!muscleScores[m]) muscleScores[m] = 0; });

  return { muscleScores, muscleVolume };
}

export function computeConsistency(logs = [], profile = {}) {
  // Sessions per week over last 28 days
  const days = 28;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = logs.filter(l => {
    const d = l.finishedAt || l.startedAt || l.createdAt;
    return d && new Date(d) >= cutoff;
  });
  const sessions = recent.length;
  const weeks = days / 7;
  const sessionsPerWeek = sessions / weeks;
  const preferred = (profile.preferredDays && profile.preferredDays.length) || 3;
  const consistencyScore = clamp(Math.round((sessionsPerWeek / preferred) * 100), 0, 100);
  return { sessions, sessionsPerWeek: Number(sessionsPerWeek.toFixed(2)), consistencyScore };
}

export function computeRecoveryIndicators(logs = [], profile = {}) {
  // For each muscle, find days since last worked
  const lastWorked = {};
  logs.forEach(l => {
    const date = l.finishedAt || l.startedAt || l.createdAt;
    const exs = l.workout?.exercises || [];
    exs.forEach(e => {
      const m = e.muscle || 'General';
      const prev = lastWorked[m];
      if (!prev || new Date(date) > new Date(prev)) lastWorked[m] = date;
    });
  });

  const recovery = {};
  Object.entries(lastWorked).forEach(([m, d]) => {
    const days = daysBetween(d);
    let status = 'Recovered';
    if (days < 2) status = 'Fatigued';
    else if (days < 4) status = 'Partial';
    recovery[m] = { daysSince: days, status };
  });
  return { lastWorked, recovery };
}

export function computeOverallFitnessScore(muscleScores = {}, consistencyScore = 0, logs = [], profile = {}) {
  // weighted: muscle strength (60%), consistency (30%), recency (10%)
  const muscleVals = Object.values(muscleScores);
  const meanMuscle = muscleVals.length ? muscleVals.reduce((a,b)=>a+b,0)/muscleVals.length : 0;
  // recency: days since last session in 14-day window
  const last = logs.length ? new Date(Math.max(...logs.map(l => new Date(l.finishedAt || l.startedAt || l.createdAt).getTime()))) : null;
  const daysSince = last ? daysBetween(last) : 365;
  const recencyScore = clamp(Math.round(100 * Math.exp(-daysSince/14)), 0, 100);
  const overall = Math.round(meanMuscle * 0.6 + consistencyScore * 0.3 + recencyScore * 0.1);
  return { overall: clamp(overall,0,100), meanMuscle: Math.round(meanMuscle), recencyScore };
}

export function computePeerPercentiles(muscleScores = {}, profile = {}) {
  // Compare to a modeled peer distribution using experience multiplier
  const xp = (profile.experience === 'advanced') ? 1.15 : (profile.experience === 'intermediate') ? 1.0 : 0.85;
  const percentiles = {};
  Object.entries(muscleScores).forEach(([m, score]) => {
    const mean = 50 * xp; const std = 12; // model
    const p = Math.round(normalCdf(score, mean, std) * 100);
    percentiles[m] = clamp(p, 1, 99);
  });
  return percentiles;
}

export function explainAdaptations(overallMetrics) {
  // Return simple explanations for the user
  const lines = [];
  lines.push(`Overall fitness score is ${overallMetrics.overall} / 100.`);
  lines.push(`Strength is averaged across tracked muscles and scaled for recent volume.`);
  lines.push(`Consistency reflects sessions per week vs preferred schedule.`);
  lines.push(`Recovery indicators show days since a muscle was last trained; aim for 48–72 hours for most muscles.`);
  return lines;
}
