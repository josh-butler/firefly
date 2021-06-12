exports.handler = async event => {
  console.log('event: ', event);
  const statusCode = 200;
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const body = JSON.stringify({ status: 'ok' });

  return { statusCode, headers, body };
};
