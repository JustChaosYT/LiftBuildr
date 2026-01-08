import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, Switch, TextInput } from 'react-native';
import Theme from '../styles/Theme';
import { generateWorkout, MUSCLE_GROUPS } from '../engine/WorkoutEngine';
import { loadProfile, appendLog, loadLogs } from '../storage/Storage';

export default function CreateWorkoutScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [targets, setTargets] = useState([]);
  const [goal, setGoal] = useState('hypertrophy');
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState('moderate');
  const [autoBalance, setAutoBalance] = useState(true);
  const [workout, setWorkout] = useState(null);

  useEffect(() => { (async () => setProfile(await loadProfile()))(); }, []);

  function toggleTarget(m) {
    setTargets(t => t.includes(m) ? t.filter(x=>x!==m) : [...t,m]);
  }

  function onGenerate() {
    const w = generateWorkout({ targets, goal, durationMin: duration, intensity, autoBalance }, profile);
    setWorkout(w);
  }

  async function onStartLog() {
    if (!workout) return;
    const entry = { workout, startedAt: new Date().toISOString(), completed: false };
    await appendLog(entry);
    navigation.navigate('LogWorkout', { entry });
  }

  return (
    <ScrollView style={Theme.container}>
      <Text style={Theme.header}>Create Workout</Text>
      <Text style={Theme.sectionTitle}>Targets</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {MUSCLE_GROUPS.map(m => (
          <Button key={m} title={targets.includes(m)?`✓ ${m}`:m} onPress={() => toggleTarget(m)} />
        ))}
      </View>
      <Text style={Theme.sectionTitle}>Goal</Text>
      <View style={{ flexDirection: 'row' }}>
        {['strength','hypertrophy','endurance','fat_loss'].map(g => (
          <Button key={g} title={g} onPress={() => setGoal(g)} />
        ))}
      </View>
      <Text style={Theme.sectionTitle}>Duration (min)</Text>
      <TextInput keyboardType="numeric" value={`${duration}`} onChangeText={t=>setDuration(Number(t))} style={{ borderBottomWidth:1, marginBottom:8 }} />
      <Text style={Theme.sectionTitle}>Intensity</Text>
      <View style={{ flexDirection: 'row' }}>
        {['low','moderate','high'].map(it => (
          <Button key={it} title={it} onPress={() => setIntensity(it)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <Text>Auto-balance</Text>
        <Switch value={autoBalance} onValueChange={setAutoBalance} />
      </View>
      <Button title="Generate Workout" onPress={onGenerate} />

      {workout && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '600' }}>Workout</Text>
          <Text>Goal: {workout.goal} • Duration: {workout.durationMin}min</Text>
          {workout.exercises.map((e, i) => (
            <View key={i} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 16 }}>{e.name} — {e.muscle}</Text>
              <Text>{e.sets} x {e.reps} • Tempo {e.tempo} • Target RPE {e.targetRPE}</Text>
            </View>
          ))}
          <View style={{ height: 8 }} />
          <Button title="Start & Log Workout" onPress={onStartLog} />
        </View>
      )}
    </ScrollView>
  );
}
