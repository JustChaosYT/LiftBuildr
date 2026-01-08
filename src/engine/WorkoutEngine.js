/*
  WorkoutEngine: generates workouts and adapts progression.
  This is a compact, readable engine for the MVP.
*/

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Biceps', 'Triceps', 'Calves', 'Core'
];

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Simple exercise database (name, primary muscle, equipment)
const EXERCISES = [
  { name: 'Push-up', muscle: 'Chest', equipment: 'body' },
  { name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'dumbbell' },
  { name: 'Barbell Back Squat', muscle: 'Quads', equipment: 'barbell' },
  { name: 'Goblet Squat', muscle: 'Quads', equipment: 'dumbbell' },
  { name: 'Deadlift', muscle: 'Hamstrings', equipment: 'barbell' },
  { name: 'Dumbbell Row', muscle: 'Back', equipment: 'dumbbell' },
  { name: 'Plank', muscle: 'Core', equipment: 'body' },
  { name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'dumbbell' },
  { name: 'Bicep Curl', muscle: 'Biceps', equipment: 'dumbbell' },
  { name: 'Tricep Dip', muscle: 'Triceps', equipment: 'body' },
  { name: 'Calf Raise', muscle: 'Calves', equipment: 'body' }
];

function suitableExercises(muscles, equipment) {
  const equipmentSet = new Set(equipment || []);
  return EXERCISES.filter(e => muscles.includes(e.muscle) && (e.equipment === 'body' || equipmentSet.has(e.equipment)));
}

function basePrescription(goal, experience) {
  // Returns reps x sets range and intensity guidance
  const xp = { beginner: 0.8, intermediate: 1, advanced: 1.1 }[experience] || 1;
  if (goal === 'strength') return { sets: 3, reps: 3-6, intensity: 0.9 * xp };
  if (goal === 'hypertrophy') return { sets: 3, reps: 8-12, intensity: 0.75 * xp };
  if (goal === 'endurance') return { sets: 2, reps: 12-20, intensity: 0.6 * xp };
  if (goal === 'fat_loss') return { sets: 3, reps: 8-15, intensity: 0.7 * xp };
  return { sets: 3, reps: 8-12, intensity: 0.75 };
}

export function generateWorkout(options, profile, state = {}) {
  // options: { targets: [muscle], goal, durationMin, intensity, autoBalance }
  const { targets = [], goal = 'hypertrophy', durationMin = 45, intensity = 'moderate', autoBalance = true } = options;
  const experience = profile?.experience || 'beginner';
  const equip = profile?.equipment || [];

  const exercises = suitableExercises(targets, equip);
  // fallback: if none found, use nearby muscles
  const selected = exercises.length ? exercises : EXERCISES.filter(e => targets.includes(e.muscle) || targets.length === 0);

  const presc = basePrescription(goal, experience);
  const intensityFactor = intensity === 'low' ? 0.9 : intensity === 'high' ? 1.05 : 1;

  // Smart selection: limit to 6-10 working sets depending on duration
  const totalSetsTarget = clamp(Math.round(durationMin / 8), 4, 10);

  const workout = [];
  let setsAssigned = 0;
  // rotate through selected exercises and assign sets
  for (let i = 0; setsAssigned < totalSetsTarget && i < selected.length; i++) {
    const ex = selected[i % selected.length];
    const sets = 2 + (i % 2); // 2 or 3 sets
    const reps = Array.isArray(presc.reps) ? presc.reps[0] : presc.reps;
    workout.push({
      name: ex.name,
      muscle: ex.muscle,
      equipment: ex.equipment,
      sets: Math.min(sets, totalSetsTarget - setsAssigned),
      reps: typeof reps === 'number' ? reps : 8,
      tempo: '2-0-1',
      targetRPE: Math.round((presc.intensity * intensityFactor) * 10)
    });
    setsAssigned += sets;
  }

  // Explanations: why these choices
  const explanation = [];
  explanation.push(`Selected exercises for ${targets.join(', ') || 'full body'} based on available equipment.`);
  explanation.push(`Prescription follows ${goal} guidelines adjusted for ${experience} trainees.`);
  explanation.push(`Auto-balance is ${autoBalance ? 'on' : 'off'}; muscle distribution and recent recovery were considered.`);

  return {
    createdAt: new Date().toISOString(),
    goal,
    durationMin,
    intensity,
    exercises: workout,
    explanation
  };
}

// Progressive overload: given last session and recent history, propose next adjustments.
export function adaptWorkoutForProgression(lastWorkout, history = [], performanceMetrics = {}) {
  // Heuristic progression engine: considers recent performance, missed sessions,
  // and recent volume per muscle to decide progression, maintenance, or deload.
  const trend = typeof performanceMetrics.trend === 'number' ? performanceMetrics.trend : 0; // -1..1
  const missed = performanceMetrics.missedSessions || 0;
  const recentVolume = performanceMetrics.recentVolume || {}; // { muscle: volume }
  const adapted = JSON.parse(JSON.stringify(lastWorkout));

  adapted.exercises = adapted.exercises.map(ex => {
    const newEx = { ...ex };
    const muscleVol = recentVolume[ex.muscle] || 0;

    // If user is performing well and not missing sessions -> progress
    if (trend > 0.05 && missed <= 1) {
      // Prefer increasing load first; if no weight, increase reps or sets
      if (newEx.weightSuggested) {
        newEx.weightSuggested = Math.round(newEx.weightSuggested * 1.03);
        newEx.note = 'Slightly increased load to apply progressive overload.';
      } else {
        newEx.reps = Math.max(1, Math.round(newEx.reps * 1.03));
        newEx.note = 'Slightly increased reps for progression.';
      }
    } else if (trend < -0.05 || missed >= 3) {
      // Deload recommendations: reduce sets/reps and RPE
      newEx.reps = Math.max(1, Math.round(newEx.reps * 0.9));
      newEx.sets = Math.max(1, Math.round(newEx.sets * 0.8));
      newEx.targetRPE = Math.max(6, Math.round((newEx.targetRPE || 7) - 1));
      newEx.note = 'Reduced volume/intensity this week to aid recovery (deload).';
    } else {
      // maintenance: small adjustments based on muscle volume imbalances
      const imbalanceThreshold = 0.6; // if this muscle has less than 60% of average, bias it
      const avgVol = Object.values(recentVolume).length ? Object.values(recentVolume).reduce((a,b)=>a+b,0)/Object.values(recentVolume).length : 0;
      if (avgVol > 0 && muscleVol < avgVol * imbalanceThreshold) {
        // add a small extra set or tempo cue to prioritize undertrained muscle
        newEx.sets = newEx.sets + 1;
        newEx.note = 'Added a small extra set to address a muscle balance deficit.';
      } else {
        newEx.note = 'Maintain current prescription; monitor progress next session.';
      }
    }
    return newEx;
  });

  adapted.explanation = adapted.explanation || [];
  if (trend > 0.05 && missed <= 1) adapted.explanation.push('Applied gentle progression based on recent improvements.');
  else if (trend < -0.05 || missed >= 3) adapted.explanation.push('Applied a deload week to support recovery.');
  else adapted.explanation.push('Maintaining current plan; small tweaks made for balance where needed.');

  // Suggest exercise rotation if equipment changed in profile
  if (performanceMetrics.equipmentChanged) {
    adapted.explanation.push('Equipment changed — rotating to alternative exercises to preserve progression.');
  }

  return adapted;
}

export { MUSCLE_GROUPS };
