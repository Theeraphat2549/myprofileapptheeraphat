import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LoginScreenProps {
  onLoginSuccess: (role: 'admin' | 'user', username: string) => void;
  registeredUsers: { [key: string]: string };
  onRegister: (user: string, pass: string) => boolean;
  onResetPassword: (user: string, newPass: string) => boolean;
}

export default function LoginScreen({ 
  onLoginSuccess, 
  registeredUsers, 
  onRegister, 
  onResetPassword 
}: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = () => {
    if (!username.trim()) {
      alert('กรุณากรอก Username');
      return;
    }

    if (mode === 'register') {
      if (!password.trim()) {
        alert('กรุณากรอก Password');
        return;
      }
      if (onRegister(username, password)) {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        setMode('login');
        setPassword('');
      } else {
        alert('Username นี้ถูกใช้งานแล้ว');
      }
    } else if (mode === 'forgot') {
      if (!registeredUsers[username]) {
        alert('ไม่พบ Username นี้ในระบบ');
        return;
      }
      if (!newPassword.trim()) {
        alert('กรุณากรอกรหัสผ่านใหม่');
        return;
      }
      onResetPassword(username, newPassword);
      alert('เปลี่ยนรหัสผ่านสำเร็จ!');
      setMode('login');
      setPassword('');
      setNewPassword('');
    } else {
      if (!password.trim()) {
        alert('กรุณากรอก Password');
        return;
      }
      if (username === 'admin' && password === '1234') {
        onLoginSuccess('admin', username);
      } else if (registeredUsers[username] && registeredUsers[username] === password) {
        onLoginSuccess('user', username);
      } else {
        alert('Username หรือ Password ไม่ถูกต้อง');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MINIMAL STORE</Text>
        <Text style={styles.subtitle}>
          {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Please Sign In'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#9CA3AF"
          value={username}
          onChangeText={setUsername}
        />

        {mode !== 'forgot' && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        )}

        {mode === 'forgot' && (
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        )}

        <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
          <Text style={styles.btnText}>
            {mode === 'register' ? 'Sign Up' : mode === 'forgot' ? 'Reset Password' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.links}>
          {mode === 'login' ? (
            <>
              <TouchableOpacity onPress={() => setMode('forgot')}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('register')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setMode('login')}>
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1F2937', marginBottom: 10 },
  btn: { backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 4 },
  linkText: { color: '#7C3AED', fontSize: 12, fontWeight: '600' },
});