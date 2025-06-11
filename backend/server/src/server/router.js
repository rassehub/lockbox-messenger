function handleMessage(fromUserId, rawData, clients) {
  try {
    const { to, text } = JSON.parse(rawData);

    const target = clients.get(to);
    if (target && target.readyState === 1) {
      target.send(JSON.stringify({ from: fromUserId, text }));
    } else {
      const sender = clients.get(fromUserId);
      sender?.send(JSON.stringify({ error: 'User not connected' }));
    }
  } catch (err) {
    console.error('Invalid message format:', err);
  }
}

module.exports = { handleMessage };
