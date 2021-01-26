const { EntityTable } = require('../ddb');

// TODO: pass this in from env var
const JOB_LIMIT = 8;

const limit = (data, max) => {
  const totalled = data.reduce((acc, val) => [...acc, +acc.slice(-1) + +val.total], []);
  const allowed = totalled.filter(t => t <= max);
  return data.slice(0, allowed.length);
};

class BatchManager {
  constructor(status) {
    this.status = status;
    this.batches = [];
    this.props = this.defaultProps();
  }

  defaultProps() {
    const prefix = 'BATCH#';
    const pk = this.status;

    return { pk, prefix };
  }

  jobCount() {
    return this.batches.reduce((acc, val) => acc + val.total, 0);
  }

  maximum(available) {
    return limit(this.batches, available);
  }

  async getBatches() {
    const { pk, prefix } = this.props;
    const { Items = [] } = await EntityTable.query(pk, { beginsWith: prefix, index: 'GSI1' });
    return Items.sort((a, b) => new Date(a.created) - new Date(b.created));
  }

  async send() {
    this.batches = await this.getBatches();
    const available = JOB_LIMIT - this.jobCount();
    const allowed = this.maximum(available);

    console.log('allowed: ', allowed);
    return null;
  }
}

exports.handler = async () => {
  const manager = new BatchManager('QUEUED');
  return manager.send();
};
