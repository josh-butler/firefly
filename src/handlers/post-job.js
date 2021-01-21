const bucket = process.env.S3_BUCKET;

exports.handler = async event => {
  console.log('bucket: ', bucket);
  console.log('event: ', event);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucket }),
  };
};
