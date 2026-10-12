import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3085/api';

export default function DashboardScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowCount: 0,
    midCount: 0,
    highCount: 0,
    avgPrice: 0,
  });

  useEffect(() => {
    // 📌 ตรวจสอบสิทธิ์แบบเงียบๆ ไม่มีกล่อง Alert เด้งกวนใจ ถ้าไม่ใช่ Admin ดีดกลับหน้าหลักทันที
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const role = localStorage.getItem('user_role');
        if (role !== 'admin') {
          router.replace('/');
          return;
        }
      }
    } catch (e) {
      console.log(e);
    }

    fetch(`${API_BASE_URL}/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          calculateDashboardAI(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.log('Dashboard fetch error:', err);
        setLoading(false);
      });
  }, []);

  const calculateDashboardAI = (data: any[]) => {
    if (!data || data.length === 0) return;
    const prices = data.map(item => parseFloat(item.price || 0));
    
    let centroids = [
      Math.min(...prices), 
      (Math.min(...prices) + Math.max(...prices)) / 2, 
      Math.max(...prices)
    ];
    
    let assignments: number[] = [];
    let changed = true;

    while (changed) {
      changed = false;
      assignments = prices.map(price => {
        const diffs = centroids.map(c => Math.abs(price - c));
        return diffs.indexOf(Math.min(...diffs));
      });

      const newCentroids = [0, 1, 2].map(i => {
        const clusterPrices = prices.filter((_, index) => assignments[index] === i);
        return clusterPrices.length 
          ? clusterPrices.reduce((a, b) => a + b, 0) / clusterPrices.length 
          : centroids[i];
      });

      if (JSON.stringify(centroids) !== JSON.stringify(newCentroids)) {
        centroids = newCentroids;
        changed = true;
      }
    }

    const sortedCentroids = [...centroids].sort((a, b) => a - b);
    const labels = ["Low", "Mid", "High"];

    let low = 0, mid = 0, high = 0;
    const clustered = data.map((item, index) => {
      const myCentroid = centroids[assignments[index]];
      const tierIndex = sortedCentroids.indexOf(myCentroid);
      const tier = labels[tierIndex] || "Mid";
      
      if (tier === 'Low') low++;
      else if (tier === 'Mid') mid++;
      else if (tier === 'High') high++;

      return { ...item, priceTier: tier };
    });

    const totalSum = prices.reduce((a, b) => a + b, 0);
    const avg = prices.length > 0 ? totalSum / prices.length : 0;

    setProducts(clustered);
    setStats({
      totalProducts: data.length,
      lowCount: low,
      midCount: mid,
      highCount: high,
      avgPrice: avg,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 ADMIN DASHBOARD</Text>
        <Text style={styles.headerSubtitle}>AI Price Clustering & Inventory Analytics (Restricted Access)</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={{ marginTop: 10, color: '#64748B' }}>กำลังตรวจสอบสิทธิ์และประมวลผลข้อมูล...</Text>
        </View>
      ) : (
        <>
          <View style={styles.cardRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={styles.cardLabel}>สินค้าทั้งหมดในระบบ</Text>
              <Text style={[styles.cardValue, { color: '#1D4ED8' }]}>{stats.totalProducts} ชิ้น</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={styles.cardLabel}>ราคาเฉลี่ยสินค้า</Text>
              <Text style={[styles.cardValue, { color: '#15803D' }]}>฿{stats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>

          <View style={styles.analyticsBox}>
            <Text style={styles.sectionTitle}>🤖 AI Price Auto Cluster Breakdown</Text>
            <Text style={styles.sectionDesc}>ผลการวิเคราะห์แบ่งกลุ่มราคาสินค้าด้วยอัลกอริทึม K-Means อัตโนมัติสำหรับผู้ดูแลระบบ</Text>

            <View style={styles.tierRow}>
              <View style={[styles.tierCard, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.tierTitle, { color: '#166534' }]}>🟢 Low Tier</Text>
                <Text style={[styles.tierCount, { color: '#166534' }]}>{stats.lowCount} รายการ</Text>
                <Text style={[styles.tierSub, { color: '#166534' }]}>ราคาประหยัด / Budget</Text>
              </View>

              <View style={[styles.tierCard, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.tierTitle, { color: '#1E40AF' }]}>🔵 Mid Tier</Text>
                <Text style={[styles.tierCount, { color: '#1E40AF' }]}>{stats.midCount} รายการ</Text>
                <Text style={[styles.tierSub, { color: '#1E40AF' }]}>ระดับกลาง / Mainstream</Text>
              </View>

              <View style={[styles.tierCard, { backgroundColor: '#FFEDD5' }]}>
                <Text style={[styles.tierTitle, { color: '#C2410C' }]}>🟠 High Tier</Text>
                <Text style={[styles.tierCount, { color: '#C2410C' }]}>{stats.highCount} รายการ</Text>
                <Text style={[styles.tierSub, { color: '#C2410C' }]}>พรีเมียม / High-End</Text>
              </View>
            </View>
          </View>

          <View style={styles.analyticsBox}>
            <Text style={styles.sectionTitle}>📦 รายการสินค้าและป้าย AI ล่าสุด</Text>
            {products.slice(0, 5).map((item, idx) => (
              <View key={idx} style={styles.productListItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productListName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productListPrice}>฿{Number(item.price).toLocaleString()}</Text>
                </View>
                <View style={[
                  styles.badgeMini, 
                  item.priceTier === 'Low' ? { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' } :
                  item.priceTier === 'High' ? { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' } :
                  { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }
                ]}>
                  <Text style={[
                    styles.badgeMiniText,
                    item.priceTier === 'Low' ? { color: '#166534' } :
                    item.priceTier === 'High' ? { color: '#C2410C' } :
                    { color: '#1E40AF' }
                  ]}>{item.priceTier}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>⬅️ กลับสู่หน้าหลักร้านค้า</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8FAFC', padding: 16, alignItems: 'center' },
  header: { width: '100%', maxWidth: 600, backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  loaderContainer: { paddingVertical: 60, alignItems: 'center' },
  cardRow: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '800' },
  analyticsBox: { width: '100%', maxWidth: 600, backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  sectionDesc: { fontSize: 11, color: '#64748B', marginBottom: 12 },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierCard: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tierTitle: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  tierCount: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  tierSub: { fontSize: 9, textAlign: 'center', fontWeight: '600' },
  productListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  productListName: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  productListPrice: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  badgeMini: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeMiniText: { fontSize: 10, fontWeight: '800' },
  buttonContainer: { width: '100%', maxWidth: 600, marginTop: 4, marginBottom: 20 },
  backBtn: { backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  backBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});     