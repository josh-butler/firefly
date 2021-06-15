const AWS = require('aws-sdk');
const { region, InterfaceLambda } = require('../config');

const lambda = new AWS.Lambda({ region });

const invokeLambda = async (FunctionName, Payload) => {
  const params = {
    FunctionName,
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload,
  };

  return lambda.invoke(params).promise();
};

const submitFile = async body => {
  const payload = JSON.stringify(body);
  return invokeLambda(InterfaceLambda, payload);
};

module.exports = {
  submitFile,
};
