import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

const API_BASE_URL = 'http://119.59.102.161:3085/api';

export default function DeleteScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลสินค้าทั้งหมดจากฐานข้อมูล (Inventory)
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any) => ({
          id: item.id || item._id || Date.now() + Math.random(),
          name: item.name || item.title || 'Product',
          price: Number(item.price ?? 0),
          image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400',
        }));
        setProducts(formatted);
      }
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ตรวจสอบสิทธิ์ Admin (ถ้าไม่ใช่ Admin ดีดกลับหน้าแรก)
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

    fetchProducts();
  }, []);

  // ฟังก์ชันลบสินค้าจากฐานข้อมูลจริง
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        // โหลดข้อมูลล่าสุดมาแสดงใหม่ทันทีหลังลบเสร็จ
        await fetchProducts();
      } else {
        alert('ไม่สามารถลบข้อมูลได้');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.push('/')}>
            <Text style={styles.backBtnText}>← Back to Store</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manage & Delete</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.infoContainer}>
                  <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>฿{item.price.toLocaleString()}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                activeOpacity={0.7} 
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerWrapper: { width: '100%', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  header: { width: '100%', maxWidth: 700, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 16 },
  backBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  backBtnText: { color: '#0F172A', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, width: '100%', maxWidth: 700, alignSelf: 'center' },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginBottom: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  productImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  infoContainer: { marginLeft: 12, flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  productPrice: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  
  deleteBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
});