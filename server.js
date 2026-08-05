const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let bekleyenKullanici = null;

io.on('connection', (socket) => {
  socket.on('profil-kaydet', (data) => {
    socket.userData = data;
  });

  socket.on('eslesme-ara', () => {
    // Eğer kullanıcı zaten bir odadaysa, eski odadakilere ayrıldığını bildir
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('rakip-ayrildi');
      socket.leave(socket.currentRoom);
      socket.currentRoom = null;
    }

    if (bekleyenKullanici && bekleyenKullanici.id !== socket.id) {
      const rakip = bekleyenKullanici;
      bekleyenKullanici = null;
      
      const odaId = `room_${socket.id}_${rakip.id}`;
      socket.join(odaId);
      rakip.join(odaId);

      socket.currentRoom = odaId;
      rakip.currentRoom = odaId;

      socket.emit('eslesme-bulundu', { ...rakip.userData, odaId, caller: true });
      rakip.emit('eslesme-bulundu', { ...socket.userData, odaId, caller: false });
    } else {
      bekleyenKullanici = socket;
      socket.emit('bekletiliyor');
    }
  });

  // Chat Mesajı İletimi
  socket.on('mesaj-gonder', (data) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('mesaj-al', {
        gonderen: socket.userData ? socket.userData.username : 'Rakip',
        mesaj: data.mesaj
      });
    }
  });

  socket.on('disconnect', () => {
    if (bekleyenKullanici && bekleyenKullanici.id === socket.id) {
      bekleyenKullanici = null;
    }
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('rakip-ayrildi');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});
