import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
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
  priceTier?: string;
}

const API_BASE_URL = 'http://119.59.102.161:3085/api';

const clusterPricesLocally = (data: any[]) => {
  if (!data || data.length === 0) return [];
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

  return data.map((item, index) => {
    const myCentroid = centroids[assignments[index]];
    const tierIndex = sortedCentroids.indexOf(myCentroid);
    return { ...item, priceTier: labels[tierIndex] || "Mid" };
  });
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  const updateCartCount = () => {
    try {
      if (typeof window !== 'undefined') {
        const existingCart = localStorage.getItem('user_cart');
        if (existingCart) {
          const cart = JSON.parse(existingCart);
          const totalCount = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          setCartCount(totalCount);
        } else {
          setCartCount(0);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item: any) => ({
          id: item.id || item._id || Date.now() + Math.random(),
          name: item.name || item.title || 'Product',
          price: Number(item.price ?? 0),
          image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400',
        }));
        const clustered = clusterPricesLocally(formatted);
        setProducts(clustered);
      } else {
        loadDefaults();
      }
    } catch (err) {
      console.log('Fetch error:', err);
      loadDefaults();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const role = localStorage.getItem('user_role');
        if (!role) {
          router.replace('/login');
          return;
        }
        if (role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.log(e);
    }

    fetchProducts();
    updateCartCount();
  }, []);

  const loadDefaults = () => {
    const defaults: Product[] = [
      { id: 1, name: 'Unisex T-Shirt White', price: 390, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400' },
      { id: 2, name: 'Unisex T-Shirt Black', price: 390, image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=400' },
      { id: 3, name: 'Unisex T-Shirt Yellow', price: 390, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400' },
    ];
    const clustered = clusterPricesLocally(defaults);
    setProducts(clustered);
  };

 const handleAddToCart = (product: Product) => {
    try {
      if (typeof window !== 'undefined') {
        const existingCart = localStorage.getItem('user_cart');
        let cart = existingCart ? JSON.parse(existingCart) : [];

        // เปลี่ยนมาเช็คจากชื่อสินค้า (name) แทน id เพื่อป้องกันปัญหาตอน id ในฐานข้อมูลเปลี่ยน
        const index = cart.findIndex((item: any) => item.name?.trim().toLowerCase() === product.name?.trim().toLowerCase());
        
        if (index > -1) {
          // อัปเดตข้อมูลล่าสุด ทั้ง id ใหม่, ชื่อ, ราคา และรูปภาพใหม่ ทับลงไปทันที
          cart[index] = {
            ...cart[index],
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: (cart[index].quantity || 1) + 1
          };
        } else {
          cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('user_cart', JSON.stringify(cart));
        updateCartCount();

        setToastMessage(`เพิ่ม "${product.name}" ลงในตะกร้าแล้ว 🛒`);
        setTimeout(() => {
          setToastMessage('');
        }, 2500);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleOpen = (item?: Product) => {
    if (!isAdmin) return;
    setEditing(item || null);
    setName(item ? item.name : '');
    setPrice(item && item.price !== undefined ? item.price.toString() : '');
    setImage(item ? item.image || '' : '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    if (!name.trim() || !price.trim()) {
      alert('กรุณากรอกชื่อและราคาสินค้า');
      return;
    }
    
    const pNum = parseFloat(price) || 0;
    const imgUrl = image.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400';

    try {
      if (editing) {
        try {
          await fetch(`${API_BASE_URL}/products/${editing.id}`, {
            method: 'DELETE',
          });
        } catch (e) {
          console.log('Delete old item notice:', e);
        }
      }

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          price: pNum,
          stock: 10,
          category: 'General',
          location: '3 stores',
          image: imgUrl
        }),
      });
      
      const result = await response.json();
      if (!response.ok && result.success === false) {
        alert('ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้');
        return;
      }

      setIsModalOpen(false);
      setName('');
      setPrice('');
      setImage('');
      setEditing(null);

      setToastMessage('Update Success!');
      setTimeout(() => setToastMessage(''), 2500);

      await fetchProducts();
    } catch (err) {
      console.error('Save error: ', err);
      setIsModalOpen(false);
      await fetchProducts();
    }
  };

  const getTierBadgeStyle = (tier?: string) => {
    switch (tier) {
      case 'Low':
        return { backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' };
      case 'Mid':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF', borderColor: '#BFDBFE' };
      case 'High':
        return { backgroundColor: '#FFEDD5', color: '#C2410C', borderColor: '#FED7AA' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', borderColor: '#E2E8F0' };
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle} numberOfLines={1}>IEM boii</Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {isAdmin ? 'Admin Mode (Full Control)' : 'User Mode (Interactive Shop)'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              localStorage.removeItem('user_role');
            }
            router.replace('/login');
          }}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast Notification */}
      {toastMessage !== '' && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <FlatList
          key="store-responsive-grid"
          data={products}
          numColumns={2}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const badgeStyle = getTierBadgeStyle(item.priceTier);
            return (
              <View style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                </View>
                <View style={styles.cardContent}>
                  <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice} numberOfLines={1}>
                      ฿{item.price ? Number(item.price).toLocaleString() : '0'}
                    </Text>
                    {item.priceTier && (
                      <View style={[styles.tierBadge, { backgroundColor: badgeStyle.backgroundColor, borderColor: badgeStyle.borderColor }]}>
                        <Text style={[styles.tierText, { color: badgeStyle.color }]}>{item.priceTier}</Text>
                      </View>
                    )}
                  </View>
                  
                  {isAdmin ? (
                    <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => handleOpen(item)}>
                      <Text style={styles.editText}>Edit Details</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.addToCartBtn} activeOpacity={0.7} onPress={() => handleAddToCart(item)}>
                      <Text style={styles.addToCartText}>🛒 Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => router.push('/search')}>
          <Text style={styles.navItemText} numberOfLines={1}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => router.push('/cart')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={styles.navItemText} numberOfLines={1}>🛒 Cart</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isAdmin && (
          <>
            <TouchableOpacity style={styles.navItemPrimary} activeOpacity={0.8} onPress={() => handleOpen()}>
              <Text style={styles.navItemPrimaryText} numberOfLines={1}>+ Add</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItemDanger} activeOpacity={0.8} onPress={() => router.push('/delete')}>
              <Text style={styles.navItemDangerText} numberOfLines={1}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modal */}
      {isAdmin && (
        <Modal visible={isModalOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Product' : 'New Product'}</Text>
              
              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput style={styles.input} placeholder="e.g. White Sneakers" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
              
              <Text style={styles.inputLabel}>Price (THB)</Text>
              <TextInput style={styles.input} placeholder="e.g. 1500" placeholderTextColor="#94A3B8" keyboardType="numeric" value={price} onChangeText={setPrice} />
              
              <Text style={styles.inputLabel}>Image URL (Optional)</Text>
              <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#94A3B8" value={image} onChangeText={setImage} />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerWrapper: { width: '100%', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  header: { width: '100%', maxWidth: 800, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  brandTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  brandSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  logoutBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  logoutBtnText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 12, paddingBottom: 90, width: '100%', maxWidth: 800, alignSelf: 'center' },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  card: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  imageContainer: { width: '100%', height: 140, backgroundColor: '#F1F5F9' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardContent: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productPrice: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  
  tierBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  tierText: { fontSize: 10, fontWeight: '700' },

  editBtn: { backgroundColor: '#F8FAFC', paddingVertical: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  editText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  
  addToCartBtn: { backgroundColor: '#0F172A', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  addToCartText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  toastContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 },
  navItem: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 2, borderWidth: 1, borderColor: '#CBD5E1' },
  navItemText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },

  cartBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  
  navItemPrimary: { flex: 1, backgroundColor: '#0F172A', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
  navItemPrimaryText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  
  navItemDanger: { flex: 1, backgroundColor: '#FEF2F2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 2, borderWidth: 1, borderColor: '#FCA5A5' },
  navItemDangerText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  saveBtn: { backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});