import { CycleFreeStrategy } from "./CycleFreeStrategy"
import { FileFactory } from "../../noun/FileFactory"
import { Noun } from "../../noun/Noun"

describe("cycle rule", () => {
	const a = FileFactory.buildFromPath(__dirname + "/samples/A.ts")
	const b = FileFactory.buildFromPath(__dirname + "/samples/B.ts")
	const c = FileFactory.buildFromPath(__dirname + "/samples/C.ts")
	const d = FileFactory.buildFromPath(__dirname + "/samples/D.ts")

	const identity = {
		filter: (x: Noun[]) => x
	}


	it("negated: A, C and B should not be cycle free", async () => {
		const s = new CycleFreeStrategy()
		const result = s.execute(true, [a, b, c], identity)
		expect(result.hasRulePassed()).toBe(true)
		expect(
			result
				.getEntries()
				.map(x => x.subject.getName() + ":" + x.info)
				.join(";")
		).toBe(
			"A.ts:Cyclic dependency found: A.ts -> B.ts -> A.ts;A.ts:Cyclic dependency found: A.ts -> B.ts -> C.ts -> A.ts"
		)
	})

	it("A, C and B should not be cycle free", async () => {
		const s = new CycleFreeStrategy()
		const result = s.execute(false, [a, b, c], identity)
		expect(result.hasRulePassed()).toBe(false)
		expect(
			result
				.getEntries()
				.map(x => x.subject.getName() + ":" + x.info)
				.join(";")
		).toBe(
			"A.ts:Cyclic dependency found: A.ts -> B.ts -> A.ts;A.ts:Cyclic dependency found: A.ts -> B.ts -> C.ts -> A.ts"
		)
	})

	it("A, C and B have 2 cycles", async () => {
		const s = new CycleFreeStrategy()
		const g = CycleFreeStrategy.getDependencyGraph([a, b, c])
		expect(s.getSimpleCycles(g).cycles).toEqual([
			[{ from: 0, to: 1 }, { from: 1, to: 0 }],
			[{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 0 }]
		])
	})

	it("A, C, D and B have 2 cycles", async () => {
		const s = new CycleFreeStrategy()
		const g = CycleFreeStrategy.getDependencyGraph([a, b, c, d])
		expect(s.getSimpleCycles(g).cycles).toEqual([
			[{ from: 0, to: 1 }, { from: 1, to: 0 }],
			[{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 0 }]
		])
	})

	it("A and B should have one simple cycle", async () => {
		const s = new CycleFreeStrategy()
		const g = CycleFreeStrategy.getDependencyGraph([a, b])
		expect(s.getSimpleCycles(g).cycles).toEqual([[{ from: 0, to: 1 }, { from: 1, to: 0 }]])
	})

	it("A and B have only two edges", async () => {
		expect(CycleFreeStrategy.getDependencyGraph([a, b]).edges).toEqual([{ from: 0, to: 1 }, { from: 1, to: 0 }])
	})

	it("A, C, D and B have 4 edges", async () => {
		expect(CycleFreeStrategy.getDependencyGraph([a, b, c, d]).edges).toEqual([
			{ from: 0, to: 1 },
			{ from: 1, to: 0 },
			{ from: 1, to: 2 },
			{ from: 2, to: 0 }
		])
	})
})
