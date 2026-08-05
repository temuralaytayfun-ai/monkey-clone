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
    if (bekleyenKullanici && bekleyenKullanici.id !== socket.id) {
      const rakip = bekleyenKullanici;
      bekleyenKullanici = null;
      
      socket.emit('eslesme-bulundu', rakip.userData);
      rakip.emit('eslesme-bulundu', socket.userData);
    } else {
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
  console.log(`Sunucu ${PORT} portunda aktif.`);
});
