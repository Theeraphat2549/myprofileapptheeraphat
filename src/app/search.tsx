import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
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

export default function SearchScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลสินค้าทั้งหมดจากฐานข้อมูล (Inventory)
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
    fetchProducts();
  }, []);

  // กรองสินค้าตามคำค้นหา
  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.push('/')}>
            <Text style={styles.backBtnText}>← Back to Store</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Search Products</Text>
        </View>
      </View>

      {/* Search Bar Input */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Type product name to search..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.infoContainer}>
                <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>฿{item.price.toLocaleString()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ไม่พบสินค้าที่คุณค้นหา</Text>
          }
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
  
  searchBarContainer: { width: '100%', maxWidth: 700, alignSelf: 'center', paddingHorizontal: 16, marginTop: 16 },
  searchInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A', shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, width: '100%', maxWidth: 700, alignSelf: 'center' },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginBottom: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  productImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  infoContainer: { marginLeft: 12, flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  productPrice: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },
});