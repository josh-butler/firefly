const AWS = require('aws-sdk');
const { region, ReportBucket } = require('../config');

const s3 = new AWS.S3({ region, apiVersion: '2006-03-01' });

const uploadReport = async (Key, Body) => (
  s3.upload({ Bucket: ReportBucket, Key, Body }).promise()
);

module.exports = {
  uploadReport,
};
