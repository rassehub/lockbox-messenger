const clients = new Map();

function addClient(userId, ws) {
  clients.set(userId, ws);
}

function removeClient(userId) {
  clients.delete(userId);
}

function getClient(userId) {
  return clients.get(userId);
}

module.exports = { addClient, removeClient, getClient };
