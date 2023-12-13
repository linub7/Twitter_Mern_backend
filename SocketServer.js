let onlineUsers = [];

module.exports = (socket, io) => {
  // user joins or opens the application
  socket.on('join', (user) => {
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
    socket.join(conversation);
  });

  // send and receive message
  socket.on('send-message', (message) => {
    const { chat } = message;
    if (!chat?.users) return;

    chat?.users?.forEach((user) => {
      if (user?._id === message?.sender?._id) return;
      socket.in(user?._id).emit('receive-message', message);
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

  // socket.on('follow-notification-received', (newNotification) => {
  //   console.log('follow notification received', newNotification);
  //   socket
  //     .in(newNotification?.user?.id)
  //     .emit('follow-notification-received', newNotification);
  // });

  // socket.on('retweet-notification-received', (newNotification) => {
  //   console.log('retweet notification received', newNotification);
  //   socket
  //     .in(newNotification?.user)
  //     .emit('retweet-notification-received', newNotification);
  // });

  // socket.on('like-notification-received', (newNotification) => {
  //   console.log('like notification received', newNotification);
  //   socket
  //     .in(newNotification?.user)
  //     .emit('like-notification-received', newNotification);
  // });

  // socket.on('reply-notification-received', (newNotification) => {
  //   console.log('reply notification received', newNotification);
  //   socket
  //     .in(newNotification?.user?.id)
  //     .emit('reply-notification-received', newNotification);
  // });
};
