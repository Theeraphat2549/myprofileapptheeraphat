import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function PaymentScreen() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [refNo, setRefNo] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const existingCart = localStorage.getItem('user_cart');
        if (existingCart) {
          const cart = JSON.parse(existingCart);
          setCartItems(cart);
          
          const total = cart.reduce((sum: number, item: any) => {
            const price = Number(item.price || 0);
            const qty = Number(item.quantity || 1);
            return sum + price * qty;
          }, 0);
          
          setTotalPrice(total);
          generateQRData(total);
        } else {
          setCartItems([]);
          setTotalPrice(0);
          generateQRData(0);
        }
      }
    } catch (e) {
      console.log('Error loading cart for payment:', e);
    }
  }, []);

  const generateQRData = (amount: number) => {
    const randomRef = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    setRefNo(randomRef);
    const payload = `PROMPTPAY|0812345678|REF:${randomRef}|AMT:${amount}`;
    setQrPayload(payload);
  };

  // 📌 กดชำระเงินสำเร็จ แสดง Toast และตั้งเวลาให้มันหายไปเองหลังผ่านไป 2 วินาที (ไม่ต้องค้างตลอดไป)
  const handleConfirmPayment = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_cart');
      }
    } catch (e) {
      console.log('Error clearing cart:', e);
    }

    setIsPaid(true);
    setToastMessage('ชำระเงินสำเร็จเรียบร้อยแล้ว!');

    // 📌 ตั้งเวลา 2 วินาที (2000 มิลลิวินาที) ให้กล่องข้อความสีเขียวหายไปเองอัตโนมัติ
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 📌 Toast Notification จะแสดงแวบเดียวแล้วหายไปเอง */}
      {toastMessage !== '' && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <View style={styles.qrCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.headerTitle}>THAI QR PAYMENT</Text>
          <View style={styles.promptPayBadge}>
            <Text style={styles.promptPayText}>PromptPay</Text>
          </View>
        </View>

        <View style={styles.qrWrapper}>
          {isPaid ? (
            <View style={styles.successBox}>
              <Image 
                source={require('../../assets/images/reveal.gif')} 
                style={styles.successImage} 
              />
              <Text style={styles.successText}>ชำระเงินสำเร็จ!</Text>
            </View>
          ) : (
            <QRCode
              value={qrPayload || 'PROMPTPAY|0812345678'}
              size={200}
              color="#000"
              backgroundColor="#FFF"
            />
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.instructionText}>
            {isPaid ? 'ทำรายการเรียบร้อยแล้ว' : 'สแกน QR เพื่อโอนเข้าบัญชี'}
          </Text>
          <Text style={styles.ownerName}>ชื่อ: นาย 1ก้องเกียดบอส ระเบาะเจีย</Text>
          <Text style={styles.accountNo}>บัญชี: xxx-x-x9999-x</Text>

          <View style={styles.divider} />

          <View style={styles.cartSummaryBox}>
            <Text style={styles.cartSummaryTitle}>รายการสินค้า ({cartItems.length} รายการ):</Text>
            {cartItems.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  • {item.name} x{item.quantity || 1}
                </Text>
                <Text style={styles.itemPrice}>
                  ฿{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabelTotal}>ยอดชำระเงินทั้งสิ้น:</Text>
            <Text style={styles.metaValueTotal}>฿{totalPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>เลขที่อ้างอิง (Ref):</Text>
            <Text style={styles.metaValueRef}>{refNo}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>K+ | Accepts all banks | รับเงินได้จากทุกธนาคาร</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {!isPaid && (
          <TouchableOpacity 
            style={[styles.confirmBtn, totalPrice === 0 && styles.disabledBtn]} 
            onPress={handleConfirmPayment}
            disabled={totalPrice === 0}
          >
            <Text style={styles.confirmBtnText}>
              {totalPrice === 0 ? 'ตะกร้าสินค้าว่างเปล่า' : 'ยืนยันชำระเงินสำเร็จ'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>กลับหน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 16 },
  
  toastContainer: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  qrCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, marginBottom: 20 },
  cardHeader: { backgroundColor: '#0A3B75', paddingVertical: 16, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  promptPayBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  promptPayText: { color: '#0A3B75', fontSize: 11, fontWeight: '700' },
  qrWrapper: { padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', minHeight: 220 },
  successBox: { alignItems: 'center', justifyContent: 'center' },
  
  successImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: 8,
  },

  successText: { fontSize: 18, fontWeight: '800', color: '#059669' },
  infoSection: { paddingHorizontal: 20, paddingBottom: 20 },
  instructionText: { fontSize: 14, color: '#059669', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  ownerName: { fontSize: 15, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 2 },
  accountNo: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  divider: { width: '100%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  cartSummaryBox: { width: '100%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  cartSummaryTitle: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: 12, color: '#475569', flex: 1, marginRight: 8 },
  itemPrice: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  metaRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metaLabel: { fontSize: 12, color: '#64748B' },
  metaLabelTotal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  metaValueTotal: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  metaValueRef: { fontSize: 11, fontWeight: '600', color: '#334155', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 10, alignItems: 'center', backgroundColor: '#F8FAFC' },
  footerText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  buttonContainer: { width: '100%', maxWidth: 360, gap: 10 },
  confirmBtn: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  confirmBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  backBtn: { backgroundColor: '#334155', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  backBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});