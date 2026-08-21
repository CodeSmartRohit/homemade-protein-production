const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = [];
    this._load();
  }

  _load() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
    const raw = fs.readFileSync(this.filePath);
    try {
      this.data = JSON.parse(raw);
      if (Array.isArray(this.data)) {
        this.data.forEach(item => {
          if (item.isActive === undefined) item.isActive = true;
          if (this.name === 'menuItems' && item.isAvailable === undefined) item.isAvailable = true;
        });
      }
    } catch {
      this.data = [];
    }
  }

  _save() {
    // Asynchronous non-blocking write to disk
    fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2))
      .catch(err => console.error(`❌ Error saving ${this.name}:`, err.message));
  }

  /* Query Execution Builder matching mongoose's chaining logic
     e.g., Model.find({}).populate('x').sort('y').skip(0).limit(10)
  */
  _createQueryBuilder(initialData, isSingle) {
    let resultData = initialData;
    let populateQueue = [];

    const builder = {
      populate: (field, select) => {
        populateQueue.push({ field, select });
        return builder;
      },
      sort: (options) => {
        if (!isSingle) {
          resultData = [...resultData].sort((a, b) => {
            for (let key in options) {
              const order = options[key] === 1 || options[key] === 'asc' ? 1 : -1;
              if (a[key] > b[key]) return order;
              if (a[key] < b[key]) return -order;
            }
            return 0;
          });
        }
        return builder;
      },
      skip: (amount) => {
        if (!isSingle) resultData = resultData.slice(amount);
        return builder;
      },
      limit: (amount) => {
        if (!isSingle) resultData = resultData.slice(0, amount);
        return builder;
      },
      select: (fields) => {
        // Simple select: e.g. "+password" or "-password", simplified logic
        return builder;
      },
       lean: () => {
         // In local DB context, lean() just returns the builder (all data is already plain JSON)
         return builder;
       },
       then: async (resolve, reject) => {
        try {
          // Process populate queue here if needed, but in our manual approach
          // we'll often do this in the controller or we can implement naive populate here
          // For now, we will just return the data. If populate is needed, the controller 
          // should use standard array mechanisms or we write a basic `populate` utility below
          
          let finalData = JSON.parse(JSON.stringify(resultData)); // Deep copy to prevent accidental mutation by controllers
          
          if (populateQueue.length > 0) {
              // Basic naive populate implementation
              // We need access to the db collections. We will attach DB context to instances later.
              for (const {field, select} of populateQueue) {
                 if (isSingle && finalData) {
                    finalData[field] = await global.localDb._populateField(finalData[field], field, select);
                 } else if (Array.isArray(finalData)) {
                    for (let item of finalData) {
                        item[field] = await global.localDb._populateField(item[field], field, select);
                    }
                 }
              }
          }

          resolve(finalData);
        } catch (err) {
          reject(err);
        }
      },
      catch: (fn) => builder.then(null, fn)
    };
    
    // Allow using await without `.then`
    return builder;
  }

  // Mongoose methods

  find(query = {}) {
    let results = this.data;

    // Very basic filter matching
    if (Object.keys(query).length > 0) {
      results = results.filter(item => {
        let match = true;
        for (let key in query) {
            if (key === '$text') {
                const searchTerm = query['$text']['$search'].toLowerCase();
                // Simple search over string values
                const itemStr = JSON.stringify(item).toLowerCase();
                if (!itemStr.includes(searchTerm)) match = false;
            } else if (typeof query[key] === 'object' && query[key] !== null && !Array.isArray(query[key])) {
                // Handling operators like $in, $gte, $lte
                if (query[key].$in) {
                    if (!query[key].$in.includes(item[key])) match = false;
                }
                if (query[key].$gte !== undefined) {
                    if (item[key] < query[key].$gte) match = false;
                }
                if (query[key].$lte !== undefined) {
                    if (item[key] > query[key].$lte) match = false;
                }
            } else {
                const itemVal = item[key] !== undefined ? item[key] : ((key === 'isActive' || key === 'isAvailable') ? true : undefined);
                if (itemVal !== query[key]) match = false;
            }
        }
        return match;
      });
    }
    
    return this._createQueryBuilder(results, false);
  }

  findOne(query) {
    if (!query) return this._createQueryBuilder(null, true);
    let item = null;
    if (query._id) {
       item = this.data.find(i => i._id === query._id);
    } else {
       const all = this.find(query);
       // We can extract data directly bypassing promise wrapper since it's synchronous up to population
       item = this.data.find(i => {
           for(let k in query) {
               if (query[k] && typeof query[k] === 'object') continue;
               if (i[k] !== query[k]) return false;
           }
           return true;
       }) || null;
    }
    return this._createQueryBuilder(item, true);
  }

  findById(id) {
    const item = this.data.find(item => item._id === id);
    return this._createQueryBuilder(item || null, true);
  }

  async countDocuments(query) {
      const results = await this.find(query);
      return Array.isArray(results) ? results.length : 0;
  }

  async create(data) {
    const isArrayContext = Array.isArray(data);
    const items = isArrayContext ? data : [data];
    const created = items.map(d => {
      const itemData = {
        _id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...d
      };
      if (itemData.isActive === undefined) itemData.isActive = true;
      if (this.name === 'menuItems' && itemData.isAvailable === undefined) itemData.isAvailable = true;
      return itemData;
    });
    this.data.push(...created);
    this._save();
    
    // Simulate mongoose document with `.save()`, `.populate()`
    const resultDoc = isArrayContext ? created : created[0];
    return this._createQueryBuilder(resultDoc, !isArrayContext);
  }

  findByIdAndUpdate(id, updateData, options = {}) {
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return this._createQueryBuilder(null, true);

    this.data[index] = {
      ...this.data[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    this._save();

    return this._createQueryBuilder(this.data[index], true);
  }

  findByIdAndDelete(id) {
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return this._createQueryBuilder(null, true);

    const deletedItem = { ...this.data[index] };
    this.data.splice(index, 1);
    this._save();

    return this._createQueryBuilder(deletedItem, true);
  }

  findOneAndDelete(query) {
    const item = this.data.find(i => {
       for(let k in query) { if (i[k] !== query[k]) return false; } return true;
    });
    if (!item) return this._createQueryBuilder(null, true);
    return this.findByIdAndDelete(item._id);
  }

  findOneAndUpdate(query, updateData) {
      const item = this.data.find(i => {
          for(let k in query) { if (i[k] !== query[k]) return false; } return true;
       });
       if (!item) return this._createQueryBuilder(null, true);
       return this.findByIdAndUpdate(item._id, updateData);
  }

  async deleteMany(query = {}) {
    const originalLength = this.data.length;
    
    // Use the find logic to identify what to REMOVE
    const toKeep = this.data.filter(item => {
      let match = true;
      for (let key in query) {
        if (typeof query[key] === 'object' && query[key] !== null && !Array.isArray(query[key])) {
          if (query[key].$in && !query[key].$in.includes(item[key])) match = false;
          if (query[key].$gte !== undefined && item[key] < query[key].$gte) match = false;
          if (query[key].$lte !== undefined && item[key] > query[key].$lte) match = false;
        } else if (item[key] !== query[key]) {
          match = false;
        }
      }
      return !match; // Keep items that DON'T match the delete query
    });

    const deletedCount = originalLength - toKeep.length;
    this.data = toKeep;
    if (deletedCount > 0) {
      this._save();
    }
    
    return { deletedCount };
  }
}

class LocalDB {
  constructor() {
    this.users = new Collection('users');
    this.categories = new Collection('categories');
    this.menuItems = new Collection('menuItems');
    this.orders = new Collection('orders');
    this.reviews = new Collection('reviews');
    this.requests = new Collection('requests');
  }

  init() {
    console.log('✅ Local JSON Database Initialized from /data directory');
  }

  // Basic reference resolver for "populate"
  async _populateField(refId, fieldName, selectFields) {
      if (!refId) return refId;
      
      let collectionName = '';
      if (fieldName === 'category') collectionName = 'categories';
      if (fieldName === 'createdBy' || fieldName === 'user' || fieldName === 'customer') collectionName = 'users';
      if (fieldName === 'items.menuItem' || fieldName === 'menuItem') collectionName = 'menuItems';
      // etc based on common usages

      if (!collectionName || !this[collectionName]) return refId;

      if (Array.isArray(refId)) {
          return refId.map(id => this[collectionName].data.find(doc => doc._id === id) || id);
      } else {
          const doc = this[collectionName].data.find(doc => doc._id === refId);
          if (!doc) return refId;
          
          if (selectFields && typeof selectFields === 'string') {
              const selected = { _id: doc._id };
              selectFields.split(' ').forEach(f => {
                  if (doc[f]) selected[f] = doc[f];
              });
              return selected;
          }
          return doc;
      }
  }
}

const dbInstance = new LocalDB();
// Make globally available for the naive populate
global.localDb = dbInstance;

module.exports = dbInstance;
