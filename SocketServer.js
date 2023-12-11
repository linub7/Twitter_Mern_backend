let onlineUsers = [];

module.exports = (socket, io) => {
  // user joins or opens the application
  socket.on('join', (user) => {
    console.log(`${user} joined`);
    socket.join(user);
    // if (!onlineUsers.some((el) => el.userId === user)) {
    //   onlineUsers.push({ userId: user, socketId: socket?.id });
    // }
    // send online users
    // io.emit('get-online-users', onlineUsers);
  });

  // socket disconnect
  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter((el) => el.socketId !== socket.id);
    io.emit('get-online-users', onlineUsers);
  });

  // join a conversation room
  socket.on('join-conversation', (conversation) => {
    console.log(`${conversation} is changed, someone came!`);
    socket.join(conversation);
  });

  // send and receive message
  socket.on('send-message', (message) => {
    console.log(
      `${message?.sender?.username} sent a message to ${message?.chat?.chatName}`
    );
    const { chat } = message;
    if (!chat?.users) {
      console.log('users not found OOPS!');
      return;
    }
    chat?.users?.forEach((user) => {
      console.log(`${user}`);
      console.log(user?._id === message?.sender?._id);
      if (user?._id === message?.sender?._id) return;
      socket.in(user?._id).emit('receive-message', message);
      console.log('message returned');
    });
  });

  // typing
  socket.on('typing', (conversation) => {
    socket.in(conversation).emit('typing');
  });

  // stop-typing
  socket.on('stop-typing', (conversation) => {
    socket.in(conversation).emit('stop-typing');
  });
};
