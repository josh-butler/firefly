module.exports = {
  region: process.env.AWS_REGION || 'us-east-1',
  EventBusName: process.env.EVENT_BUS_NAME || 'firefly',
  InterfaceLambda: process.env.EXTERNAL_INTERFACE_LAMBDA || 'external-interface',
  BatchLimit: +process.env.BATCH_LIMIT || 1,
  MonitorSmArn: process.env.MONITOR_SM_ARN,
};
