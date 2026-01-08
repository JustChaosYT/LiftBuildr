import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Switch, Alert } from 'react-native';
import { loadProfile, saveProfile } from '../storage/Storage';
import { requestPermissions, scheduleDailyReminder, cancelAllReminders } from '../engine/Reminders';

export default function PersonalScreen({ navigation }) {
  const [profile, setProfile] = useState({
    age: '', heightCm: '', weightKg: '', sex: '', experience: 'beginner', equipment: ['body'], injuries: '', preferredDays: [], timePerDayMin: 45
  });

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (p) setProfile(p);
    })();
  }, []);

  async function onSave() {
    await saveProfile(profile);
    navigation.navigate('CreateWorkout');
  }

  async function onToggleReminders(enabled) {
    if (enabled) {
      const ok = await requestPermissions();
      if (!ok) { Alert.alert('Notifications disabled', 'Please enable notifications to receive reminders.'); return; }
      await scheduleDailyReminder(18, 0);
    } else {
      await cancelAllReminders();
    }
    setProfile(s => ({ ...s, remindersEnabled: enabled }));
    await saveProfile({ ...profile, remindersEnabled: enabled });
  }

  return (
    <ScrollView style={require('../styles/Theme').default.container}>
      <Text style={require('../styles/Theme').default.header}>Personal</Text>
      <Text>Age</Text>
      <TextInput value={`${profile.age}`} keyboardType="numeric" onChangeText={t => setProfile(s => ({ ...s, age: t }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <Text>Height (cm)</Text>
      <TextInput value={`${profile.heightCm}`} keyboardType="numeric" onChangeText={t => setProfile(s => ({ ...s, heightCm: t }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <Text>Weight (kg)</Text>
      <TextInput value={`${profile.weightKg}`} keyboardType="numeric" onChangeText={t => setProfile(s => ({ ...s, weightKg: t }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <Text>Sex (optional)</Text>
      <TextInput value={profile.sex} onChangeText={t => setProfile(s => ({ ...s, sex: t }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <Text>Experience</Text>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {['beginner','intermediate','advanced'].map(e => (
          <Button key={e} title={e} onPress={() => setProfile(s => ({ ...s, experience: e }))} />
        ))}
      </View>
      <Text>Available equipment (comma separated: dumbbell,barbell,machine)</Text>
      <TextInput value={(profile.equipment||[]).join(',')} onChangeText={t => setProfile(s => ({ ...s, equipment: t.split(',').map(x=>x.trim()).filter(Boolean) }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <Text>Injuries / limitations</Text>
      <TextInput value={profile.injuries} onChangeText={t => setProfile(s => ({ ...s, injuries: t }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <Text>Preferred time per session (min)</Text>
      <TextInput value={`${profile.timePerDayMin}`} keyboardType="numeric" onChangeText={t => setProfile(s => ({ ...s, timePerDayMin: Number(t) }))} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ marginRight: 8 }}>Enable daily reminders</Text>
        <Switch value={!!profile.remindersEnabled} onValueChange={onToggleReminders} />
      </View>
      <Button title="Save Personal Profile" onPress={onSave} />
      <View style={{ height: 12 }} />
      <Button title="View History" onPress={() => navigation.navigate('History')} />
    </ScrollView>
  );
}
