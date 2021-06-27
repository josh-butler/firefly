const { v4: uuid } = require('uuid');

exports.handler = async event => {
  console.log('event: ', event);
  let resp;

  const { type, params } = this.event;

  switch (type) {
    case 'taskReport':
      resp = { data: "<note> <to>Tove</to> <from>Jani</from> <heading>Reminder</heading> <body>Don't forget me this weekend!</body> </note>" };
      break;
    case 'submitFile':
      resp = { data: { taskId: uuid() } };
      break;
    default:
      resp = { data: { taskId: uuid() } };
  }
  // const statusCode = 200;
  // const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  // const body = JSON.stringify({ status: 'ok' });

  return resp;
};
