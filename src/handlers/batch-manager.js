/* eslint-disable max-classes-per-file */
const { EntityTable, Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');
const { publishEvent } = require('../util/events');
const { BATCH_LIMIT } = require('../config');

const logInfo = (message, params = {}) => {
  const base = { type: 'BatchManager', message };
  console.info(JSON.stringify({ ...base, ...params }));
};

class Job {
  constructor(data) {
    this.data = data;
  }

  get putParams() {
    const { pk, sk } = this.data;
    return { pk, sk, status: 'ACCEPTED' };
  }

  get attrs() {
    const {
      pk, sk, path, plan,
    } = this.data;

    return {
      pk, sk, path, plan,
    };
  }
}

class Batch {
  constructor(data) {
    this.data = data;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { pk } = this.data;
    const status = 'ACCEPTED';
    return { pk, status };
  }

  get attrs() {
    const { pk, id, eid } = this.data;
    return { pk, id, eid };
  }

  async getJobItems() {
    const { pk } = this.props;

    const result = await EntityTable.query(pk, { beginsWith: 'JOB#' });

    this.items = result.Items || [];
  }

  async process() {
    const { pk, status } = this.props;
    logInfo('processing batch', { pk });

    await this.getJobItems();
    this.jobs = this.items.map(item => new Job(item));

    // update Batch status to ACCEPTED
    await BatchEntity.update({ pk, sk: pk, status });

    // update Jobs status to ACCEPTED
    await Promise.all(this.jobs.map(job => JobEntity.update(job.putParams)));

    this.payload = { ...this.attrs, jobs: this.jobs.map(job => job.attrs) };

    return publishEvent('SUBMIT_BATCH', this.payload);
  }
}

class Batches {
  constructor(limit = 1) {
    this.limit = limit;
    this.props = this.defaultProps();
  }

  defaultProps() {
    return { pk: 'READY', limit: this.limit };
  }

  async getBatchItems() {
    const { pk, limit } = this.props;

    const params = { limit, beginsWith: 'BATCH#', index: 'GSI1' };
    const result = await EntityTable.query(pk, params);

    this.items = result.Items || [];
  }

  async process() {
    const { limit } = this.props;
    logInfo('fetching oldest batches', { limit });

    await this.getBatchItems();
    this.batches = this.items.map(item => new Batch(item));
    console.log('this.batches: ', this.batches);

    return Promise.all(this.batches.map(batch => batch.process()));
  }
}

exports.handler = async () => {
  const batches = new Batches(BATCH_LIMIT);
  return batches.process();
};
