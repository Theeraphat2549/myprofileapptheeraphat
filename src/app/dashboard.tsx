import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('minimal_store_products');
      if (saved) {
        try {
          const products = JSON.parse(saved);
          setTotalProducts(products.length);
          const stockSum = products.reduce((acc: number, p: any) => acc + (p.stock || 5), 0);
          setTotalStock(stockSum);
          const low = products.filter((p: any) => (p.stock || 5) <= 3).length;
          setLowStockCount(low);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Store Dashboard</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Products</Text>
            <Text style={styles.cardValue}>{totalProducts} Items</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Stock Available</Text>
            <Text style={styles.cardValue}>{totalStock} Units</Text>
          </View>

          <View style={[styles.card, { borderColor: '#FCA5A5' }]}>
            <Text style={styles.cardTitle}>Low Stock Warning</Text>
            <Text style={[styles.cardValue, { color: '#DC2626' }]}>{lowStockCount} Items</Text>
          </View>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.navItem}>
              <Text style={styles.navIcon}>🏠</Text>
              <Text style={styles.navText}>Home</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/add" asChild>
            <TouchableOpacity style={styles.navItem}>
              <Text style={styles.navIcon}>➕</Text>
              <Text style={styles.navText}>Add</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/dashboard" asChild>
            <TouchableOpacity style={styles.navItem}>
              <Text style={styles.navIcon}>📊</Text>
              <Text style={styles.navTextActive}>Dashboard</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', alignItems: 'center' },
  wrapper: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#F8FAFC', position: 'relative' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 6 },
  cardValue: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 16 },
  navText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  navTextActive: { fontSize: 10, color: '#7C3AED', fontWeight: '700', marginTop: 2 },
});