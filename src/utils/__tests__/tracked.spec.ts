import { describe, it, expect } from 'vitest'
import { TrackedArray, TrackedObject } from '../tracked'

describe('TrackedArray', () => {
  describe('initialization', () => {
    it('should initialize with empty array', () => {
      const tracked = new TrackedArray<number>()
      expect(tracked.array).toEqual([])
      // accessing .array might trigger a read, so we reset and check
      tracked.resetCounters()
      expect(tracked.reads).toBe(0)
      expect(tracked.writes).toBe(0)
    })

    it('should initialize with initial items and count them as writes', () => {
      const items = [1, 2, 3]
      const tracked = new TrackedArray(items)
      expect(tracked.array).toEqual([1, 2, 3])
      expect(tracked.writes).toBe(3)
      // accessing .array might trigger reads, so we check after reset
      tracked.resetCounters()
      expect(tracked.reads).toBe(0)
    })
  })

  describe('read tracking', () => {
    it('should track index access', () => {
      const tracked = new TrackedArray([10, 20, 30])
      tracked.resetCounters()

      const value = tracked.array[1]
      expect(value).toBe(20)
      expect(tracked.reads).toBe(1)
      expect(tracked.writes).toBe(0)
    })

    it('should track length access', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      const len = tracked.array.length
      expect(len).toBe(3)
      expect(tracked.reads).toBe(1)
    })

    it('should track multiple reads', () => {
      const tracked = new TrackedArray([1, 2, 3, 4, 5])
      tracked.resetCounters()

      const first = tracked.array[0]
      const second = tracked.array[1]
      const len = tracked.array.length

      expect(first).toBe(1)
      expect(second).toBe(2)
      expect(len).toBe(5)
      expect(tracked.reads).toBe(3)
    })

    it('should track reads through length getter', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      const len = tracked.length
      expect(len).toBe(3)
      expect(tracked.reads).toBe(1)
    })
  })

  describe('write tracking', () => {
    it('should track index assignment', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      tracked.array[1] = 99
      const writes = tracked.writes
      expect(tracked.toArray()[1]).toBe(99)
      expect(writes).toBe(1)
    })

    it('should track multiple writes', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      tracked.array[0] = 10
      tracked.array[1] = 20
      tracked.array[2] = 30

      expect(tracked.toArray()).toEqual([10, 20, 30])
      expect(tracked.writes).toBe(3)
    })
  })

  describe('array methods', () => {
    it('should track push operations', () => {
      const tracked = new TrackedArray<number>([1, 2])
      tracked.resetCounters()

      tracked.array.push(3, 4)
      const reads = tracked.reads
      const writes = tracked.writes
      expect(tracked.toArray()).toEqual([1, 2, 3, 4])
      expect(reads).toBe(1)
      expect(writes).toBe(2)
    })

    it('should track pop operations', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      const popped = tracked.array.pop()
      const reads = tracked.reads
      const writes = tracked.writes
      expect(popped).toBe(3)
      expect(tracked.toArray()).toEqual([1, 2])
      expect(reads).toBe(1)
      expect(writes).toBe(1)
    })

    it('should track shift operations', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      const shifted = tracked.array.shift()
      const reads = tracked.reads
      const writes = tracked.writes
      expect(shifted).toBe(1)
      expect(tracked.toArray()).toEqual([2, 3])
      expect(reads).toBe(1)
      expect(writes).toBe(1)
    })

    it('should track unshift operations', () => {
      const tracked = new TrackedArray([2, 3])
      tracked.resetCounters()

      tracked.array.unshift(0, 1)
      const reads = tracked.reads
      const writes = tracked.writes
      expect(tracked.toArray()).toEqual([0, 1, 2, 3])
      expect(reads).toBe(1)
      expect(writes).toBe(2)
    })

    it('should track splice operations', () => {
      const tracked = new TrackedArray([1, 2, 3, 4, 5])
      tracked.resetCounters()

      const removed = tracked.array.splice(1, 2, 20, 30)
      const reads = tracked.reads
      const writes = tracked.writes
      expect(removed).toEqual([2, 3])
      expect(tracked.toArray()).toEqual([1, 20, 30, 4, 5])
      expect(reads).toBe(1)
      expect(writes).toBe(4)
    })

    it('should track sort operations', () => {
      const tracked = new TrackedArray([3, 1, 4, 2])
      tracked.resetCounters()

      tracked.array.sort()
      const reads = tracked.reads
      const writes = tracked.writes
      expect(tracked.toArray()).toEqual([1, 2, 3, 4])
      expect(reads).toBe(1)
      expect(writes).toBe(4)
    })

    it('should track reverse operations', () => {
      const tracked = new TrackedArray([1, 2, 3, 4])
      tracked.resetCounters()

      tracked.array.reverse()
      const reads = tracked.reads
      const writes = tracked.writes
      expect(tracked.toArray()).toEqual([4, 3, 2, 1])
      expect(reads).toBe(1)
      expect(writes).toBe(4)
    })

    it('should track fill operations', () => {
      const tracked = new TrackedArray([1, 2, 3, 4])
      tracked.resetCounters()

      tracked.array.fill(0)
      const reads = tracked.reads
      const writes = tracked.writes
      expect(tracked.toArray()).toEqual([0, 0, 0, 0])
      expect(reads).toBe(1)
      expect(writes).toBe(4)
    })

    it('should track non-mutating methods without writes', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      const index = tracked.array.indexOf(2)
      const includes = tracked.array.includes(3)
      const joined = tracked.array.join(',')

      expect(index).toBe(1)
      expect(includes).toBe(true)
      expect(joined).toBe('1,2,3')
      expect(tracked.reads).toBe(3)
      expect(tracked.writes).toBe(0)
    })
  })

  describe('counter management', () => {
    it('should reset counters', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()
      const _ = tracked.array[0] // eslint-disable-line @typescript-eslint/no-unused-vars
      tracked.array[1] = 99

      expect(tracked.reads).toBe(1)
      expect(tracked.writes).toBe(1)

      tracked.resetCounters()

      expect(tracked.reads).toBe(0)
      expect(tracked.writes).toBe(0)
    })

    it('should get counts as object', () => {
      const tracked = new TrackedArray([1, 2, 3])
      tracked.resetCounters()

      const _ = tracked.array[0] // eslint-disable-line @typescript-eslint/no-unused-vars
      tracked.array[1] = 99

      const counts = tracked.getCounts()
      expect(counts).toEqual({
        reads: 1,
        writes: 1,
      })
    })
  })

  describe('conversion', () => {
    it('should convert to regular array', () => {
      const original = [1, 2, 3]
      const tracked = new TrackedArray(original)
      const converted = tracked.toArray()

      expect(converted).toEqual([1, 2, 3])
      expect(converted).not.toBe(tracked.array)
      expect(Array.isArray(converted)).toBe(true)
    })
  })
})

