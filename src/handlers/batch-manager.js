const { EntityTable } = require('../ddb');

const { MAX_JOBS = 15 } = process.env;

const batchAttrs = ({ pk }) => ({ pk });

const jobsAttrs = ({ pk, sk }) => ({ pk, sk });

const limit = (data, max) => {
  const totalled = data.reduce((acc, val) => [...acc, +acc.slice(-1) + +val.total], []);
  const allowed = totalled.filter(t => t <= max);
  return data.slice(0, allowed.length);
};

const getBatch = async batch => {
  const { pk } = batch;
  const { Items = [] } = await EntityTable.query(pk);
  return Items;
};

class BatchManager {
  constructor(status, maxJobs) {
    this.status = status;
    this.maxJobs = maxJobs;
    this.batches = [];
    this.batchJobs = [];
    this.props = this.defaultProps();
  }

  defaultProps() {
    const prefix = 'BATCH#';
    const pk = this.status;

    return { pk, prefix };
  }

  get jobCount() {
    return this.batches.reduce((acc, val) => acc + val.total, 0);
  }

  get available() {
    return this.maxJobs - this.jobCount;
  }

  maximum() {
    return limit(this.batches, this.available);
  }

  async getBatches() {
    const { pk, prefix } = this.props;
    const { Items = [] } = await EntityTable.query(pk, { beginsWith: prefix, index: 'GSI1' });
    return Items.sort((a, b) => new Date(a.created) - new Date(b.created));
  }

  async buildBatchJobs() {
    const allowed = this.maximum();
    const batches = allowed.map(async batch => getBatch(batch));
    return Promise.all(batches);
  }

  submitBatchJobs() {
    return this.batchJobs.map(b => {
      const [batch] = b.filter(i => i.entity === 'BATCH');
      const jobs = b.filter(i => i.entity === 'JOB');
      return {
        batch: {
          ...batchAttrs(batch), jobs: jobs.map(jobsAttrs), intervalSeconds: '60', maxAttempts: '10',
        },
      };
    });
  }

  async send() {
    this.batches = await this.getBatches();
    this.batchJobs = await this.buildBatchJobs();
    console.log('this.batchJobs: ', this.batchJobs);
    console.log(JSON.stringify(this.submitBatchJobs(), null, 2));

    return null;
  }
}

exports.handler = async () => {
  const manager = new BatchManager('QUEUED', MAX_JOBS);
  return manager.send();
};
