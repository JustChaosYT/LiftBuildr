import React, { useState } from 'react';
import { View, Text, Button, ScrollView, TextInput } from 'react-native';
import { appendLog, saveLogs } from '../storage/Storage';

export default function WorkoutLogScreen({ route, navigation }) {
  const entry = route.params?.entry;
  const [log, setLog] = useState(entry?.workout?.exercises?.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, weight: '', perceived: '' })) || []);

  function update(i, key, value) {
    setLog(l => l.map((it, idx) => idx === i ? { ...it, [key]: value } : it));
  }

  async function onSave() {
    const finished = { ...entry, completed: true, finishedAt: new Date().toISOString(), log };
    await appendLog(finished);
    navigation.navigate('History');
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20 }}>Logging</Text>
      {log.map((s, i) => (
        <View key={i} style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '600' }}>{s.name}</Text>
          <Text>Planned: {s.sets} x {s.reps}</Text>
          <TextInput placeholder="weight" value={s.weight} onChangeText={t=>update(i,'weight',t)} style={{ borderBottomWidth:1 }} />
          <TextInput placeholder="perceived effort (RPE)" value={s.perceived} onChangeText={t=>update(i,'perceived',t)} style={{ borderBottomWidth:1 }} />
        </View>
      ))}
      <View style={{ height: 12 }} />
      <Button title="Save Workout Log" onPress={onSave} />
    </ScrollView>
  );
}
