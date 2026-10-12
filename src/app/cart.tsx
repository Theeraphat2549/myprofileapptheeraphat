import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  priceTier?: string;
}

const API_BASE_URL = 'http://119.59.102.161:3085/api';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // States สำหรับ Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD', 'QR', 'Card'

  // States สำหรับข้อมูลบัตรเครดิต (จำลอง)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const role = localStorage.getItem('user_role');
        if (role === 'admin') {
          setIsAdmin(true);
        }

        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  const saveCartToStorage = (items: CartItem[]) => {
    setCartItems(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_cart', JSON.stringify(items));
    }
  };

  const increaseQty = (id: number) => {
    const updated = cartItems.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    saveCartToStorage(updated);
  };

  const decreaseQty = (id: number) => {
    const updated = cartItems
      .map(item => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter(item => item.quantity > 0);
    saveCartToStorage(updated);
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) {
      setToastMessage('ตะกร้าสินค้าของคุณว่างเปล่า !');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // ฟังก์ชันยิง API ไปยัง Backend Node.js (แบบเช็ค Error จาก Database จริงๆ)
  const handleConfirmOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setToastMessage('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน !');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    if (paymentMethod === 'Card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setToastMessage('กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน !');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          paymentMethod: paymentMethod,
          items: cartItems,
          totalPrice: totalPrice,
          createdAt: new Date().toISOString(),
        }),
      });

      const data = await response.json(); // อ่านผลลัพธ์จาก Backend

      if (response.ok && data.success) {
        // ถ้ายิง API สำเร็จ และบันทึกลง Database แล้วจริงๆ
        setIsCheckoutModalOpen(false);
        const total = totalPrice.toLocaleString();
        
        setToastMessage(`สั่งซื้อสำเร็จ! จัดส่งถึงคุณ ${fullName} ยอดรวม ฿${total} ✅`);
        saveCartToStorage([]); // ล้างตะกร้า

        // รีเซ็ตฟอร์ม
        setFullName('');
        setPhone('');
        setAddress('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
      } else {
        // ถ้า Backend มี Error (เช่น SQL ผิด, ต่อ Database ไม่ได้)
        setToastMessage(`เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${data.message || 'บันทึกไม่สำเร็จ'} ❌`);
      }

      setTimeout(() => {
        setToastMessage('');
      }, 3500);

    } catch (err) {
      console.log('API call error:', err);
      // กรณี Network Error หรือเซิร์ฟเวอร์ดับ
      setToastMessage('เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาลองใหม่ ❌');
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.brandTitle} numberOfLines={1}>SHOPPING CART</Text>
            <Text style={styles.subHeaderRole} numberOfLines={1}>
              {isAdmin ? 'Admin View (ระบบดูข้อมูลระบบ)' : 'User View'}
            </Text>
          </View>
          <View style={{ width: 50 }} />
        </View>
      </View>

      {/* Toast Notification */}
      {toastMessage !== '' && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ตะกร้าสินค้าของคุณว่างเปล่า</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.replace('/')}>
            <Text style={styles.shopNowText}>กลับไปหน้าหลักร้านค้า</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.cartCard}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  ฿{item.price.toLocaleString()} {item.priceTier ? `(${item.priceTier})` : ''}
                </Text>
                
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemTotal}>
                ฿{(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}

      {/* Footer Summary */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ราคารวมทั้งหมด:</Text>
            <Text style={styles.summaryValue}>฿{totalPrice.toLocaleString()}</Text>
          </View>

          {isAdmin ? (
            <View style={styles.adminInfoBox}>
              <Text style={styles.adminInfoText}>Admin Mode: สำหรับตรวจสอบข้อมูลระบบ</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.8} onPress={handleOpenCheckout}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout (ยืนยันคำสั่งซื้อ)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Checkout Modal */}
      <Modal visible={isCheckoutModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ข้อมูลการจัดส่งและการชำระเงิน</Text>

            <Text style={styles.inputLabel}>ชื่อ-นามสกุล ผู้รับ</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกชื่อและนามสกุล"
              placeholderTextColor="#94A3B8"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.inputLabel}>เบอร์โทรศัพท์</Text>
            <TextInput
              style={styles.input}
              placeholder="08xxxxxxxx"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.inputLabel}>ที่อยู่จัดส่ง</Text>
            <TextInput
              style={[styles.input, { height: 45, textAlignVertical: 'top' }]}
              placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด"
              placeholderTextColor="#94A3B8"
              multiline
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.inputLabel}>ช่องทางการชำระเงิน</Text>
            <View style={styles.paymentContainer}>
              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('COD')}
                activeOpacity={0.8}
              >
                <Text style={[styles.paymentText, paymentMethod === 'COD' && styles.paymentTextActive]}>ปลายทาง</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === 'QR' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('QR')}
                activeOpacity={0.8}
              >
                <Text style={[styles.paymentText, paymentMethod === 'QR' && styles.paymentTextActive]}>QR PromptPay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === 'Card' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('Card')}
                activeOpacity={0.8}
              >
                <Text style={[styles.paymentText, paymentMethod === 'Card' && styles.paymentTextActive]}>บัตรเครดิต</Text>
              </TouchableOpacity>
            </View>

            {/* ส่วนแสดงผล QR PromptPay เสมือนจริง */}
            {paymentMethod === 'QR' && (
              <View style={styles.qrBox}>
                <View style={styles.promptPayHeader}>
                  <Text style={styles.promptPayLogo}>PROMPTPAY</Text>
                  <Text style={styles.promptPaySub}>THAILAND QR PAYMENT</Text>
                </View>
                <View style={styles.qrVisual}>
                  <Text style={styles.qrMatrix}>█▀█ █ █▀█</Text>
                  <Text style={styles.qrMatrix}>▀ █▄█ ▀ █</Text>
                  <Text style={styles.qrMatrix}>█▀█ ▀ █▀█</Text>
                </View>
                <Text style={styles.qrMerchant}>ร้านค้า: IEM BOII STORE</Text>
                <Text style={styles.qrAmount}>฿{totalPrice.toLocaleString()}</Text>
              </View>
            )}

            {/* ส่วนกรอกข้อมูลบัตรเครดิต */}
            {paymentMethod === 'Card' && (
              <View style={styles.cardBox}>
                <Text style={styles.cardBoxTitle}>ข้อมูลบัตรเครดิต/เดบิต</Text>
                <TextInput
                  style={styles.input}
                  placeholder="หมายเลขบัตร (4242 •••• •••• 4242)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
                <View style={styles.cardRow}>
                  <View style={styles.cardFieldHalf}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      maxLength={5}
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                    />
                  </View>
                  <View style={styles.cardFieldHalf}>
                    <TextInput
                      style={styles.input}
                      placeholder="CVV"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      maxLength={4}
                      value={cardCvv}
                      onChangeText={setCardCvv}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>ยอดชำระสุทธิ:</Text>
              <Text style={styles.modalTotalValue}>฿{totalPrice.toLocaleString()}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsCheckoutModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmOrder} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>ยืนยันการสั่งซื้อ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerWrapper: { width: '100%', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  header: { width: '100%', maxWidth: 800, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  titleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  brandTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  subHeaderRole: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 3, textAlign: 'center' },
  backBtn: { paddingVertical: 4, paddingRight: 4 },
  backBtnText: { color: '#475569', fontSize: 13, fontWeight: '700' },

  toastContainer: {
    position: 'absolute',
    top: 75,
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

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#64748B', fontWeight: '600', marginBottom: 16 },
  shopNowBtn: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  shopNowText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  listContainer: { padding: 16, maxWidth: 800, width: '100%', alignSelf: 'center', paddingBottom: 120 },
  cartCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  itemPrice: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 26, height: 26, backgroundColor: '#F1F5F9', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  qtyBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#0F172A', minWidth: 20, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 },
  summaryRow: { width: '100%', maxWidth: 800, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  checkoutBtn: { width: '100%', maxWidth: 800, backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  checkoutBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  adminInfoBox: { width: '100%', maxWidth: 800, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  adminInfoText: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Styles สำหรับ Modal Checkout
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 6, textAlign: 'center' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 2, marginTop: 5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#0F172A', marginTop: 2, width: '100%' },
  
  paymentContainer: { flexDirection: 'row', gap: 6, marginTop: 4 },
  paymentOption: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 7, paddingHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  paymentOptionActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  paymentText: { fontSize: 10, fontWeight: '700', color: '#475569', textAlign: 'center' },
  paymentTextActive: { color: '#FFFFFF' },

  // PromptPay QR Styles
  qrBox: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 10, padding: 8, alignItems: 'center', marginTop: 6 },
  promptPayHeader: { alignItems: 'center', marginBottom: 2 },
  promptPayLogo: { fontSize: 11, fontWeight: '900', color: '#1D4ED8', letterSpacing: 1 },
  promptPaySub: { fontSize: 7, fontWeight: '700', color: '#64748B' },
  qrVisual: { backgroundColor: '#FFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginVertical: 3 },
  qrMatrix: { fontSize: 12, fontWeight: '900', color: '#0F172A', letterSpacing: 2 },
  qrMerchant: { fontSize: 9, fontWeight: '700', color: '#334155' },
  qrAmount: { fontSize: 12, fontWeight: '800', color: '#2563EB', marginTop: 1 },

  // Card Box Styles
  cardBox: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, padding: 8, marginTop: 6 },
  cardBoxTitle: { fontSize: 11, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  cardFieldHalf: { flex: 1, marginHorizontal: 2 },

  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6 },
  modalTotalLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  modalTotalValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  saveBtn: { backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});