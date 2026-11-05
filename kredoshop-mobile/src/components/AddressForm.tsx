import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from './ui';
import { colors, label } from '@/lib/theme';
import { useToast } from '@/lib/toast';

type Province = { name: string; wards?: { name: string }[] };
let cache: Province[] | null = null;

async function loadProvinces(): Promise<Province[]> {
  if (cache) return cache;
  const res = await fetch('https://provinces.open-api.vn/api/v2/?depth=2');
  cache = await res.json();
  return cache!;
}

function Picker({ title, value, options, onPick, disabled }: { title: string; value: string; options: string[]; onPick: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const shown = useMemo(() => options.filter((o) => o.toLowerCase().includes(q.toLowerCase())), [options, q]);
  return (
    <View style={{ marginBottom: 18, opacity: disabled ? 0.4 : 1 }}>
      <Text style={[label, { color: colors.faint, marginBottom: 6 }]}>{title}</Text>
      <Pressable disabled={disabled} onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 12 }}>
        <Text style={{ flex: 1, fontWeight: '700', fontSize: 15, color: value ? colors.primary : 'rgba(17,17,17,0.25)' }}>{value || `Chọn ${title.toLowerCase()}`}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.faint} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 56 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginBottom: 8 }}>
            <TextInput value={q} onChangeText={setQ} placeholder={`Tìm ${title.toLowerCase()}…`} autoFocus style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 10, fontWeight: '700' }} />
            <Pressable onPress={() => { setOpen(false); setQ(''); }}>
              <Ionicons name="close" size={26} />
            </Pressable>
          </View>
          <FlatList
            data={shown}
            keyExtractor={(i) => i}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { onPick(item); setOpen(false); setQ(''); }}
                style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row' }}
              >
                <Text style={{ flex: 1, fontWeight: item === value ? '900' : '600' }}>{item}</Text>
                {item === value && <Ionicons name="checkmark" size={18} color={colors.accent} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export type AddressValue = { province: string; delivery_address: string; delivery_note: string };

export default function AddressForm({
  initial,
  submitLabel = 'Lưu địa chỉ',
  onSubmit,
  onCancel,
}: {
  initial?: Partial<AddressValue>;
  submitLabel?: string;
  onSubmit: (v: AddressValue) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [province, setProvince] = useState(initial?.province || '');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState(initial?.delivery_address || '');
  const [note, setNote] = useState(initial?.delivery_note || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadProvinces().then(setProvinces).catch(() => toast('Không tải được danh sách tỉnh/thành', 'error'));
  }, [toast]);

  const wards = useMemo(() => provinces.find((p) => p.name === province)?.wards?.map((w) => w.name) ?? [], [provinces, province]);

  const submit = async () => {
    if (!street.trim()) return toast('Vui lòng nhập địa chỉ chi tiết', 'info');
    if (!province) return toast('Vui lòng chọn Tỉnh/Thành phố', 'info');
    setBusy(true);
    try {
      await onSubmit({ province, delivery_address: ward ? `${street.trim()}, ${ward}` : street.trim(), delivery_note: note.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: colors.border }}>
      <Picker title="Tỉnh/Thành phố" value={province} options={provinces.map((p) => p.name)} onPick={(v) => { setProvince(v); setWard(''); }} />
      <Picker title="Phường/Xã" value={ward} options={wards} onPick={setWard} disabled={!province || wards.length === 0} />
      <Field label="Địa chỉ chi tiết" value={street} onChangeText={setStreet} placeholder="Số nhà, tên đường…" autoCapitalize="sentences" />
      <Field label="Ghi chú giao hàng" value={note} onChangeText={setNote} autoCapitalize="sentences" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {onCancel && <Button title="Hủy" variant="outline" style={{ flex: 1 }} onPress={onCancel} />}
        <Button title={submitLabel} loading={busy} style={{ flex: 1 }} onPress={submit} />
      </View>
    </View>
  );
}
