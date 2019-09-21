import { Noun } from "../../noun/Noun"
import { Result } from "../../Result"
import { DependOnStrategy } from "../dependency/DependOnStrategy"
import { CheckStrategy } from "../CheckStrategy"
import { File } from "../../noun/File"
import { Edge } from "./Model"
import { TrajanSCC } from "./TrajanSCC"
import { JohnsonsAPSP } from "./JohnsonsAPSP"
import { Filter } from "../../filter/Filter"

export interface DependencyGraph {
	edges: Edge[]
	fileData: Map<number, File>
}

export interface SimpleCycles {
	cycles: Array<Edge[]>
	fileData: Map<number, File>
}

export class CycleFreeStrategy implements CheckStrategy {
	execute(isNegated: boolean, nouns: Noun[], subjectFilter: Filter): Result {
		const result = new Result()
		let dependencyGraph = this.getDependencyGraph(File.getFrom(nouns))
		const filteredGraph = this.filterGraph(dependencyGraph, subjectFilter)
		const cycles = this.getSimpleCycles(filteredGraph)

		if (cycles.cycles.length > 0) {
			cycles.cycles.forEach(cycle => {
				const subject = cycles.fileData.get(cycle[0].from)!
				result.addEntry({
					subject: subject,
					info: this.getReadableCycle(cycle, cycles.fileData),
					pass: isNegated
				})
			})
		}

		return result
	}

	private getReadableCycle(c: Edge[], fileData: Map<number, File>): string {
		return (
			"Cyclic dependency found: " +
			[...c, c[0]].map(edge => fileData.get(edge.from)!.getName()).join(" -> ")
		)
	}

	public getSimpleCycles(graph: DependencyGraph): SimpleCycles {
		const tarjan = new TrajanSCC()
		const cycles: Array<Edge[]> = []
		const stronglyConnectedComponents = tarjan.findStronglyConnectedComponents(graph.edges)
		stronglyConnectedComponents.forEach(scc => {
			const johnson = new JohnsonsAPSP()
			if (scc.length > 1) {
				cycles.push(...johnson.findSimpleCycles(scc))
			}
		})
		return {
			cycles: cycles,
			fileData: graph.fileData
		}
	}

	private filterGraph(graph: DependencyGraph, filter: Filter): DependencyGraph {
		const admissibleIndices = new Set<number>();
		const entries = graph.fileData.entries()
		const fileData = new Map()
		const edges: Edge[] = [];
		for (const [index, file] of entries) {
			if (filter.filter([file]).length===1) {
				admissibleIndices.add(index)
				fileData.set(index, file)
			}
		}
		for (const edge of graph.edges) {
			if (admissibleIndices.has(edge.from) && admissibleIndices.has(edge.to)) {
				edges.push(edge)
			}
		}

		return {
			fileData,
			edges
		}
	}

	public getDependencyGraph(subjects: File[]): DependencyGraph {
		const ids: Map<File, number> = new Map()
		const reversedMap: Map<number, File> = new Map()
		const edges: Edge[] = []
		subjects.forEach((subject, i) => {
			ids.set(subject, i)
			reversedMap.set(i, subject)
		})
		ids.forEach((id, file) => {
			const fileDeps = DependOnStrategy.getDependenciesOfSubject(file, subjects)
			fileDeps.forEach(fileDep => {
				const depId = ids.get(fileDep)
				if (depId !== undefined) {
					edges.push({
						from: id,
						to: depId
					})
				}
			})
		})
		return { edges: edges, fileData: reversedMap }
	}
}
