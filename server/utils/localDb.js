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
    const raw = fs.readFileSync(this.filePath, 'utf-8');
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
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`❌ Error saving ${this.name}:`, err.message);
    }
  }

  /**
   * Internal: Apply a query filter to the in-memory data array.
   * Returns a plain JavaScript Array of matching documents.
   */
  _applyFilter(query = {}) {
    if (Object.keys(query).length === 0) {
      return [...this.data];
    }

    return this.data.filter(item => {
      for (const key in query) {
        if (key === '$or') {
          // $or: at least one sub-condition must match
          const orConditions = query['$or'];
          const orMatch = orConditions.some(cond => {
            for (const subKey in cond) {
              const val = cond[subKey];
              if (val && typeof val === 'object' && val.$regex) {
                const regex = new RegExp(val.$regex, val.$options || '');
                if (!regex.test(item[subKey] || '')) return false;
              } else {
                if (item[subKey] !== val) return false;
              }
            }
            return true;
          });
          if (!orMatch) return false;
          continue;
        }

        if (key === '$text') {
          const searchTerm = query['$text']['$search'].toLowerCase();
          const itemStr = JSON.stringify(item).toLowerCase();
          if (!itemStr.includes(searchTerm)) return false;
          continue;
        }

        const queryVal = query[key];

        if (queryVal !== null && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
          // Operator queries: $in, $gte, $lte, $regex
          if (queryVal.$in) {
            const itemVal = item[key];
            if (Array.isArray(itemVal)) {
              // Item field is an array — check intersection
              if (!queryVal.$in.some(v => itemVal.includes(v))) return false;
            } else {
              if (!queryVal.$in.includes(itemVal)) return false;
            }
          }
          if (queryVal.$gte !== undefined) {
            if ((item[key] || 0) < queryVal.$gte) return false;
          }
          if (queryVal.$lte !== undefined) {
            if ((item[key] || 0) > queryVal.$lte) return false;
          }
          if (queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, queryVal.$options || '');
            if (!regex.test(item[key] || '')) return false;
          }
        } else {
          // Direct value comparison with safe defaults for boolean flags
          let itemVal = item[key];
          if (itemVal === undefined) {
            if (key === 'isActive' || key === 'isAvailable') {
              itemVal = true;
            }
          }
          if (itemVal !== queryVal) return false;
        }
      }
      return true;
    });
  }

  /**
   * Create a Mongoose-compatible thenable query builder.
   * The key fix: .then() always resolves to a plain JS value (array or single doc),
   * never a builder object. This makes await, Promise.resolve, etc. work correctly.
   */
  _createQueryBuilder(initialData, isSingle) {
    let resultData = isSingle ? initialData : [...(initialData || [])];
    const populateQueue = [];

    const builder = {
      populate: (field, select) => {
        populateQueue.push({ field, select });
        return builder;
      },
      sort: (options) => {
        if (!isSingle && Array.isArray(resultData)) {
          if (typeof options === 'string') {
            // Parse string sort like "createdAt" or "-createdAt"
            const sortObj = {};
            options.split(' ').forEach(part => {
              if (part.startsWith('-')) {
                sortObj[part.slice(1)] = -1;
              } else {
                sortObj[part] = 1;
              }
            });
            options = sortObj;
          }
          resultData.sort((a, b) => {
            for (const key in options) {
              const order = (options[key] === 1 || options[key] === 'asc') ? 1 : -1;
              const aVal = a[key] || '';
              const bVal = b[key] || '';
              if (aVal > bVal) return order;
              if (aVal < bVal) return -order;
            }
            return 0;
          });
        }
        return builder;
      },
      skip: (amount) => {
        if (!isSingle && Array.isArray(resultData)) {
          resultData = resultData.slice(amount);
        }
        return builder;
      },
      limit: (amount) => {
        if (!isSingle && Array.isArray(resultData)) {
          resultData = resultData.slice(0, amount);
        }
        return builder;
      },
      select: () => builder,
      lean: () => builder,

      // Make it a proper thenable so `await` resolves to actual data
      then: (resolve, reject) => {
        try {
          let finalData = JSON.parse(JSON.stringify(resultData));

          // Process populate queue
          if (populateQueue.length > 0 && global.localDb) {
            const populateAll = async () => {
              for (const { field, select } of populateQueue) {
                if (isSingle && finalData) {
                  finalData[field] = await global.localDb._populateField(finalData[field], field, select);
                } else if (Array.isArray(finalData)) {
                  for (const item of finalData) {
                    item[field] = await global.localDb._populateField(item[field], field, select);
                  }
                }
              }
              return finalData;
            };
            return populateAll().then(resolve, reject);
          }

          return resolve(finalData);
        } catch (err) {
          if (reject) return reject(err);
          throw err;
        }
      },
      catch: (fn) => builder.then(undefined, fn),
    };

    return builder;
  }

  // ========== Mongoose-Compatible Methods ==========

  find(query = {}) {
    const results = this._applyFilter(query);
    return this._createQueryBuilder(results, false);
  }

  findOne(query) {
    if (!query) return this._createQueryBuilder(null, true);
    if (query._id) {
      const item = this.data.find(i => i._id === query._id) || null;
      return this._createQueryBuilder(item, true);
    }
    const results = this._applyFilter(query);
    return this._createQueryBuilder(results[0] || null, true);
  }

  findById(id) {
    const item = this.data.find(item => item._id === id) || null;
    return this._createQueryBuilder(item, true);
  }

  /**
   * FIXED: countDocuments now directly returns a number (not a builder).
   * This is the #1 cause of "No items found" — previously it returned
   * a builder object which is always truthy and never === 0.
   */
  async countDocuments(query = {}) {
    const results = this._applyFilter(query);
    return results.length;
  }

  async create(data) {
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];
    const created = items.map(d => {
      const doc = {
        _id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...d,
      };
      if (doc.isActive === undefined) doc.isActive = true;
      if (this.name === 'menuItems' && doc.isAvailable === undefined) doc.isAvailable = true;
      return doc;
    });
    this.data.push(...created);
    this._save();
    const result = isArray ? created : created[0];
    return this._createQueryBuilder(result, !isArray);
  }

  findByIdAndUpdate(id, updateData, options = {}) {
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return this._createQueryBuilder(null, true);

    // Handle $set operator
    const flatUpdate = updateData.$set ? { ...updateData.$set } : { ...updateData };
    delete flatUpdate.$set;

    this.data[index] = {
      ...this.data[index],
      ...flatUpdate,
      updatedAt: new Date().toISOString(),
    };
    this._save();
    return this._createQueryBuilder(this.data[index], true);
  }

  findByIdAndDelete(id) {
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return this._createQueryBuilder(null, true);

    const deleted = { ...this.data[index] };
    this.data.splice(index, 1);
    this._save();
    return this._createQueryBuilder(deleted, true);
  }

  findOneAndDelete(query) {
    const item = this.data.find(i => {
      for (const k in query) { if (i[k] !== query[k]) return false; }
      return true;
    });
    if (!item) return this._createQueryBuilder(null, true);
    return this.findByIdAndDelete(item._id);
  }

  findOneAndUpdate(query, updateData, options = {}) {
    const item = this.data.find(i => {
      for (const k in query) {
        if (typeof query[k] === 'object') continue;
        if (i[k] !== query[k]) return false;
      }
      return true;
    });
    if (!item) return this._createQueryBuilder(null, true);
    return this.findByIdAndUpdate(item._id, updateData, options);
  }

  async updateMany(query = {}, updateData = {}) {
    const matches = this._applyFilter(query);
    const flatUpdate = updateData.$set ? { ...updateData.$set } : { ...updateData };
    delete flatUpdate.$set;

    let modifiedCount = 0;
    for (const match of matches) {
      const index = this.data.findIndex(i => i._id === match._id);
      if (index !== -1) {
        this.data[index] = { ...this.data[index], ...flatUpdate, updatedAt: new Date().toISOString() };
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) this._save();
    return { modifiedCount };
  }

  async deleteMany(query = {}) {
    const toDelete = this._applyFilter(query);
    const deleteIds = new Set(toDelete.map(d => d._id));
    const originalLength = this.data.length;
    this.data = this.data.filter(i => !deleteIds.has(i._id));
    const deletedCount = originalLength - this.data.length;
    if (deletedCount > 0) this._save();
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
    this.notifications = new Collection('notifications');
    this.settings = new Collection('settings');
  }

  init() {
    console.log('✅ Local JSON Database Initialized from /data directory');
    console.log(`   📦 Categories: ${this.categories.data.length}`);
    console.log(`   📦 Menu Items: ${this.menuItems.data.length}`);
    console.log(`   📦 Users: ${this.users.data.length}`);
  }

  async _populateField(refId, fieldName, selectFields) {
    if (!refId) return refId;

    const fieldToCollection = {
      'category': 'categories',
      'createdBy': 'users',
      'user': 'users',
      'customer': 'users',
      'sender': 'users',
      'recipient': 'users',
      'menuItem': 'menuItems',
      'items.menuItem': 'menuItems',
    };

    const collectionName = fieldToCollection[fieldName];
    if (!collectionName || !this[collectionName]) return refId;

    if (Array.isArray(refId)) {
      return refId.map(id => {
        const doc = this[collectionName].data.find(d => d._id === id);
        return doc ? this._selectFields(doc, selectFields) : id;
      });
    }

    const doc = this[collectionName].data.find(d => d._id === refId);
    if (!doc) return refId;
    return this._selectFields(doc, selectFields);
  }

  _selectFields(doc, selectFields) {
    if (!selectFields || typeof selectFields !== 'string') return { ...doc };
    const selected = { _id: doc._id };
    selectFields.split(' ').forEach(f => {
      if (f && doc[f] !== undefined) selected[f] = doc[f];
    });
    return selected;
  }
}

const dbInstance = new LocalDB();
global.localDb = dbInstance;

module.exports = dbInstance;
