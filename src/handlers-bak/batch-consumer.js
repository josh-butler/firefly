const { v4: uuid } = require('uuid');

const { EntityTable, Batch, Job } = require('../ddb');

class Batches {
  constructor(event) {
    this.event = event;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { Records } = this.event;
    const batches = Records.map(r => JSON.parse(r.body));
    const pk = `BATCH#${uuid()}`;
    const status = 'QUEUED';

    return { pk, batches, status };
  }

  isValid() {
    const { batches } = this.props;
    return !!batches.length;
  }

  jobParams(job) {
    const { pk, status } = this.props;
    const sk = `JOB#${uuid()}`;
    return {
      pk, sk, status, eid: sk, data: { ...job },
    };
  }

  batchParams(batch) {
    const { pk, status } = this.props;
    const { externalRefId, taskToken } = batch;
    const data = { externalRefId, taskToken };
    return {
      pk, sk: pk, status, eid: pk, data,
    };
  }

  async postBatch(batch) {
    const { jobs } = batch;
    const jobWrites = jobs.map(job => Job.putBatch(this.jobParams(job)));
    const batchWrite = Batch.putBatch({ ...this.batchParams(batch), total: jobWrites.length });

    await EntityTable.batchWrite([batchWrite, ...jobWrites]);
  }

  async postBatches() {
    const { batches } = this.props;
    const posts = batches.map(batch => this.postBatch(batch));
    return Promise.all(posts);
  }

  async post() {
    if (this.isValid()) {
      return this.postBatches();
    }
    throw new Error('invalid batch');
  }
}

exports.handler = async event => {
  console.log('event: ', event);
  const batches = new Batches(event);
  return batches.post();
};
