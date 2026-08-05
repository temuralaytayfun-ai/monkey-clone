const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let bekleyenKullanici = null;

io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  socket.on('profil-kaydet', (data) => {
    socket.userData = data;
  });

  socket.on('eslesme-ara', () => {
    if (bekleyenKullanici && bekleyenKullanici.id !== socket.id) {
      // Eşleşme sağlandı
      socket.emit('eslesme-bulundu', bekleyenKullanici.userData);
      bekleyenKullanici.emit('eslesme-bulundu', socket.userData);
      bekleyenKullanici = null;
    } else {
      // Kimse yoksa beklemeye al
      bekleyenKullanici = socket;
      socket.emit('bekletiliyor');
    }
  });

  socket.on('disconnect', () => {
    if (bekleyenKullanici && bekleyenKullanici.id === socket.id) {
      bekleyenKullanici = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
