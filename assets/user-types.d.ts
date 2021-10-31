/// <reference types="node" />
/// <reference types="web" />
/**
 * Use this symbol to delete properies in deepObjectAssign.
 */
declare const DELETE: unique symbol;
/**
 * Turns `undefined` into `undefined | typeof DELETE` and makes everything
 * partial. Intended to be used with `deepObjectAssign`.
 */
declare type Assignable<T> = T extends undefined ? (T extends Function ? T : T extends object ? {
    [Key in keyof T]?: Assignable<T[Key]> | undefined;
} : T) | typeof DELETE : T extends Function ? T | undefined : T extends object ? {
    [Key in keyof T]?: Assignable<T[Key]> | undefined;
} : T | undefined;

/** Queue configuration object. */
interface QueueOptions {
    /** The queue will be flushed automatically after an inactivity of this delay in milliseconds. By default there is no automatic flushing (`null`). */
    delay?: null | number;
    /** When the queue exceeds the given maximum number of entries, the queue is flushed automatically. Default value is `Infinity`. */
    max?: number;
}
/**
 * Queue extending options.
 *
 * @typeParam T - The type of method names to be replaced by queued versions.
 */
interface QueueExtendOptions<T> {
    /** A list with method names of the methods on the object to be replaced with queued ones. */
    replace: T[];
    /** When provided, the queue will be flushed automatically after an inactivity of this delay in milliseconds. Default value is null. */
    delay?: number;
    /** When the queue exceeds the given maximum number of entries, the queue is flushed automatically. Default value of max is Infinity. */
    max?: number;
}
/**
 * Queue call entry.
 * - A function to be executed.
 * - An object with function, args, context (like function.bind(context, ...args)).
 */
declare type QueueCallEntry = Function | {
    fn: Function;
    args: unknown[];
} | {
    fn: Function;
    args: unknown[];
    context: unknown;
};
/**
 * A queue.
 *
 * @typeParam T - The type of method names to be replaced by queued versions.
 */
declare class Queue<T = never> {
    /** Delay in milliseconds. If defined the queue will be periodically flushed. */
    delay: null | number;
    /** Maximum number of entries in the queue before it will be flushed. */
    max: number;
    private readonly _queue;
    private _timeout;
    private _extended;
    /**
     * Construct a new Queue.
     *
     * @param options - Queue configuration.
     */
    constructor(options?: QueueOptions);
    /**
     * Update the configuration of the queue.
     *
     * @param options - Queue configuration.
     */
    setOptions(options?: QueueOptions): void;
    /**
     * Extend an object with queuing functionality.
     * The object will be extended with a function flush, and the methods provided in options.replace will be replaced with queued ones.
     *
     * @param object - The object to be extended.
     * @param options - Additional options.
     *
     * @returns The created queue.
     */
    static extend<O extends {
        flush?: () => void;
    }, K extends string>(object: O, options: QueueExtendOptions<K>): Queue<O>;
    /**
     * Destroy the queue. The queue will first flush all queued actions, and in case it has extended an object, will restore the original object.
     */
    destroy(): void;
    /**
     * Replace a method on an object with a queued version.
     *
     * @param object - Object having the method.
     * @param method - The method name.
     */
    replace<M extends string>(object: Record<M, () => void>, method: M): void;
    /**
     * Queue a call.
     *
     * @param entry - The function or entry to be queued.
     */
    queue(entry: QueueCallEntry): void;
    /**
     * Check whether the queue needs to be flushed.
     */
    private _flushIfNeeded;
    /**
     * Flush all queued calls
     */
    flush(): void;
}

/**
 * [[DataSet]] code that can be reused in [[DataView]] or other similar implementations of [[DataInterface]].
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
declare abstract class DataSetPart<Item, IdProp extends string> implements Pick<DataInterface<Item, IdProp>, "on" | "off"> {
    private readonly _subscribers;
    protected _trigger(event: "add", payload: EventPayloads<Item, IdProp>["add"], senderId?: Id | null): void;
    protected _trigger(event: "update", payload: EventPayloads<Item, IdProp>["update"], senderId?: Id | null): void;
    protected _trigger(event: "remove", payload: EventPayloads<Item, IdProp>["remove"], senderId?: Id | null): void;
    /** @inheritDoc */
    on(event: "*", callback: EventCallbacksWithAny<Item, IdProp>["*"]): void;
    /** @inheritDoc */
    on(event: "add", callback: EventCallbacksWithAny<Item, IdProp>["add"]): void;
    /** @inheritDoc */
    on(event: "remove", callback: EventCallbacksWithAny<Item, IdProp>["remove"]): void;
    /** @inheritDoc */
    on(event: "update", callback: EventCallbacksWithAny<Item, IdProp>["update"]): void;
    /** @inheritDoc */
    off(event: "*", callback: EventCallbacksWithAny<Item, IdProp>["*"]): void;
    /** @inheritDoc */
    off(event: "add", callback: EventCallbacksWithAny<Item, IdProp>["add"]): void;
    /** @inheritDoc */
    off(event: "remove", callback: EventCallbacksWithAny<Item, IdProp>["remove"]): void;
    /** @inheritDoc */
    off(event: "update", callback: EventCallbacksWithAny<Item, IdProp>["update"]): void;
    /**
     * @deprecated Use on instead (PS: DataView.subscribe === DataView.on).
     */
    subscribe: DataSetPart<Item, IdProp>["on"];
    /**
     * @deprecated Use off instead (PS: DataView.unsubscribe === DataView.off).
     */
    unsubscribe: DataSetPart<Item, IdProp>["off"];
    get testLeakSubscribers(): any;
}

/**
 * Data stream
 *
 * @remarks
 * [[DataStream]] offers an always up to date stream of items from a [[DataSet]] or [[DataView]].
 * That means that the stream is evaluated at the time of iteration, conversion to another data type or when [[cache]] is called, not when the [[DataStream]] was created.
 * Multiple invocations of for example [[toItemArray]] may yield different results (if the data source like for example [[DataSet]] gets modified).
 *
 * @typeParam Item - The item type this stream is going to work with.
 */
declare class DataStream<Item> implements Iterable<[Id, Item]> {
    private readonly _pairs;
    /**
     * Create a new data stream.
     *
     * @param pairs - The id, item pairs.
     */
    constructor(pairs: Iterable<[Id, Item]>);
    /**
     * Return an iterable of key, value pairs for every entry in the stream.
     */
    [Symbol.iterator](): IterableIterator<[Id, Item]>;
    /**
     * Return an iterable of key, value pairs for every entry in the stream.
     */
    entries(): IterableIterator<[Id, Item]>;
    /**
     * Return an iterable of keys in the stream.
     */
    keys(): IterableIterator<Id>;
    /**
     * Return an iterable of values in the stream.
     */
    values(): IterableIterator<Item>;
    /**
     * Return an array containing all the ids in this stream.
     *
     * @remarks
     * The array may contain duplicities.
     *
     * @returns The array with all ids from this stream.
     */
    toIdArray(): Id[];
    /**
     * Return an array containing all the items in this stream.
     *
     * @remarks
     * The array may contain duplicities.
     *
     * @returns The array with all items from this stream.
     */
    toItemArray(): Item[];
    /**
     * Return an array containing all the entries in this stream.
     *
     * @remarks
     * The array may contain duplicities.
     *
     * @returns The array with all entries from this stream.
     */
    toEntryArray(): [Id, Item][];
    /**
     * Return an object map containing all the items in this stream accessible by ids.
     *
     * @remarks
     * In case of duplicate ids (coerced to string so `7 == '7'`) the last encoutered appears in the returned object.
     *
     * @returns The object map of all id → item pairs from this stream.
     */
    toObjectMap(): Record<Id, Item>;
    /**
     * Return a map containing all the items in this stream accessible by ids.
     *
     * @returns The map of all id → item pairs from this stream.
     */
    toMap(): Map<Id, Item>;
    /**
     * Return a set containing all the (unique) ids in this stream.
     *
     * @returns The set of all ids from this stream.
     */
    toIdSet(): Set<Id>;
    /**
     * Return a set containing all the (unique) items in this stream.
     *
     * @returns The set of all items from this stream.
     */
    toItemSet(): Set<Item>;
    /**
     * Cache the items from this stream.
     *
     * @remarks
     * This method allows for items to be fetched immediatelly and used (possibly multiple times) later.
     * It can also be used to optimize performance as [[DataStream]] would otherwise reevaluate everything upon each iteration.
     *
     * ## Example
     * ```javascript
     * const ds = new DataSet([…])
     *
     * const cachedStream = ds.stream()
     *   .filter(…)
     *   .sort(…)
     *   .map(…)
     *   .cached(…) // Data are fetched, processed and cached here.
     *
     * ds.clear()
     * chachedStream // Still has all the items.
     * ```
     *
     * @returns A new [[DataStream]] with cached items (detached from the original [[DataSet]]).
     */
    cache(): DataStream<Item>;
    /**
     * Get the distinct values of given property.
     *
     * @param callback - The function that picks and possibly converts the property.
     *
     * @typeParam T - The type of the distinct value.
     *
     * @returns A set of all distinct properties.
     */
    distinct<T>(callback: (item: Item, id: Id) => T): Set<T>;
    /**
     * Filter the items of the stream.
     *
     * @param callback - The function that decides whether an item will be included.
     *
     * @returns A new data stream with the filtered items.
     */
    filter(callback: (item: Item, id: Id) => boolean): DataStream<Item>;
    /**
     * Execute a callback for each item of the stream.
     *
     * @param callback - The function that will be invoked for each item.
     */
    forEach(callback: (item: Item, id: Id) => boolean): void;
    /**
     * Map the items into a different type.
     *
     * @param callback - The function that does the conversion.
     *
     * @typeParam Mapped - The type of the item after mapping.
     *
     * @returns A new data stream with the mapped items.
     */
    map<Mapped>(callback: (item: Item, id: Id) => Mapped): DataStream<Mapped>;
    /**
     * Get the item with the maximum value of given property.
     *
     * @param callback - The function that picks and possibly converts the property.
     *
     * @returns The item with the maximum if found otherwise null.
     */
    max(callback: (item: Item, id: Id) => number): Item | null;
    /**
     * Get the item with the minimum value of given property.
     *
     * @param callback - The function that picks and possibly converts the property.
     *
     * @returns The item with the minimum if found otherwise null.
     */
    min(callback: (item: Item, id: Id) => number): Item | null;
    /**
     * Reduce the items into a single value.
     *
     * @param callback - The function that does the reduction.
     * @param accumulator - The initial value of the accumulator.
     *
     * @typeParam T - The type of the accumulated value.
     *
     * @returns The reduced value.
     */
    reduce<T>(callback: (accumulator: T, item: Item, id: Id) => T, accumulator: T): T;
    /**
     * Sort the items.
     *
     * @param callback - Item comparator.
     *
     * @returns A new stream with sorted items.
     */
    sort(callback: (itemA: Item, itemB: Item, idA: Id, idB: Id) => number): DataStream<Item>;
}

/**
 * Initial DataSet configuration object.
 *
 * @typeParam IdProp - Name of the property that contains the id.
 */
interface DataSetInitialOptions<IdProp extends string> {
    /**
     * The name of the field containing the id of the items. When data is fetched from a server which uses some specific field to identify items, this field name can be specified in the DataSet using the option `fieldId`. For example [CouchDB](http://couchdb.apache.org/) uses the field `'_id'` to identify documents.
     */
    fieldId?: IdProp;
    /**
     * Queue data changes ('add', 'update', 'remove') and flush them at once. The queue can be flushed manually by calling `DataSet.flush()`, or can be flushed after a configured delay or maximum number of entries.
     *
     * When queue is true, a queue is created with default options. Options can be specified by providing an object.
     */
    queue?: QueueOptions | false;
}
/** DataSet configuration object. */
interface DataSetOptions {
    /**
     * Queue configuration object or false if no queue should be used.
     *
     * - If false and there was a queue before it will be flushed and then removed.
     * - If [[QueueOptions]] the existing queue will be reconfigured or a new queue will be created.
     */
    queue?: Queue | QueueOptions | false;
}
/**
 * # DataSet
 *
 * Vis.js comes with a flexible DataSet, which can be used to hold and
 * manipulate unstructured data and listen for changes in the data. The DataSet
 * is key/value based. Data items can be added, updated and removed from the
 * DataSet, and one can subscribe to changes in the DataSet. The data in the
 * DataSet can be filtered and ordered. Data can be normalized when appending it
 * to the DataSet as well.
 *
 * ## Example
 *
 * The following example shows how to use a DataSet.
 *
 * ```javascript
 * // create a DataSet
 * var options = {};
 * var data = new vis.DataSet(options);
 *
 * // add items
 * // note that the data items can contain different properties and data formats
 * data.add([
 *   {id: 1, text: 'item 1', date: new Date(2013, 6, 20), group: 1, first: true},
 *   {id: 2, text: 'item 2', date: '2013-06-23', group: 2},
 *   {id: 3, text: 'item 3', date: '2013-06-25', group: 2},
 *   {id: 4, text: 'item 4'}
 * ]);
 *
 * // subscribe to any change in the DataSet
 * data.on('*', function (event, properties, senderId) {
 *   console.log('event', event, properties);
 * });
 *
 * // update an existing item
 * data.update({id: 2, group: 1});
 *
 * // remove an item
 * data.remove(4);
 *
 * // get all ids
 * var ids = data.getIds();
 * console.log('ids', ids);
 *
 * // get a specific item
 * var item1 = data.get(1);
 * console.log('item1', item1);
 *
 * // retrieve a filtered subset of the data
 * var items = data.get({
 *   filter: function (item) {
 *     return item.group == 1;
 *   }
 * });
 * console.log('filtered items', items);
 * ```
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
declare class DataSet<Item extends PartItem<IdProp>, IdProp extends string = "id"> extends DataSetPart<Item, IdProp> implements DataInterface<Item, IdProp> {
    /** Flush all queued calls. */
    flush?: () => void;
    /** @inheritDoc */
    length: number;
    /** @inheritDoc */
    get idProp(): IdProp;
    private readonly _options;
    private readonly _data;
    private readonly _idProp;
    private _queue;
    /**
     * @param options - DataSet configuration.
     */
    constructor(options?: DataSetInitialOptions<IdProp>);
    /**
     * @param data - An initial set of items for the new instance.
     * @param options - DataSet configuration.
     */
    constructor(data: Item[], options?: DataSetInitialOptions<IdProp>);
    /**
     * Set new options.
     *
     * @param options - The new options.
     */
    setOptions(options?: DataSetOptions): void;
    /**
     * Add a data item or an array with items.
     *
     * After the items are added to the DataSet, the DataSet will trigger an event `add`. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
     *
     * ## Example
     *
     * ```javascript
     * // create a DataSet
     * const data = new vis.DataSet()
     *
     * // add items
     * const ids = data.add([
     *   { id: 1, text: 'item 1' },
     *   { id: 2, text: 'item 2' },
     *   { text: 'item without an id' }
     * ])
     *
     * console.log(ids) // [1, 2, '<UUIDv4>']
     * ```
     *
     * @param data - Items to be added (ids will be generated if missing).
     * @param senderId - Sender id.
     *
     * @returns addedIds - Array with the ids (generated if not present) of the added items.
     *
     * @throws When an item with the same id as any of the added items already exists.
     */
    add(data: Item | Item[], senderId?: Id | null): (string | number)[];
    /**
     * Update existing items. When an item does not exist, it will be created.
     *
     * @remarks
     * The provided properties will be merged in the existing item. When an item does not exist, it will be created.
     *
     * After the items are updated, the DataSet will trigger an event `add` for the added items, and an event `update`. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
     *
     * ## Example
     *
     * ```javascript
     * // create a DataSet
     * const data = new vis.DataSet([
     *   { id: 1, text: 'item 1' },
     *   { id: 2, text: 'item 2' },
     *   { id: 3, text: 'item 3' }
     * ])
     *
     * // update items
     * const ids = data.update([
     *   { id: 2, text: 'item 2 (updated)' },
     *   { id: 4, text: 'item 4 (new)' }
     * ])
     *
     * console.log(ids) // [2, 4]
     * ```
     *
     * ## Warning for TypeScript users
     * This method may introduce partial items into the data set. Use add or updateOnly instead for better type safety.
     *
     * @param data - Items to be updated (if the id is already present) or added (if the id is missing).
     * @param senderId - Sender id.
     *
     * @returns updatedIds - The ids of the added (these may be newly generated if there was no id in the item from the data) or updated items.
     *
     * @throws When the supplied data is neither an item nor an array of items.
     */
    update(data: DeepPartial<Item> | DeepPartial<Item>[], senderId?: Id | null): Id[];
    /**
     * Update existing items. When an item does not exist, an error will be thrown.
     *
     * @remarks
     * The provided properties will be deeply merged into the existing item.
     * When an item does not exist (id not present in the data set or absent), an error will be thrown and nothing will be changed.
     *
     * After the items are updated, the DataSet will trigger an event `update`.
     * When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
     *
     * ## Example
     *
     * ```javascript
     * // create a DataSet
     * const data = new vis.DataSet([
     *   { id: 1, text: 'item 1' },
     *   { id: 2, text: 'item 2' },
     *   { id: 3, text: 'item 3' },
     * ])
     *
     * // update items
     * const ids = data.update([
     *   { id: 2, text: 'item 2 (updated)' }, // works
     *   // { id: 4, text: 'item 4 (new)' }, // would throw
     *   // { text: 'item 4 (new)' }, // would also throw
     * ])
     *
     * console.log(ids) // [2]
     * ```
     *
     * @param data - Updates (the id and optionally other props) to the items in this data set.
     * @param senderId - Sender id.
     *
     * @returns updatedIds - The ids of the updated items.
     *
     * @throws When the supplied data is neither an item nor an array of items, when the ids are missing.
     */
    updateOnly(data: UpdateItem<Item, IdProp> | UpdateItem<Item, IdProp>[], senderId?: Id | null): Id[];
    /** @inheritDoc */
    get(): FullItem<Item, IdProp>[];
    /** @inheritDoc */
    get(options: DataInterfaceGetOptionsArray<Item>): FullItem<Item, IdProp>[];
    /** @inheritDoc */
    get(options: DataInterfaceGetOptionsObject<Item>): Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    get(options: DataInterfaceGetOptions<Item>): FullItem<Item, IdProp>[] | Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    get(id: Id): null | FullItem<Item, IdProp>;
    /** @inheritDoc */
    get(id: Id, options: DataInterfaceGetOptionsArray<Item>): null | FullItem<Item, IdProp>;
    /** @inheritDoc */
    get(id: Id, options: DataInterfaceGetOptionsObject<Item>): Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    get(id: Id, options: DataInterfaceGetOptions<Item>): null | FullItem<Item, IdProp> | Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    get(ids: Id[]): FullItem<Item, IdProp>[];
    /** @inheritDoc */
    get(ids: Id[], options: DataInterfaceGetOptionsArray<Item>): FullItem<Item, IdProp>[];
    /** @inheritDoc */
    get(ids: Id[], options: DataInterfaceGetOptionsObject<Item>): Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    get(ids: Id[], options: DataInterfaceGetOptions<Item>): FullItem<Item, IdProp>[] | Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    get(ids: Id | Id[], options?: DataInterfaceGetOptions<Item>): null | FullItem<Item, IdProp> | FullItem<Item, IdProp>[] | Record<Id, FullItem<Item, IdProp>>;
    /** @inheritDoc */
    getIds(options?: DataInterfaceGetIdsOptions<Item>): Id[];
    /** @inheritDoc */
    getDataSet(): DataSet<Item, IdProp>;
    /** @inheritDoc */
    forEach(callback: (item: Item, id: Id) => void, options?: DataInterfaceForEachOptions<Item>): void;
    /** @inheritDoc */
    map<T>(callback: (item: Item, id: Id) => T, options?: DataInterfaceMapOptions<Item, T>): T[];
    private _filterFields;
    /**
     * Sort the provided array with items.
     *
     * @param items - Items to be sorted in place.
     * @param order - A field name or custom sort function.
     *
     * @typeParam T - The type of the items in the items array.
     */
    private _sort;
    /**
     * Remove an item or multiple items by “reference” (only the id is used) or by id.
     *
     * The method ignores removal of non-existing items, and returns an array containing the ids of the items which are actually removed from the DataSet.
     *
     * After the items are removed, the DataSet will trigger an event `remove` for the removed items. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
     *
     * ## Example
     * ```javascript
     * // create a DataSet
     * const data = new vis.DataSet([
     *   { id: 1, text: 'item 1' },
     *   { id: 2, text: 'item 2' },
     *   { id: 3, text: 'item 3' }
     * ])
     *
     * // remove items
     * const ids = data.remove([2, { id: 3 }, 4])
     *
     * console.log(ids) // [2, 3]
     * ```
     *
     * @param id - One or more items or ids of items to be removed.
     * @param senderId - Sender id.
     *
     * @returns The ids of the removed items.
     */
    remove(id: Id | Item | (Id | Item)[], senderId?: Id | null): Id[];
    /**
     * Remove an item by its id or reference.
     *
     * @param id - Id of an item or the item itself.
     *
     * @returns The removed item if removed, null otherwise.
     */
    private _remove;
    /**
     * Clear the entire data set.
     *
     * After the items are removed, the [[DataSet]] will trigger an event `remove` for all removed items. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
     *
     * @param senderId - Sender id.
     *
     * @returns removedIds - The ids of all removed items.
     */
    clear(senderId?: Id | null): Id[];
    /**
     * Find the item with maximum value of a specified field.
     *
     * @param field - Name of the property that should be searched for max value.
     *
     * @returns Item containing max value, or null if no items.
     */
    max(field: keyof Item): Item | null;
    /**
     * Find the item with minimum value of a specified field.
     *
     * @param field - Name of the property that should be searched for min value.
     *
     * @returns Item containing min value, or null if no items.
     */
    min(field: keyof Item): Item | null;
    distinct<T extends keyof Item>(prop: T): Item[T][];
    distinct(prop: string): unknown[];
    /**
     * Add a single item. Will fail when an item with the same id already exists.
     *
     * @param item - A new item to be added.
     *
     * @returns Added item's id. An id is generated when it is not present in the item.
     */
    private _addItem;
    /**
     * Update a single item: merge with existing item.
     * Will fail when the item has no id, or when there does not exist an item with the same id.
     *
     * @param update - The new item
     *
     * @returns The id of the updated item.
     */
    private _updateItem;
    /** @inheritDoc */
    stream(ids?: Iterable<Id>): DataStream<Item>;
    get testLeakData(): Map<Id, FullItem<Item, IdProp>>;
    get testLeakIdProp(): IdProp;
    get testLeakOptions(): DataSetInitialOptions<IdProp>;
    get testLeakQueue(): Queue<this> | null;
    set testLeakQueue(v: Queue<this> | null);
}

/** Valid id type. */
declare type Id = number | string;
/** Nullable id type. */
declare type OptId = undefined | null | Id;
/**
 * Make an object deeply partial.
 */
declare type DeepPartial<T> = T extends any[] | Function | Node ? T : T extends object ? {
    [key in keyof T]?: DeepPartial<T[key]>;
} : T;
/**
 * An item that may ([[Id]]) or may not (absent, undefined or null) have an id property.
 *
 * @typeParam IdProp - Name of the property that contains the id.
 */
declare type PartItem<IdProp extends string> = Partial<Record<IdProp, OptId>>;
/**
 * An item that has a property containing an id and all other required properties of given item type.
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
declare type FullItem<Item extends PartItem<IdProp>, IdProp extends string> = Item & Record<IdProp, Id>;
/**
 * An item that has a property containing an id and optionally other properties of given item type.
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
declare type UpdateItem<Item extends PartItem<IdProp>, IdProp extends string> = Assignable<FullItem<Item, IdProp>> & Record<IdProp, Id>;
/** Add event payload. */
interface AddEventPayload {
    /** Ids of added items. */
    items: Id[];
}
/** Update event payload. */
interface UpdateEventPayload<Item, IdProp extends string> {
    /** Ids of updated items. */
    items: Id[];
    /** Items as they were before this update. */
    oldData: FullItem<Item, IdProp>[];
    /**
     * Items as they are now.
     *
     * @deprecated Just get the data from the data set or data view.
     */
    data: FullItem<Item, IdProp>[];
}
/** Remove event payload. */
interface RemoveEventPayload<Item, IdProp extends string> {
    /** Ids of removed items. */
    items: Id[];
    /** Items as they were before their removal. */
    oldData: FullItem<Item, IdProp>[];
}
/**
 * Map of event payload types (event name → payload).
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
interface EventPayloads<Item, IdProp extends string> {
    add: AddEventPayload;
    update: UpdateEventPayload<Item, IdProp>;
    remove: RemoveEventPayload<Item, IdProp>;
}
/**
 * Map of event callback types (event name → callback).
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
interface EventCallbacks<Item, IdProp extends string> {
    /**
     * @param name - The name of the event ([[EventName]]).
     * @param payload - Data about the items affected by this event.
     * @param senderId - A senderId, optionally provided by the application code which triggered the event. If senderId is not provided, the argument will be `null`.
     */
    add(name: "add", payload: AddEventPayload | null, senderId?: Id | null): void;
    /**
     * @param name - The name of the event ([[EventName]]).
     * @param payload - Data about the items affected by this event.
     * @param senderId - A senderId, optionally provided by the application code which triggered the event. If senderId is not provided, the argument will be `null`.
     */
    update(name: "update", payload: UpdateEventPayload<Item, IdProp> | null, senderId?: Id | null): void;
    /**
     * @param name - The name of the event ([[EventName]]).
     * @param payload - Data about the items affected by this event.
     * @param senderId - A senderId, optionally provided by the application code which triggered the event. If senderId is not provided, the argument will be `null`.
     */
    remove(name: "remove", payload: RemoveEventPayload<Item, IdProp> | null, senderId?: Id | null): void;
}
/**
 * Map of event callback types including any event (event name → callback).
 *
 * @typeParam Item - Item type that may or may not have an id.
 * @typeParam IdProp - Name of the property that contains the id.
 */
