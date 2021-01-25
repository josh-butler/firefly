const AWS = require('aws-sdk');

const { Table, Entity } = require('dynamodb-toolbox');

const DocumentClient = new AWS.DynamoDB.DocumentClient();

const { TABLE_NAME } = process.env;

const EntityTable = new Table({
  name: TABLE_NAME,
  partitionKey: 'pk',
  sortKey: 'sk',
  indexes: {
    GSI1: { partitionKey: 'GSI1pk', sortKey: 'GSI1sk' },
  },
  DocumentClient,
});

const Batch = new Entity({
  name: 'BATCH',
  attributes: {
    pk: { partitionKey: true },
    sk: { sortKey: true },
    GSI1pk: { alias: 'status' },
    GSI1sk: { alias: 'eid' },
    data: { type: 'map' },
    tln: { type: 'number', alias: 'total' },
  },
  table: EntityTable,
});

const Job = new Entity({
  name: 'JOB',
  attributes: {
    pk: { partitionKey: true },
    sk: { sortKey: true },
    GSI1pk: { alias: 'status' },
    GSI1sk: { alias: 'eid' },
    data: { type: 'map' },
  },
  table: EntityTable,
});

module.exports = {
  EntityTable,
  Batch,
  Job,
};
