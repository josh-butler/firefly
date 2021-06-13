module.exports = {
  region: process.env.AWS_REGION || 'us-east-1',
  EventBusName: process.env.EVENT_BUS_NAME || 'firefly',
};