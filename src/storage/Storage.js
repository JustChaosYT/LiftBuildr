import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'liftbuildr_profile_v1';
const LOGS_KEY = 'liftbuildr_logs_v1';

export async function loadProfile() {
  const json = await AsyncStorage.getItem(PROFILE_KEY);
  return json ? JSON.parse(json) : null;
}

export async function saveProfile(profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadLogs() {
  const json = await AsyncStorage.getItem(LOGS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveLogs(logs) {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export async function appendLog(entry) {
  const logs = await loadLogs();
  logs.push(entry);
  await saveLogs(logs);
}
