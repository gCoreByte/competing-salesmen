/**
 * TrackedArray - an array-like structure that tracks all reads and writes
 * @template T - the type of the array elements
 */
export class TrackedArray<T> {
  private _array: T[] = []
  private _reads = 0
  private _writes = 0
  private _proxy: T[]
  private _methodCallDepth = 0

  constructor(initialItems?: T[]) {
    if (initialItems) {
      this._array = [...initialItems]
      this._writes += initialItems.length
    }

    const self = this // eslint-disable-line @typescript-eslint/no-this-alias

    this._proxy = new Proxy(this._array, {
      get(target, prop, receiver) {
        // always pass symbols through
        if (typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver)
        }

        const value = Reflect.get(target, prop, receiver)

        // method access
        if (typeof value === 'function') {
          // only count the method access if we're not already inside a method call
          if (self._methodCallDepth === 0) {
            self._reads++
          }

          return (...args: unknown[]) => {
            // increment depth to suppress internal reads during method execution
            self._methodCallDepth++
            try {
              const result = value.apply(receiver, args)

              const mutatingMethods = [
                'push',
                'pop',
                'shift',
                'unshift',
                'splice',
                'sort',
                'reverse',
                'fill',
              ]

              if (mutatingMethods.includes(prop)) {
                if (prop === 'push' || prop === 'unshift') {
                  self._writes += args.length
                } else if (prop === 'pop' || prop === 'shift') {
                  self._writes++
                } else if (prop === 'splice') {
                  const deleteCount = (args[1] as number) ?? 0
                  const addCount = Math.max(0, args.length - 2)
                  self._writes += deleteCount + addCount
                } else {
                  self._writes += target.length
                }
              }

              return result
            } finally {
              self._methodCallDepth--
            }
          }
        }

        // numeric index access
        const index = Number(prop)
        if (!Number.isNaN(index)) {
          // Only count if not inside a method call
          if (self._methodCallDepth === 0) {
            self._reads++
          }
          return value
        }

        // length access
        if (prop === 'length') {
          // only count if not inside a method call
          if (self._methodCallDepth === 0) {
            self._reads++
          }
          return value
        }

        // other property access
        if (self._methodCallDepth === 0) {
          self._reads++
        }
        return value
      },

      set(target, prop, value, receiver) {
        // ignore symbols
        if (typeof prop === 'symbol') {
          return Reflect.set(target, prop, value, receiver)
        }

        const index = Number(prop)
        const success = Reflect.set(target, prop, value, receiver)

        // only count writes if not inside a method call (method calls handle their own write counting)
        if (success && self._methodCallDepth === 0) {
          if (!Number.isNaN(index)) {
            self._writes++
          } else {
            self._writes++
          }
        }

        return success
      },
    }) as T[]
  }

  get length(): number {
    this._reads++
    return this._array.length
  }

  get array(): T[] {
    return this._proxy
  }

  get reads(): number {
    return this._reads
  }

  get writes(): number {
    return this._writes
  }

  resetCounters(): void {
    this._reads = 0
    this._writes = 0
  }

  getCounts(): { reads: number; writes: number } {
    return { reads: this._reads, writes: this._writes }
  }

  toArray(): T[] {
    return [...this._array]
  }
}

/**
 * TrackedObject - an object-like structure that tracks all reads and writes
 * @template T - the type of the object
 */
export class TrackedObject<T extends Record<string, unknown>> {
  private _object: T
  private _reads = 0
  private _writes = 0
  private _proxy: T
  private _insideOwnKeys = false
  private _insideSet = false

  constructor(initialObject?: T) {
    this._object = initialObject ? { ...initialObject } : ({} as T)
    if (initialObject) {
      this._writes += Object.keys(initialObject).length
    }

    const self = this // eslint-disable-line @typescript-eslint/no-this-alias

    this._proxy = new Proxy(this._object, {
      get(target, prop, receiver) {
        if (typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver)
        }

        self._reads++
        return Reflect.get(target, prop, receiver)
      },

      set(target, prop, value, receiver) {
        if (typeof prop === 'symbol') {
          return Reflect.set(target, prop, value, receiver)
        }

        // mark that we're inside a set operation to suppress internal getOwnPropertyDescriptor calls
        self._insideSet = true
        try {
          const success = Reflect.set(target, prop, value, receiver)
          if (success) self._writes++
          return success
        } finally {
          self._insideSet = false
        }
      },

      has(target, prop) {
        self._reads++
        return Reflect.has(target, prop)
      },

      ownKeys(target) {
        // count ownKeys when called directly (e.g., by Object.keys)
        self._reads++
        self._insideOwnKeys = true
        try {
          return Reflect.ownKeys(target)
        } finally {
          self._insideOwnKeys = false
        }
      },

      getOwnPropertyDescriptor(target, prop) {
        // count getOwnPropertyDescriptor when called directly
        // not when called internally by ownKeys or set operations
        if (!self._insideOwnKeys && !self._insideSet) {
          self._reads++
        }
        return Reflect.getOwnPropertyDescriptor(target, prop)
      },
    }) as T
  }

  get object(): T {
    return this._proxy
  }

  get reads(): number {
    return this._reads
  }

  get writes(): number {
    return this._writes
  }

  resetCounters(): void {
    this._reads = 0
    this._writes = 0
  }

  getCounts(): { reads: number; writes: number } {
    return { reads: this._reads, writes: this._writes }
  }

  toObject(): T {
    return { ...this._object }
  }
}
