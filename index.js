require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const app = express();
const PORT = 3000;

// Inisialisasi Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Inisialisasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Endpoint untuk menghapus laporan dan gambarnya
app.delete('/delete-report/:userId/:complaintId', async (req, res) => {
  const { userId, complaintId } = req.params;

  try {
    const docRef = db.collection('users').doc(userId).collection('complaints').doc(complaintId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send('Laporan tidak ditemukan');
    }

    const data = doc.data();
    const photoUrl = data.photoPath || '';

    // Hapus data dari Firestore
    await docRef.delete();
    console.log(`Laporan ${complaintId} berhasil dihapus.`);

    // Hapus gambar dari Cloudinary (jika ada)
    if (photoUrl.includes('cloudinary')) {
      const publicId = photoUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
      console.log(`Gambar ${publicId} berhasil dihapus dari Cloudinary.`);
    }

    res.send('Laporan dan gambar berhasil dihapus');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan saat menghapus laporan');
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});