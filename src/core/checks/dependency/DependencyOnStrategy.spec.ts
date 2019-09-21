import { DependOnStrategy } from "./DependOnStrategy"
import { FileFactory } from "../../noun/FileFactory"
import { TSArch } from "../../TSArch"

describe("dependency rule", () => {
	const noDependenciesFile = FileFactory.buildFromPath(__dirname + "/samples/NoDependencies.ts")
	const dependOnStrategyFile = FileFactory.buildFromPath(__dirname + "/DependOnStrategy.ts")
	const twoDependenciesFile = FileFactory.buildFromPath(
		__dirname + "/samples/TwoDependenciesInProject.ts"
	)
	const haveComplexityLowerThanStrategyFile = FileFactory.buildFromPath(
		__dirname + "/../complexity/HaveComplexityLowerThanStrategy.ts"
	)
	const allFiles = [
		noDependenciesFile,
		dependOnStrategyFile,
		twoDependenciesFile,
		haveComplexityLowerThanStrategyFile
	]

	it("NoDependencies.ts should have no dependencies", async () => {
		expect(
			DependOnStrategy.getDependenciesOfSubject(noDependenciesFile, [
				dependOnStrategyFile,
				haveComplexityLowerThanStrategyFile
			]).length
		).toBe(0)
	})

	it("TwoDependenciesInProject.ts should have two dependencies", async () => {
		expect(
			DependOnStrategy.getDependenciesOfSubject(twoDependenciesFile, [
				dependOnStrategyFile,
				haveComplexityLowerThanStrategyFile
			]).length
		).toBe(2)
	})

	it("TwoDependenciesInProject.ts should depend on given objects DependOnStrategy.ts and ../HaveComplexityLowerThanStrategy.ts", async () => {
		const rule = new DependOnStrategy(TSArch.config.ignore)
		const result = rule.execute(
			false,
			allFiles,
			{ filter: () => [twoDependenciesFile] },
			{ filter: () => [dependOnStrategyFile, haveComplexityLowerThanStrategyFile] }
		)
		expect(result.hasRulePassed()).toBe(true)
		expect(result.getEntries().length).toBe(2)
	})

	it("TwoDependenciesInProject.ts should not depend on0 given objects DependOnStrategy.ts and ../HaveComplexityLowerThanStrategy.ts", async () => {
		const rule = new DependOnStrategy(TSArch.config.ignore)
		const result = rule.execute(
			true,
			allFiles,
			{ filter: () => [twoDependenciesFile] },
			{ filter: () => [dependOnStrategyFile, haveComplexityLowerThanStrategyFile] }
		)
		expect(result.hasRulePassed()).toBe(false)
		expect(result.getEntries().length).toBe(2)
	})

	it("TwoDependenciesInProject.ts has dependencies which are not part of the object", async () => {
		const rule = new DependOnStrategy(TSArch.config.ignore)
		const result = rule.execute(
			false,
			allFiles,
			{ filter: () => [twoDependenciesFile] },
			{ filter: () => [] }
		)
		expect(result.hasRulePassed()).toBe(false)
		expect(result.getEntries().length).toBe(1)
	})

	it("TwoDependenciesInProject.ts has dependencies which are not part of the object, negated", async () => {
		const rule = new DependOnStrategy(TSArch.config.ignore)
		const result = rule.execute(
			true,
			allFiles,
			{ filter: () => [twoDependenciesFile] },
			{ filter: () => [] }
		)
		expect(result.hasRulePassed()).toBe(true)
		expect(result.getEntries().length).toBe(1)
	})
})
