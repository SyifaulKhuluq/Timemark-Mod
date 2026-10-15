import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';

const COLORS = {
  blue: '#0877E8', ink: '#202124', muted: '#73777D',
  background: '#F4F5F7', card: '#FFFFFF', yellow: '#F4C900',
};

export default function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('Foto');
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const result = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(result.status === 'granted');
    })();
  }, []);

  async function getLocation() {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        const asked = await Location.requestForegroundPermissionsAsync();
        if (asked.status !== 'granted') return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      let address = '';
      try {
        const rows = await Location.reverseGeocodeAsync(pos.coords);
        if (rows?.[0]) {
          const a = rows[0];
          address = [a.street, a.district, a.city, a.region, a.postalCode]
            .filter(Boolean).join(', ');
        }
      } catch (_) {}
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address,
      };
    } catch (_) {
      return null;
    }
  }

  async function takePhoto() {
    if (!cameraRef.current || !cameraReady || busy) return;
    setBusy(true);
    try {
      const loc = await getLocation();
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setPhotoUri(shot.uri);
      setLocationInfo(loc);
      Alert.alert(
        'Foto diambil',
        'Foto tersimpan sementara di aplikasi. Watermark visual dan penyimpanan permanen belum diimplementasikan pada versi awal ini.'
      );
    } catch (e) {
      Alert.alert('Kamera', 'Foto gagal diambil. Periksa izin kamera dan lokasi.');
    } finally {
      setBusy(false);
    }
  }

  async function savePhotoToAppStorage() {
    if (!photoUri) return;
    try {
      const dir = FileSystem.documentDirectory + 'TimemarkCompanion/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const dest = dir + `photo-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: photoUri, to: dest });
      Alert.alert('Tersimpan', 'Salinan foto tersimpan di penyimpanan aplikasi.');
    } catch (e) {
      Alert.alert('Gagal menyimpan', 'Tidak dapat menyimpan salinan foto.');
    }
  }

  if (!cameraPermission) {
    return <SafeAreaView style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Memeriksa izin kamera…</Text></SafeAreaView>;
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Timemark iOS Companion</Text>
        <Text style={styles.muted}>Aplikasi memerlukan izin kamera untuk mengambil foto.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestCameraPermission}>
          <Text style={styles.primaryText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.menu}>☰</Text>
        <Text style={styles.brand}>Timemark Companion</Text>
        <TouchableOpacity onPress={() => Alert.alert('Verifikasi foto', 'Integrasi verifikasi resmi belum dikonfigurasi.')}>
          <Text style={styles.verify}>✓ Verifikasi</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraArea}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
        ) : (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />
        )}
        <View style={styles.watermark}>
          <Text style={styles.watermarkTime}>{new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', hour12:false})}</Text>
          <Text style={styles.watermarkDate}>{new Date().toLocaleDateString('id-ID', {weekday:'long', day:'2-digit', month:'long', year:'numeric'})}</Text>
          {locationInfo ? (
            <>
              <Text style={styles.watermarkLine}>{locationInfo.address || 'Alamat tidak tersedia'}</Text>
              <Text style={styles.watermarkLine}>{locationInfo.latitude.toFixed(6)}, {locationInfo.longitude.toFixed(6)}</Text>
            </>
          ) : <Text style={styles.watermarkLine}>Lokasi belum diambil</Text>}
          <Text style={styles.watermarkBrand}>TIMEMARK COMPANION · DRAF</Text>
        </View>
        {photoUri ? (
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={savePhotoToAppStorage}>
              <Text style={styles.primaryText}>Simpan salinan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => {setPhotoUri(null); setLocationInfo(null);}}>
              <Text style={styles.secondaryText}>Kembali ke kamera</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {!photoUri && (
        <View style={styles.capturePanel}>
          <Text style={styles.hint}>Pastikan tanggal dan lokasi sesuai sebelum mengambil foto.</Text>
          <TouchableOpacity
            style={[styles.shutter, (!cameraReady || busy) && styles.disabled]}
            onPress={takePhoto}
            disabled={!cameraReady || busy}
          >
            {busy ? <ActivityIndicator color="#111" /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>
          <Text style={styles.captureLabel}>{busy ? 'Memproses…' : 'Foto'}</Text>
        </View>
      )}

      <View style={styles.tabs}>
        {['Laporan', 'Video', 'Foto', 'Absensi', 'Daftar Periksa'].map(tab => (
          <TouchableOpacity key={tab} onPress={() => {
            setActiveTab(tab);
            if (tab !== 'Foto') Alert.alert(tab, 'Modul ini belum tersedia pada prototipe awal.');
          }}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.notice}>
        <Text style={styles.noticeTitle}>Status prototipe</Text>
        <Text style={styles.noticeText}>Kamera dan pembacaan lokasi adalah contoh awal. Watermark yang terlihat di layar belum menyatu ke file foto. Login, tim, laporan, cloud, dan verifikasi belum terhubung ke layanan Timemark.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: COLORS.background },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFF' },
  menu: { fontSize: 26, color: COLORS.ink },
  brand: { fontSize: 17, fontWeight: '700', color: COLORS.ink },
  verify: { color: COLORS.ink, borderWidth: 1, borderColor: '#777', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7, fontWeight: '600' },
  cameraArea: { flex: 1, minHeight: 300, backgroundColor: '#202124', overflow: 'hidden' },
  watermark: { position: 'absolute', left: 12, right: 12, bottom: 16, padding: 12, borderLeftWidth: 4, borderLeftColor: COLORS.yellow, backgroundColor: 'rgba(0,0,0,0.48)' },
  watermarkTime: { color: '#FFF', fontSize: 30, fontWeight: '800' },
  watermarkDate: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 4 },
  watermarkLine: { color: '#FFF', fontSize: 13, marginTop: 4 },
  watermarkBrand: { color: '#EEE', fontSize: 10, marginTop: 8, letterSpacing: 1 },
  capturePanel: { backgroundColor: '#FFF', alignItems: 'center', paddingTop: 12, paddingBottom: 18 },
  hint: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 12 },
  shutter: { width: 76, height: 76, borderRadius: 40, borderWidth: 5, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  shutterInner: { width: 58, height: 58, borderRadius: 30, backgroundColor: '#FFF' },
  disabled: { opacity: 0.5 },
  captureLabel: { color: COLORS.muted, marginTop: 5 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFF', paddingVertical: 13, gap: 7 },
  tabText: { color: '#888', fontSize: 11 },
  tabActive: { color: COLORS.ink, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: COLORS.blue, paddingBottom: 5 },
  notice: { maxHeight: 92, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  noticeTitle: { fontWeight: '700', color: COLORS.ink, marginBottom: 4 },
  noticeText: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.ink },
  muted: { color: COLORS.muted, textAlign: 'center' },
  primaryButton: { backgroundColor: COLORS.blue, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  primaryText: { color: '#FFF', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#E6EEF9', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  secondaryText: { color: COLORS.ink, fontWeight: '600' },
  previewActions: { position: 'absolute', top: 12, right: 12, left: 12, alignItems: 'center' },
});
