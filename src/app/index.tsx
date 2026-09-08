import { Link, Stack } from 'expo-router';
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

import LoginScreen from './login';
import SaveModal from './save';

interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  image?: string;
}

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [currentUsername, setCurrentUsername] = useState('');

  const [registeredUsers, setRegisteredUsers] = useState<{ [key: string]: string }>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('minimal_store_users');
      if (saved) return JSON.parse(saved);
    }
    return { admin: '1234' };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('minimal_store_users', JSON.stringify(registeredUsers));
    }
  }, [registeredUsers]);

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedProducts = localStorage.getItem('minimal_store_products');
      if (savedProducts) {
        try { return JSON.parse(savedProducts); } catch (e) { console.error(e); }
      }
    }
    return [
      { id: 1, name: 'Minimal White Sneakers', price: 2590, stock: 12, category: 'Footwear', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=400' },
      { id: 2, name: 'Essential Cotton Tee', price: 590, stock: 10, category: 'Apparel', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400' },
      { id: 3, name: 'Canvas Tote Bag', price: 890, stock: 8, category: 'Accessories', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400' },
      { id: 4, name: 'Classic Leather Watch', price: 3400, stock: 5, category: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400' },
    ];
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('minimal_store_products', JSON.stringify(products));
    }
  }, [products]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  const handleRegister = (u: string, p: string) => {
    if (registeredUsers[u]) return false;
    setRegisteredUsers(prev => ({ ...prev, [u]: p }));
    return true;
  };

  const handleResetPassword = (u: string, p: string) => {
    setRegisteredUsers(prev => ({ ...prev, [u]: p }));
    return true;
  };

  const filteredProducts = products.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!isLoggedIn) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoginScreen 
          registeredUsers={registeredUsers}
          onRegister={handleRegister}
          onResetPassword={handleResetPassword}
          onLoginSuccess={(role, name) => { setUserRole(role); setCurrentUsername(name); setIsLoggedIn(true); }} 
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.brandTitle}>MINIMAL STORE</Text>
        <View style={styles.navRight}>
          <Link href="/" style={styles.navLinkActive}>Home</Link>
          {userRole === 'admin' && (
            <>
              <Link href="/add" style={styles.navLink}>Add Product</Link>
              <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
            </>
          )}
          <Text style={styles.userRoleText}>{userRole === 'admin' ? 'Admin: ' : 'User: '}{currentUsername}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setIsLoggedIn(false)}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Product Catalog</Text>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search products..." 
            placeholderTextColor="#9CA3AF" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id.toString()}
            numColumns={4}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => {
              const stockCount = item.stock ?? 5;
              const isLowStock = stockCount <= 3;
              return (
                <View style={styles.card}>
                  <Image source={{ uri: item.image || 'https://via.placeholder.com/300' }} style={styles.cardImage} />
                  <View style={styles.cardBody}>
                    <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.prodCategory}>{item.category || 'General'}</Text>
                    
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>฿{item.price.toLocaleString()}</Text>
                      <View style={[styles.badge, isLowStock ? styles.badgeLow : styles.badgeActive]}>
                        <Text style={[styles.badgeText, isLowStock && { color: '#991B1B' }]}>
                          {isLowStock ? 'Low Stock' : `Stock: ${stockCount}`}
                        </Text>
                      </View>
                    </View>

                    {userRole === 'admin' && (
                      <View style={styles.adminActions}>
                        <TouchableOpacity 
                          style={styles.editBtn} 
                          onPress={() => { 
                            setEditingProduct(item); 
                            setNameInput(item.name); 
                            setPriceInput(item.price.toString()); 
                            setImageInput(item.image || ''); 
                            setIsEditModalOpen(true); 
                          }}
                        >
                          <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.delBtn} 
                          onPress={() => setProducts(prev => prev.filter(p => p.id !== item.id))}
                        >
                          <Text style={styles.delText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Edit Modal */}
      <SaveModal
        visible={isEditModalOpen}
        nameInput={nameInput} setNameInput={setNameInput}
        priceInput={priceInput} setPriceInput={setPriceInput}
        imageInput={imageInput} setImageInput={setImageInput}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {
          if (!nameInput.trim()) return alert('กรุณากรอกชื่อสินค้า');
          const cleanPrice = priceInput ? parseFloat(priceInput.toString().replace(/[^0-9.]/g, '')) : 0;
          const priceNum = isNaN(cleanPrice) ? 0 : cleanPrice;
          const imgUrl = imageInput.trim() || 'https://via.placeholder.com/300';

          if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, name: nameInput, price: priceNum, image: imgUrl } : p));
          }
          setIsEditModalOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F8FAFC', paddingBottom: 60 },
  navbar: { height: 70, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  brandTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 1.5, color: '#0F172A' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  navLink: { fontSize: 14, fontWeight: '500', color: '#64748B', textDecorationLine: 'none' },
  navLinkActive: { fontSize: 14, fontWeight: '700', color: '#0F172A', textDecorationLine: 'none' },
  userRoleText: { fontSize: 13, fontWeight: '600', color: '#334155', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  contentWrapper: { paddingHorizontal: 40, paddingTop: 32 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  searchInput: { width: 300, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A', outlineStyle: 'none' } as any,
  gridContainer: { paddingBottom: 40 },
  columnWrapper: { gap: 24, marginBottom: 24 },
  card: { flex: 1, maxWidth: '23%', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  cardImage: { width: '100%', height: 200, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  cardBody: { padding: 16 },
  prodName: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  prodCategory: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  priceText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: '#F1F5F9' },
  badgeActive: { backgroundColor: '#F1F5F9' },
  badgeLow: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  adminActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  editBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  editText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  delBtn: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  delText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  center: { padding: 50, alignItems: 'center' },
});