interface EventCallbacksWithAny<Item, IdProp extends string> extends EventCallbacks<Item, IdProp> {
    /**
     * @param name - The name of the event ([[EventName]]).
     * @param payload - Data about the items affected by this event.
     * @param senderId - A senderId, optionally provided by the application code which triggered the event. If senderId is not provided, the argument will be `null`.
     */
    "*"<N extends keyof EventCallbacks<Item, IdProp>>(name: N, payload: EventPayloads<Item, IdProp>[N], senderId?: Id | null): void;
}
/**
 * Data interface order parameter.
 * - A string value determines which property will be used for sorting (using < and > operators for numeric comparison).
 * - A function will be used the same way as in Array.sort.
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
declare type DataInterfaceOrder<Item> = keyof Item | ((a: Item, b: Item) => number);
/**
 * Data interface get options (return type independent).
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
interface DataInterfaceGetOptionsBase<Item> {
    /**
     * An array with field names, or an object with current field name and new field name that the field is returned as. By default, all properties of the items are emitted. When fields is defined, only the properties whose name is specified in fields will be included in the returned items.
     *
     * @remarks
     * **Warning**: There is no TypeScript support for this.
     */
    fields?: string[] | Record<string, string>;
    /** Items can be filtered on specific properties by providing a filter function. A filter function is executed for each of the items in the DataSet, and is called with the item as parameter. The function must return a boolean. All items for which the filter function returns true will be emitted. */
    filter?: (item: Item) => boolean;
    /** Order the items by a field name or custom sort function. */
    order?: DataInterfaceOrder<Item>;
}
/**
 * Data interface get options (returns a single item or an array).
 *
 * @remarks
 * Whether an item or and array of items is returned is determined by the type of the id(s) argument.
 * If an array of ids is requested an array of items will be returned.
 * If a single id is requested a single item (or null if the id doesn't correspond to any item) will be returned.
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
interface DataInterfaceGetOptionsArray<Item> extends DataInterfaceGetOptionsBase<Item> {
    /** Items will be returned as a single item (if invoked with an id) or an array of items (if invoked with an array of ids). */
    returnType?: undefined | "Array";
}
/**
 * Data interface get options (returns an object).
 *
 * @remarks
 * The returned object has ids as keys and items as values of corresponding ids.
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
interface DataInterfaceGetOptionsObject<Item> extends DataInterfaceGetOptionsBase<Item> {
    /** Items will be returned as an object map (id → item). */
    returnType: "Object";
}
/**
 * Data interface get options (returns single item, an array or object).
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
declare type DataInterfaceGetOptions<Item> = DataInterfaceGetOptionsArray<Item> | DataInterfaceGetOptionsObject<Item>;
/**
 * Data interface get ids options.
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
interface DataInterfaceGetIdsOptions<Item> {
    /** Items can be filtered on specific properties by providing a filter function. A filter function is executed for each of the items in the DataSet, and is called with the item as parameter. The function must return a boolean. All items for which the filter function returns true will be emitted. */
    filter?: (item: Item) => boolean;
    /** Order the items by a field name or custom sort function. */
    order?: DataInterfaceOrder<Item>;
}
/**
 * Data interface for each options.
 *
 * @typeParam Item - Item type that may or may not have an id.
 */
interface DataInterfaceForEachOptions<Item> {
    /** An array with field names, or an object with current field name and new field name that the field is returned as. By default, all properties of the items are emitted. When fields is defined, only the properties whose name is specified in fields will be included in the returned items. */
    fields?: string[] | Record<string, string>;
    /** Items can be filtered on specific properties by providing a filter function. A filter function is executed for each of the items in the DataSet, and is called with the item as parameter. The function must return a boolean. All items for which the filter function returns true will be emitted. */
    filter?: (item: Item) => boolean;
    /** Order the items by a field name or custom sort function. */
    order?: DataInterfaceOrder<Item>;
}
/**
 * Data interface map oprions.
 *
 * @typeParam Original - The original item type in the data.
 * @typeParam Mapped - The type after mapping.
 */
interface DataInterfaceMapOptions<Original, Mapped> {
    /** An array with field names, or an object with current field name and new field name that the field is returned as. By default, all properties of the items are emitted. When fields is defined, only the properties whose name is specified in fields will be included in the returned items. */
    fields?: string[] | Record<string, string>;
    /** Items can be filtered on specific properties by providing a filter function. A filter function is executed for each of the items in the DataSet, and is called with the item as parameter. The function must return a boolean. All items for which the filter function returns true will be emitted. */
    filter?: (item: Original) => boolean;
    /** Order the items by a field name or custom sort function. */
    order?: DataInterfaceOrder<Mapped>;
}
/**
 * Common interface for data sets and data view.
 *
 * @typeParam Item - Item type that may or may not have an id (missing ids will be generated upon insertion).
 * @typeParam IdProp - Name of the property on the Item type that contains the id.
 */
interface DataInterface<Item extends PartItem<IdProp>, IdProp extends string = "id"> {
    /** The number of items. */
    length: number;
    /** The key of id property. */
    idProp: IdProp;
    /**
     * Add a universal event listener.
     *
     * @remarks The `*` event is triggered when any of the events `add`, `update`, and `remove` occurs.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    on(event: "*", callback: EventCallbacksWithAny<Item, IdProp>["*"]): void;
    /**
     * Add an `add` event listener.
     *
     * @remarks The `add` event is triggered when an item or a set of items is added, or when an item is updated while not yet existing.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    on(event: "add", callback: EventCallbacksWithAny<Item, IdProp>["add"]): void;
    /**
     * Add a `remove` event listener.
     *
     * @remarks The `remove` event is triggered when an item or a set of items is removed.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    on(event: "remove", callback: EventCallbacksWithAny<Item, IdProp>["remove"]): void;
    /**
     * Add an `update` event listener.
     *
     * @remarks The `update` event is triggered when an existing item or a set of existing items is updated.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    on(event: "update", callback: EventCallbacksWithAny<Item, IdProp>["update"]): void;
    /**
     * Remove a universal event listener.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    off(event: "*", callback: EventCallbacksWithAny<Item, IdProp>["*"]): void;
    /**
     * Remove an `add` event listener.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    off(event: "add", callback: EventCallbacksWithAny<Item, IdProp>["add"]): void;
    /**
     * Remove a `remove` event listener.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    off(event: "remove", callback: EventCallbacksWithAny<Item, IdProp>["remove"]): void;
    /**
     * Remove an `update` event listener.
     *
     * @param event - Event name.
     * @param callback - Callback function.
     */
    off(event: "update", callback: EventCallbacksWithAny<Item, IdProp>["update"]): void;
    /**
     * Get all the items.
     *
     * @returns An array containing all the items.
     */
    get(): FullItem<Item, IdProp>[];
    /**
     * Get all the items.
     *
     * @param options - Additional options.
     *
     * @returns An array containing requested items.
     */
    get(options: DataInterfaceGetOptionsArray<Item>): FullItem<Item, IdProp>[];
    /**
     * Get all the items.
     *
     * @param options - Additional options.
     *
     * @returns An object map of items (may be an empty object if there are no items).
     */
    get(options: DataInterfaceGetOptionsObject<Item>): Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get all the items.
     *
     * @param options - Additional options.
     *
     * @returns An array containing requested items or if requested an object map of items (may be an empty object if there are no items).
     */
    get(options: DataInterfaceGetOptions<Item>): FullItem<Item, IdProp>[] | Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get one item.
     *
     * @param id - The id of the item.
     *
     * @returns The item or null if the id doesn't correspond to any item.
     */
    get(id: Id): null | FullItem<Item, IdProp>;
    /**
     * Get one item.
     *
     * @param id - The id of the item.
     * @param options - Additional options.
     *
     * @returns The item or null if the id doesn't correspond to any item.
     */
    get(id: Id, options: DataInterfaceGetOptionsArray<Item>): null | FullItem<Item, IdProp>;
    /**
     * Get one item.
     *
     * @param id - The id of the item.
     * @param options - Additional options.
     *
     * @returns An object map of items (may be an empty object if no item was found).
     */
    get(id: Id, options: DataInterfaceGetOptionsObject<Item>): Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get one item.
     *
     * @param id - The id of the item.
     * @param options - Additional options.
     *
     * @returns The item if found or null otherwise. If requested an object map with 0 to 1 items.
     */
    get(id: Id, options: DataInterfaceGetOptions<Item>): null | FullItem<Item, IdProp> | Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get multiple items.
     *
     * @param ids - An array of requested ids.
     *
     * @returns An array of found items (ids that do not correspond to any item are omitted).
     */
    get(ids: Id[]): FullItem<Item, IdProp>[];
    /**
     * Get multiple items.
     *
     * @param ids - An array of requested ids.
     * @param options - Additional options.
     *
     * @returns An array of found items (ids that do not correspond to any item are omitted).
     */
    get(ids: Id[], options: DataInterfaceGetOptionsArray<Item>): FullItem<Item, IdProp>[];
    /**
     * Get multiple items.
     *
     * @param ids - An array of requested ids.
     * @param options - Additional options.
     *
     * @returns An object map of items (may be an empty object if no item was found).
     */
    get(ids: Id[], options: DataInterfaceGetOptionsObject<Item>): Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get multiple items.
     *
     * @param ids - An array of requested ids.
     * @param options - Additional options.
     *
     * @returns An array of found items (ids that do not correspond to any item are omitted).
     * If requested an object map of items (may be an empty object if no item was found).
     */
    get(ids: Id[], options: DataInterfaceGetOptions<Item>): FullItem<Item, IdProp>[] | Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get items.
     *
     * @param ids - Id or ids to be returned.
     * @param options - Options to specify iteration details.
     *
     * @returns The items (format is determined by ids (single or array) and the options.
     */
    get(ids: Id | Id[], options?: DataInterfaceGetOptions<Item>): null | FullItem<Item, IdProp> | FullItem<Item, IdProp>[] | Record<Id, FullItem<Item, IdProp>>;
    /**
     * Get the DataSet to which the instance implementing this interface is connected.
     * In case there is a chain of multiple DataViews, the root DataSet of this chain is returned.
     *
     * @returns The data set that actually contains the data.
     */
    getDataSet(): DataSet<Item, IdProp>;
    /**
     * Get ids of items.
     *
     * @remarks
     * No guarantee is given about the order of returned ids unless an ordering function is supplied.
     *
     * @param options - Additional configuration.
     *
     * @returns An array of requested ids.
     */
    getIds(options?: DataInterfaceGetIdsOptions<Item>): Id[];
    /**
     * Execute a callback function for each item.
     *
     * @remarks
     * No guarantee is given about the order of iteration unless an ordering function is supplied.
     *
     * @param callback - Executed in similar fashion to Array.forEach callback, but instead of item, index, array receives item, id.
     * @param options - Options to specify iteration details.
     */
    forEach(callback: (item: Item, id: Id) => void, options?: DataInterfaceForEachOptions<Item>): void;
    /**
     * Map each item into different item and return them as an array.
     *
     * @remarks
     * No guarantee is given about the order of iteration even if ordering function is supplied (the items are sorted after the mapping).
     *
     * @param callback - Array.map-like callback, but only with the first two params.
     * @param options - Options to specify iteration details.
     *
     * @returns The mapped items.
     */
    map<T>(callback: (item: Item, id: Id) => T, options?: DataInterfaceMapOptions<Item, T>): T[];
    /**
     * Stream.
     *
     * @param ids - Ids of the items to be included in this stream (missing are ignored), all if omitted.
     *
     * @returns The data stream for this data set.
     */
    stream(ids?: Iterable<Id>): DataStream<Item>;
}

// Type definitions for vis.js 8.3.2

type DataInterfaceEdges = DataInterface<Edge, 'id'>
type DataInterfaceNodes = DataInterface<Node$1, 'id'>

type IdType = string | number;
type DirectionType = 'from' | 'to';

/**
 * If true (default) or an Object, the range is animated smoothly to the new window.
 * An object can be provided to specify duration and easing function.
 * Default duration is 500 ms, and default easing function is 'easeInOutQuad'.
 */
type TimelineAnimationType = boolean | AnimationOptions;

type NetworkEvents =
  'click' |
  'doubleClick' |
  'oncontext' |
  'hold' |
  'release' |
  'select' |
  'selectNode' |
  'selectEdge' |
  'deselectNode' |
  'deselectEdge' |
  'dragStart' |
  'dragging' |
  'dragEnd' |
  'controlNodeDragging' |
  'controlNodeDragEnd' |
  'hoverNode' |
  'blurNode' |
  'hoverEdge' |
  'blurEdge' |
  'zoom' |
  'showPopup' |
  'hidePopup' |
  'startStabilizing' |
  'stabilizationProgress' |
  'stabilizationIterationsDone' |
  'stabilized' |
  'resize' |
  'initRedraw' |
  'beforeDrawing' |
  'afterDrawing' |
  'animationFinished' |
  'configChange';

/**
 * Network is a visualization to display networks and networks consisting of nodes and edges.
 * The visualization is easy to use and supports custom shapes, styles, colors, sizes, images, and more.
 * The network visualization works smooth on any modern browser for up to a few thousand nodes and edges.
 * To handle a larger amount of nodes, Network has clustering support. Network uses HTML canvas for rendering.
 */
declare class Network {
  /**
   * Creates an instance of Network.
   *
   * @param container the HTML element representing the network container
   * @param data network data
   * @param [options] optional network options
   */
  constructor(container: HTMLElement, data: Data$1, options?: Options$2);

  /**
   * 	Remove the network from the DOM and remove all Hammer bindings and references.
   */
  destroy(): void;

  /**
   * Override all the data in the network.
   * If stabilization is enabled in the physics module,
   * the network will stabilize again.
   * This method is also performed when first initializing the network.
   *
   * @param data network data
   */
  setData(data: Data$1): void;

  /**
   * Set the options.
   * All available options can be found in the modules above.
   * Each module requires it's own container with the module name to contain its options.
   *
   * @param options network options
   */
  setOptions(options: Options$2): void;

  /**
   * Set an event listener.
   * Depending on the type of event you get different parameters for the callback function.
   *
   * @param eventName the name of the event, f.e. 'click'
   * @param callback the callback function that will be raised
   */
  on(eventName: NetworkEvents, callback: (params?: any) => void): void;

  /**
   * Remove an event listener.
   * The function you supply has to be the exact same as the one you used in the on function.
   * If no function is supplied, all listeners will be removed.
   *
   * @param eventName the name of the event, f.e. 'click'
   * @param [callback] the exact same callback function that was used when calling 'on'
   */
  off(eventName: NetworkEvents, callback?: (params?: any) => void): void;

  /**
   * Set an event listener only once.
   * After it has taken place, the event listener will be removed.
   * Depending on the type of event you get different parameters for the callback function.
   *
   * @param eventName the name of the event, f.e. 'click'
   * @param callback the callback function that will be raised once
   */
  once(eventName: NetworkEvents, callback: (params?: any) => void): void;

  /**
   * This function converts canvas coordinates to coordinates on the DOM.
   * Input and output are in the form of {x:Number, y:Number} (IPosition interface).
   * The DOM values are relative to the network container.
   *
   * @param position the canvas coordinates
   * @returns the DOM coordinates
   */
  canvasToDOM(position: Position): Position;

  /**
   * This function converts DOM coordinates to coordinates on the canvas.
   * Input and output are in the form of {x:Number,y:Number} (IPosition interface).
   * The DOM values are relative to the network container.
   *
   * @param position the DOM coordinates
   * @returns the canvas coordinates
   */
  DOMtoCanvas(position: Position): Position;

  /**
   * Redraw the network.
   */
  redraw(): void;

  /**
   * Set the size of the canvas.
   * This is automatically done on a window resize.
   *
   * @param width width in a common format, f.e. '100px'
   * @param height height in a common format, f.e. '100px'
   */
  setSize(width: string, height: string): void;

  /**
   * The joinCondition function is presented with all nodes.
   */
  cluster(options?: ClusterOptions): void;

  /**
   * 	This method looks at the provided node and makes a cluster of it and all it's connected nodes.
   * The behaviour can be customized by proving the options object.
   * All options of this object are explained below.
   * The joinCondition is only presented with the connected nodes.
   *
   * @param nodeId the id of the node
   * @param [options] the cluster options
   */
  clusterByConnection(nodeId: string, options?: ClusterOptions): void;

  /**
   * This method checks all nodes in the network and those with a equal or higher
   * amount of edges than specified with the hubsize qualify.
   * If a hubsize is not defined, the hubsize will be determined as the average
   * value plus two standard deviations.
   * For all qualifying nodes, clusterByConnection is performed on each of them.
   * The options object is described for clusterByConnection and does the same here.
   *
   * @param [hubsize] optional hubsize
   * @param [options] optional cluster options
   */
  clusterByHubsize(hubsize?: number, options?: ClusterOptions): void;

  /**
   * This method will cluster all nodes with 1 edge with their respective connected node.
   *
   * @param [options] optional cluster options
   */
  clusterOutliers(options?: ClusterOptions): void;

  /**
   * Nodes can be in clusters.
   * Clusters can also be in clusters.
   * This function returns an array of nodeIds showing where the node is.
   *
   * Example:
   * cluster 'A' contains cluster 'B', cluster 'B' contains cluster 'C',
   * cluster 'C' contains node 'fred'.
   *
   * network.clustering.findNode('fred') will return ['A','B','C','fred'].
   *
   * @param nodeId the node id.
   * @returns an array of nodeIds showing where the node is
   */
  findNode(nodeId: IdType): IdType[];

  /**
   * Similar to findNode in that it returns all the edge ids that were
   * created from the provided edge during clustering.
   *
   * @param baseEdgeId the base edge id
   * @returns an array of edgeIds
   */
  getClusteredEdges(baseEdgeId: IdType): IdType[];

  /**
   * When a clusteredEdgeId is available, this method will return the original
   * baseEdgeId provided in data.edges ie.
   * After clustering the 'SelectEdge' event is fired but provides only the clustered edge.
   * This method can then be used to return the baseEdgeId.
   */
  getBaseEdge(clusteredEdgeId: IdType): IdType;

  /**
   * For the given clusteredEdgeId, this method will return all the original
   * base edge id's provided in data.edges.
   * For a non-clustered (i.e. 'base') edge, clusteredEdgeId is returned.
   * Only the base edge id's are returned.
   * All clustered edges id's under clusteredEdgeId are skipped,
   * but scanned recursively to return their base id's.
   */
  getBaseEdges(clusteredEdgeId: IdType): IdType[];

  /**
   * Visible edges between clustered nodes are not the same edge as the ones provided
   * in data.edges passed on network creation. With each layer of clustering, copies of
   * the edges between clusters are created and the previous edges are hidden,
   * until the cluster is opened. This method takes an edgeId (ie. a base edgeId from data.edges)
   * and applys the options to it and any edges that were created from it while clustering.
   */
  updateEdge(startEdgeId: IdType, options?: EdgeOptions): void;

  /**
   * Clustered Nodes when created are not contained in the original data.nodes
   * passed on network creation. This method updates the cluster node.
   */
  updateClusteredNode(clusteredNodeId: IdType, options?: NodeOptions): void;

  /**
   * Returns true if the node whose ID has been supplied is a cluster.
   *
   * @param nodeId the node id.
   */
  isCluster(nodeId: IdType): boolean;

  /**
   * Returns an array of all nodeIds of the nodes that
   * would be released if you open the cluster.
   *
   * @param clusterNodeId the id of the cluster node
   */
  getNodesInCluster(clusterNodeId: IdType): IdType[];

  /**
   * Opens the cluster, releases the contained nodes and edges,
   * removing the cluster node and cluster edges.
   * The options object is optional and currently supports one option,
   * releaseFunction, which is a function that can be used to manually
   * position the nodes after the cluster is opened.
   *
   * @param nodeId the node id
   * @param [options] optional open cluster options
   */
  openCluster(nodeId: IdType, options?: OpenClusterOptions): void;

  /**
   * If you like the layout of your network
   * and would like it to start in the same way next time,
   * ask for the seed using this method and put it in the layout.randomSeed option.
   *
   * @returns the current seed of the network.
   */
  getSeed(): number | string;

  /**
   * 	Programatically enable the edit mode.
   * Similar effect to pressing the edit button.
   */
  enableEditMode(): void;

  /**
   * Programatically disable the edit mode.
   * Similar effect to pressing the close icon (small cross in the corner of the toolbar).
   */
  disableEditMode(): void;

  /**
   * 	Go into addNode mode. Having edit mode or manipulation enabled is not required.
   * To get out of this mode, call disableEditMode().
   * The callback functions defined in handlerFunctions still apply.
   * To use these methods without having the manipulation GUI, make sure you set enabled to false.
   */
  addNodeMode(): void;

  /**
   * Edit the selected node.
   * The explaination from addNodeMode applies here as well.
   */
  editNode(): void;

  /**
   * Go into addEdge mode.
   * The explaination from addNodeMode applies here as well.
   */
  addEdgeMode(): void;

  /**
   * Go into editEdge mode.
   * The explaination from addNodeMode applies here as well.
   */
  editEdgeMode(): void;

  /**
   * Delete selected.
   * Having edit mode or manipulation enabled is not required.
   */
  deleteSelected(): void;

  /**
   * Returns the x y positions in canvas space of a requested node or array of nodes.
   * 
   * @remarks
   * - If `nodeIds` is supplied as a single id that does not correspond
   * to a node in the network, this function will return an empty object.
   * - If `nodeIds` is supplied as an array of ids, but one or more do not correspond to a node in the network, the
   * returned object will *not* include entries for the non-existent node positions.
   *
   * @param nodeIds - Either an array of node ids or a single node id. If not supplied, all node ids in the network will be used.
   * @returns A an object containing the x y positions in canvas space of the nodes in the network, keyed by id.
   */
  getPositions(nodeIds?: IdType[] | IdType): { [nodeId: string]: Position };

  /**
   * Retrieves the x y position of a specific id.
   * 
   * @param id - a node id
   * @returns the x y position in canvas space of the requested node.
   * 
   * @throws {@link TypeError} 
   *  Thrown if an undefined or null id is provided as a parameter.
   * @throws {@link ReferenceError} 
   *  Thrown if the id provided as a parameter does not correspond to a node in the network.
   */
  getPosition(nodeId: IdType): Position;

  /**
   * 	When using the vis.DataSet to load your nodes into the network,
   * this method will put the X and Y positions of all nodes into that dataset.
   * If you're loading your nodes from a database and have this dynamically coupled with the DataSet,
   * you can use this to stablize your network once, then save the positions in that database
   * through the DataSet so the next time you load the nodes, stabilization will be near instantaneous.
   *
   * If the nodes are still moving and you're using dynamic smooth edges (which is on by default),
   * you can use the option stabilization.onlyDynamicEdges in the physics module to improve initialization time.
   *
   * This method does not support clustering.
   * At the moment it is not possible to cache positions when using clusters since
   * they cannot be correctly initialized from just the positions.
   */
  storePositions(): void;

  /**
   * You can use this to programatically move a node.
   * The supplied x and y positions have to be in canvas space!
   *
   * @param nodeId the node that will be moved
   * @param x new canvas space x position
   * @param y new canvas space y position
   */
  moveNode(nodeId: IdType, x: number, y: number): void;

  /**
   * Returns a bounding box for the node including label.
   *
   */
  getBoundingBox(nodeId: IdType): BoundingBox;

  /**
   * Returns an array of nodeIds of the all the nodes that are directly connected to this node.
   * If you supply an edgeId, vis will first match the id to nodes.
   * If no match is found, it will search in the edgelist and return an array: [fromId, toId].
   *
   * @param nodeOrEdgeId a node or edge id
   */
  getConnectedNodes(nodeOrEdgeId: IdType, direction?: DirectionType): IdType[] | Array<{ fromId: IdType, toId: IdType }>;

  /**
   * Returns an array of edgeIds of the edges connected to this node.
   *
   * @param nodeId the node id
   */
  getConnectedEdges(nodeId: IdType): IdType[];

  /**
   * Start the physics simulation.
   * This is normally done whenever needed and is only really useful
   * if you stop the simulation yourself and wish to continue it afterwards.
   */
  startSimulation(): void;

  /**
   * This stops the physics simulation and triggers a stabilized event.
   * Tt can be restarted by dragging a node,
   * altering the dataset or calling startSimulation().
   */
  stopSimulation(): void;

  /**
   * You can manually call stabilize at any time.
   * All the stabilization options above are used.
   * You can optionally supply the number of iterations it should do.
   *
   * @param [iterations] the number of iterations it should do
   */
  stabilize(iterations?: number): void;

  /**
   * Returns an object with selected nodes and edges ids.
   *
   */
  getSelection(): { nodes: IdType[], edges: IdType[] };

  /**
   * Returns an array of selected node ids like so:
   * [nodeId1, nodeId2, ..].
   *
   */
  getSelectedNodes(): IdType[];

  /**
   * Returns an array of selected edge ids like so:
   * [edgeId1, edgeId2, ..].
   *
   */
  getSelectedEdges(): IdType[];

  /**
   * Returns a nodeId or undefined.
   * The DOM positions are expected to be in pixels from the top left corner of the canvas.
   *
   */
  getNodeAt(position: Position): IdType;

  /**
   * Returns a edgeId or undefined.
   * The DOM positions are expected to be in pixels from the top left corner of the canvas.
   *
   */
  getEdgeAt(position: Position): IdType;

