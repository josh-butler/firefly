/* eslint-disable max-classes-per-file */
const { v4: uuid } = require('uuid');

const { Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');

const logInfo = (message, params = {}) => {
  const base = { type: 'BatchJobConsumer', message };
  console.info(JSON.stringify({ ...base, ...params }));
};

const jsonBody = ({ body = {} }) => (JSON.parse(body));

class Job {
  constructor(data) {
    this.data = data;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { testPlan, mediaFilePath } = this.data;
    const id = uuid();
    const ts = new Date().toISOString();
    const ets = `JOB#${ts}`;
    const sk = `JOB#${id}`;
    const status = 'READY';
    return {
      id, sk, ets, status, testPlan, mediaFilePath,
    };
  }

  get valid() {
    const { testPlan, mediaFilePath } = this.props;
    return testPlan && mediaFilePath;
  }

  async putJob({ pk, eid, owner }) {
    const {
      sk, id, status, ets, testPlan, mediaFilePath,
    } = this.props;

    const item = {
      pk, sk, id, status, sts: ets, owner, ots: ets, eid, plan: testPlan, path: mediaFilePath,
    };

    return JobEntity.put(item);
  }
}

class Batch {
  constructor(data) {
    this.data = data;
    this.props = this.defaultProps();
    this.files = [];
  }

  defaultProps() {
    const {
      externalId: eid, owner, output, files = [],
    } = this.data;
    const id = uuid();
    const ts = new Date().toISOString();
    const pk = `BATCH#${id}`;
    const ets = `BATCH#${ts}`;
    const status = 'READY';
    const jobs = files.map(data => new Job(data));
    return {
      pk, id, status, ts, ets, eid, owner, output, jobs, files,
    };
  }

  get valid() {
    const {
      eid, owner, output, jobs,
    } = this.props;

    const params = [eid, owner, output].every(i => i);
    const jobParams = !!(jobs.length && jobs.every(i => i.valid));

    return params && jobParams;
  }

  async putBatch() {
    const {
      pk, id, status, ets, eid, owner, output, files,
    } = this.props;

    const item = {
      pk, sk: pk, id, status, sts: ets, owner, ots: ets, output, files, eid,
    };

    return BatchEntity.put(item);
  }

  async process() {
    const {
      pk, id, eid, owner, jobs,
    } = this.props;

    logInfo('processing new batch', { id, eid, owner });

    if (!this.valid) {
      // TODO: don't throw on validation errors since they will be retried
      throw new Error(`invalid batch: ${eid}`);
    }

    await this.putBatch();
    return Promise.all(jobs.map(job => job.putJob({ pk, eid, owner })));
  }
}

class Batches {
  constructor(event) {
    this.event = event;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { Records: records = [] } = this.event;
    const items = records.map(jsonBody).map(data => new Batch(data));
    return { items, records };
  }

  async process() {
    return Promise.all(this.props.items.map(i => i.process()));
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));

  const batches = new Batches(event);
  return batches.process();
};
