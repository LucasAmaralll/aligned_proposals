const ORIGINS = new Set(['store', 'ecommerce', 'quote']);
const CHANNELS = new Set(['retail', 'wholesale']);

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function inferChannelFromClient(client) {
  if (!client) return 'retail';
  return onlyDigits(client.document).length > 11 ? 'wholesale' : 'retail';
}

function resolveOrigin(origin) {
  if (ORIGINS.has(origin)) return origin;
  return 'store';
}

function resolveChannel(channel, client) {
  if (CHANNELS.has(channel)) return channel;
  return inferChannelFromClient(client);
}

module.exports = {
  ORIGINS,
  CHANNELS,
  onlyDigits,
  inferChannelFromClient,
  resolveOrigin,
  resolveChannel,
};