  /**
   * Selects the nodes corresponding to the id's in the input array.
   * If highlightEdges is true or undefined, the neighbouring edges will also be selected.
   * This method unselects all other objects before selecting its own objects. Does not fire events.
   *
   */
  selectNodes(nodeIds: IdType[], highlightEdges?: boolean): void;

  /**
   * Selects the edges corresponding to the id's in the input array.
   * This method unselects all other objects before selecting its own objects.
   * Does not fire events.
   *
   */
  selectEdges(edgeIds: IdType[]): void;

  /**
   * Sets the selection.
   * You can also pass only nodes or edges in selection object.
   *
   */
  setSelection(selection: { nodes?: IdType[], edges?: IdType[] }, options?: SelectionOptions): void;

  /**
   * Unselect all objects.
   * Does not fire events.
   */
  unselectAll(): void;

  /**
   * Returns the current scale of the network.
   * 1.0 is comparible to 100%, 0 is zoomed out infinitely.
   *
   * @returns the current scale of the network
   */
  getScale(): number;

  /**
   * Returns the current central focus point of the view in the form: { x: {Number}, y: {Number} }
   *
   * @returns the view position;
   */
  getViewPosition(): Position;

  /**
   * Zooms out so all nodes fit on the canvas.
   *
   * @param [options] All options are optional for the fit method
   */
  fit(options?: FitOptions): void;

  /**
   * You can focus on a node with this function.
   * What that means is the view will lock onto that node, if it is moving, the view will also move accordingly.
   * If the view is dragged by the user, the focus is broken. You can supply options to customize the effect.
   *
   */
  focus(nodeId: IdType, options?: FocusOptions): void;

  /**
   * You can animate or move the camera using the moveTo method.
   *
   */
  moveTo(options: MoveToOptions): void;

  /**
   * Programatically release the focussed node.
   */
  releaseNode(): void;

  /**
   * If you use the configurator, you can call this method to get an options object that contains
   * all differences from the default options caused by users interacting with the configurator.
   *
   */
  getOptionsFromConfigurator(): any;
}

/**
 * Options interface for focus function.
 */
interface FocusOptions extends ViewPortOptions {
  /**
   * Locked denotes whether or not the view remains locked to
   * the node once the zoom-in animation is finished.
   * Default value is true.
   */
  locked?: boolean;
}

/**
 * Base options interface for some viewport functions.
 */
interface ViewPortOptions {
  /**
   * The scale is the target zoomlevel.
   * Default value is 1.0.
   */
  scale?: number;

  /**
   * The offset (in DOM units) is how many pixels from the center the view is focussed.
   * Default value is {x:0,y:0}
   */
  offset?: Position;

  /**
   * For animation you can either use a Boolean to use it with the default options or
   * disable it or you can define the duration (in milliseconds) and easing function manually.
   */
  animation?: AnimationOptions | boolean;
}

/**
 * You will have to define at least a scale, position or offset.
 * Otherwise, there is nothing to move to.
 */
interface MoveToOptions extends ViewPortOptions {
  /**
   * The position (in canvas units!) is the position of the central focus point of the camera.
   */
  position?: Position;
}

/**
 * Animation options interface.
 */
interface AnimationOptions {
  /**
   * The duration (in milliseconds).
   */
  duration: number;
  /**
   * The easing function.
   *
   * Available are:
   * linear, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic,
   * easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart,
   * easeInQuint, easeOutQuint, easeInOutQuint.
   */
  easingFunction: EasingFunction;
}

type EasingFunction =
  'linear' |
  'easeInQuad' |
  'easeOutQuad' |
  'easeInOutQuad' |
  'easeInCubic' |
  'easeOutCubic' |
  'easeInOutCubic' |
  'easeInQuart' |
  'easeOutQuart' |
  'easeInOutQuart' |
  'easeInQuint' |
  'easeOutQuint' |
  'easeInOutQuint';

/**
 * Optional options for the fit method.
 */
interface FitOptions {
  /**
   * The nodes can be used to zoom to fit only specific nodes in the view.
   */
  nodes?: IdType[];

  /**
   * How far away can be zoomed out, the default is just above 0.
   *
   * @remarks
   * Values less than 1 mean zooming out, more than 1 means zooming in.
   */
  minZoomLevel?: number;

  /**
   * How close can be zoomed in, the default is 1.
   *
   * @remarks
   * Values less than 1 mean zooming out, more than 1 means zooming in.
   */
  maxZoomLevel?: number;

  /**
   * For animation you can either use a Boolean to use it with the default options or
   * disable it or you can define the duration (in milliseconds) and easing function manually.
   */
  animation?: TimelineAnimationType;
}

interface SelectionOptions {
  unselectAll?: boolean;
  highlightEdges?: boolean;
}

/**
 * These values are in canvas space.
 */
interface BoundingBox {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * Cluster methods options interface.
 */
interface ClusterOptions {
  /**
   * Optional for all but the cluster method.
   * The cluster module loops over all nodes that are selected to be in the cluster
   * and calls this function with their data as argument. If this function returns true,
   * this node will be added to the cluster. You have access to all options (including the default)
   * as well as any custom fields you may have added to the node to determine whether or not to include it in the cluster.
   */
  joinCondition?(nodeOptions: any): boolean;

  /**
   * Optional.
   * Before creating the new cluster node, this (optional) function will be called with the properties
   * supplied by you (clusterNodeProperties), all contained nodes and all contained edges.
   * You can use this to update the properties of the cluster based on which items it contains.
   * The function should return the properties to create the cluster node.
   */
  processProperties?(clusterOptions: any, childNodesOptions: any[], childEdgesOptions: any[]): any;

  /**
   * Optional.
   * This is an object containing the options for the cluster node.
   * All options described in the nodes module are allowed.
   * This allows you to style your cluster node any way you want.
   * This is also the style object that is provided in the processProperties function for fine tuning.
   * If undefined, default node options will be used.
   */
  clusterNodeProperties?: NodeOptions;

  /**
   * Optional.
   * This is an object containing the options for the edges connected to the cluster.
   * All options described in the edges module are allowed.
   * Using this, you can style the edges connecting to the cluster any way you want.
   * If none are provided, the options from the edges that are replaced are used.
   * If undefined, default edge options will be used.
   */
  clusterEdgeProperties?: EdgeOptions;
}

/**
 * Options for the openCluster function of Network.
 */
interface OpenClusterOptions {
  /**
   * A function that can be used to manually position the nodes after the cluster is opened.
   * The containedNodesPositions contain the positions of the nodes in the cluster at the
   * moment they were clustered. This function is expected to return the newPositions,
   * which can be the containedNodesPositions (altered) or a new object.
   * This has to be an object with keys equal to the nodeIds that exist in the
   * containedNodesPositions and an {x:x,y:y} position object.
   *
   * For all nodeIds not listed in this returned object,
   * we will position them at the location of the cluster.
   * This is also the default behaviour when no releaseFunction is defined.
   */
  releaseFunction(
    clusterPosition: Position,
    containedNodesPositions: { [nodeId: string]: Position }): { [nodeId: string]: Position };
}

interface Position {
  x: number;
  y: number;
}

interface Data$1 {
  nodes?: Node$1[] | DataInterfaceNodes;
  edges?: Edge[] | DataInterfaceEdges;
}

interface Node$1 extends NodeOptions {
  id?: IdType;
}

interface Edge extends EdgeOptions {
  from?: IdType;
  to?: IdType;
  id?: IdType;
}

interface Locales {
  [language: string]: LocaleMessages | undefined;
  en?: LocaleMessages;
  cn?: LocaleMessages;
  de?: LocaleMessages;
  es?: LocaleMessages;
  it?: LocaleMessages;
  nl?: LocaleMessages;
  'pt-br'?: LocaleMessages;
  ru?: LocaleMessages;
}

interface LocaleMessages {
  edit: string;
  del: string;
  back: string;
  addNode: string;
  addEdge: string;
  editNode: string;
  editEdge: string;
  addDescription: string;
  edgeDescription: string;
  editEdgeDescription: string;
  createEdgeError: string;
  deleteClusterError: string;
  editClusterError: string;
}

interface Options$2 {
  autoResize?: boolean;

  width?: string;

  height?: string;

  locale?: string;

  locales?: Locales;

  clickToUse?: boolean;

  configure?: any; // https://visjs.github.io/vis-network/docs/network/configure.html

  edges?: EdgeOptions;

  nodes?: NodeOptions;

  groups?: any;

  layout?: any; // https://visjs.github.io/vis-network/docs/network/layout.html

  interaction?: any; // https://visjs.github.io/vis-network/docs/network/interaction.html?keywords=edges

  manipulation?: any; // https://visjs.github.io/vis-network/docs/network/manipulation.html

  physics?: any; // https://visjs.github.io/vis-network/docs/network/physics.html
}

interface Image {
  unselected?: string;
  selected?: string;
}

interface ImagePadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface Color {
  border?: string;

  background?: string;

  highlight?: string | {
    border?: string;
    background?: string;
  };

  hover?: string | {
    border?: string;
    background?: string;
  };
}

interface ChosenLabelValues {
  color: string;
  face: string;
  mod: string;
  size: number;
  strokeColor: string;
  strokeWidth: number;
  vadjust: number;
}
type NodeChosenLabelFunction = (
  values: ChosenLabelValues,
  id: IdType,
  selected: boolean,
  hovered: boolean
) => void;

interface ChosenNodeValues {
  borderColor: string;
  borderDashes: boolean | number[];
  borderRadius: number;
  borderWidth: number;
  color: string;
  shadow: boolean;
  shadowColor: string;
  shadowSize: number;
  shadowX: number;
  shadowY: number;
  size: number;
}
type NodeChosenNodeFunction = (
  values: ChosenNodeValues,
  id: IdType,
  selected: boolean,
  hovered: boolean
) => void;

interface NodeChosen {
  node: boolean | NodeChosenNodeFunction;
  label: boolean | NodeChosenLabelFunction;
}

interface NodeOptions {
  borderWidth?: number;

  borderWidthSelected?: number;

  brokenImage?: string;

  color?: string | Color;

  chosen?: boolean | NodeChosen;

  opacity?: number;

  fixed?: boolean | {
    x?: boolean,
    y?: boolean,
  };

  font?: string | Font;

  group?: string;

  hidden?: boolean;

  icon?: {
    face?: string,
    code?: string,
    size?: number,  // 50,
    color?: string,
    weight?: number | string,
  };

  image?: string | Image;

  imagePadding?: number | ImagePadding;

  label?: string;

  labelHighlightBold?: boolean;

  level?: number;

  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };

  mass?: number;

  physics?: boolean;

  scaling?: OptionsScaling;

  shadow?: boolean | OptionsShadow;

  shape?: string;

  shapeProperties?: {
    borderDashes?: boolean | number[], // only for borders
    borderRadius?: number,     // only for box shape
    interpolation?: boolean,  // only for image and circularImage shapes
    useImageSize?: boolean,  // only for image and circularImage shapes
    useBorderWithImage?: boolean,  // only for image shape
    coordinateOrigin?: string  // only for image and circularImage shapes
  };

  size?: number;

  title?: string | HTMLElement;

  value?: number;

  /**
   * If false, no widthConstraint is applied. If a number is specified, the minimum and maximum widths of the node are set to the value.
   * The node's label's lines will be broken on spaces to stay below the maximum and the node's width
   * will be set to the minimum if less than the value.
   */
  widthConstraint?: number | boolean | { minimum?: number, maximum?: number };

  x?: number;

  y?: number;
}

interface EdgeOptions {
  arrows?: string | {
    to?: boolean | ArrowHead
    middle?: boolean | ArrowHead
    from?: boolean | ArrowHead
  };

  arrowStrikethrough?: boolean;

  chosen?: boolean | {
    edge?: boolean, // please note, chosen.edge could be also a function. This case is not represented here
    label?: boolean, // please note, chosen.label could be also a function. This case is not represented here
  };

  color?: string | {
    color?: string,
    highlight?: string,
    hover?: string,
    inherit?: boolean | string,
    opacity?: number,
  };

  dashes?: boolean | number[];

  font?: string | Font;

  hidden?: boolean;

  hoverWidth?: number; // please note, hoverWidth could be also a function. This case is not represented here

  label?: string;

  labelHighlightBold?: boolean;

  length?: number;

  physics?: boolean;

  scaling?: OptionsScaling;

  selectionWidth?: number; // please note, selectionWidth could be also a function. This case is not represented here

  selfReferenceSize?: number;

  selfReference?: {
    size?: number,
    angle?: number,
    renderBehindTheNode?: boolean
  };

  shadow?: boolean | OptionsShadow;

  smooth?: boolean | {
    enabled: boolean,
    type: string,
    forceDirection?: string | boolean,
    roundness: number,
  };

  title?: string | HTMLElement;

  value?: number;

  width?: number;

  widthConstraint?: number | boolean | {
    maximum?: number;
  };
}

interface ArrowHead {
  enabled?: boolean,
  imageHeight?: number,
  imageWidth?: number,
  scaleFactor?: number,
  src?: string,
  type?: string;
}

interface Font {
  color?: string,
  size?: number, // px
  face?: string,
  background?: string,
  strokeWidth?: number, // px
  strokeColor?: string,
  align?: string,
  vadjust?: number,
  multi?: boolean | string,
  bold?: string | FontStyles,
  ital?: string | FontStyles,
  boldital?: string | FontStyles,
  mono?: string | FontStyles,
}

interface FontStyles {
  color?: string;
  size?: number;
  face?: string;
  mod?: string;
  vadjust?: number;
}

interface OptionsScaling {
  min?: number;
  max?: number;
  label?: boolean | {
    enabled?: boolean,
    min?: number,
    max?: number,
    maxVisible?: number,
    drawThreshold?: number
  };
  customScalingFunction?(min?: number, max?: number, total?: number, value?: number): number;
}

interface OptionsShadow {
  enabled?: boolean;
  color?: string;
  size?: number;
  x?: number;
  y?: number;
}

declare module 'keycharm' {
  interface KeycharmOptions {
    preventDefault?: boolean;
    container?: Window | Element;
  }

  type BindType = 'keydown' | 'keyup';

  interface Keycharm {
    bind(key: string, callback: (ev: KeyboardEvent) => void, type?: BindType): void;

    bindAll(callback: (ev: KeyboardEvent) => void, type?: BindType): void;

    unbind(key: string, callback?: (ev: KeyboardEvent) => void, type?: BindType): void;

    reset(): void;

    destroy(): void

    getKey(event: KeyboardEvent): string;
  }