describe('TrackedObject', () => {
  describe('initialization', () => {
    it('should initialize with empty object', () => {
      const tracked = new TrackedObject<Record<string, number>>()
      expect(tracked.object).toEqual({})
      // accessing .object might trigger reads, so we reset and check
      tracked.resetCounters()
      expect(tracked.reads).toBe(0)
      expect(tracked.writes).toBe(0)
    })

    it('should initialize with initial object and count properties as writes', () => {
      const initial = { a: 1, b: 2, c: 3 }
      const tracked = new TrackedObject(initial)
      expect(tracked.object).toEqual({ a: 1, b: 2, c: 3 })
      expect(tracked.writes).toBe(3)
      // accessing .object might trigger reads, so we check after reset
      tracked.resetCounters()
      expect(tracked.reads).toBe(0)
    })
  })

  describe('read tracking', () => {
    it('should track property access', () => {
      const tracked = new TrackedObject({ name: 'test', value: 42 })
      tracked.resetCounters()

      const name = tracked.object.name
      expect(name).toBe('test')
      expect(tracked.reads).toBe(1)
      expect(tracked.writes).toBe(0)
    })

    it('should track multiple property reads', () => {
      const tracked = new TrackedObject({ a: 1, b: 2, c: 3 })
      tracked.resetCounters()

      const a = tracked.object.a
      const b = tracked.object.b
      const c = tracked.object.c

      expect(a).toBe(1)
      expect(b).toBe(2)
      expect(c).toBe(3)
      expect(tracked.reads).toBe(3)
    })

    it('should track "in" operator', () => {
      const tracked = new TrackedObject({ prop: 'value' })
      tracked.resetCounters()

      const hasProp = 'prop' in tracked.object
      expect(hasProp).toBe(true)
      expect(tracked.reads).toBe(1)
    })

    it('should track Object.keys', () => {
      const tracked = new TrackedObject({ a: 1, b: 2 })
      tracked.resetCounters()

      const keys = Object.keys(tracked.object)
      expect(keys).toEqual(['a', 'b'])
      // object.keys calls ownKeys (1 read) + getOwnPropertyDescriptor for each key (2 reads)
      expect(tracked.reads).toBe(3)
    })

    it('should track property descriptor access', () => {
      const tracked = new TrackedObject({ prop: 'value' })
      tracked.resetCounters()

      const descriptor = Object.getOwnPropertyDescriptor(tracked.object, 'prop')
      expect(descriptor).toBeDefined()
      expect(tracked.reads).toBe(1)
    })
  })

  describe('write tracking', () => {
    it('should track property assignment', () => {
      const tracked = new TrackedObject<{ value?: number }>({})
      tracked.resetCounters()

      tracked.object.value = 42
      expect(tracked.object.value).toBe(42)
      expect(tracked.writes).toBe(1)
    })

    it('should track multiple property writes', () => {
      const tracked = new TrackedObject<{ a?: number; b?: number }>({})
      tracked.resetCounters()

      tracked.object.a = 1
      tracked.object.b = 2

      expect(tracked.object.a).toBe(1)
      expect(tracked.object.b).toBe(2)
      expect(tracked.writes).toBe(2)
    })

    it('should track property updates', () => {
      const tracked = new TrackedObject({ value: 10 })
      tracked.resetCounters()

      tracked.object.value = 20
      expect(tracked.object.value).toBe(20)
      expect(tracked.writes).toBe(1)
    })
  })

  describe('counter management', () => {
    it('should reset counters', () => {
      const tracked = new TrackedObject<{ prop: string; newProp?: string }>({ prop: 'value' })
      tracked.resetCounters()
      const _ = tracked.object.prop // eslint-disable-line @typescript-eslint/no-unused-vars
      tracked.object.newProp = 'new'

      expect(tracked.reads).toBe(1)
      expect(tracked.writes).toBe(1)

      tracked.resetCounters()

      expect(tracked.reads).toBe(0)
      expect(tracked.writes).toBe(0)
    })

    it('should get counts as object', () => {
      const tracked = new TrackedObject<{ prop: string; newProp?: string }>({ prop: 'value' })
      tracked.resetCounters()

      const _ = tracked.object.prop // eslint-disable-line @typescript-eslint/no-unused-vars
      tracked.object.newProp = 'new'

      const counts = tracked.getCounts()
      expect(counts).toEqual({
        reads: 1,
        writes: 1,
      })
    })
  })

  describe('conversion', () => {
    it('should convert to regular object', () => {
      const original = { a: 1, b: 2, c: 3 }
      const tracked = new TrackedObject(original)
      const converted = tracked.toObject()

      expect(converted).toEqual({ a: 1, b: 2, c: 3 })
      expect(converted).not.toBe(tracked.object)
    })
  })

  describe('complex scenarios', () => {
    it('should track nested property access', () => {
      const tracked = new TrackedObject<{ level1: { level2: number } }>({
        level1: { level2: 42 },
      })
      tracked.resetCounters()

      const level1 = tracked.object.level1
      // accessing level1.level2 won't be tracked since level1 is a regular object
      expect(level1.level2).toBe(42)
      expect(tracked.reads).toBe(1)
    })
  })
})
