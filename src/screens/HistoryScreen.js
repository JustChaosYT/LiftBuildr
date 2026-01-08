import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import { loadLogs, loadProfile } from '../storage/Storage';
import MuscleHeatMap from '../components/MuscleHeatMap';
import { computeMuscleStrengthScores, computeConsistency, computeRecoveryIndicators, computeOverallFitnessScore, computePeerPercentiles, explainAdaptations } from '../engine/Analytics';
import { evaluateAchievements } from '../engine/Achievements';

export default function HistoryScreen() {
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { (async () => setLogs(await loadLogs()))(); }, []);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      const l = await loadLogs();
      setLogs(l);
      const { muscleScores, muscleVolume } = computeMuscleStrengthScores(l, p || {});
      const consistency = computeConsistency(l, p || {});
      const recovery = computeRecoveryIndicators(l, p || {});
      const overall = computeOverallFitnessScore(muscleScores, consistency.consistencyScore, l, p || {});
      const peers = computePeerPercentiles(muscleScores, p || {});
      const explanation = explainAdaptations(overall);
      const achievements = evaluateAchievements(l, { muscleScores, consistency });
      setMetrics({ muscleScores, muscleVolume, consistency, recovery, overall, peers, explanation });
      setAchievements(achievements);
    })();
  }, []);

  // Simple analytics and presentation
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20 }}>History & Progress</Text>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Overall Fitness</Text>
        <Text>{metrics ? `${metrics.overall.overall} / 100` : 'Loading...'}</Text>
        {metrics && metrics.explanation.map((l, i) => <Text key={i}>{l}</Text>)}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Consistency</Text>
        <Text>{metrics ? `${metrics.consistency.sessions} sessions in last 28 days • ${metrics.consistency.sessionsPerWeek} / week` : 'Loading...'}</Text>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Strength by Muscle</Text>
        {metrics ? Object.entries(metrics.muscleScores).map(([m,s]) => (
          <View key={m} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text>{m}</Text>
            <Text>{s} • {metrics.peers[m]}th pct</Text>
          </View>
        )) : <Text>Loading...</Text>}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Recovery Indicators</Text>
        {metrics ? Object.entries(metrics.recovery.recovery).map(([m,r]) => (
          <View key={m} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text>{m}</Text>
            <Text>{r.status} • {r.daysSince}d since</Text>
          </View>
        )) : <Text>Loading...</Text>}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Muscle Heat Map</Text>
        {metrics ? <MuscleHeatMap muscleCounts={metrics.muscleVolume} /> : <Text>Loading...</Text>}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Achievements</Text>
        {achievements ? achievements.map(a => (
          <View key={a.id} style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>{a.title}</Text>
            <Text>{a.earned ? '✓' : '—'}</Text>
          </View>
        )) : <Text>Loading...</Text>}
      </View>

      <View style={{ height: 12 }} />
      <Text style={{ marginTop: 8, fontWeight: '600' }}>Recent Workouts</Text>
      {logs.slice().reverse().map((l, i) => (
        <View key={i} style={{ marginTop: 8 }}>
          <Text>{l.workout?.goal} — {l.startedAt?.slice(0,10)}</Text>
          <Text>{(l.finishedAt ? 'completed' : 'incomplete')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
