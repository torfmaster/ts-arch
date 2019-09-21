import { generateFileSubjectMock } from "../../../../test/generators"
import { HaveSubjectsStrategy } from "./HaveSubjectsStrategy"
import { Noun } from "../../noun/Noun"

describe("'have subjects rule'", () => {
	let rule: HaveSubjectsStrategy
	const identity = {
		filter: (x: Noun[]) => x
	}


	beforeEach(() => {
		rule = new HaveSubjectsStrategy()
	})

	it("should be false when given no subjects", () => {
		expect(rule.execute(false, [], identity).hasRulePassed()).toBe(false)
	})

	it("should be true when given subjects", () => {
		expect(
			rule
				.execute(false, [generateFileSubjectMock("a/a"), generateFileSubjectMock("a/a")], identity)
				.hasRulePassed()
		).toBe(true)
	})

	it("should be true when given no subjects and not modifier", () => {
		expect(rule.execute(true, [], identity).hasRulePassed()).toBe(true)
	})

	it("should be false when given subjects and not modifier", () => {
		expect(
			rule
				.execute(true, [generateFileSubjectMock("a/a"), generateFileSubjectMock("a/a")], identity)
				.hasRulePassed()
		).toBe(false)
	})
})
