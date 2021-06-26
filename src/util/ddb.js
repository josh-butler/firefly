const AWS = require('aws-sdk');
const { Table, Entity } = require('dynamodb-toolbox');

const { ENTITY_TABLE } = process.env;

const DocumentClient = new AWS.DynamoDB.DocumentClient();

const EntityTable = new Table({
  name: ENTITY_TABLE,
  partitionKey: 'pk',
  sortKey: 'sk',
  indexes: {
    GSI1: { partitionKey: 'GSI1pk', sortKey: 'GSI1sk' },
    GSI2: { partitionKey: 'GSI2pk', sortKey: 'GS21sk' },
  },
  DocumentClient,
});

const Batch = new Entity({
  name: 'BATCH',
  attributes: {
    pk: { partitionKey: true },
    sk: { sortKey: true },
    GSI1pk: { alias: 'status' },
    GSI1sk: { alias: 'sts' },
    GSI2pk: { alias: 'owner' },
    GSI2sk: { alias: 'ots' },
    id: { type: 'string' },
    eid: { type: 'string' },
    cfg: { type: 'map' },
    files: { type: 'list' },
  },
  table: EntityTable,
});

const Job = new Entity({
  name: 'JOB',
  attributes: {
    pk: { partitionKey: true },
    sk: { sortKey: true },
    GSI1pk: { alias: 'status' },
    GSI1sk: { alias: 'sts' },
    GSI2pk: { alias: 'owner' },
    GSI2sk: { alias: 'ots' },
    id: { type: 'string' },
    eid: { type: 'string' },
    tid: { alias: 'taskId' },
    plan: { type: 'string' },
    path: { type: 'string' },
  },
  table: EntityTable,
});

module.exports = {
  EntityTable,
  Batch,
  Job,
};
