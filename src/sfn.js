const AWS = require('aws-sdk');

const sfn = new AWS.StepFunctions();

// var params = {
//   stateMachineArn: 'STRING_VALUE', /* required */
//   input: 'STRING_VALUE',
//   name: 'STRING_VALUE',
//   traceHeader: 'STRING_VALUE'
// };
const startSFN = async params => {
  let err;
  let res;

  try {
    res = await sfn.startExecution(params).promise();
  } catch (e) {
    console.log(e);
    err = e;
  }

  return { res, err };
};

// var params = {
//   output: 'STRING_VALUE', /* required */
//   taskToken: 'STRING_VALUE' /* required */
// };
const passSFN = async params => {
  let err;
  let res;

  try {
    res = await sfn.sendTaskSuccess(params).promise();
  } catch (e) {
    console.log(e);
    err = e;
  }

  return { res, err };
};

// var params = {
//   taskToken: 'STRING_VALUE', /* required */
//   cause: 'STRING_VALUE',
//   error: 'STRING_VALUE'
// };
const failSFN = async params => {
  let err;
  let res;

  try {
    res = await sfn.sendTaskFailure(params).promise();
  } catch (e) {
    console.log(e);
    err = e;
  }

  return { res, err };
};

module.exports = {
  startSFN,
  passSFN,
  failSFN,
};
