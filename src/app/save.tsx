import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SaveModalProps {
  visible: boolean;
  isEditing: boolean; // ตัวเช็คว่าเป็นโหมด Edit หรือ Add
  nameInput: string;
  setNameInput: (val: string) => void;
  priceInput: string;
  setPriceInput: (val: string) => void;
  imageInput: string;
  setImageInput: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function SaveModal({
  visible,
  isEditing,
  nameInput,
  setNameInput,
  priceInput,
  setPriceInput,
  imageInput,
  setImageInput,
  onClose,
  onSave,
}: SaveModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* เปลี่ยนหัวข้อและปุ่มอัตโนมัติ ตามโหมด Add หรือ Edit */}
          <Text style={styles.modalTitle}>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Product Name"
            placeholderTextColor="#9CA3AF"
            value={nameInput}
            onChangeText={setNameInput}
          />
          <TextInput
            style={styles.input}
            placeholder="Price (THB)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={priceInput}
            onChangeText={setPriceInput}
          />
          <TextInput
            style={styles.input}
            placeholder="Image URL"
            placeholderTextColor="#9CA3AF"
            value={imageInput}
            onChangeText={setImageInput}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Save Changes' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A', marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, gap: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  cancelBtnText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  saveBtn: { backgroundColor: '#0F172A', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});