  export default function keycharm(options?: KeycharmOptions): Keycharm;
}

/** Interest retransmission policy options. */
interface RetxOptions {
    /**
     * Maximum number of retransmissions, excluding initial Interest.
     *
     * Default is 0, which disables retransmissions.
     */
    limit?: number;
    /**
     * Initial retx interval
     *
     * Default is 50% of InterestLifetime.
     */
    interval?: number;
    /**
     * Randomize retx interval within [1-randomize, 1+randomize].
     *
     * Suppose this is set to 0.1, an interval of 100ms would become [90ms, 110ms].
     * Default is 0.1.
     */
    randomize?: number;
    /**
     * Multiply retx interval by backoff factor after each retx.
     *
     * This number should be in range [1.0, 2.0].
     * Default is 1.0.
     */
    backoff?: number;
    /**
     * Maximum retx interval.
     *
     * Default is 90% of InterestLifetime.
     */
    max?: number;
}
/** A function to generate retx intervals. */
declare type RetxGenerator = (interestLifetime: number) => Iterable<number>;
/**
 * Interest retransmission policy.
 *
 * A number is interpreted as the limit.
 * Set 0 to disable retransmissions.
 */
declare type RetxPolicy = RetxOptions | RetxGenerator | number;

interface Decodable<R> {
    decodeFrom: (decoder: Decoder) => R;
}
/** TLV decoder. */
declare class Decoder {
    private readonly input;
    /** Determine whether end of input has been reached. */
    get eof(): boolean;
    private readonly dv;
    private offset;
    constructor(input: Uint8Array);
    /** Read TLV structure. */
    read(): Decoder.Tlv;
    /** Read a Decodable object. */
    decode<R>(d: Decodable<R>): R;
    private readVarNum;
    private readType;
    private readLength;
    private skipValue;
}
declare namespace Decoder {
    /** Decoded TLV. */
    interface Tlv {
        /** TLV-TYPE. */
        readonly type: number;
        /** TLV-LENGTH. */
        readonly length: number;
        /** TLV-VALUE. */
        readonly value: Uint8Array;
        /** TLV buffer. */
        readonly tlv: Uint8Array;
        /** Size of TLV. */
        readonly size: number;
        /** TLV as decoder. */
        readonly decoder: Decoder;
        /** TLV-VALUE as decoder. */
        readonly vd: Decoder;
        /** TLV-VALUE as non-negative integer. */
        readonly nni: number;
        /** TLV-VALUE as non-negative integer bigint. */
        readonly nniBig: bigint;
        /** TLV-VALUE as UTF-8 string. */
        readonly text: string;
        /** Siblings before this TLV. */
        readonly before: Uint8Array;
        /** Siblings after this TLV. */
        readonly after: Uint8Array;
    }
}

/** An object that knows how to prepend itself to an Encoder. */
interface EncodableObj {
    encodeTo: (encoder: Encoder) => void;
}
/**
 * An encodable TLV structure.
 *
 * First item is a number for TLV-TYPE.
 * Optional second item could be OmitEmpty to omit the TLV if TLV-VALUE is empty.
 * Subsequent items are Encodables for TLV-VALUE.
 */
declare type EncodableTlv = [number, ...any[]];
/** An object acceptable to Encoder.encode(). */
declare type Encodable = Uint8Array | undefined | EncodableObj | EncodableTlv;
/** TLV encoder that accepts objects in reverse order. */
declare class Encoder {
    private buf;
    private off;
    /** Return encoding output size. */
    get size(): number;
    /** Obtain encoding output. */
    get output(): Uint8Array;
    constructor(initSize?: number);
    /** Obtain part of encoding output. */
    slice(start?: number, length?: number): Uint8Array;
    /**
     * Make room to prepend an object.
     * @param sizeofObject object size.
     * @returns room to write object.
     */
    prependRoom(sizeofObject: number): Uint8Array;
    /** Prepend TLV-TYPE and TLV-LENGTH. */
    prependTypeLength(tlvType: number, tlvLength: number): void;
    /** Prepend TLV-VALUE. */
    prependValue(...tlvValue: Encodable[]): void;
    /**
     * Prepend TLV structure.
     * @param tlvType TLV-TYPE number.
     * @param omitEmpty omit TLV altogether if set to Encoder.OmitEmpty
     * @param tlvValue TLV-VALUE objects.
     */
    prependTlv(tlvType: number, omitEmpty?: typeof Encoder.OmitEmpty | Encodable, ...tlvValue: Encodable[]): void;
    /** Prepend an Encodable object. */
    encode(obj: Encodable | readonly Encodable[]): void;
    private grow;
}
declare namespace Encoder {
    /** Create a DataView over a Uint8Array. */
    function asDataView(a: Uint8Array): DataView;
    namespace DataViewPolyfill {
        function getBigUint64(dv: DataView, byteOffset: number, littleEndian?: boolean): bigint;
        function setBigUint64(dv: DataView, byteOffset: number, value: bigint, littleEndian?: boolean): void;
    }
    /** DataView.prototype.getBigUint64 with polyfill for iOS 14. */
    const getBigUint64: (dv: DataView, byteOffset: number, littleEndian?: boolean) => bigint;
    /** DataView.prototype.setBigUint64 with polyfill for iOS 14. */
    const setBigUint64: (dv: DataView, byteOffset: number, value: bigint, littleEndian?: boolean) => void;
    const OmitEmpty: unique symbol;
    /** Encode a single object into Uint8Array. */
    function encode(obj: Encodable | readonly Encodable[], initBufSize?: number): Uint8Array;
    /** Extract the encoding output of an element while writing to a larger encoder. */
    function extract(obj: Encodable | readonly Encodable[], cb: (output: Uint8Array) => void): Encodable;
}

/** TLV-VALUE decoder that understands Packet Format v0.3 evolvability guidelines. */
declare class EvDecoder<T> {
    private readonly typeName;
    private readonly topTT;
    private readonly rules;
    private readonly requiredTlvTypes;
    private nextOrder;
    private isCriticalCb;
    private unknownCb;
    /** Callbacks to receive top-level TLV before decoding TLV-VALUE. */
    readonly beforeTopCallbacks: Array<EvDecoder.TopElementCallback<T>>;
    /** Callbacks before decoding TLV-VALUE. */
    readonly beforeValueCallbacks: Array<EvDecoder.TargetCallback<T>>;
    /** Callbacks after decoding TLV-VALUE. */
    readonly afterValueCallbacks: Array<EvDecoder.TargetCallback<T>>;
    /** Callbacks to receive top-level TLV after decoding TLV-VALUE. */
    readonly afterTopCallbacks: Array<EvDecoder.TopElementCallback<T>>;
    /**
     * Constructor.
     * @param typeName type name, used in error messages.
     * @param topTT if specified, check top-level TLV-TYPE to be in this list.
     */
    constructor(typeName: string, topTT?: number | readonly number[]);
    /**
     * Add a decoding rule.
     * @param tt TLV-TYPE to match this rule.
     * @param cb callback to handle element TLV.
     * @param options additional rule options.
     */
    add(tt: number, cb: EvDecoder.ElementCallback<T> | EvDecoder<T>, options?: Partial<EvDecoder.RuleOptions>): this;
    /** Set callback to determine whether TLV-TYPE is critical. */
    setIsCritical(cb: EvDecoder.IsCriticalCallback): this;
    /** Set callback to handle unknown elements. */
    setUnknown(cb: EvDecoder.UnknownElementCallback<T>): this;
    /** Decode TLV to target object. */
    decode<R extends T = T>(target: R, decoder: Decoder): R;
    /** Decode TLV-VALUE to target object. */
    decodeValue<R extends T = T>(target: R, vd: Decoder): R;
    private handleUnrecognized;
}
declare namespace EvDecoder {
    /** Invoked when a matching TLV element is found. */
    type ElementCallback<T> = (target: T, tlv: Decoder.Tlv) => void;
    interface RuleOptions {
        /**
         * Expected order of appearance.
         * Default to the order in which rules were added to EvDecoder.
         */
        order: number;
        /** Whether TLV element must appear at least once. */
        required: boolean;
        /** Whether TLV element may appear more than once. */
        repeat: boolean;
    }
    /**
     * Invoked when a TLV element does not match any rule.
     * 'order' denotes the order number of last recognized TLV element.
     * Return true if this TLV element is accepted, or false to follow evolvability guidelines.
     */
    type UnknownElementCallback<T> = (target: T, tlv: Decoder.Tlv, order: number) => boolean;
    type IsCriticalCallback = (tt: number) => boolean;
    type TopElementCallback<T> = (target: T, tlv: Decoder.Tlv) => void;
    type TargetCallback<T> = (target: T) => void;
}

/** An TLV element that allows extension sub element. */
interface Extensible {
    readonly [Extensible.TAG]: ExtensionRegistry<any>;
}
declare namespace Extensible {
    const TAG: unique symbol;
    /** Clone extension fields of src to dst. */
    function cloneRecord(dst: Extensible, src: Extensible): void;
}
/**
 * An extension sub element on a parent TLV element.
 * T is the parent TLV element type.
 * R is the value type of this extension.
 */
interface Extension<T, R = unknown> {
    /** TLV-TYPE. */
    readonly tt: number;
    /** Order relative to other extensions, used on encoding only. */
    readonly order?: number;
    /**
     * Decode extension element.
     * @param obj parent object.
     * @param tlv TLV of sub element; its TLV-TYPE would be this.tt .
     * @param accumulator previous decoded value, if extension element appears more than once.
     */
    decode: (obj: T, tlv: Decoder.Tlv, accumulator?: R) => R;
    /**
     * Encode extension element.
     * @param obj parent object.
     * @param value decoded value.
     * @returns encoding of sub element; its TLV-TYPE should be this.tt .
     */
    encode: (obj: T, value: R) => Encodable;
}
declare namespace Extension {
    /** Retrieve value of an extension field. */
    function get(obj: Extensible, tt: number): unknown;
    /** Assign value of an extension field. */
    function set(obj: Extensible, tt: number, value: unknown): void;
    /** Clear value of an extension field. */
    function clear(obj: Extensible, tt: number): void;
}
/** Registry of known extension fields of a parent TLV element. */
declare class ExtensionRegistry<T extends Extensible> {
    private readonly table;
    /** Add an extension. */
    readonly registerExtension: <R>(ext: Extension<T, R>) => void;
    /** Remove an extension. */
    readonly unregisterExtension: (tt: number) => void;
    /** UnknownElementCallback for EvDecoder. */
    readonly decodeUnknown: (target: T, tlv: Decoder.Tlv, order: number) => boolean;
    /** Encode extension fields. */
    encode(source: T): Encodable[];
}

declare class Nni1 {
    private readonly n;
    constructor(n: number);
    encodeTo(encoder: Encoder): void;
}
declare class Nni2 {
    private readonly n;
    constructor(n: number);
    encodeTo(encoder: Encoder): void;
}
declare class Nni4 {
    private readonly n;
    constructor(n: number);
    encodeTo(encoder: Encoder): void;
}
declare class Nni8Number {
    private readonly n;
    constructor(n: number);
    encodeTo(encoder: Encoder): void;
}
declare type Len = 1 | 2 | 4 | 8;
interface Options$1<LenT = Len> {
    /** If set, use/enforce specific TLV-LENGTH. */
    len?: LenT;
    /** If true, allow approximate integers. */
    unsafe?: boolean;
}
declare const EncodeNniClass: {
    1: typeof Nni1;
    2: typeof Nni2;
    4: typeof Nni4;
    8: typeof Nni8Number;
};
/** Create Encodable from non-negative integer. */
declare function NNI(n: number | bigint, { len, unsafe, }?: Options$1<Extract<Len, keyof typeof EncodeNniClass>>): Encodable;
declare namespace NNI {
    /** Determine if len is a valid length of encoded NNI. */
    function isValidLength(len: number): boolean;
    /** Decode non-negative integer as number. */
    function decode(value: Uint8Array, opts?: Options$1 & {
        big?: false;
    }): number;
    /** Decode non-negative integer as bigint. */
    function decode(value: Uint8Array, opts: Options$1 & {
        big: true;
    }): bigint;
    /** Error if n exceeds [0,MAX_SAFE_INTEGER] range. */
    function constrain(n: number, typeName: string): number;
    /** Error if n exceeds [0,max] range. */
    function constrain(n: number, typeName: string, max: number): number;
    /** Error if n exceeds [min,max] range. */
    function constrain(n: number, typeName: string, min: number, max?: number): number;
}

/** Pretty-print TLV-TYPE number. */
declare function printTT(tlvType: number): string;
/** Convert byte array to upper-case hexadecimal string. */
declare function toHex(buf: Uint8Array): string;
/**
 * Convert hexadecimal string to byte array.
 *
 * This function lacks error handling. Use on trusted input only.
 */
declare function fromHex(s: string): Uint8Array;
declare function toUtf8(s: string): Uint8Array;
declare function fromUtf8(buf: Uint8Array): string;

type tlv_Decodable<_0> = Decodable<_0>;
declare const tlv_Decoder: typeof Decoder;
type tlv_EncodableObj = EncodableObj;
type tlv_EncodableTlv = EncodableTlv;
type tlv_Encodable = Encodable;
declare const tlv_Encoder: typeof Encoder;
declare const tlv_EvDecoder: typeof EvDecoder;
declare const tlv_Extensible: typeof Extensible;
declare const tlv_Extension: typeof Extension;
type tlv_ExtensionRegistry<_0> = ExtensionRegistry<_0>;
declare const tlv_ExtensionRegistry: typeof ExtensionRegistry;
declare const tlv_NNI: typeof NNI;
declare const tlv_printTT: typeof printTT;
declare const tlv_toHex: typeof toHex;
declare const tlv_fromHex: typeof fromHex;
declare const tlv_toUtf8: typeof toUtf8;
declare const tlv_fromUtf8: typeof fromUtf8;
declare namespace tlv {
  export {
    tlv_Decodable as Decodable,
    tlv_Decoder as Decoder,
    tlv_EncodableObj as EncodableObj,
    tlv_EncodableTlv as EncodableTlv,
    tlv_Encodable as Encodable,
    tlv_Encoder as Encoder,
    tlv_EvDecoder as EvDecoder,
    tlv_Extensible as Extensible,
    tlv_Extension as Extension,
    tlv_ExtensionRegistry as ExtensionRegistry,
    tlv_NNI as NNI,
    tlv_printTT as printTT,
    tlv_toHex as toHex,
    tlv_fromHex as fromHex,
    tlv_toUtf8 as toUtf8,
    tlv_fromUtf8 as fromUtf8,
  };
}

/**
 * Naming convention, which interprets a name component in a specific way.
 * @template A input type to construct component.
 * @template R output type to interpret component.
 */
interface NamingConvention<A, R = A> {
    /** Determine if a component follows this naming convention. */
    match: (comp: Component) => boolean;
    /** Create a component from input value following this naming convention. */
    create: (v: A) => Component;
    /** Parse value of a matched component. */
    parse: (comp: Component) => R;
}
declare namespace NamingConvention {
    /** A naming convention that supports alternate/pretty URI. */
    interface WithAltUri {
        /** Convert to alternate URI. */
        toAltUri: (comp: Component) => string;
        /**
         * Parse from alternate URI.
         * @returns component, or undefined if it cannot be parsed.
         */
        fromAltUri: (input: string) => Component | undefined;
    }
    function isConvention(obj: any): obj is NamingConvention<any>;
}

declare type ComponentLike = Component | string;
/**
 * Name component.
 * This type is immutable.
 */
declare class Component {
    get length(): number;
    /** TLV-VALUE interpreted as UTF-8 string. */
    get text(): string;
    static decodeFrom(decoder: Decoder): Component;
    /** Parse from URI representation, or return existing Component. */
    static from(input: ComponentLike): Component;
    readonly tlv: Uint8Array;
    readonly type: number;
    readonly value: Uint8Array;
    /**
     * Construct from TLV-TYPE and TLV-VALUE.
     * @param type TLV-TYPE, default is GenericNameComponent.
     * @param value TLV-VALUE; if specified as string, it's encoded as UTF-8 but not interpreted
     *              as URI representation. Use from() to interpret URI.
     */
    constructor(type?: number, value?: Uint8Array | string);
    /** Construct from TLV. */
    constructor(tlv: Uint8Array);
    /** Get URI string. */
    toString(): string;
    encodeTo(encoder: Encoder): void;
    /** Determine if component follows a naming convention. */
    is(convention: NamingConvention<any>): boolean;
    /** Convert with naming convention. */
    as<R>(convention: NamingConvention<any, R>): R;
    /** Compare this component with other. */
    compare(other: ComponentLike): Component.CompareResult;
    /** Determine if this component equals other. */
    equals(other: ComponentLike): boolean;
}
declare namespace Component {
    /** Component compare result. */
    enum CompareResult {
        /** lhs is less than rhs */
        LT = -2,
        /** lhs and rhs are equal */
        EQUAL = 0,
        /** lhs is greater than rhs */
        GT = 2
    }
    /** Compare two components. */
    function compare(lhs: ComponentLike, rhs: ComponentLike): CompareResult;
}

declare type NameLike = Name | string;
/**
 * Name.
 * This type is immutable.
 */
declare class Name {
    static decodeFrom(decoder: Decoder): Name;
    /** TLV-VALUE of the Name. */
    readonly value: Uint8Array;
    /** List of name components. */
    readonly comps: readonly Component[];
    /** Create empty name, or copy from other name, or parse from URI. */
    constructor(input?: NameLike);
    /** Parse from URI, with specific component parser. */
    constructor(uri: string, parseComponent?: (input: string) => Component);
    /** Construct from TLV-VALUE. */
    constructor(value: Uint8Array);
    /** Construct from components. */
    constructor(comps: readonly ComponentLike[]);
    get length(): number;
    /** Retrieve i-th component. */
    get(i: number): Component | undefined;
    /**
     * Retrieve i-th component.
     * @throws i-th component does not exist.
     */
    at(i: number): Component;
    /** Get URI string. */
    toString(): string;
    /** Get sub name [begin, end). */
    slice(begin?: number, end?: number): Name;
    /** Get prefix of n components. */
    getPrefix(n: number): Name;
    /** Append a component from naming convention. */
    append<A>(convention: NamingConvention<A, unknown>, v: A): Name;
    /** Append suffix with one or more components. */
    append(...suffix: readonly ComponentLike[]): Name;
    /** Return a copy of Name with a component replaced. */
    replaceAt(i: number, comp: ComponentLike): Name;
    /** Compare with other name. */
    compare(other: NameLike): Name.CompareResult;
    /** Determine if this name equals other. */
    equals(other: NameLike): boolean;
    /** Determine if this name is a prefix of other. */
    isPrefixOf(other: NameLike): boolean;
    encodeTo(encoder: Encoder): void;
}
declare namespace Name {
    function isNameLike(obj: any): obj is NameLike;
    /** Name compare result. */
    enum CompareResult {
        /** lhs is less than, but not a prefix of rhs */
        LT = -2,
        /** lhs is a prefix of rhs */
        LPREFIX = -1,
        /** lhs and rhs are equal */
        EQUAL = 0,
        /** rhs is a prefix of lhs */
        RPREFIX = 1,
        /** rhs is less than, but not a prefix of lhs */
        GT = 2
    }
}

/**
 * Name longest prefix match algorithm.
 * @param name target name.
 * @param get callback function to retrieve entry by hexadecimal name prefix.
 */
declare function lpm<Entry>(name: Name, get: (prefixHex: string) => Entry | undefined): Iterable<Entry>;

/**
 * Functions to print and parse names in alternate/pretty URI syntax.
 *
 * This class is constructed with a sequence of NamingConventions. Each component is matched
 * against these conventions in order, and the first matching convention can determine how to
 * print that component in an alternate URI syntax, if available.
 *
 * Other than pre-constructed 'AltUri' instances exported by this and naming convention packages,
 * you may construct an instance with only the naming conventions you have adopted, so that a
 * component that happens to match a convention that your application did not adopt is not
 * mistakenly interpreted with that convention.
 */
declare class AltUriConverter {
    readonly conventions: ReadonlyArray<NamingConvention<any> & NamingConvention.WithAltUri>;
    constructor(conventions: ReadonlyArray<NamingConvention<any> & NamingConvention.WithAltUri>);
    /** Print component in alternate URI syntax */
    ofComponent: (comp: Component) => string;
    /** Print name in alternate URI syntax. */
    ofName: (name: Name) => string;
    /** Parse component from alternate URI syntax */
    parseComponent: (input: string) => Component;
    /** Parse name from alternate URI syntax. */
    parseName: (input: string) => Name;
}
/** Print Generic, ImplicitDigest, ParamsDigest in alternate URI syntax. */
declare const AltUri: AltUriConverter;

declare class DigestComp implements NamingConvention<Uint8Array>, NamingConvention.WithAltUri {
    private readonly tt;
    private readonly altUriPrefix;
    private readonly altUriRegex;
    constructor(tt: number, altUriPrefix: string);
    match(comp: Component): boolean;
    create(v: Uint8Array): Component;
    parse(comp: Component): Uint8Array;
    toAltUri(comp: Component): string;
    fromAltUri(input: string): Component | undefined;
}
declare class ImplicitDigestComp extends DigestComp {
    constructor();
    /** Remove ImplicitDigest if present at last component. */
    strip(name: Name): Name;
}
/** ImplicitSha256DigestComponent */
declare const ImplicitDigest: ImplicitDigestComp;
declare class ParamsDigestComp extends DigestComp {
    /** ParamsDigest placeholder during Interest encoding. */
    readonly PLACEHOLDER: Component;
    constructor();
    /** Determine if comp is a ParamsDigest placeholder. */
    isPlaceholder(comp: Component): boolean;
    /** Find ParamsDigest or placeholder in name. */
    findIn(name: Name, matchPlaceholder?: boolean): number;
}
/** ParametersSha256DigestComponent */
declare const ParamsDigest: ParamsDigestComp;

/** ForwardingHint in Interest. */
declare class FwHint {
    static decodeValue(value: Uint8Array): FwHint;
    constructor(copy?: FwHint);
    constructor(name: NameLike);
    constructor(delegations: readonly FwHint.Delegation[]);
    private add;
    get delegations(): readonly FwHint.Delegation[];
    private readonly m;
    encodeTo(encoder: Encoder): void;
}
declare namespace FwHint {
    /** Delegation in ForwardingHint. */
    class Delegation {
        preference: number;
        static decodeFrom(decoder: Decoder): Delegation;
        constructor(name?: NameLike, preference?: number);
        name: Name;
        encodeTo(encoder: Encoder): void;
    }
}

/** KeyLocator in SigInfo. */
declare class KeyLocator {
    static decodeFrom(decoder: Decoder): KeyLocator;
    name?: Name;
    digest?: Uint8Array;
    constructor(...args: KeyLocator.CtorArg[]);
    encodeTo(encoder: Encoder): void;
}
declare namespace KeyLocator {
    type CtorArg = KeyLocator | NameLike | Uint8Array;
    function isCtorArg(arg: unknown): arg is CtorArg;
    /** Throw if KeyLocator is missing or does not have Name. */
    function mustGetName(kl?: KeyLocator): Name;
}

declare const ctorAssign$2: unique symbol;
interface CtorTag$2 {
    [ctorAssign$2]: (si: SigInfo) => void;
}
/** SignatureInfo on Interest or Data. */
declare class SigInfo {
    static decodeFrom(decoder: Decoder): SigInfo;
    type: number;
    keyLocator?: KeyLocator;
    nonce?: Uint8Array;
    time?: number;
    seqNum?: bigint;
    readonly [Extensible.TAG]: ExtensionRegistry<SigInfo>;
    /**
     * Construct from flexible arguments.
     *
     * Arguments can include, in any order:
     * - SigInfo to copy from
     * - number as SigType
     * - KeyLocator, or Name/URI/KeyDigest to construct KeyLocator
     * - SigInfo.Nonce(v)
     * - SigInfo.Time(v)
     * - SigInfo.SeqNum(v)
     */
    constructor(...args: SigInfo.CtorArg[]);
    /**
     * Create an Encodable.
     * @param tt either TT.ISigInfo or TT.DSigInfo.
     */
    encodeAs(tt: number): EncodableObj;
    private encodeTo;
}
declare namespace SigInfo {
    function Nonce(v?: Uint8Array | number): CtorTag$2;
    /** Generate a random nonce. */
    function generateNonce(size?: number): Uint8Array;
    function Time(v?: number): CtorTag$2;
    function SeqNum(v: bigint): {
        [ctorAssign$2](si: SigInfo): void;
    };
    type CtorArg = SigInfo | number | KeyLocator.CtorArg | CtorTag$2;
    const registerExtension: <R>(ext: Extension<SigInfo, R>) => void;
    const unregisterExtension: (tt: number) => void;
}

declare function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;

/**
 * Low level signing function.
 * It takes a buffer of signed portion, and returns a Promise of signature value.
 */
declare type LLSign = (input: Uint8Array) => Promise<Uint8Array>;
declare namespace LLSign {
    const OP: unique symbol;
    interface Signable {
        [OP]: (signer: LLSign) => Promise<void>;
    }
}
/**
 * Low level verification function.
 * It takes a buffer of signed portion and the signature value, and returns a Promise
 * that is resolved upon good signature or rejected upon bad signature.
 */
declare type LLVerify = (input: Uint8Array, sig: Uint8Array) => Promise<void>;
declare namespace LLVerify {
    const OP: unique symbol;
    interface Verifiable {
        [OP]: (verifier: LLVerify) => Promise<void>;
    }
    const timingSafeEqual: typeof timingSafeEqual;
}
interface PacketWithSignature {
    readonly name: Name;
    sigInfo?: SigInfo;
    sigValue: Uint8Array;
}
/** High level signer, such as a private key. */
interface Signer {
    /** Sign a packet. */
    sign: (pkt: Signer.Signable) => Promise<void>;
}
declare namespace Signer {
    interface Signable extends PacketWithSignature, LLSign.Signable {
    }
    /**
     * Put SigInfo on packet if it does not exist.
     * @param pkt target packet.
     * @param sigType optionally set sigType.
     * @param keyLocator optionally set keyLocator; false to unset KeyLocator.
     */
    function putSigInfo(pkt: PacketWithSignature, sigType?: number, keyLocator?: KeyLocator.CtorArg | false): SigInfo;
}
/** High level verifier, such as a public key. */
interface Verifier {
    /**
     * Verify a packet.
     * @returns a Promise is resolved upon good signature/policy or rejected upon bad signature/policy.
     */
    verify: (pkt: Verifier.Verifiable) => Promise<void>;
}
declare namespace Verifier {
    interface Verifiable extends Readonly<PacketWithSignature>, LLVerify.Verifiable {
    }
    /** Throw if packet does not have expected SigType. */
    function checkSigType(pkt: Readonly<PacketWithSignature>, expectedSigType: number): void;
    /** Throw bad signature error if not OK. */
    function throwOnBadSig(ok: boolean): asserts ok;
}
/** Signer and Verifier that do nothing. */
declare const noopSigning: Signer & Verifier;
/** Signer and Verifier for SigType.Sha256 digest. */
declare const digestSigning: Signer & Verifier;
/**
 * Signer for SigType.Null, a packet that is not signed.
 * @see https://redmine.named-data.net/projects/ndn-tlv/wiki/NullSignature
 */
declare const nullSigner: Signer;

declare const FIELDS$1: unique symbol;
declare class Fields$1 {
    constructor(...args: Array<Interest | Interest.CtorArg>);
    name: Name;
    canBePrefix: boolean;
    mustBeFresh: boolean;
    fwHint?: FwHint;
    get nonce(): number | undefined;
    set nonce(v: number | undefined);
    get lifetime(): number;
    set lifetime(v: number);
    get hopLimit(): number;
    set hopLimit(v: number);
    appParameters?: Uint8Array;
    sigInfo?: SigInfo;
    sigValue: Uint8Array;
    private nonce_;
    private lifetime_;
    private hopLimit_;
    signedPortion?: Uint8Array;
    paramsPortion?: Uint8Array;
}
declare const ctorAssign$1: unique symbol;
interface CtorTag$1 {
    [ctorAssign$1]: (f: Fields$1) => void;
}
/** Interest packet. */
declare class Interest implements LLSign.Signable, LLVerify.Verifiable, Signer.Signable, Verifier.Verifiable {
    /**
     * Construct from flexible arguments.
     *
     * Arguments can include, in any order:
     * - Interest to copy from
     * - Name or name URI
     * - Interest.CanBePrefix
     * - Interest.MustBeFresh
     * - Interest.Nonce(v)
     * - Interest.Lifetime(v)
     * - Interest.HopLimit(v)
     * - Uint8Array as AppParameters
     */
    constructor(...args: Array<Interest | Interest.CtorArg>);
    readonly [FIELDS$1]: Fields$1;
    static decodeFrom(decoder: Decoder): Interest;
    encodeTo(encoder: Encoder): void;
    private encodeParamsPortion;
    private appendParamsDigestPlaceholder;
    updateParamsDigest(): Promise<void>;
    validateParamsDigest(): Promise<void>;
    [LLSign.OP](sign: LLSign): Promise<void>;
    [LLVerify.OP](verify: LLVerify): Promise<void>;
}
interface Interest extends Fields$1 {
}
declare namespace Interest {
    /** Signer that calculates ParamsDigest. */
    const Parameterize: LLSign;
    /** Generate a random nonce. */
    function generateNonce(): number;
    /** Default InterestLifetime. */
    const DefaultLifetime = 4000;
    /** Constructor argument to set CanBePrefix flag. */
    const CanBePrefix: unique symbol;
    /** Constructor argument to set MustBeFresh flag. */
    const MustBeFresh: unique symbol;
    /** Constructor argument to set Nonce field. */
    function Nonce(v?: number): CtorTag$1;
    /** Constructor argument to set InterestLifetime field. */
    function Lifetime(v: number): CtorTag$1;
    /** Constructor argument to set HopLimit field. */
    function HopLimit(v: number): CtorTag$1;
    /** Constructor argument. */
    type CtorArg = NameLike | typeof CanBePrefix | typeof MustBeFresh | FwHint | CtorTag$1 | Uint8Array;
    /** A function to modify an existing Interest. */
    type ModifyFunc = (interest: Interest) => void;
    /** Common fields to assign onto an existing Interest. */
    interface ModifyFields {
        canBePrefix?: boolean;
        mustBeFresh?: boolean;
        fwHint?: FwHint;
        lifetime?: number;
        hopLimit?: number;
    }
    /** A structure to modify an existing Interest. */
    type Modify = ModifyFunc | ModifyFields;
    /** Turn ModifyFields to ModifyFunc; return ModifyFunc as-is. */
    function makeModifyFunc(input?: Modify): ModifyFunc;
}

declare const FIELDS: unique symbol;
declare class Fields {
    constructor(...args: Array<Data | Data.CtorArg>);
    get isFinalBlock(): boolean;
    set isFinalBlock(v: boolean);
    name: Name;
    get contentType(): number;
    set contentType(v: number);
    get freshnessPeriod(): number;
    set freshnessPeriod(v: number);
    finalBlockId?: Component;
    content: Uint8Array;
    sigInfo: SigInfo;
    sigValue: Uint8Array;
    private contentType_;
    private freshnessPeriod_;
    signedPortion?: Uint8Array;
    topTlv?: Uint8Array;
    topTlvDigest?: Uint8Array;
}
declare const ctorAssign: unique symbol;
interface CtorTag {
    [ctorAssign]: (f: Fields) => void;
}
/** Data packet. */
declare class Data implements LLSign.Signable, LLVerify.Verifiable, Signer.Signable, Verifier.Verifiable {
    /**
     * Construct from flexible arguments.
     *
     * Arguments can include:
     * - Data to copy from
     * - Name or name URI
     * - Data.ContentType(v)
     * - Data.FreshnessPeriod(v)
     * - Data.FinalBlock (must appear after Name)
     * - Uint8Array as Content
     */
    constructor(...args: Array<Data | Data.CtorArg>);
    readonly [FIELDS]: Fields;
    static decodeFrom(decoder: Decoder): Data;
    encodeTo(encoder: Encoder): void;
    private encodeSignedPortion;
    getImplicitDigest(): Uint8Array | undefined;
    computeImplicitDigest(): Promise<Uint8Array>;
    getFullName(): Name | undefined;
    computeFullName(): Promise<Name>;
    /**
     * Determine if a Data can satisfy an Interest.
     * @returns a Promise that will be resolved with the result.
     */
    canSatisfy(interest: Interest): Promise<boolean>;
    [LLSign.OP](sign: LLSign): Promise<void>;
    [LLVerify.OP](verify: LLVerify): Promise<void>;
}
interface Data extends Fields {
}
declare namespace Data {
    /** Constructor argument to set ContentType field. */
    function ContentType(v: number): CtorTag;
    /** Constructor argument to set FreshnessPeriod field. */
    function FreshnessPeriod(v: number): CtorTag;
    /** Constructor argument to set the current packet as FinalBlock. */
    const FinalBlock: unique symbol;
    /** Constructor argument. */
    type CtorArg = NameLike | CtorTag | typeof FinalBlock | Uint8Array;
}

/** Low level encryption function. */
declare type LLEncrypt = (params: LLEncrypt.Params) => Promise<LLEncrypt.Result>;
declare namespace LLEncrypt {
    /** Input of LLEncrypt function. */
    interface Params {
        plaintext: Uint8Array;
        iv?: Uint8Array;
        additionalData?: Uint8Array;
    }
    /** Output of LLEncrypt function. */
    interface Result {
        ciphertext: Uint8Array;
        iv?: Uint8Array;
        authenticationTag?: Uint8Array;
    }
    /** Object that provides LLEncrypt function, such as secret key. */
    interface Key {
        readonly llEncrypt: LLEncrypt;
    }
}
/** Low level decryption function. */
declare type LLDecrypt = (params: LLDecrypt.Params) => Promise<LLDecrypt.Result>;
declare namespace LLDecrypt {
    /** Input of LLDecrypt function. */
    interface Params {
        ciphertext: Uint8Array;
        iv?: Uint8Array;
        authenticationTag?: Uint8Array;
        additionalData?: Uint8Array;
    }
    /** Output of LLDecrypt function. */
    interface Result {
        plaintext: Uint8Array;
    }
    /** Object that provides LLDecrypt function, such as secret key. */
    interface Key {
        readonly llDecrypt: LLDecrypt;
    }
}
/**
 * High level encrypter.
 *
 * This captures both the encryption key and the wire format of encrypted content.
 */
interface Encrypter<T = Data> {
    /** Encrypt a packet. The packet is modified in-place. */
    encrypt: (pkt: T) => Promise<void>;
}
/**
 * High level decrypter.
 *
 * This captures both the decryption key and the wire format of encrypted content.
 */
interface Decrypter<T = Data> {
    /** Decrypt a packet. The packet is modified in-place. */
    decrypt: (pkt: T) => Promise<void>;
}
/** Encrypter and decrypter that do nothing. */
declare const noopEncryption: Encrypter<any> & Decrypter<any>;

interface KeyState {
    nonces?: Set<string>;
    time?: number;
    seqNum?: bigint;
}
interface Rule {
    update: (si: SigInfo, state: KeyState) => void;
    check: (si: SigInfo, state: KeyState) => () => void;
}
/** Validation policy for SigInfo fields in signed Interest. */
declare class SignedInterestPolicy {
    private readonly owned;
    private readonly trackedKeys;
    private readonly records;
    private readonly rules;
    /**
     * Constructor.
     * @param opts options.
     * @param rules one or more rules created from SignedInterestPolicy.Nonce(),
     *              SignedInterestPolicy.Time(), SignedInterestPolicy.SeqNum().
     */
    constructor(opts: SignedInterestPolicy.Options, ...rules: Rule[]);
    constructor(...rules: Rule[]);
    /**
     * Assign SigInfo fields on an Interest before signing.
     * @param key signing key object to associate state with; if omitted, use global state.
     */
    update(interest: Interest, key?: object): void;
    /**
     * Check SigInfo of an Interest.
     * @returns a function to save state after the Interest has passed all verifications.
     */
    check({ sigInfo }: Interest): () => void;
    /**
     * Wrap an Interest to update/check SigInfo during signing/verification.
     * During signing, global state is being used because signer key cannot be detected.
     */
    wrapInterest(interest: Interest): Signer.Signable & Verifier.Verifiable;
    /**
     * Wrap a Signer to update SigInfo when signing an Interest.
     * State is associated with the provided Signer.
     */
    makeSigner(inner: Signer): Signer;
    /** Wrap a Verifier to check the policy when verifying an Interest. */
    makeVerifier(inner: Verifier, { passData, passUnsignedInterest, }?: SignedInterestPolicy.WrapOptions): Verifier;
}
declare namespace SignedInterestPolicy {
    interface Options {
        /**
         * How many distinct public keys to keep track.
         * Each different KeyLocator Name or KeyDigest is tracked separately.
         *
         * Minimum is 1.
         * @default 256
         */
        trackedKeys?: number;
    }
    interface WrapOptions {
        /**
         * If true, non-Interest packets are passed through to the inner Verifier.
         * If false, non-Interest packets are rejected.
         * @default true
         */
        passData?: boolean;
        /**
         * If true, Interests without SigInfo are passed through to the inner Verifier.
         * If false, Interests without SigInfo are rejected.
         * @default false
         */
        passUnsignedInterest?: boolean;
    }
    interface NonceOptions {
        /**
         * Length of generated SigNonce.
         *
         * Minimum is 1.
         * @default 8
         */
        nonceLength?: number;
        /**
         * Minimum required length of SigNonce.
         *
         * Minimum is 1.
         * @default 8
         */
        minNonceLength?: number;
        /**
         * How many distinct SigNonce values to keep track, within each public key.
         *
         * Minimum is 1.
         * @default 256
         */
        trackedNonces?: number;
    }
    /**
     * Create a rule to assign or check SigNonce.
     *
     * This rule assigns a random SigNonce of `minNonceLength` octets that does not duplicate
     * last `trackedNonces` values.
     *
     * This rule rejects an Interest on any of these conditions:
     * - SigNonce is absent.
     * - SigNonce has fewer than `minNonceLength` octets.
     * - SigNonce value duplicates any of last `trackedNonces` values.
     */
    function Nonce(opts?: NonceOptions): Rule;
    interface TimeOptions {
        /**
         * Maximum allowed clock offset in milliseconds.
         *
         * Minimum is 0. Setting to 0 is generally a bad idea because it would require consumer and
         * producer to have precisely synchronized clocks.
         * @default 60000
         */
        maxClockOffset?: number;
    }
    /**
     * Create a rule to assign or check SigTime.
     *
     * This rule assigns SigTime to be same as current timestamp, but may increment if it
     * duplicates the previous value.
     *
     * This rule rejects an Interest on any of these conditions:
     * - SigTime is absent.
     * - SigTime differs from current timestamp by more than `maxClockOffset` milliseconds.
     * - SigTime value is less than or equal to a previous value.
     *
     * This check logic differs from NDN Packet Format v0.3 specification (as of 2020-September) in
     * that `maxClockOffset` is checked on every Interest rather than only the "initial" Interest.
     * It is the same behavior as ndn-cxx v0.7.1 implementation.
     * This logic offers better consistency as it has less dependency on internal state of the
     * SignedInterestPolicy. However, persistently sending more than 1000 signed Interests per second
     * would eventually push SigTime out of `maxClockOffset` range and cause rejections.
     */
    function Time(opts?: TimeOptions): Rule;
    interface SeqNumOptions {
        /**
         * Initial sequence number.
         * @default 0n
         */
        initialSeqNum?: bigint;
    }
    /**
     * Create a rule to assign or check SigSeqNum.
     *
     * This rule assigns SigSeqNum to `initialSegNum`, or increments from previous value.
     *
     * This rule rejects an Interest on any of these conditions:
     * (1) SigSeqNum is absent.
     * (2) SigSeqNum value is less than or equal to a previous value.
     */
    function SeqNum(opts?: SeqNumOptions): Rule;
}

declare const TT: {
    Name: number;
    GenericNameComponent: number;
    ImplicitSha256DigestComponent: number;
    ParametersSha256DigestComponent: number;
    Interest: number;
    CanBePrefix: number;
    MustBeFresh: number;
    ForwardingHint: number;
    Delegation: number;
    Preference: number;
    Nonce: number;
    InterestLifetime: number;
    HopLimit: number;
    AppParameters: number;
    ISigInfo: number;
    ISigValue: number;
    Data: number;
    MetaInfo: number;
    ContentType: number;
    FreshnessPeriod: number;
    FinalBlock: number;
    Content: number;
    DSigInfo: number;
    DSigValue: number;
    SigType: number;
    KeyLocator: number;
    KeyDigest: number;
    SigNonce: number;
    SigTime: number;
    SigSeqNum: number;
    Nack: number;
    NackReason: number;
};
declare const SigType: {
    Sha256: number;
    Sha256WithRsa: number;
    Sha256WithEcdsa: number;
    HmacWithSha256: number;
    Null: number;
};
declare const NackReason: {
    Congestion: number;
    Duplicate: number;
    NoRoute: number;
};

/** Nack header. */
declare class NackHeader {
    get reason(): number;
    set reason(v: number);
    private reason_;
    static decodeFrom(decoder: Decoder): NackHeader;
    constructor(reason?: number);
    encodeTo(encoder: Encoder): void;
}
/** Nack packet. */
declare class Nack {
    get reason(): number;
    set reason(v: number);
    header: NackHeader;
    interest: Interest;
    constructor(interest: Interest, header?: NackHeader | number);
}

declare const packet_lpm: typeof lpm;
type packet_AltUriConverter = AltUriConverter;
declare const packet_AltUriConverter: typeof AltUriConverter;
declare const packet_AltUri: typeof AltUri;
type packet_ComponentLike = ComponentLike;
declare const packet_Component: typeof Component;
declare const packet_NamingConvention: typeof NamingConvention;
declare const packet_ImplicitDigest: typeof ImplicitDigest;
declare const packet_ParamsDigest: typeof ParamsDigest;
type packet_NameLike = NameLike;
declare const packet_Name: typeof Name;
declare const packet_LLEncrypt: typeof LLEncrypt;
declare const packet_LLDecrypt: typeof LLDecrypt;
type packet_Encrypter<_0> = Encrypter<_0>;
type packet_Decrypter<_0> = Decrypter<_0>;
declare const packet_noopEncryption: typeof noopEncryption;
declare const packet_SignedInterestPolicy: typeof SignedInterestPolicy;
declare const packet_LLSign: typeof LLSign;
declare const packet_LLVerify: typeof LLVerify;
declare const packet_Signer: typeof Signer;
declare const packet_Verifier: typeof Verifier;
declare const packet_noopSigning: typeof noopSigning;
declare const packet_digestSigning: typeof digestSigning;
declare const packet_nullSigner: typeof nullSigner;
declare const packet_TT: typeof TT;
declare const packet_SigType: typeof SigType;
declare const packet_NackReason: typeof NackReason;
declare const packet_Data: typeof Data;
declare const packet_FwHint: typeof FwHint;
declare const packet_Interest: typeof Interest;
declare const packet_KeyLocator: typeof KeyLocator;
type packet_NackHeader = NackHeader;
declare const packet_NackHeader: typeof NackHeader;
type packet_Nack = Nack;
declare const packet_Nack: typeof Nack;
declare const packet_SigInfo: typeof SigInfo;
declare namespace packet {
  export {
    packet_lpm as lpm,
    packet_AltUriConverter as AltUriConverter,
    packet_AltUri as AltUri,
    packet_ComponentLike as ComponentLike,
    packet_Component as Component,
    packet_NamingConvention as NamingConvention,
    packet_ImplicitDigest as ImplicitDigest,
    packet_ParamsDigest as ParamsDigest,
    packet_NameLike as NameLike,
    packet_Name as Name,
    packet_LLEncrypt as LLEncrypt,
    packet_LLDecrypt as LLDecrypt,
    packet_Encrypter as Encrypter,
    packet_Decrypter as Decrypter,
    packet_noopEncryption as noopEncryption,
    packet_SignedInterestPolicy as SignedInterestPolicy,
    packet_LLSign as LLSign,
    packet_LLVerify as LLVerify,
    packet_Signer as Signer,
    packet_Verifier as Verifier,
    packet_noopSigning as noopSigning,
    packet_digestSigning as digestSigning,
    packet_nullSigner as nullSigner,
    packet_TT as TT,
    packet_SigType as SigType,
    packet_NackReason as NackReason,
    packet_Data as Data,
    packet_FwHint as FwHint,
    packet_Interest as Interest,
    packet_KeyLocator as KeyLocator,
    packet_NackHeader as NackHeader,
    packet_Nack as Nack,
    packet_SigInfo as SigInfo,
  };
}

declare type L3Pkt = Interest | Data | Nack;
/** A logical packet in the forwarder. */
interface FwPacket<T extends L3Pkt = L3Pkt> {
    l3: T;
    token?: unknown;
    reject?: RejectInterest.Reason;
    cancel?: boolean;
}
declare namespace FwPacket {
    function create<T extends L3Pkt>(l3: T, token?: unknown): FwPacket<T>;
    /** Whether this is a plain packet that can be sent on the wire. */
    function isEncodable({ reject, cancel }: FwPacket): boolean;
}
/** Indicate an Interest has been rejected. */
declare class RejectInterest implements FwPacket<Interest> {
    reject: RejectInterest.Reason;
    l3: Interest;
    token?: unknown;
    constructor(reject: RejectInterest.Reason, l3: Interest, token?: unknown);
}
declare namespace RejectInterest {
    type Reason = "cancel" | "expire";
}

type Arguments<T> = [T] extends [(...args: infer U) => any]
  ? U
  : [T] extends [void] ? [] : [T]

/**
 * Type-safe event emitter.
 *
 * Use it like this:
 *
 * interface MyEvents {
 *   error: (error: Error) => void
 *   message: (from: string, content: string) => void
 * }
 *
 * const myEmitter = new EventEmitter() as TypedEmitter<MyEvents>
 *
 * myEmitter.on("message", (from, content) => {
 *   // ...
 * })
 *
 * myEmitter.emit("error", "x")  // <- Will catch this type error
 */
interface TypedEventEmitter<Events> {
  addListener<E extends keyof Events> (event: E, listener: Events[E]): this
  on<E extends keyof Events> (event: E, listener: Events[E]): this
  once<E extends keyof Events> (event: E, listener: Events[E]): this
  prependListener<E extends keyof Events> (event: E, listener: Events[E]): this
  prependOnceListener<E extends keyof Events> (event: E, listener: Events[E]): this

