const AWS = require('aws-sdk');

const { EventBusName, region } = require('../config');

const eb = new AWS.EventBridge({ region });

const publishEvent = async (DetailType, detail, Source = 'firefly.batch-manager') => {
  const params = {
    Entries: [{
      Detail: JSON.stringify(detail),
      DetailType,
      Source,
      EventBusName,
    }],
  };

  return eb.putEvents(params).promise();
};

module.exports = {
  publishEvent,
};
