// const { startSFN } = require('../sfn');
// const { publishEvent } = require('../util/events');

// const { EntityTable, Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');
// const { interfaceSubmitJob } = require('../util/lambda');

class Batch {
  constructor(event) {
    this.event = event;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const {
      detail: {
        pk, id, eid, jobs = [],
      } = {},
    } = this.event;

    return {
      pk, id, eid, jobs,
    };
  }

  async submit() {
    console.log('this.props', this.props);
    return null;
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const batch = new Batch(event);
  return batch.submit();
};