  off<E extends keyof Events>(event: E, listener: Events[E]): this
  removeAllListeners<E extends keyof Events> (event?: E): this
  removeListener<E extends keyof Events> (event: E, listener: Events[E]): this

  emit<E extends keyof Events> (event: E, ...args: Arguments<Events[E]>): boolean
  eventNames (): (keyof Events | string | symbol)[]
  rawListeners<E extends keyof Events> (event: E): Function[]
  listeners<E extends keyof Events> (event: E): Function[]
  listenerCount<E extends keyof Events> (event: E): number

  getMaxListeners (): number
  setMaxListeners (maxListeners: number): this
}

interface Events$7 {
    /** Emitted before adding face. */
    faceadd: (face: FwFace) => void;
    /** Emitted after removing face. */
    facerm: (face: FwFace) => void;
    /** Emitted before adding prefix to face. */
    prefixadd: (face: FwFace, prefix: Name) => void;
    /** Emitted after removing prefix from face. */
    prefixrm: (face: FwFace, prefix: Name) => void;
    /** Emitted before advertising prefix. */
    annadd: (announcement: Name) => void;
    /** Emitted before withdrawing prefix. */
    annrm: (announcement: Name) => void;
    /** Emitted after packet arrival. */
    pktrx: (face: FwFace, pkt: FwPacket) => void;
    /** Emitted before packet transmission. */
    pkttx: (face: FwFace, pkt: FwPacket) => void;
}
/** Forwarding plane. */
interface Forwarder extends TypedEventEmitter<Events$7> {
    /** Node names, used in forwarding hint processing. */
    readonly nodeNames: Name[];
    /** Logical faces. */
    readonly faces: Set<FwFace>;
    /** Add a logical face to the forwarding plane. */
    addFace(face: FwFace.RxTx | FwFace.RxTxDuplex, attributes?: FwFace.Attributes): FwFace;
    /**
     * Cancel timers and other I/O resources.
     * This instance should not be used after this operation.
     */
    close(): void;
}
declare namespace Forwarder {
    interface Options {
        /** Per-face RX buffer length. */
        faceRxBuffer?: number;
        /** Per-face TX buffer length. */
        faceTxBuffer?: number;
        /** Whether to try matching Data without PIT token. */
        dataNoTokenMatch?: boolean;
    }
    const DefaultOptions: Required<Options>;
    /** Create a new forwarding plane. */
    function create(options?: Options): Forwarder;
    /** Access the default forwarding plane instance. */
    function getDefault(): Forwarder;
    /** Replace the default forwarding plane instance. */
    function replaceDefault(fw?: Forwarder): void;
    /** Delete default instance (mainly for unit testing). */
    function deleteDefault(): void;
}

interface Events$6 {
    /** Emitted upon face is up as reported by lower layer. */
    up: () => void;
    /** Emitted upon face is down as reported by lower layer. */
    down: () => void;
    /** Emitted upon face is closed. */
    close: () => void;
}
/** A socket or network interface associated with forwarding plane. */
interface FwFace extends TypedEventEmitter<Events$6> {
    readonly fw: Forwarder;
    readonly attributes: FwFace.Attributes;
    readonly running: boolean;
    readonly txQueueLength: number;
    /** Shutdown the face. */
    close(): void;
    toString(): string;
    /** Determine if a route is present on the face. */
    hasRoute(name: NameLike): boolean;
    /** Add a route toward the face. */
    addRoute(name: NameLike, announcement?: FwFace.RouteAnnouncement): void;
    /** Remove a route toward the face. */
    removeRoute(name: NameLike, announcement?: FwFace.RouteAnnouncement): void;
    /** Add a prefix announcement associated with the face. */
    addAnnouncement(name: NameLike): void;
    /** Remove a prefix announcement associated with the face. */
    removeAnnouncement(name: NameLike): void;
}
declare namespace FwFace {
    interface Attributes extends Record<string, any> {
        /** Short string to identify the face. */
        describe?: string;
        /** Whether face is local. Default is false. */
        local?: boolean;
        /** Whether to readvertise registered routes. Default is true. */
        advertiseFrom?: boolean;
        /**
         * Whether routes registered on this face would cause FIB to stop matching onto shorter prefixes.
         * Default is true.
         * More explanation in @ndn/endpoint package ProducerOptions type.
         */
        routeCapture?: boolean;
    }
    type RouteAnnouncement = boolean | number | NameLike;
    interface RxTxEvents {
        up: () => void;
        down: () => void;
    }
    interface RxTxBase extends Partial<TypedEventEmitter<RxTxEvents>> {
        readonly attributes?: Attributes;
    }
    interface RxTx extends RxTxBase {
        rx: AsyncIterable<FwPacket>;
        tx: (iterable: AsyncIterable<FwPacket>) => void;
    }
    interface RxTxDuplex extends RxTxBase {
        /**
         * The transform function takes an iterable of packets sent by the forwarder,
         * and returns an iterable of packets received by the forwarder.
         */
        duplex: (iterable: AsyncIterable<FwPacket>) => AsyncIterable<FwPacket>;
    }
}

/**
 * `Event` interface.
 * @see https://dom.spec.whatwg.org/#event
 */
interface Event {
    /**
     * The type of this event.
     */
    readonly type: string

    /**
     * The target of this event.
     */
    readonly target: EventTarget<{}, {}, "standard"> | null

    /**
     * The current target of this event.
     */
    readonly currentTarget: EventTarget<{}, {}, "standard"> | null

    /**
     * The target of this event.
     * @deprecated
     */
    readonly srcElement: any | null

    /**
     * The composed path of this event.
     */
    composedPath(): EventTarget<{}, {}, "standard">[]

    /**
     * Constant of NONE.
     */
    readonly NONE: number

    /**
     * Constant of CAPTURING_PHASE.
     */
    readonly CAPTURING_PHASE: number

    /**
     * Constant of BUBBLING_PHASE.
     */
    readonly BUBBLING_PHASE: number

    /**
     * Constant of AT_TARGET.
     */
    readonly AT_TARGET: number

    /**
     * Indicates which phase of the event flow is currently being evaluated.
     */
    readonly eventPhase: number

    /**
     * Stop event bubbling.
     */
    stopPropagation(): void

    /**
     * Stop event bubbling.
     */
    stopImmediatePropagation(): void

    /**
     * Initialize event.
     * @deprecated
     */
    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void

    /**
     * The flag indicating bubbling.
     */
    readonly bubbles: boolean

    /**
     * Stop event bubbling.
     * @deprecated
     */
    cancelBubble: boolean

    /**
     * Set or get cancellation flag.
     * @deprecated
     */
    returnValue: boolean

    /**
     * The flag indicating whether the event can be canceled.
     */
    readonly cancelable: boolean

    /**
     * Cancel this event.
     */
    preventDefault(): void

    /**
     * The flag to indicating whether the event was canceled.
     */
    readonly defaultPrevented: boolean

    /**
     * The flag to indicating if event is composed.
     */
    readonly composed: boolean

    /**
     * Indicates whether the event was dispatched by the user agent.
     */
    readonly isTrusted: boolean

    /**
     * The unix time of this event.
     */
    readonly timeStamp: number
}

/**
 * The constructor of `EventTarget` interface.
 */
type EventTargetConstructor<
    TEvents extends EventTarget.EventDefinition = {},
    TEventAttributes extends EventTarget.EventDefinition = {},
    TMode extends EventTarget.Mode = "loose"
> = {
    prototype: EventTarget<TEvents, TEventAttributes, TMode>
    new(): EventTarget<TEvents, TEventAttributes, TMode>
}

/**
 * `EventTarget` interface.
 * @see https://dom.spec.whatwg.org/#interface-eventtarget
 */
type EventTarget<
    TEvents extends EventTarget.EventDefinition = {},
    TEventAttributes extends EventTarget.EventDefinition = {},
    TMode extends EventTarget.Mode = "loose"
> = EventTarget.EventAttributes<TEventAttributes> & {
    /**
     * Add a given listener to this event target.
     * @param eventName The event name to add.
     * @param listener The listener to add.
     * @param options The options for this listener.
     */
    addEventListener<TEventType extends EventTarget.EventType<TEvents, TMode>>(
        type: TEventType,
        listener:
            | EventTarget.Listener<EventTarget.PickEvent<TEvents, TEventType>>
            | null,
        options?: boolean | EventTarget.AddOptions
    ): void

    /**
     * Remove a given listener from this event target.
     * @param eventName The event name to remove.
     * @param listener The listener to remove.
     * @param options The options for this listener.
     */
    removeEventListener<TEventType extends EventTarget.EventType<TEvents, TMode>>(
        type: TEventType,
        listener:
            | EventTarget.Listener<EventTarget.PickEvent<TEvents, TEventType>>
            | null,
        options?: boolean | EventTarget.RemoveOptions
    ): void

    /**
     * Dispatch a given event.
     * @param event The event to dispatch.
     * @returns `false` if canceled.
     */
    dispatchEvent<TEventType extends EventTarget.EventType<TEvents, TMode>>(
        event: EventTarget.EventData<TEvents, TEventType, TMode>
    ): boolean
}

declare const EventTarget: EventTargetConstructor & {
    /**
     * Create an `EventTarget` instance with detailed event definition.
     *
     * The detailed event definition requires to use `defineEventAttribute()`
     * function later.
     *
     * Unfortunately, the second type parameter `TEventAttributes` was needed
     * because we cannot compute string literal types.
     *
     * @example
     * const signal = new EventTarget<{ abort: Event }, { onabort: Event }>()
     * defineEventAttribute(signal, "abort")
     */
    new <
        TEvents extends EventTarget.EventDefinition,
        TEventAttributes extends EventTarget.EventDefinition,
        TMode extends EventTarget.Mode = "loose"
    >(): EventTarget<TEvents, TEventAttributes, TMode>

    /**
     * Define an `EventTarget` constructor with attribute events and detailed event definition.
     *
     * Unfortunately, the second type parameter `TEventAttributes` was needed
     * because we cannot compute string literal types.
     *
     * @example
     * class AbortSignal extends EventTarget<{ abort: Event }, { onabort: Event }>("abort") {
     *      abort(): void {}
     * }
     *
     * @param events Optional event attributes (e.g. passing in `"click"` adds `onclick` to prototype).
     */
    <
        TEvents extends EventTarget.EventDefinition = {},
        TEventAttributes extends EventTarget.EventDefinition = {},
        TMode extends EventTarget.Mode = "loose"
    >(events: string[]): EventTargetConstructor<
        TEvents,
        TEventAttributes,
        TMode
    >

    /**
     * Define an `EventTarget` constructor with attribute events and detailed event definition.
     *
     * Unfortunately, the second type parameter `TEventAttributes` was needed
     * because we cannot compute string literal types.
     *
     * @example
     * class AbortSignal extends EventTarget<{ abort: Event }, { onabort: Event }>("abort") {
     *      abort(): void {}
     * }
     *
     * @param events Optional event attributes (e.g. passing in `"click"` adds `onclick` to prototype).
     */
    <
        TEvents extends EventTarget.EventDefinition = {},
        TEventAttributes extends EventTarget.EventDefinition = {},
        TMode extends EventTarget.Mode = "loose"
    >(event0: string, ...events: string[]): EventTargetConstructor<
        TEvents,
        TEventAttributes,
        TMode
    >
}

declare namespace EventTarget {
    /**
     * Options of `removeEventListener()` method.
     */
    export interface RemoveOptions {
        /**
         * The flag to indicate that the listener is for the capturing phase.
         */
        capture?: boolean
    }

    /**
     * Options of `addEventListener()` method.
     */
    export interface AddOptions extends RemoveOptions {
        /**
         * The flag to indicate that the listener doesn't support
         * `event.preventDefault()` operation.
         */
        passive?: boolean
        /**
         * The flag to indicate that the listener will be removed on the first
         * event.
         */
        once?: boolean
    }

    /**
     * The type of regular listeners.
     */
    export interface FunctionListener<TEvent> {
        (event: TEvent): void
    }

    /**
     * The type of object listeners.
     */
    export interface ObjectListener<TEvent> {
        handleEvent(event: TEvent): void
    }

    /**
     * The type of listeners.
     */
    export type Listener<TEvent> =
        | FunctionListener<TEvent>
        | ObjectListener<TEvent>

    /**
     * Event definition.
     */
    export type EventDefinition = {
        readonly [key: string]: Event
    }

    /**
     * Mapped type for event attributes.
     */
    export type EventAttributes<TEventAttributes extends EventDefinition> = {
        [P in keyof TEventAttributes]:
            | FunctionListener<TEventAttributes[P]>
            | null
    }

    /**
     * The type of event data for `dispatchEvent()` method.
     */
    export type EventData<
        TEvents extends EventDefinition,
        TEventType extends keyof TEvents | string,
        TMode extends Mode
    > =
        TEventType extends keyof TEvents
            ? (
                // Require properties which are not generated automatically.
                & Pick<
                    TEvents[TEventType],
                    Exclude<keyof TEvents[TEventType], OmittableEventKeys>
                >
                // Properties which are generated automatically are optional.
                & Partial<Pick<Event, OmittableEventKeys>>
            )
            : (
                TMode extends "standard"
                    ? Event
                    : Event | NonStandardEvent
            )

    /**
     * The string literal types of the properties which are generated
     * automatically in `dispatchEvent()` method.
     */
    export type OmittableEventKeys = Exclude<keyof Event, "type">

    /**
     * The type of event data.
     */
    export type NonStandardEvent = {
        [key: string]: any
        type: string
    }

    /**
     * The type of listeners.
     */
    export type PickEvent<
        TEvents extends EventDefinition,
        TEventType extends keyof TEvents | string,
    > =
        TEventType extends keyof TEvents
            ? TEvents[TEventType]
            : Event

    /**
     * Event type candidates.
     */
    export type EventType<
        TEvents extends EventDefinition,
        TMode extends Mode
    > =
        TMode extends "strict"
            ? keyof TEvents
            : keyof TEvents | string

