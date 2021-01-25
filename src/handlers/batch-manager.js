const { EntityTable } = require('../ddb');

class BatchManager {
  constructor(status) {
    this.status = status;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const prefix = 'BATCH#';
    const pk = this.status;

    return { pk, prefix };
  }

  async getBatches() {
    let err;
    let result;
    const { pk, prefix } = this.props;

    try {
      result = await EntityTable.query(
        pk,
        { beginsWith: prefix, index: 'GSI1' },
      );
    } catch (e) {
      console.error(e);
      err = e;
    }

    // if (result) {
    //   const { Items = [] } = result;
    //   const sorted = Items.sort((a, b) => b.modified - a.modified);
    //   data = sorted.map(batchAttrs);
    // }

    return { result, err };
  }

  async send() {
    return this.getBatches();
  }
}

exports.handler = async () => {
  const manager = new BatchManager('QUEUED');
  return manager.send();
};