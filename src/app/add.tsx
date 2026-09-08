import { Link, router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [stock, setStock] = useState('');

  const handleSaveProduct = () => {
    if (!name.trim()) {
      alert('กรุณากรอกชื่อสินค้า');
      return;
    }

    const priceNum = parseFloat(price) || 0;
    const stockNum = parseInt(stock, 10) || 5;
    const imgUrl = image.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400';

    // ดึงข้อมูลสินค้าเดิมจาก localStorage มาเพิ่มตัวใหม่
    const saved = localStorage.getItem('minimal_store_products');
    let products = saved ? JSON.parse(saved) : [];

    const newProduct = {
      id: Date.now(),
      name,
      price: priceNum,
      stock: stockNum,
      category: 'T-shirts',
      image: imgUrl,
    };

    products.unshift(newProduct);
    localStorage.setItem('minimal_store_products', JSON.stringify(products));

    alert('เพิ่มสินค้าสำเร็จ!');
    router.replace('/'); // กลับไปหน้า Home
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Product</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Unisex T-Shirt Blue"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Price (THB)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 590"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>Stock Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
          />

          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://image-url.com/photo.jpg"
            placeholderTextColor="#9CA3AF"
            value={image}
            onChangeText={setImage}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
            <Text style={styles.saveBtnText}>Save Product</Text>
          </TouchableOpacity>

          <Link href="/" asChild>
            <TouchableOpacity style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </Link>
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
              <Text style={styles.navTextActive}>Add</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/dashboard" asChild>
            <TouchableOpacity style={styles.navItem}>
              <Text style={styles.navIcon}>📊</Text>
              <Text style={styles.navText}>Dashboard</Text>
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
  form: { padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1F2937' },
  saveBtn: { backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 16 },
  navText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  navTextActive: { fontSize: 10, color: '#7C3AED', fontWeight: '700', marginTop: 2 },
});