    /**
     * - `"strict"` ..... Methods don't accept unknown events.
     *                    `dispatchEvent()` accepts partial objects.
     * - `"loose"` ...... Methods accept unknown events.
     *                    `dispatchEvent()` accepts partial objects.
     * - `"standard"` ... Methods accept unknown events.
     *                    `dispatchEvent()` doesn't accept partial objects.
     */
    export type Mode = "strict" | "standard" | "loose"
}

type Events$5 = {
    abort: any
}
type EventAttributes = {
    onabort: any
}
/**
 * The signal class.
 * @see https://dom.spec.whatwg.org/#abortsignal
 */
declare class AbortSignal extends EventTarget<Events$5, EventAttributes> {
    /**
     * AbortSignal cannot be constructed directly.
     */
    constructor()
    /**
     * Returns `true` if this `AbortSignal`"s `AbortController` has signaled to abort, and `false` otherwise.
     */
    readonly aborted: boolean
}

interface ConsumerOptions {
    /** Description for debugging purpose. */
    describe?: string;
    /** AbortSignal that allows canceling the Interest via AbortController. */
    signal?: AbortSignal | globalThis.AbortSignal;
    /**
     * Modify Interest according to specified options.
     * Default is no modification.
     */
    modifyInterest?: Interest.Modify;
    /**
     * Retransmission policy.
     * Default is disabling retransmission.
     */
    retx?: RetxPolicy;
    /**
     * Data verifier.
     * Default is no verification.
     */
    verifier?: Verifier;
}
/**
 * Progress of Data retrieval.
 *
 * This is a Promise that resolves with the retrieved Data and rejects upon timeout,
 * annotated with the Interest and some counters.
 */
interface ConsumerContext extends Promise<Data> {
    readonly interest: Interest;
    readonly nRetx: number;
}
/** Consumer functionality of Endpoint. */
declare class EndpointConsumer {
    fw: Forwarder;
    opts: ConsumerOptions;
    /** Consume a single piece of Data. */
    consume(interestInput: Interest | NameLike, opts?: ConsumerOptions): ConsumerContext;
}

/** Outgoing Data buffer for producer. */
interface DataBuffer {
    find: (interest: Interest) => Promise<Data | undefined>;
    insert: (...pkts: Data[]) => Promise<void>;
}

/**
 * Producer handler function.
 *
 * The handler can return a Data to respond to the Interest, or return `undefined` to cause a timeout.
 *
 * If Options.dataBuffer is provided, the handler can access the DataBuffer via producer.dataBuffer .
 * The handler can return a Data to respond to the Interest, which is also inserted to the DataBuffer
 * unless Options.autoBuffer is set to false. If the handler returns `undefined`, the Interest is used
 * to query the DataBuffer, and any matching Data may be sent.
 */
declare type ProducerHandler = (interest: Interest, producer: Producer) => Promise<Data | undefined>;
interface ProducerOptions {
    /** Description for debugging purpose. */
    describe?: string;
    /** AbortSignal that allows closing the producer via AbortController. */
    signal?: AbortSignal | globalThis.AbortSignal;
    /**
     * Whether routes registered by producer would cause @ndn/fw internal FIB to stop matching toward
     * shorter prefixes. Default is true.
     *
     * If all nexthops of a FIB entry are set to non-capture, FIB lookup may continue onto nexthops
     * on FIB entries with shorter prefixes. One use case is in @ndn/sync package, where both local
     * and remote sync participants want to receive each other's Interests.
     */
    routeCapture?: boolean;
    /**
     * What name to be readvertised.
     * Ignored if prefix is undefined.
     */
    announcement?: EndpointProducer.RouteAnnouncement;
    /**
     * How many Interests to process in parallel.
     * Default is 1.
     */
    concurrency?: number;
    /**
     * If specified, automatically sign Data packets unless already signed.
     * This does not apply to Data packets manually inserted to the dataBuffer.
     */
    dataSigner?: Signer;
    /** Outgoing Data buffer. */
    dataBuffer?: DataBuffer;
    /**
     * Whether to add handler return value to buffer.
     * Default is true.
     * Ignored when dataBuffer is not specified.
     */
    autoBuffer?: boolean;
}
/** A running producer. */
interface Producer {
    readonly prefix: Name | undefined;
    readonly face: FwFace;
    readonly dataBuffer?: DataBuffer;
    /**
     * Process an Interest received elsewhere.
     *
     * Use case of this function:
     * 1. Producer A dynamically creates producer B upon receiving an Interest.
     * 2. Producer A can invoke this function to let producer B generate a response.
     * 3. The response should be sent by producer A.
     */
    processInterest: (interest: Interest) => Promise<Data | undefined>;
    /** Close the producer. */
    close: () => void;
}
/** Producer functionality of Endpoint. */
declare class EndpointProducer {
    fw: Forwarder;
    opts: ProducerOptions;
    /**
     * Start a producer.
     * @param prefixInput prefix registration; if undefined, prefixes may be added later.
     * @param handler function to handle incoming Interest.
     */
    produce(prefixInput: NameLike | undefined, handler: ProducerHandler, opts?: ProducerOptions): Producer;
}
declare namespace EndpointProducer {
    type RouteAnnouncement = FwFace.RouteAnnouncement;
}

interface Options extends ConsumerOptions, ProducerOptions {
    fw?: Forwarder;
}
/**
 * Endpoint is the main entry point for an application to interact with the forwarding plane.
 * It provides basic consumer and producer functionality.
 */
declare class Endpoint {
    readonly opts: Options;
    readonly fw: Forwarder;
    constructor(opts?: Options);
}
interface Endpoint extends EndpointConsumer, EndpointProducer {
}
declare namespace Endpoint {
    /** Delete default Forwarder instance (mainly for unit testing). */
    const deleteDefaultForwarder: typeof Forwarder.deleteDefault;
    type RouteAnnouncement = EndpointProducer.RouteAnnouncement;
}

// Type definitions for @root/asn1 1.0


interface Element$1<V extends string|Uint8Array> {
    type: number;
    lengthSize: number;
    length: number;
    value?: V | undefined;
    children?: Array<Element$1<V>> | undefined;
}

type ElementBuffer = Element$1<Uint8Array>;

declare type If<Cond, True, False, Unknown = True | False> = Cond extends true ? True : Cond extends false ? False : Unknown;
/** Identify kind of key. */
declare type KeyKind = "private" | "public" | "secret";
declare namespace KeyKind {
    /** Pick "private" or "secret" based on whether the algorithm is asymmetric. */
    type PrivateSecret<Asym extends boolean> = If<Asym, "private", "secret">;
    /** Pick "public" or "secret" based on whether the algorithm is asymmetric. */
    type PublicSecret<Asym extends boolean> = If<Asym, "public", "secret">;
}
declare const KeyKind: unique symbol;
interface Key<K extends KeyKind> {
    readonly name: Name;
    readonly [KeyKind]: K;
    readonly spki?: "public" extends K ? Uint8Array : never;
}
/** Named private key. */
declare type PrivateKey = Key<"private">;
/** Named public key. */
declare type PublicKey = Key<"public">;
/** Named secret key. */
declare type SecretKey = Key<"secret">;
/** Named private key or secret key signer. */
interface NamedSigner<Asym extends boolean = any> extends Key<KeyKind.PrivateSecret<Asym>>, Signer {
    readonly sigType: number;
    /** Create a Signer that signs with this private key but a different KeyLocator. */
    withKeyLocator: (keyLocator: KeyLocator.CtorArg) => Signer;
}
declare namespace NamedSigner {
    /** Named private key signer. */
    type PrivateKey = NamedSigner<true>;
    /** Named secret key signer. */
    type SecretKey = NamedSigner<false>;
}
/** Named public key or secret key verifier. */
interface NamedVerifier<Asym extends boolean = any> extends Key<KeyKind.PublicSecret<Asym>>, Verifier {
    readonly sigType: number;
}
declare namespace NamedVerifier {
    /** Named public key verifier. */
    type PublicKey = NamedVerifier<true>;
    /** Named secret key verifier. */
    type SecretKey = NamedVerifier<false>;
}
/** Named public key or secret key encrypter. */
interface NamedEncrypter<Asym extends boolean = any> extends Key<KeyKind.PublicSecret<Asym>>, LLEncrypt.Key {
}
declare namespace NamedEncrypter {
    /** Named public key encrypter. */
    type PublicKey = NamedEncrypter<true>;
    /** Named secret key encrypter. */
    type SecretKey = NamedEncrypter<false>;
}
/** Named private key or secret key decrypter. */
interface NamedDecrypter<Asym extends boolean = any> extends Key<KeyKind.PrivateSecret<Asym>>, LLDecrypt.Key {
}
declare namespace NamedDecrypter {
    /** Named private key decrypter. */
    type PrivateKey = NamedDecrypter<true>;
    /** Named secret key decrypter. */
    type SecretKey = NamedDecrypter<false>;
}
/** WebCrypto based algorithm implementation. */
interface CryptoAlgorithm<I = any, Asym extends boolean = any, G = any> {
    /**
     * Identifies an algorithm in storage.
     * This should be changed when the serialization format changes.
     */
    readonly uuid: string;
    readonly keyUsages: If<Asym, Record<"private" | "public", KeyUsage[]>, Record<"secret", KeyUsage[]>, {}>;
    /** Generate key pair or secret key. */
    cryptoGenerate: (params: G, extractable: boolean) => Promise<Asym extends true ? CryptoAlgorithm.GeneratedKeyPair<I> : Asym extends false ? CryptoAlgorithm.GeneratedSecretKey<I> : never>;
    /**
     * Import public key from SPKI.
     *
     * This should only appear on asymmetric algorithm.
     */
    importSpki?: (spki: Uint8Array, der: ElementBuffer) => Promise<CryptoAlgorithm.PublicKey<I>>;
}
declare namespace CryptoAlgorithm {
    function isAsym<I, G>(algo: CryptoAlgorithm<I, any, G>): algo is CryptoAlgorithm<I, true, G>;
    function isSym<I, G>(algo: CryptoAlgorithm<I, any, G>): algo is CryptoAlgorithm<I, false, G>;
    function isSigning<I, Asym extends boolean = any, G = any>(algo: CryptoAlgorithm<I, Asym, G>): algo is SigningAlgorithm<I, Asym, G>;
    function isEncryption<I, Asym extends boolean = any, G = any>(algo: CryptoAlgorithm<I, Asym, G>): algo is EncryptionAlgorithm<I, Asym, G>;
    interface PrivateKey<I = any> {
        privateKey: CryptoKey;
        info: I;
    }
    interface PublicKey<I = any> {
        publicKey: CryptoKey;
        spki: Uint8Array;
        info: I;
    }
    interface SecretKey<I = any> {
        secretKey: CryptoKey;
        info: I;
    }
    type PrivateSecretKey<I = any, Asym extends boolean = any> = If<Asym, PrivateKey<I>, SecretKey<I>>;
    type PublicSecretKey<I = any, Asym extends boolean = any> = If<Asym, PublicKey<I>, SecretKey<I>>;
    interface GeneratedKeyPair<I = any> extends PrivateKey<I>, PublicKey<I> {
        jwkImportParams: AlgorithmIdentifier;
    }
    interface GeneratedSecretKey<I = any> extends SecretKey<I> {
        jwkImportParams: AlgorithmIdentifier;
    }
}
/** WebCrypto based signing algorithm implementation. */
interface SigningAlgorithm<I = any, Asym extends boolean = any, G = any> extends CryptoAlgorithm<I, Asym, G> {
    readonly sigType: number;
    makeLLSign: If<Asym, (key: CryptoAlgorithm.PrivateKey<I>) => LLSign, (key: CryptoAlgorithm.SecretKey<I>) => LLSign, unknown>;
    makeLLVerify: If<Asym, (key: CryptoAlgorithm.PublicKey<I>) => LLVerify, (key: CryptoAlgorithm.SecretKey<I>) => LLVerify, unknown>;
}
/** WebCrypto based encryption algorithm implementation. */
interface EncryptionAlgorithm<I = any, Asym extends boolean = any, G = any> extends CryptoAlgorithm<I, Asym, G> {
    makeLLEncrypt: If<Asym, (key: CryptoAlgorithm.PublicKey<I>) => LLEncrypt, (key: CryptoAlgorithm.SecretKey<I>) => LLEncrypt, unknown>;
    makeLLDecrypt: If<Asym, (key: CryptoAlgorithm.PrivateKey<I>) => LLDecrypt, (key: CryptoAlgorithm.SecretKey<I>) => LLDecrypt, unknown>;
}

/** Underlying storage provider. */
interface StoreProvider<T> {
    /**
     * Indicate whether the storage provider supports the structured clone algorithm.
     * If false, values must be serialized as JSON.
     */
    readonly canSClone: boolean;
    list: () => Promise<string[]>;
    get: (key: string) => Promise<T>;
    insert: (key: string, value: T) => Promise<void>;
    erase: (key: string) => Promise<void>;
}

declare abstract class StoreBase<T> {
    private readonly provider;
    private throttle;
    constructor(provider: StoreProvider<T>);
    get canSClone(): boolean;
    /** List item names. */
    list(): Promise<Name[]>;
    /** Erase item by name. */
    erase(name: Name): Promise<void>;
    protected getValue(name: Name): Promise<T>;
    protected insertValue(name: Name, value: T): Promise<void>;
    protected bufferToStorable(input: Uint8Array | string): Uint8Array | string;
}
declare namespace StoreBase {
    function bufferFromStorable(input: Uint8Array | string): Uint8Array;
}

declare class KeyLoader {
    private readonly extractable;
    constructor(extractable?: boolean);
    loadKey(name: Name, stored: KeyStore.StoredKey): Promise<KeyStore.KeyPair>;
    private loadAsymmetric;
    private loadSymmetric;
}
/** Storage of key pairs. */
declare class KeyStore extends StoreBase<KeyStore.StoredKey> {
    private loader;
    get(name: Name): Promise<KeyStore.KeyPair>;
    insert(name: Name, stored: KeyStore.StoredKey): Promise<void>;
}
declare namespace KeyStore {
    const Loader: typeof KeyLoader;
    class KeyPair<Asym extends boolean = any, I = any> {
        readonly name: Name;
        readonly algo: CryptoAlgorithm<I, Asym>;
        readonly pvt: CryptoAlgorithm.PrivateSecretKey<I, Asym>;
        readonly pub: CryptoAlgorithm.PublicSecretKey<I, Asym>;
        constructor(name: Name, algo: CryptoAlgorithm<I, Asym>, pvt: CryptoAlgorithm.PrivateSecretKey<I, Asym>, pub: CryptoAlgorithm.PublicSecretKey<I, Asym>);
        get signer(): NamedSigner<Asym>;
        get verifier(): NamedVerifier<Asym>;
        get encrypter(): NamedEncrypter<Asym>;
        get decrypter(): NamedDecrypter<Asym>;
        get publicKey(): PublicKey;
    }
    interface StoredKey {
        algo: string;
        info: any;
        jwkImportParams?: AlgorithmIdentifier;
        privateKey?: CryptoKey | JsonWebKey;
        publicKey?: CryptoKey | JsonWebKey;
        publicKeySpki?: Uint8Array | string;
        secretKey?: CryptoKey | JsonWebKey;
    }
}

/** Certificate validity period. */
declare class ValidityPeriod {
    static decodeFrom(decoder: Decoder): ValidityPeriod;
    constructor();
    constructor(notBefore: ValidityPeriod.TimestampInput, notAfter: ValidityPeriod.TimestampInput);
    notBefore: number;
    notAfter: number;
    encodeTo(encoder: Encoder): void;
    /** Determine whether the specified timestamp is within validity period. */
    includes(t: ValidityPeriod.TimestampInput): boolean;
    /** Determine whether this validity period equals another. */
    equals({ notBefore, notAfter }: ValidityPeriod): boolean;
    /** Compute the intersection of this and other validity periods. */
    intersect(...validityPeriods: ValidityPeriod[]): ValidityPeriod;
    toString(): string;
}
declare namespace ValidityPeriod {
    type TimestampInput = number | Date;
    const MAX: ValidityPeriod;
    function daysFromNow(n: number): ValidityPeriod;
    function get(si: SigInfo): ValidityPeriod | undefined;
    function set(si: SigInfo, v?: ValidityPeriod): void;
}

/**
 * NDN Certificate v2.
 * This type is immutable.
 */
declare class Certificate {
    readonly data: Data;
    readonly validity: ValidityPeriod;
    static fromData(data: Data): Certificate;
    private constructor();
    get name(): Name;
    get issuer(): Name | undefined;
    get isSelfSigned(): boolean;
    /** Public key in SubjectPublicKeyInfo (SPKI) binary format. */
    get publicKeySpki(): Uint8Array;
    /** Import SPKI as public key. */
    importPublicKey<I, A extends CryptoAlgorithm<I>>(algoList: readonly A[]): Promise<[A, CryptoAlgorithm.PublicKey<I>]>;
    /** Create verifier from SPKI. */
    createVerifier(): Promise<NamedVerifier.PublicKey>;
    /** Create encrypter from SPKI. */
    createEncrypter(): Promise<NamedEncrypter.PublicKey>;
    private verifier?;
    private encrypter?;
}
declare namespace Certificate {
    interface BuildOptions {
        name: Name;
        freshness?: number;
        validity: ValidityPeriod;
        publicKeySpki: Uint8Array;
        signer: Signer;
    }
    function build({ name, freshness, validity, publicKeySpki, signer, }: BuildOptions): Promise<Certificate>;
    interface IssueOptions {
        freshness?: number;
        validity: ValidityPeriod;
        issuerId: Component;
        issuerPrivateKey: Signer;
        publicKey: PublicKey;
    }
    function issue(options: IssueOptions): Promise<Certificate>;
    interface SelfSignOptions {
        freshness?: number;
        validity?: ValidityPeriod;
        privateKey: NamedSigner;
        publicKey: PublicKey;
    }
    function selfSign(options: SelfSignOptions): Promise<Certificate>;
}

interface StoredCert {
    certBuffer: Uint8Array | string;
}
/** Storage of certificates. */
declare class CertStore extends StoreBase<StoredCert> {
    get(name: Name): Promise<Certificate>;
    insert(cert: Certificate): Promise<void>;
}

/** Storage of own private keys and certificates. */
declare abstract class KeyChain {
    /** Return whether insertKey function expects JsonWebKey instead of CryptoKey. */
    abstract readonly needJwk: boolean;
    /** List keys, filtered by name prefix. */
    abstract listKeys(prefix?: Name): Promise<Name[]>;
    /** Retrieve key pair by key name. */
    abstract getKeyPair(name: Name): Promise<KeyChain.KeyPair>;
    /**
     * Retrieve key by key name.
     * @param typ "signer", "verifier", etc
     */
    getKey<K extends keyof KeyChain.KeyPair>(name: Name, typ: K): Promise<KeyChain.KeyPair[K]>;
    /** Insert key pair. */
    abstract insertKey(name: Name, stored: KeyStore.StoredKey): Promise<void>;
    /** Delete key pair and associated certificates. */
    abstract deleteKey(name: Name): Promise<void>;
    /** List certificates, filtered by name prefix. */
    abstract listCerts(prefix?: Name): Promise<Name[]>;
    /** Retrieve certificate by cert name. */
    abstract getCert(name: Name): Promise<Certificate>;
    /** Insert certificate; key must exist. */
    abstract insertCert(cert: Certificate): Promise<void>;
    /** Delete certificate. */
    abstract deleteCert(name: Name): Promise<void>;
    /**
     * Create a signer from keys and certificates in the KeyChain.
     * @param name subject name, key name, or certificate name.
     *
     * @li If name is a certificate name, sign with the corresponding private key,
     *     and use the specified certificate name as KeyLocator.
     * @li If name is a key name, sign with the specified private key.
     *     If a non-self-signed certificate exists for this key, use the certificate name as KeyLocator.
     *     Otherwise, use the key name as KeyLocator.
     * @li If name is neither certificate name nor key name, it is interpreted as a subject name.
     *     A non-self-signed certificate of this subject name is preferred.
     *     If such a certificate does not exist, use any key of this subject name.
     * @li If prefixMatch is true, name can also be interpreted as a prefix of the subject name.
     */
    getSigner(name: Name, { prefixMatch, fallback, useKeyNameKeyLocator }?: KeyChain.GetSignerOptions): Promise<Signer>;
    private findSignerCertName;
}
declare namespace KeyChain {
    type KeyPair<Asym extends boolean = any> = KeyStore.KeyPair<Asym>;
    /**
     * Create a signer from keys and certificates in the KeyChain.
     * @param name subject name, key name, or certificate name.
     * @param fallback invoked when no matching key or certificate is found.
     * @param useKeyNameKeyLocator force KeyLocator to be key name instead of certificate name.
     *
     * @li If name is a certificate name, sign with the corresponding private key,
     *     and use the specified certificate name as KeyLocator.
     * @li If name is a key name, sign with the specified private key.
     *     If a non-self-signed certificate exists for this key, use the certificate name as KeyLocator.
     *     Otherwise, use the key name as KeyLocator.
     * @li If name is neither certificate name nor key name, it is interpreted as a subject name.
     *     A non-self-signed certificate of this subject name is preferred.
     *     If such a certificate does not exist, use any key of this subject name.
     * @li If prefixMatch is true, name can also be interpreted as a prefix of the subject name.
     */
    interface GetSignerOptions {
        /**
         * If false, name argument must equal subject name, key name, or certificate name.
         * If true, name argument may be a prefix of subject name.
         * Default is false.
         */
        prefixMatch?: boolean;
        /**
         * If a function, it is invoked when no matching key or certificate is found, and should
         * either return a fallback Signer or reject the promise.
         * If a Signer, it is used when no matching key or certificate is found.
         */
        fallback?: Signer | ((name: Name, keyChain: KeyChain, err?: Error) => Promise<Signer>);
        /**
         * If false, KeyLocator is a certificate name when a non-self-signed certificate exists.
         * If true, KeyLocator is the key name.
         * Default is false.
         */
        useKeyNameKeyLocator?: boolean;
    }
    /**
     * Open a persistent keychain.
     * @param locator in Node.js, a filesystem directory; in browser, a database name.
     */
    function open(locator: string): KeyChain;
    /** Open a keychain from given KeyStore and CertStore. */
    function open(keys: KeyStore, certs: CertStore): KeyChain;
    /** Create an in-memory ephemeral keychain. */
    function createTemp(): KeyChain;
}

/** Create a plain encrypter from crypto key. */
declare function createEncrypter<I>(algo: EncryptionAlgorithm<I>, key: CryptoAlgorithm.PublicSecretKey<I>): LLEncrypt.Key;
/** Create a named encrypter from crypto key. */
declare function createEncrypter<I, Asym extends boolean>(name: Name, algo: EncryptionAlgorithm<I, Asym>, key: CryptoAlgorithm.PublicSecretKey<I>): NamedEncrypter<Asym>;
/** Create a plain decrypter from crypto key. */
declare function createDecrypter<I>(algo: EncryptionAlgorithm<I>, key: CryptoAlgorithm.PrivateSecretKey<I>): LLDecrypt.Key;
/** Create a named decrypter from crypto key. */
declare function createDecrypter<I, Asym extends boolean>(name: Name, algo: EncryptionAlgorithm<I, Asym>, key: CryptoAlgorithm.PrivateSecretKey<I>): NamedDecrypter<Asym>;
declare type EncryptionOptG<I, Asym extends boolean, G> = {} extends G ? [EncryptionAlgorithm<I, Asym, G>, G?] : [EncryptionAlgorithm<I, Asym, G>, G];
/** Generate a pair of encrypter and decrypter. */
declare function generateEncryptionKey<I, Asym extends boolean, G>(name: NameLike, ...a: EncryptionOptG<I, Asym, G>): Promise<[NamedEncrypter<Asym>, NamedDecrypter<Asym>]>;
/** Generate a pair of encrypter and decrypter, and save to KeyChain. */
declare function generateEncryptionKey<I, Asym extends boolean, G>(keyChain: KeyChain, name: NameLike, ...a: EncryptionOptG<I, Asym, G>): Promise<[NamedEncrypter<Asym>, NamedDecrypter<Asym>]>;

/** Initialization Vector generator. */
declare abstract class IvGen {
    readonly ivLength: number;
    constructor(ivLength: number);
    wrap<T extends LLEncrypt.Key>(key: T): T;
    wrap(f: LLEncrypt): LLEncrypt;
    private wrapKey;
    private wrapLLEncrypt;
    protected abstract generate(): Uint8Array;
    protected update(plaintextLength: number, ciphertextLength: number): void;
}
/** Initialization Vector checker. */
declare abstract class IvChecker {
    readonly ivLength: number;
    constructor(ivLength: number);
    wrap<T extends LLDecrypt.Key>(key: T): T;
    wrap(f: LLDecrypt): LLDecrypt;
    private wrapKey;
    private wrapLLDecrypt;
    protected abstract check(iv: Uint8Array, plaintextLength: number, ciphertextLength: number): void;
}
/** IV generator using all random bits. */
declare class RandomIvGen extends IvGen {
    protected generate(): Uint8Array;
}
/**
 * Options for Initialization Vectors using fixed+random+counter structure.
 *
 * IVs following this construction method have three parts:
 * @li fixed bits, specified in options.
 * @li random bits, different for each key and in each session.
 * @li counter bits, monotonically increasing for each plaintext/ciphertext block.
 */
interface CounterIvOptions {
    /** IV length in octets. */
    ivLength: number;
    /**
     * Number of fixed bits.
     * @default 0
     */
    fixedBits?: number;
    /**
     * Fixed portion.
     * Required if fixedBits is positive.
     * This may be specified as a bigint or a Uint8Array.
     * If it's a Uint8Array, it must have fixedBits bits.
     * The least significant bits are taken.
     */
    fixed?: bigint | Uint8Array;
    /** Number of counter bits. */
    counterBits: number;
    /**
     * Crypto algorithm block size in octets.
     * If plaintext and ciphertext have different lengths, the longer length is considered.
     */
    blockSize: number;
}
/** IV generator using fixed+random+counter structure. */
declare class CounterIvGen extends IvGen {
    constructor(opts: CounterIvGen.Options);
    private readonly ivPrefix;
    private readonly ci;
    protected generate(): Uint8Array;
    protected update(plaintextLength: number, ciphertextLength: number): void;
}
declare namespace CounterIvGen {
    interface Options extends CounterIvOptions {
    }
}
/** Check IVs of fixed+random+counter structure to detect duplication. */
declare class CounterIvChecker extends IvChecker {
    constructor(opts: CounterIvChecker.Options);
    private readonly fixedMask;
    private readonly randomMask;
    private readonly counterMask;
    private readonly fixed;
    private readonly requireSameRandom;
    private lastRandom?;
    private readonly ci;
    extract(iv: Uint8Array): {
        fixed: bigint;
        random: bigint;
        counter: bigint;
    };
    protected check(iv: Uint8Array, plaintextLength: number, ciphertextLength: number): void;
}
declare namespace CounterIvChecker {
    interface Options extends CounterIvOptions {
        /**
         * If true, all IVs must have the same bits in the random portion.
         * @default false
         */
        requireSameRandom?: boolean;
    }
}

/** Create a plain signer from crypto key. */
declare function createSigner<I>(algo: SigningAlgorithm<I>, key: CryptoAlgorithm.PrivateSecretKey<I>): Signer;
/** Create a named signer from crypto key. */
declare function createSigner<I, Asym extends boolean>(name: Name, algo: SigningAlgorithm<I, Asym>, key: CryptoAlgorithm.PrivateSecretKey<I>): NamedSigner<Asym>;
/** Create a plain verifier from crypto key. */
declare function createVerifier<I>(algo: SigningAlgorithm<I>, key: CryptoAlgorithm.PublicSecretKey<I>): Verifier;
/** Create a named verifier from crypto key. */
declare function createVerifier<I, Asym extends boolean>(name: Name, algo: SigningAlgorithm<I, Asym>, key: CryptoAlgorithm.PublicSecretKey<I>): NamedVerifier<Asym>;
declare type SigningOptG<I, Asym extends boolean, G> = {} extends G ? [SigningAlgorithm<I, Asym, G>, G?] : [SigningAlgorithm<I, Asym, G>, G];
/** Generate a pair of signer and verifier with the default ECDSA signing algorithm. */
declare function generateSigningKey(name: NameLike): Promise<[NamedSigner.PrivateKey, NamedVerifier.PublicKey]>;
/** Generate a pair of signer and verifier with the default ECDSA signing algorithm, and save to KeyChain. */
declare function generateSigningKey(keyChain: KeyChain, name: NameLike): Promise<[NamedSigner.PrivateKey, NamedVerifier.PublicKey]>;
/** Generate a pair of signer and verifier. */
declare function generateSigningKey<I, Asym extends boolean, G>(name: NameLike, ...a: SigningOptG<I, Asym, G>): Promise<[NamedSigner<Asym>, NamedVerifier<Asym>]>;
/** Generate a pair of signer and verifier, and save to KeyChain. */
declare function generateSigningKey<I, Asym extends boolean, G>(keyChain: KeyChain, name: NameLike, ...a: SigningOptG<I, Asym, G>): Promise<[NamedSigner<Asym>, NamedVerifier<Asym>]>;

interface Encryption<I, G extends GenParams> extends EncryptionAlgorithm<I, false, G> {
    readonly ivLength: number;
    makeAesKeyGenParams: (genParams: G) => AesKeyGenParams;
}
declare type KeyLength = 128 | 192 | 256;
declare namespace KeyLength {
    const Default: KeyLength;
    const Choices: readonly KeyLength[];
}
/** Key generation parameters. */
interface GenParams {
    length?: KeyLength;
    /** Import raw key bits instead of generating. */
    importRaw?: Uint8Array;
}
declare type GenParams_ = GenParams;
/** AES block size in octets. */
declare const blockSize = 16;
/**
 * AES-CBC encryption algorithm.
 *
 * Initialization Vectors must be 16 octets.
 * During encryption, if IV is unspecified, it is randomly generated.
 * During decryption, quality of IV is not checked.
 */
declare const CBC: Encryption<{}, GenParams>;
/**
 * AES-CTR encryption algorithm.
 *
 * Initialization Vectors must be 16 octets.
 * During encryption, if IV is unspecified, it is constructed with two parts:
 * @li a 64-bit random number, generated each time a private key instance is constructed;
 * @li a 64-bit counter starting from zero.
 *
 * During decryption, quality of IV is not automatically checked.
 * Since the security of AES-CTR depends on having unique IVs, the application is recommended to
 * check IVs using CounterIvChecker type.
 */
declare const CTR: Encryption<CTR.Info, CTR.GenParams>;
declare namespace CTR {
    interface Info {
        /**
         * Specify number of bits in IV to use as counter.
         * This must be between 1 and 128. Default is 64.
         */
        counterLength: number;
    }
    type GenParams = GenParams_ & Partial<Info>;
}
/**
 * AES-GCM encryption algorithm.
 *
 * Initialization Vectors must be 12 octets.
 * During encryption, if IV is unspecified, it is constructed with two parts:
 * @li a 64-bit random number, generated each time a private key instance is constructed;
 * @li a 32-bit counter starting from zero.
 *
 * During decryption, quality of IV is not automatically checked.
 * Since the security of AES-CTR depends on having unique IVs, the application is recommended to
 * check IVs using CounterIvChecker type.
 */
declare const GCM: Encryption<{}, GenParams>;

type aes_d_Encryption<_0, _1> = Encryption<_0, _1>;
declare const aes_d_KeyLength: typeof KeyLength;
type aes_d_GenParams = GenParams;
declare const aes_d_blockSize: typeof blockSize;
declare const aes_d_CBC: typeof CBC;
declare const aes_d_CTR: typeof CTR;
declare const aes_d_GCM: typeof GCM;
declare namespace aes_d {
  export {
    aes_d_Encryption as Encryption,
    aes_d_KeyLength as KeyLength,
    aes_d_GenParams as GenParams,
    aes_d_blockSize as blockSize,
    aes_d_CBC as CBC,
    aes_d_CTR as CTR,
    aes_d_GCM as GCM,
  };
}

declare const PointSizes: {
    "P-256": number;
    "P-384": number;
    "P-521": number;
};
declare type EcCurve = keyof typeof PointSizes;
declare namespace EcCurve {
    const Default: EcCurve;
    const Choices: readonly ("P-256" | "P-384" | "P-521")[];
}
/** Sha256WithEcdsa signing algorithm. */
declare const ECDSA: SigningAlgorithm<ECDSA.Info, true, ECDSA.GenParams>;
declare namespace ECDSA {
    /** Key generation parameters. */
    interface GenParams {
        curve?: EcCurve;
        /**
         * Import PKCS#8 private key and SPKI public key instead of generating.
         * This cannot handle specificCurve in SPKI.
         */
        importPkcs8?: [Uint8Array, Uint8Array];
    }
    interface Info {
        curve: EcCurve;
    }
}

/** HmacWithSha256 signing algorithm. */
declare const HMAC: SigningAlgorithm<{}, false, HMAC.GenParams>;
declare namespace HMAC {
    /** Key generation parameters. */
    interface GenParams {
        /** Import raw key bits instead of generating. */
        importRaw?: Uint8Array;
    }
}

declare const SigningAlgorithmList: SigningAlgorithm[];
declare const EncryptionAlgorithmList: EncryptionAlgorithm[];
declare const CryptoAlgorithmList: CryptoAlgorithm[];

declare type RsaModulusLength = 2048 | 4096;
declare namespace RsaModulusLength {
    const Default: RsaModulusLength;
    const Choices: readonly RsaModulusLength[];
}
/** Sha256WithRsa signing algorithm. */
declare const RSA: SigningAlgorithm<{}, true, RSA.GenParams>;
declare namespace RSA {
    interface GenParams {
        modulusLength?: RsaModulusLength;
        /** Import PKCS#8 private key and SPKI public key instead of generating. */
        importPkcs8?: [Uint8Array, Uint8Array];
    }
}
/** RSA-OAEP encryption algorithm. */
declare const RSAOAEP: EncryptionAlgorithm<{}, true, RSA.GenParams>;

declare const crypto: Crypto;

/** 'KEY' component. */
declare const KEY: Component;
/** Default issuerId. */
declare const ISSUER_DEFAULT: Component;
/** Self-signed issuerId. */
declare const ISSUER_SELF: Component;
interface KeyNameFields {
    subjectName: Name;
    keyId: Component;
}
interface CertNameFields extends KeyNameFields {
    issuerId: Component;
    version: Component;
    keyName: Name;
}
/** Get subject name from subject name, key name, or certificate name. */
declare function toSubjectName(name: Name): Name;
/** Determine whether the name is a key name. */
declare function isKeyName(name: Name): boolean;
/** Parse a key name into fields. */
declare function parseKeyName(name: Name): KeyNameFields;
/**
 * Get key name from key name or certificate name.
 * @throws input name is neither key name nor certificate name.
 */
declare function toKeyName(name: Name): Name;
/**
 * Create key name from subject name, key name, or certificate name.
 * @param name subject name, key name, or certificate name.
 * @param opts.keyId keyId component, used only if input name is subject name.
 */
declare function makeKeyName(name: Name, opts?: Partial<Omit<KeyNameFields, "subjectName">>): Name;
/** Determine whether the name is a certificate name. */
declare function isCertName(name: Name): boolean;
/** Parse a certificate name into fields. */
declare function parseCertName(name: Name): CertNameFields;
/**
 * Create certificate name from subject name, key name, or certificate name.
 * @param name subject name, key name, or certificate name.
 * @param opts.keyId keyId component, used only if input name is subject name.
 * @param opts.issuerId keyId, used only if input name is subject name.
 * @param opts.version keyId, used only if input name is subject name.
 */
declare function makeCertName(name: Name, opts?: Partial<Omit<CertNameFields, "subjectName">>): Name;

declare const naming_d_KEY: typeof KEY;
declare const naming_d_ISSUER_DEFAULT: typeof ISSUER_DEFAULT;
declare const naming_d_ISSUER_SELF: typeof ISSUER_SELF;
type naming_d_KeyNameFields = KeyNameFields;
type naming_d_CertNameFields = CertNameFields;
declare const naming_d_toSubjectName: typeof toSubjectName;
declare const naming_d_isKeyName: typeof isKeyName;
declare const naming_d_parseKeyName: typeof parseKeyName;
declare const naming_d_toKeyName: typeof toKeyName;
declare const naming_d_makeKeyName: typeof makeKeyName;
declare const naming_d_isCertName: typeof isCertName;
declare const naming_d_parseCertName: typeof parseCertName;
declare const naming_d_makeCertName: typeof makeCertName;
declare namespace naming_d {
  export {
    naming_d_KEY as KEY,
    naming_d_ISSUER_DEFAULT as ISSUER_DEFAULT,
    naming_d_ISSUER_SELF as ISSUER_SELF,
    naming_d_KeyNameFields as KeyNameFields,
    naming_d_CertNameFields as CertNameFields,
    naming_d_toSubjectName as toSubjectName,
    naming_d_isKeyName as isKeyName,
    naming_d_parseKeyName as parseKeyName,
    naming_d_toKeyName as toKeyName,
    naming_d_makeKeyName as makeKeyName,
    naming_d_isCertName as isCertName,
    naming_d_parseCertName as parseCertName,
    naming_d_makeCertName as makeCertName,
  };
}

declare const keychain_EcCurve: typeof EcCurve;
declare const keychain_ECDSA: typeof ECDSA;
declare const keychain_HMAC: typeof HMAC;
declare const keychain_SigningAlgorithmList: typeof SigningAlgorithmList;
declare const keychain_EncryptionAlgorithmList: typeof EncryptionAlgorithmList;
declare const keychain_CryptoAlgorithmList: typeof CryptoAlgorithmList;
declare const keychain_RsaModulusLength: typeof RsaModulusLength;
declare const keychain_RSA: typeof RSA;
declare const keychain_RSAOAEP: typeof RSAOAEP;
declare const keychain_ValidityPeriod: typeof ValidityPeriod;
declare const keychain_Certificate: typeof Certificate;
declare const keychain_KeyKind: typeof KeyKind;
type keychain_PrivateKey = PrivateKey;
type keychain_PublicKey = PublicKey;
type keychain_SecretKey = SecretKey;
declare const keychain_NamedSigner: typeof NamedSigner;
declare const keychain_NamedVerifier: typeof NamedVerifier;
declare const keychain_NamedEncrypter: typeof NamedEncrypter;
declare const keychain_NamedDecrypter: typeof NamedDecrypter;
declare const keychain_CryptoAlgorithm: typeof CryptoAlgorithm;
type keychain_SigningAlgorithm<_0, _1, _2> = SigningAlgorithm<_0, _1, _2>;
type keychain_EncryptionAlgorithm<_0, _1, _2> = EncryptionAlgorithm<_0, _1, _2>;
declare const keychain_createEncrypter: typeof createEncrypter;
declare const keychain_createDecrypter: typeof createDecrypter;
declare const keychain_generateEncryptionKey: typeof generateEncryptionKey;
type keychain_IvGen = IvGen;
declare const keychain_IvGen: typeof IvGen;
type keychain_IvChecker = IvChecker;
declare const keychain_IvChecker: typeof IvChecker;
type keychain_RandomIvGen = RandomIvGen;
declare const keychain_RandomIvGen: typeof RandomIvGen;
type keychain_CounterIvOptions = CounterIvOptions;
declare const keychain_CounterIvGen: typeof CounterIvGen;
declare const keychain_CounterIvChecker: typeof CounterIvChecker;
declare const keychain_createSigner: typeof createSigner;
declare const keychain_createVerifier: typeof createVerifier;
declare const keychain_generateSigningKey: typeof generateSigningKey;
declare const keychain_KeyStore: typeof KeyStore;
type keychain_CertStore = CertStore;
declare const keychain_CertStore: typeof CertStore;
declare const keychain_KeyChain: typeof KeyChain;
declare namespace keychain {
  export {
    crypto as KeyChainImplWebCrypto,
    naming_d as CertNaming,
    aes_d as AES,
    keychain_EcCurve as EcCurve,
    keychain_ECDSA as ECDSA,
    keychain_HMAC as HMAC,
    keychain_SigningAlgorithmList as SigningAlgorithmList,
    keychain_EncryptionAlgorithmList as EncryptionAlgorithmList,
    keychain_CryptoAlgorithmList as CryptoAlgorithmList,
    keychain_RsaModulusLength as RsaModulusLength,
    keychain_RSA as RSA,
    keychain_RSAOAEP as RSAOAEP,
    keychain_ValidityPeriod as ValidityPeriod,
    keychain_Certificate as Certificate,
    keychain_KeyKind as KeyKind,
    keychain_PrivateKey as PrivateKey,
    keychain_PublicKey as PublicKey,
    keychain_SecretKey as SecretKey,
    keychain_NamedSigner as NamedSigner,
    keychain_NamedVerifier as NamedVerifier,
    keychain_NamedEncrypter as NamedEncrypter,
    keychain_NamedDecrypter as NamedDecrypter,
    keychain_CryptoAlgorithm as CryptoAlgorithm,
    keychain_SigningAlgorithm as SigningAlgorithm,
    keychain_EncryptionAlgorithm as EncryptionAlgorithm,
    keychain_createEncrypter as createEncrypter,
    keychain_createDecrypter as createDecrypter,
    keychain_generateEncryptionKey as generateEncryptionKey,
    keychain_IvGen as IvGen,
    keychain_IvChecker as IvChecker,
    keychain_RandomIvGen as RandomIvGen,
    keychain_CounterIvOptions as CounterIvOptions,
    keychain_CounterIvGen as CounterIvGen,
    keychain_CounterIvChecker as CounterIvChecker,
    keychain_createSigner as createSigner,
    keychain_createVerifier as createVerifier,
    keychain_generateSigningKey as generateSigningKey,
    keychain_KeyStore as KeyStore,
    keychain_CertStore as CertStore,
    keychain_KeyChain as KeyChain,
  };
}

interface ForwardingProvider {
    topo: Topology;
    pendingUpdatesNodes: {
        [id: string]: Partial<INode>;
    };
    pendingUpdatesEdges: {
        [id: string]: Partial<IEdge>;
    };
    defaultLatency: number;
    defaultLoss: number;
    contentStoreSize?: number;
    latencySlowdown?: number;
    initialize: () => Promise<void>;
    initializePostNetwork: () => Promise<void>;
    edgeUpdated: (edge?: IEdge) => Promise<void>;
    nodeUpdated: (node?: INode) => Promise<void>;
    onNetworkClick: () => Promise<void>;
    sendPingInterest: (from: INode, to: INode) => void;
    sendInterest: (name: string, node: INode) => void;
    fetchCapturedPackets?: (node: INode) => void;
    visualizeCaptured?: (packet: any) => void;
    downloadExperimentDump?: () => void;
    loadExperimentDump?: () => void;
    runCode: (code: string, node: INode) => void;
}

declare class Topology {
    provider: ForwardingProvider;
    readonly DEFAULT_LINK_COLOR = "#3583ea";
    readonly DEFAULT_NODE_COLOR = "#a4b7fc";
    readonly SELECTED_NODE_COLOR = "#4ee44e";
    readonly ACTIVE_NODE_COLOR = "#ffcccb";
    readonly nodes: DataSet<INode, "id">;
    readonly edges: DataSet<IEdge, "id">;
    network: Network;
    imported?: 'MININDN' | 'BROWSER';
    busiestNode?: INode;
    busiestLink?: IEdge;
    selectedNode?: INode;
    selectedEdge?: IEdge;
    captureAll: boolean;
    pendingClickEvent?: (params: any) => void;
    globalCaptureFilter: (packet: ICapturedPacket) => boolean;
    constructor(provider: ForwardingProvider);
    /** Initialize the network */
    createNetwork: (container: HTMLElement) => Promise<void>;
    /** Update objects every animation frame */
    runAnimationFrame(): void;
    /** Handler */
    private onNetworkClick;
    /** Ensure all nodes and edges are initialized */
    private ensureInitialized;
    updateNodeColor(nodeId: IdType, nodeExtra?: INodeExtra): void;
    updateEdgeColor(edge: IEdge): void;
}

declare class SecurityController {
    private topo;
    private rootKeychain;
    private rootKeys;
    private issuerKeys;
    private refreshTimer;
    readonly nodes: DataSet<Node$1, "id">;
    readonly edges: DataSet<Edge, "id">;
    network: Network;
    schemaText: string;
    constructor(topo: Topology);
    private addCertNode;
    private refresh;
    /** Compute static routes */
    computeSecurity: () => Promise<void>;
    /** Initialize the network */
    createNetwork(container: HTMLElement): void;
    fitLazy(): void;
}

declare class ProviderBrowser implements ForwardingProvider {
    readonly LOG_INTERESTS = false;
    readonly BROWSER = 1;
    topo: Topology;
    pendingUpdatesNodes: {
        [id: string]: Partial<INode>;
    };
    pendingUpdatesEdges: {
        [id: string]: Partial<IEdge>;
    };
    defaultLatency: number;
    defaultLoss: number;
    contentStoreSize: number;
    latencySlowdown: number;
    private scheduledRouteRefresh;
    security: SecurityController;
    constructor();
    initialize: () => Promise<void>;
    initializePostNetwork: () => Promise<void>;
    edgeUpdated: (edge?: IEdge | undefined) => Promise<void>;
    nodeUpdated: (node?: INode | undefined) => Promise<void>;
    onNetworkClick: () => Promise<void>;
    sendPingInterest(from: INode, to: INode): void;
    sendInterest(name: string, node: INode): void;
    runCode(code: string, node: INode): void;
    /** Schedule a refresh of static routes */
    scheduleRouteRefresh: () => void;
    /** Compute static routes */
    private computeRoutes;
    /** Ensure all nodes and edges are initialized */
    private ensureInitialized;
    downloadExperimentDump(): void;
    loadExperimentDump(): void;
    loadExperimentDumpFromStr(val: string): void;
}

declare class DefaultServers {
    private nfw;
    /** Server for ping */
    private pingServer?;
    /** Server for certificates */
    private certServer?;
    constructor(nfw: NFW);
    restart(): void;
    private setupPingServer;
    private setupCertServer;
}

declare class NFW {
    private readonly topo;
    readonly nodeId: IdType;
    /** NDNts forwarder */
    fw: Forwarder;
    /** Local face for content store etc */
    localFace: FwFace;
    /** Push channel to local face */
    private localFaceTx;
    /** Browser Forwarding Provider */
    provider: ProviderBrowser;
    /** Security options */
    securityOptions?: {
        /** Signer object */
        signer: Signer;
        /** Verifier object */
        verifier: Verifier;
        /** Keychain */
        keyChain: KeyChain;
    };
    /** Forwarding table */
    fib: any[];
    /** Enable packet capture */
    capture: boolean;
    /** Content Store */
    private cs;
    /** Dead Nonce List */
    private dnl;
    /** Routing strategies */
    readonly strategies: {
        prefix: Name;
        strategy: string;
    }[];
    /** Default servers */
    defualtServers: DefaultServers;
    /** Connections to other NFWs */
    private connections;
    /** Aggregate of sent interests */
    private pit;
    /** Announcements current */
    private announcements;
    /** Extra parameters of node */
    private nodeExtra;
    /** Packet capture */
    private shark;
    constructor(topo: Topology, nodeId: IdType);
    node(): INode;
    nodeUpdated(): void;
    /** Update color of current node */
    updateColors(): void;
    /** Add traffic to link */
    private addLinkTraffic;
    private checkPrefixRegistrationMatches;
    private longestMatch;
    private allMatches;
    private expressInterest;
    private getConnection;
    strsFIB(): string[];
    getEndpoint(opts?: {
        secure?: boolean;
    }): Endpoint;
}

interface ICapturedPacket {
    /** Node for which this packet is captured */
    node?: string;
    /** Frame number */
    fn?: number | string;
    /** Timestamp in ms */
    t: number;
    /** Length of packet in bytes */
    l: number;
    /** Interest/Data/Nack */
    type: string;
    /** NDN name of packet */
    name: string;
    /** Originating node */
    from?: string;
    /** Destination node */
    to?: string;
    /** Contents of the packet for visualization */
    p?: any;
    /** Currently replaying this packet */
    a?: boolean;
}
interface INodeExtra {
    /** Units of traffic pending on this node */
    pendingTraffic: number;
    /** Currently written code on this node */
    codeEdit: string;
    /** Prefixes prodcued by this node */
    producedPrefixes: string[];
    /** FIB or status information of the node */
    fibStr: string;
    /** Wireshark */
    capturedPackets: ICapturedPacket[];
    /** Replay position */
    replayWindow?: number;
    /** Replay position (first) */
    replayWindowF?: number;
}
interface INode extends Node$1 {
    nfw?: NFW;
    /** Extra data object */
    extra: INodeExtra;
}
interface ILinkExtra {
    /** Units of traffic pending on this link */
    pendingTraffic: number;
}
interface IEdge extends Edge {
    /** Latency in milliseconds */
    latency: number;
    /** Loss in percentage */
    loss: number;
    /** Extra data object */
    extra: ILinkExtra;
}

/** Invertible Bloom Lookup Table. */
declare class IBLT {
    constructor(p: IBLT.Parameters | IBLT.PreparedParameters);
    private readonly p;
    private readonly ht;
    /** Insert a key. */
    insert(key: number): void;
    /** Erase a key. */
    erase(key: number): void;
    private checkHash;
    private keyToBuffer;
    private update;
    private update2;
    /** Compute the difference between this (first) and other (second) IBLT. */
    diff(...others: IBLT[]): IBLT.Diff;
    /**
     * Serialize the hashtable to a byte array.
     *
     * Each entry is serialized as 12 octets:
     * - count: int32
     * - keySum: uint32
     * - keyCheck: uint32
     * These numbers are big endian.
     *
     * Return value shares the underlying memory. It must be copied when not using compression.
     */
    serialize(): Uint8Array;
    /**
     * Deserialize from a byte array.
     * @throws input does not match parameters.
     */
    deserialize(v: Uint8Array): void;
    /**
     * Clone to another IBLT.
     */
    clone(): IBLT;
}
declare namespace IBLT {
    type HashFunction = (seed: number, input: Uint8Array) => number;
    /** IBLT parameters. */
    interface Parameters {
        /** Whether to use little endian when converting uint32 key to Uint8Array. */
        keyToBufferLittleEndian: boolean;
        /** Whether to use little endian when serializing uint32 and int32 fields. */
        serializeLittleEndian: boolean;
        /** 32-bit hash function. */
        hash: HashFunction;
        /** Number of hash keys. */
        nHash: number;
        /**
         * Hash function seed for KeyCheck field.
         * This must be greater than nHash.
         */
        checkSeed: number;
        /**
         * Number of hashtable entries.
         * This must be divisible by `nHash`.
         */
        nEntries: number;
    }
    class PreparedParameters implements Readonly<Parameters> {
        static prepare(p: Parameters): PreparedParameters;
        private constructor();
        readonly nBuckets: number;
    }
    interface PreparedParameters extends Readonly<Parameters> {
    }
    /** Difference between two IBLTs. */
    interface Diff {
        /** Whether all keys have been extracted. */
        success: boolean;
        /** Keys present in the first IBLT but absent in the second IBLT. */
        positive: Set<number>;
        /** Keys absent in the first IBLT but present in the second IBLT. */
        negative: Set<number>;
        /** Total number of keys in positive and negative sets. */
        total: number;
    }
}

declare type IntervalRange = [min: number, max: number];

/** A sync protocol participant. */
interface SyncProtocol<ID = any> extends TypedEventEmitter<SyncProtocol.Events<ID>> {
    /** Stop the protocol operation. */
    close(): void;
    /** Retrieve a node. */
    get(id: ID): SyncNode<ID> | undefined;
    /** Retrieve or create a node. */
    add(id: ID): SyncNode<ID>;
}
declare namespace SyncProtocol {
    interface Events<ID> {
        /** Emitted when a node is updated, i.e. has new sequence numbers. */
        update: (update: SyncUpdate<ID>) => void;
    }
}
/**
 * A sync protocol node.
 *
 * Each sync protocol participant may have zero or more nodes.
 */
interface SyncNode<ID = any> {
    /**
     * Node identifier.
     * This is typically a number or a Name.
     */
    readonly id: ID;
    /**
     * Current sequence number.
     * It can be increased, but cannot be decreased.
     */
    seqNum: number;
    /**
     * Remove this node from participating in the sync protocol.
     * This may or may not have effect, depending on the sync protocol.
     */
    remove(): void;
}
/** A received update regarding a node. */
declare class SyncUpdate<ID = any> {
    readonly node: SyncNode<ID>;
    readonly loSeqNum: number;
    readonly hiSeqNum: number;
    /**
     * Constructor.
     * @param node the node.
     * @param loSeqNum low sequence number, inclusive.
     * @param hiSeqNum high sequence number, inclusive.
     */
    constructor(node: SyncNode<ID>, loSeqNum: number, hiSeqNum: number);
    /** Node identifier. */
    get id(): ID;
    /** Number of new sequence numbers. */
    get count(): number;
    /** Iterate over new sequence numbers. */
    seqNums(): Iterable<number>;
}
interface Subscriber<Topic = Name, Update = any, SubscribeInfo = Topic> {
    subscribe: (topic: SubscribeInfo) => Subscription<Topic, Update>;
}
/**
 * A subscription on a topic.
 * Listen to the 'update' event to receive updates on incoming publications matching the topic.
 */
interface Subscription<Topic = Name, Update = SyncUpdate<Topic>> extends TypedEventEmitter<Subscription.Events<Update>> {
    /** The topic. */
    readonly topic: Topic;
    /** Unsubscribe. */
    remove(): void;
}
declare namespace Subscription {
    interface Events<Update> {
        /** Emitted when a subscription update is received. */
        update: (update: Update) => void;
    }
}

/** 32-bit hash function. */
declare type HashFunction = (seed: number, input: Uint8Array) => number;
/**
 * Bloom filter algorithm parameters.
 *
 * All participants must agree on the same parameters in order to communicate.
 */
interface Parameters {
    hash: HashFunction;
    projectedElementCount: number;
    falsePositiveProbability: number;
}
/** A Bloom filter. */
declare class BloomFilter {
    private readonly m;
    /**
     * Construct a Bloom filter.
     * @param p algorithm parameter.
     * @param wire decode from serialized wire encoding.
     * @returns a Promise that resolves to BloomFilter instance.
     */
    static create(p: Parameters, wire?: Uint8Array): Promise<BloomFilter>;
    /** Dispose this instance to prevent memory leak. */
    dispose(): void;
    /** Clear the Bloom filter. */
    clear(): void;
    /** Insert a value to the Bloom filter. */
    insert(s: string | Uint8Array): void;
    /** Determine whether the Bloom filter probably contains a value. */
    contains(s: string | Uint8Array): boolean;
    /** Serialize the Bloom filter. */
    encode(): Uint8Array;
    private constructor();
    private readonly c;
    private disposed;
    private throwIfDisposed;
    private readonly hashFunction;
}
interface BloomFilter extends Readonly<Parameters> {
}

interface Compression {
    compress: (input: Uint8Array) => Uint8Array;
    decompress: (compressed: Uint8Array) => Uint8Array;
}
declare class IbltCodec {
    readonly ibltCompression: Compression;
    protected readonly ibltParams: IBLT.PreparedParameters;
    iblt2comp(iblt: IBLT): Component;
    comp2iblt(comp: Component): IBLT;
}

declare class PSyncCore {
    constructor(p: PSyncCore.Parameters);
    readonly ibltParams: IBLT.PreparedParameters;
    readonly threshold: number;
    readonly joinPrefixSeqNum: (ps: PSyncCore.PrefixSeqNum) => PSyncCore.PrefixSeqNumEncoded;
    readonly nodes: Map<string, PSyncNode>;
    readonly keys: Map<number, PSyncNode>;
    readonly iblt: IBLT;
    get(prefix: Name): PSyncNode | undefined;
    add(prefix: Name): PSyncNode;
    list(filter: (node: PSyncNode) => boolean): PSyncCore.State;
    onIncreaseSeqNum?: (node: PSyncNode, prevSeqNum: number, prevKey: number) => void;
}
declare namespace PSyncCore {
    interface PrefixSeqNum {
        prefix: Name;
        seqNum: number;
    }
    type State = PrefixSeqNum[];
    interface PrefixSeqNumEncoded {
        readonly value: Uint8Array;
        readonly hash: number;
    }
    interface Parameters {
        iblt: IBLT.Parameters;
        /** If IBLT diff has at least this number of entries, respond with SyncData right away. */
        threshold: number;
        /** Encode prefix and sequence number to byte array. */
        joinPrefixSeqNum: (ps: PrefixSeqNum) => PrefixSeqNumEncoded;
    }
}
declare class PSyncNode implements SyncNode<Name>, PSyncCore.PrefixSeqNum {
    private readonly c;
    readonly id: Name;
    private readonly prefixHex;
    constructor(c: PSyncCore, id: Name, prefixHex: string);
    get prefix(): Name;
    get key(): number;
    private seq;
    private k;
    get seqNum(): number;
    set seqNum(v: number);
    /**
     * Change sequence number, for internal use.
     * @param v new sequence number.
     * @param triggerEvent whether to trigger onIncreaseSeqNum callback.
     */
    setSeqNum(v: number, triggerEvent?: boolean): void;
    remove(): void;
    /** Recompute `this.k` after changing sequence number. */
    private updateKey;
    private detachKey;
}

declare class PSyncCodec {
    protected readonly ibltParams: IBLT.PreparedParameters;
    constructor(p: PSyncCodec.Parameters, ibltParams: IBLT.PreparedParameters);
    readonly uselessCompsAfterIblt: Component[];
    state2buffer(state: PSyncCore.State): Uint8Array;
    buffer2state(buffer: Uint8Array): PSyncCore.State;
}
interface PSyncCodec extends Readonly<PSyncCodec.Parameters>, IbltCodec {
}
declare namespace PSyncCodec {
    type Compression = Compression;
    interface Parameters {
        /** Version convention for SyncData. */
        versionConvention: NamingConvention<number, number>;
        /** Segment number convention for SyncData. */
        segmentNumConvention: NamingConvention<number, number>;
        /** Compression method for IBLT in name component. */
        ibltCompression: Compression;
        /**
         * Number of useless components between IBLT and Version.
         * @see https://github.com/named-data/PSync/blob/b60398c5fc216a1b577b9dbcf61d48a21cb409a4/PSync/full-producer.cpp#L239
         */
        nUselessCompsAfterIblt: number;
        /** Compression method for State in segmented object. */
        contentCompression: Compression;
        /** Encode State to buffer (without compression). */
        encodeState: (state: PSyncCore.State) => Uint8Array;
        /** Decode State from buffer (without decompression). */
        decodeState: (payload: Uint8Array) => PSyncCore.State;
        /** Convert a name prefix to a Bloom filter key. */
        toBloomKey: (prefix: Name) => string | Uint8Array;
        /** Number of name components in an encoded Bloom filter. */
        encodeBloomLength: number;
        /** Encode a Bloom filter. */
        encodeBloom: (bf: BloomFilter) => Component[];
        /** Decode a Bloom filter. */
        decodeBloom: (Bloom: typeof BloomFilter, comps: readonly Component[]) => Promise<BloomFilter>;
    }
}

interface DebugEntry$4 {
    action: string;
    ownIblt: IBLT;
    recvIblt?: IBLT;
    state?: PSyncCore.State;
}
interface Events$4 extends SyncProtocol.Events<Name> {
    debug: (entry: DebugEntry$4) => void;
}
declare const PSyncFull_base: new () => TypedEventEmitter<Events$4>;
/** PSync - FullSync participant. */
declare class PSyncFull extends PSyncFull_base implements SyncProtocol<Name> {
    constructor({ p, endpoint, describe, syncPrefix, syncReplyFreshness, signer, producerBufferLimit, syncInterestLifetime, syncInterestInterval, verifier, }: PSyncFull.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly c;
    private readonly codec;
    private closed;
    private readonly pFreshness;
    private readonly pBuffer;
    private readonly pProducer;
    private readonly pPendings;
    private readonly cFetcher;
    private readonly cInterval;
    private cTimer;
    private cAbort?;
    private cCurrentInterestName?;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    get(prefix: Name): SyncNode<Name> | undefined;
    add(prefix: Name): SyncNode<Name>;
    private handleSyncInterest;
    private handleIncreaseSeqNum;
    private sendSyncData;
    private scheduleSyncInterest;
    private sendSyncInterest;
}
declare namespace PSyncFull {
    interface Parameters extends PSyncCore.Parameters, PSyncCodec.Parameters {
    }
    interface Options {
        /**
         * Algorithm parameters.
         * They must be the same on every peer.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync group prefix. */
        syncPrefix: Name;
        /**
         * FreshnessPeriod of sync reply Data packet.
         * @default 1000
         */
        syncReplyFreshness?: number;
        /**
         * Signer of sync reply Data packets.
         * Default is digest signing.
         */
        signer?: Signer;
        /**
         * How many sync reply segmented objects to keep in buffer.
         * This must be positive.
         * @default 32
         */
        producerBufferLimit?: number;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 1000
         */
        syncInterestLifetime?: number;
        /**
         * Interval between sync Interests, randomized within the range, in milliseconds.
         * @default [syncInterestLifetime/2+100,syncInterestLifetime/2+500]
         */
        syncInterestInterval?: IntervalRange;
        /**
         * Verifier of sync reply Data packets.
         * Default is no verification.
         */
        verifier?: Verifier;
    }
}

interface DebugEntry$3 {
    action: string;
    interestName?: Name;
}
interface Events$3 extends SyncProtocol.Events<Name> {
    debug: (entry: DebugEntry$3) => void;
}
declare const PSyncPartialPublisher_base: new () => TypedEventEmitter<Events$3>;
/** PSync - PartialSync publisher. */
declare class PSyncPartialPublisher extends PSyncPartialPublisher_base implements SyncProtocol<Name> {
    constructor({ p, endpoint, describe, syncPrefix, helloReplyFreshness, syncReplyFreshness, signer, producerBufferLimit, }: PSyncPartialPublisher.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly c;
    private readonly codec;
    private closed;
    private readonly pBuffer;
    private readonly hFreshness;
    private readonly hProducer;
    private readonly sFreshness;
    private readonly sProducer;
    private readonly sPendings;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    get(prefix: Name): SyncNode<Name> | undefined;
    add(prefix: Name): SyncNode<Name>;
    private handleHelloInterest;
    private handleSyncInterest;
    private handleIncreaseSeqNum;
    private sendStateData;
}
declare namespace PSyncPartialPublisher {
    interface Parameters extends PSyncCore.Parameters, PSyncCodec.Parameters {
    }
    interface Options {
        /**
         * Algorithm parameters.
         * They must match the subscriber parameters.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync producer prefix. */
        syncPrefix: Name;
        /**
         * FreshnessPeriod of hello reply Data packet.
         * @default 1000
         */
        helloReplyFreshness?: number;
        /**
         * FreshnessPeriod of sync reply Data packet.
         * @default 1000
         */
        syncReplyFreshness?: number;
        /**
         * Signer of sync reply Data packets.
         * Default is digest signing.
         */
        signer?: Signer;
        /**
         * How many sync reply segmented objects to keep in buffer.
         * This must be positive.
         * @default 32
         */
        producerBufferLimit?: number;
    }
}

declare type Sub = Subscription<Name, SyncUpdate<Name>>;
declare type Update = SyncUpdate<Name>;
interface DebugEntry$2 {
    action: string;
}
interface Events$2 {
    debug: (entry: DebugEntry$2) => void;
    state: (topics: readonly PSyncPartialSubscriber.TopicInfo[]) => void;
}
declare const PSyncPartialSubscriber_base: new () => TypedEventEmitter<Events$2>;
/** PSync - PartialSync subscriber. */
declare class PSyncPartialSubscriber extends PSyncPartialSubscriber_base implements Subscriber<Name, Update, PSyncPartialSubscriber.TopicInfo> {
    constructor({ p, endpoint, describe, syncPrefix, syncInterestLifetime, syncInterestInterval, verifier, }: PSyncPartialSubscriber.Options);
    readonly describe: string;
    private readonly helloPrefix;
    private readonly syncPrefix;
    private readonly codec;
    private readonly encodeBloom;
    private closed;
    private readonly subs;
    private readonly prevSeqNums;
    private bloom;
    private ibltComp?;
    private readonly cFetcher;
    private readonly cInterval;
    private cTimer;
    private cAbort?;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    subscribe(topic: PSyncPartialSubscriber.TopicInfo): Sub;
    private handleAddTopic;
    private handleRemoveTopic;
    private scheduleInterest;
    private sendInterest;
    private sendHelloInterest;
    private sendSyncInterest;
    private handleState;
}
declare namespace PSyncPartialSubscriber {
    interface Parameters extends PSyncCore.Parameters, PSyncCodec.Parameters {
        bloom: Parameters;
    }
    interface Options {
        /**
         * Algorithm parameters.
         * They must match the publisher parameters.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync producer prefix. */
        syncPrefix: Name;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 1000
         */
        syncInterestLifetime?: number;
        /**
         * Interval between sync Interests, randomized within the range, in milliseconds.
         * @default [syncInterestLifetime/2+100,syncInterestLifetime/2+500]
         */
        syncInterestInterval?: [min: number, max: number];
        /**
         * Verifier of sync reply Data packets.
         * Default is no verification.
         */
        verifier?: Verifier;
    }
    interface TopicInfo extends PSyncCore.PrefixSeqNum {
    }
}

/** Create algorithm parameters to be compatible with PSync C++ library. */
declare function makePSyncCompatParam({ keyToBufferLittleEndian, expectedEntries, expectedSubscriptions, ibltCompression, contentCompression, }?: makePSyncCompatParam.Options): PSyncFull.Parameters & PSyncPartialPublisher.Parameters & PSyncPartialSubscriber.Parameters;
declare namespace makePSyncCompatParam {
    interface Options {
        /**
         * Whether to use little endian when converting uint32 key to Uint8Array.
         * PSync C++ library behaves differently on big endian and little endian machines,
         * https://github.com/named-data/PSync/blob/b60398c5fc216a1b577b9dbcf61d48a21cb409a4/PSync/detail/util.cpp#L126
         * This must be set to match other peers.
         * @default true
         */
        keyToBufferLittleEndian?: boolean;
        /**
         * Expected number of IBLT entries, i.e. expected number of updates in a sync cycle.
         * This is irrelevant to PartialSync consumer.
         * @default 80
         */
        expectedEntries?: number;
        /**
         * Estimated number of subscriptions in PartialSync consumer.
         * @default 16
         */
        expectedSubscriptions?: number;
        /**
         * Whether to use zlib compression on IBLT.
         * Default is no compression. Use `PSyncZlib` to set zlib compression.
         *
         * In PSync C++ library, default for FullSync depends on whether zlib is available at compile
         * time, and default for PartialSync is no compression.
         * This must be set to match other peers.
         */
        ibltCompression?: PSyncCodec.Compression;
        /**
         * Whether to use zlib compression on Data payload.
         * Default is no compression. Use `PSyncZlib` to set zlib compression.
         *
         * In PSync C++ library, default for FullSync depends on whether zlib is available at compile
         * time. For PartialSync, it is always no compression.
         * This must be set to match other peers.
         */
        contentCompression?: PSyncCodec.Compression;
    }
}

/** Use zlib compression with PSync. */
declare const PSyncZlib: PSyncCodec.Compression;

interface DebugEntry$1 {
    action: string;
    own: Record<string, number>;
    recv?: Record<string, number>;
    state: string;
    nextState?: string;
    ourOlder?: number;
    ourNewer?: number;
}
interface Events$1 extends SyncProtocol.Events<SvSync.ID> {
    debug: (entry: DebugEntry$1) => void;
}
declare const SvSync_base: new () => TypedEventEmitter<Events$1>;
/** StateVectorSync participant. */
declare class SvSync extends SvSync_base implements SyncProtocol<SvSync.ID> {
    constructor({ endpoint, describe, syncPrefix, syncInterestLifetime, steadyTimer, suppressionTimer, signer, verifier, }: SvSync.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly syncInterestLifetime;
    private readonly steadyTimer;
    private readonly suppressionTimer;
    private readonly signer;
    private readonly verifier?;
    private readonly producer;
    /** Own version vector. */
    private readonly own;
    /**
     * In steady state, undefined.
     * In suppression state, aggregated version vector of incoming sync Interests.
     */
    private aggregated?;
    /** Sync Interest timer. */
    private timer;
    private debug;
    close(): void;
    get(id: SvSync.IDLike): SyncNode<SvSync.ID>;
    add(id: SvSync.IDLike): SyncNode<SvSync.ID>;
    private makeNode;
    private readonly handlePublish;
    private readonly handleSyncInterest;
    private resetTimer;
    private readonly handleTimer;
    private sendSyncInterest;
}
declare namespace SvSync {
    /**
     * Timer settings.
     * ms: median interval in milliseconds.
     * jitter: ± percentage, in [0.0, 1.0) range.
     */
    type Timer = [ms: number, jitter: number];
    interface Options {
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync group prefix. */
        syncPrefix: Name;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 1000
         */
        syncInterestLifetime?: number;
        /**
         * Sync Interest timer in steady state.
         * Default is [30000ms, ±10%]
         */
        steadyTimer?: Timer;
        /**
         * Sync Interest timer in suppression state.
         * Default is [200ms, ±50%]
         */
        suppressionTimer?: Timer;
        /**
         * Sync Interest signer.
         * Default is NullSigning.
         */
        signer?: Signer;
        /**
         * Sync Interest verifier.
         * Default is no verification.
         */
        verifier?: Verifier;
    }
    type IDLike = string | Uint8Array | ID;
    class ID {
        constructor(input: IDLike, hex?: string);
        readonly value: Uint8Array;
        readonly hex: string;
        get text(): string;
    }
    interface Node extends SyncNode<ID> {
    }
}

declare class SyncpsCodec {
    protected readonly ibltParams: IBLT.PreparedParameters;
    constructor(p: SyncpsCodec.Parameters, ibltParams: IBLT.PreparedParameters);
}
interface SyncpsCodec extends Readonly<SyncpsCodec.Parameters>, IbltCodec {
}
declare namespace SyncpsCodec {
    type Compression = Compression;
    interface Parameters {
        /** Compression method for IBLT in name component. */
        ibltCompression: Compression;
        /** Compute the hash of a publication. */
        hashPub: (pub: Data) => number;
        /** Encode Content to buffer. */
        encodeContent: (pubs: readonly Data[], maxSize: number) => [wire: Uint8Array, count: number];
        /** Decode Content from buffer. */
        decodeContent: (payload: Uint8Array) => Data[];
    }
}

interface DebugEntry {
    action: string;
    key?: number;
    name?: Name;
    ownIblt: IBLT;
    recvIblt?: IBLT;
    content?: Name[];
}
interface Events {
    debug: (entry: DebugEntry) => void;
}
declare const SyncpsPubsub_base: new () => TypedEventEmitter<Events>;
/** syncps - pubsub service. */
declare class SyncpsPubsub extends SyncpsPubsub_base implements Subscriber<Name, Data> {
    constructor({ p, endpoint, describe, syncPrefix, syncInterestLifetime, syncDataPubSize, syncSigner, syncVerifier, maxPubLifetime, maxClockSkew, modifyPublication, isExpired, filterPubs, pubSigner, pubVerifier, }: SyncpsPubsub.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly codec;
    private closed;
    private readonly iblt;
    private readonly pubs;
    private readonly maxPubLifetime;
    private readonly maxClockSkew;
    private readonly subs;
    private readonly dModify;
    private readonly dIsExpired;
    private readonly dSigner;
    private readonly dVerifier?;
    private nOwnPubs;
    /** IBLT of own publications with callback. */
    private readonly dConfirmIblt;
    private readonly pProducer;
    private readonly pFilter;
    private readonly pPubSize;
    private readonly pPendings;
    private readonly cVerifier?;
    private readonly cLifetime;
    private cAbort?;
    private cTimer;
    private cCurrentInterestNonce?;
    private cDelivering;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    /**
     * Publish a packet.
     * @param pub a Data packet. This does not need to be signed.
     * @param cb a callback to get notified whether publication is confirmed,
     *           i.e. its hash appears in a sync Interest from another participant.
     * @returns a Promise that resolves when the publication is recorded.
     *          It does not mean the publication has reached other participants.
     */
    publish(pub: Data, cb?: SyncpsPubsub.PublishCallback): Promise<void>;
    /**
     * Subscribe to a topic.
     * @param topic a name prefix.
     */
    subscribe(topic: Name): Subscription<Name, Data>;
    private handleSyncInterest;
    private processSyncInterest;
    private processPendingInterests;
    private scheduleSyncInterest;
    private sendSyncInterest;
    private isExpired;
    private addToActive;
    private invokePublishCb;
}
declare namespace SyncpsPubsub {
    interface Parameters extends SyncpsCodec.Parameters {
        iblt: IBLT.Parameters;
    }
    type ModifyPublicationCallback = (pub: Data) => void;
    /**
     * Callback to determine if a publication is expired.
     *
     * The callback can return either:
     * - boolean to indicate whether the publication is expired.
     * - number, interpreted as Unix timestamp (milliseconds) of publication creation time.
     *   The publication is considered expired if this timestamp is before
     *   `NOW - (maxPubLifetime+maxClockSkew)` or after `NOW + maxClockSkew`.
     */
    type IsExpiredCallback = (pub: Data) => boolean | number;
    interface FilterPubItem {
        /** A publication, i.e. Data packet. */
        readonly pub: Data;
        /** Whether the publication is owned by the local participant. */
        readonly own: boolean;
    }
    /**
     * Callback to decide what publications to be included in a response.
     * Argument contains unexpired publications only.
     * It should return a priority list of publications to be included in the response.
     */
    type FilterPubsCallback = (items: FilterPubItem[]) => FilterPubItem[];
    interface Options {
        /**
         * Algorithm parameters.
         * They must be the same on every peer.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync group prefix. */
        syncPrefix: Name;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 4000
         */
        syncInterestLifetime?: number;
        /**
         * Advisory maximum size for publications included in a sync reply Data packet.
         * @default 1300
         */
        syncDataPubSize?: number;
        /**
         * Signer of sync reply Data packets.
         * Default is digest signing.
         */
        syncSigner?: Signer;
        /**
         * Verifier of sync reply Data packets.
         * Default is no verification.
         */
        syncVerifier?: Verifier;
        /**
         * Publication lifetime.
         * @default 1000
         */
        maxPubLifetime?: number;
        /**
         * Maximum clock skew, for calculating timers.
         * @default 1000
         */
        maxClockSkew?: number;
        /**
         * Callback to modify publication before it's signed.
         * Default is appending a TimestampNameComponent to the name.
         */
        modifyPublication?: ModifyPublicationCallback;
        /**
         * Callback to determine if a publication is expired.
         * Default is interpreting the last component as TimestampNameComponent;
         * if the last component is not a TimestampNameComponent, it is seen as expired.
         */
        isExpired?: IsExpiredCallback;
        /**
         * Callback to decide what publications to be included in a response.
         * Default is: respond nothing if there's no own publication; otherwise,
         * prioritize own publications over others, and prioritize later timestamp.
         */
        filterPubs?: FilterPubsCallback;
        /**
         * Signer of publications.
         * Default is digest signing.
         */
        pubSigner?: Signer;
        /**
         * Verifier of publications.
         * Default is no verification.
         */
        pubVerifier?: Verifier;
    }
    type PublishCallback = (pub: Data, confirmed: boolean) => void;
}

/** Create algorithm parameters to be compatible with PSync C++ library. */
declare function makeSyncpsCompatParam({ keyToBufferLittleEndian, expectedEntries, }?: makeSyncpsCompatParam.Options): SyncpsPubsub.Parameters;
declare namespace makeSyncpsCompatParam {
    interface Options {
        /**
         * Whether to use little endian when converting a uint32 key to a byte array.
         * ndn-ind behaves differently on big endian and little endian machines,
         * https://github.com/operantnetworks/ndn-ind/blob/dd934a7a5106cda6ea14675554427e12df1ce18f/src/lite/util/crypto-lite.cpp#L114
         * This must be set to match other peers.
         * @default true
         */
        keyToBufferLittleEndian?: boolean;
        /**
         * Expected number of IBLT entries, i.e. expected number of updates in a sync cycle.
         * @default 85
         */
        expectedEntries?: number;
    }
}

declare const sync_IBLT: typeof IBLT;
declare const sync_makePSyncCompatParam: typeof makePSyncCompatParam;
declare const sync_PSyncFull: typeof PSyncFull;
declare const sync_PSyncZlib: typeof PSyncZlib;
declare const sync_PSyncPartialPublisher: typeof PSyncPartialPublisher;
declare const sync_PSyncPartialSubscriber: typeof PSyncPartialSubscriber;
declare const sync_SvSync: typeof SvSync;
declare const sync_makeSyncpsCompatParam: typeof makeSyncpsCompatParam;
declare const sync_SyncpsPubsub: typeof SyncpsPubsub;
declare const sync_SyncProtocol: typeof SyncProtocol;
type sync_SyncNode<_0> = SyncNode<_0>;
type sync_SyncUpdate<_0> = SyncUpdate<_0>;
declare const sync_SyncUpdate: typeof SyncUpdate;
type sync_Subscriber<_0, _1, _2> = Subscriber<_0, _1, _2>;
declare const sync_Subscription: typeof Subscription;
declare namespace sync {
  export {
    sync_IBLT as IBLT,
    sync_makePSyncCompatParam as makePSyncCompatParam,
    sync_PSyncFull as PSyncFull,
    sync_PSyncZlib as PSyncZlib,
    sync_PSyncPartialPublisher as PSyncPartialPublisher,
    sync_PSyncPartialSubscriber as PSyncPartialSubscriber,
    sync_SvSync as SvSync,
    sync_makeSyncpsCompatParam as makeSyncpsCompatParam,
    sync_SyncpsPubsub as SyncpsPubsub,
    sync_SyncProtocol as SyncProtocol,
    sync_SyncNode as SyncNode,
    sync_SyncUpdate as SyncUpdate,
    sync_Subscriber as Subscriber,
    sync_Subscription as Subscription,
  };
}

declare const node: INode;
declare const ndn: {
    packet: typeof packet;
    tlv: typeof tlv;
    sync: typeof sync;
    keychain: typeof keychain;
};
declare const visualize: (packet: any) => void;
declare const setGlobalCaptureFilter: (filter: (packet: ICapturedPacket) => boolean) => void;

export { ndn, node, setGlobalCaptureFilter, visualize };
