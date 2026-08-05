const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Çevrim içi kullanıcılar ve eşleşme havuzu
let aktifKullanicilar = new Map(); // socket.id -> { peerId, kullaniciAdi, avatar }
let bekleyenKullanici = null;

io.on('connection', (socket) => {
  console.log('Yeni baglanti:', socket.id);

  // Kullanici profilini kaydet
  socket.on('profil-kaydet', (profil) => {
    aktifKullanicilar.set(socket.id, {
      socketId: socket.id,
      peerId: profil.peerId,
      kullaniciAdi: profil.kullaniciAdi,
      avatar: profil.avatar
    });
    // Aktif kullanıcı listesini herkese duyur
    io.emit('aktif-kullanicilar', Array.from(aktifKullanicilar.values()));
  });

  // Rastgele eşleşme isteği
  socket.on('eslesme-iste', () => {
    const mevcutKullanici = aktifKullanicilar.get(socket.id);
    if (!mevcutKullanici) return;

    if (bekleyenKullanici && bekleyenKullanici.socketId !== socket.id) {
      // Eşleştir
      socket.emit('eslestin', { 
        partner: bekleyenKullanici, 
        arayanBenMiyim: true 
      });
      
      io.to(bekleyenKullanici.socketId).emit('eslestin', { 
        partner: mevcutKullanici, 
        arayanBenMiyim: false 
      });

      bekleyenKullanici = null;
    } else {
      bekleyenKullanici = mevcutKullanici;
    }
  });

  // Doğrudan (Keşfet üzerinden) arama isteği
  socket.on('dogrudan-ara', ({ hedefSocketId }) => {
    const arayan = aktifKullanicilar.get(socket.id);
    if (arayan && hedefSocketId) {
      io.to(hedefSocketId).emit('gelen-arama', { arayan });
    }
  });

  socket.on('arama-yanitla', ({ hedefSocketId, kabul }) => {
    io.to(hedefSocketId).emit('arama-sonuc', { kabul, yanitlayanId: socket.id });
  });

  // Bağlantı koptuğunda temizlik
  socket.on('disconnect', () => {
    if (bekleyenKullanici && bekleyenKullanici.socketId === socket.id) {
      bekleyenKullanici = null;
    }
    aktifKullanicilar.delete(socket.id);
    io.emit('aktif-kullanicilar', Array.from(aktifKullanicilar.values()));
  });
});

// Render için dinamik PORT kullanımı
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Monkey-App Sunucusu ${PORT} portunda aktif!`);
});