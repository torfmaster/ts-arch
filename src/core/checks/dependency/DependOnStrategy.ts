import { SyntaxKind, ImportDeclaration } from "typescript"
import { CheckStrategy } from "../CheckStrategy"
import { Noun } from "../../noun/Noun"
import { File } from "../../noun/File"
import { Result, ResultEntry } from "../../Result"
import * as path from "path"
import { IgnoreConfig } from "../../TSArchConfig"
import { PathHelper } from "./PathHelper"
import { Filter } from "../../filter/Filter"
import { CycleFreeStrategy } from "../cycles/CycleFreeStrategy"
export class DependOnStrategy implements CheckStrategy {
	constructor(private ignore: IgnoreConfig) {}

	execute(
		isNegated: boolean,
		nouns: Noun[],
		subjectFilter: Filter,
		objectFilter: Filter
	): Result {
		const result = new Result()

		const graph = CycleFreeStrategy.getDependencyGraph(File.getFrom(nouns))
		const subjects = subjectFilter.filter(nouns)
		const objects = objectFilter.filter(nouns)
		const validSubjectSet = new Set<number>()
		for (const [key, value] of graph.fileData.entries()) {
			if (subjects.some(subject => subject.getName() === value.getName())) {
				validSubjectSet.add(key)
			}
		}

		const invalidEdges = graph.edges.filter(({ from, to }) => {
			const fromFile = graph.fileData.get(from)
			const toFile = graph.fileData.get(to)
			const subjectContained = subjects.some(
				subject => !!fromFile && subject.getName() === fromFile.getName()
			)
			const objectContained = objects.some(
				object => !!toFile && object.getName() === toFile.getName()
			)
			return subjectContained && objectContained
		})

		for (const invalidEdge of invalidEdges) {
			const from = graph.fileData.get(invalidEdge.from)
			const to = graph.fileData.get(invalidEdge.to)
			result.addEntry(this.buildHasDependenciesResult(from!, to!, isNegated))
			validSubjectSet.delete(invalidEdge.from)
		}
		console.log(validSubjectSet)
		for (const validSubject of validSubjectSet) {
			const subject = graph.fileData.get(validSubject)
			result.addEntry(this.buildHasNoDependenciesResult(subject!, isNegated))
		}
		return result
	}

	private buildHasNoDependenciesResult(s: File, isNegated: boolean): ResultEntry {
		return {
			subject: s,
			info: this.buildHasNoDependencyString(),
			pass: isNegated
		}
	}

	private buildHasDependenciesResult(s: File, d: File, isNegated: boolean): ResultEntry {
		return {
			subject: s,
			object: d,
			info: this.buildHasDependencyString(d),
			pass: !isNegated
		}
	}

	private buildHasNoDependencyString(): string {
		return `has no dependencies on objects`
	}

	private buildHasDependencyString(f: File): string {
		return `has dependency on ${f.getName()}`
	}

	public static getDependenciesOfSubject(
		subject: File,
		objects: File[],
		ignoreJs: boolean = false
	): File[] {
		const result: File[] = []
		objects.forEach(object => {
			const declaration = DependOnStrategy.getImportDeclarationForObject(
				object,
				subject,
				ignoreJs
			)
			if (declaration) {
				result.push(object)
			}
		})
		return result
	}

	public static getImportDeclarationForObject(
		object: File,
		subject: File,
		ignoreJs: boolean = false
	): ImportDeclaration | null {
		let result: ImportDeclaration | null = null
		this.getImportDeclarations(subject).forEach(i => {
			const assumedPath = PathHelper.assumePathOfImportedObject(
				subject.getSourceFile().fileName,
				i
			)
			if (!assumedPath) {
				return
			}
			if (
				DependOnStrategy.hasSuffix(assumedPath, "ts") &&
				this.pathsMatch(assumedPath, object)
			) {
				result = i
			} else if (
				DependOnStrategy.hasSuffix(assumedPath, "js") &&
				!ignoreJs &&
				this.pathsMatch(assumedPath, object)
			) {
				result = i
			} else {
				const assumedTsPath = assumedPath + ".ts"
				const assumedJsPath = assumedPath + ".js"

				if (
					this.pathsMatch(assumedTsPath, object) ||
					(ignoreJs ? false : this.pathsMatch(assumedJsPath, object))
				) {
					result = i
				}
			}
		})
		return result
	}

	private static hasSuffix(assumedPath: string, suffix: string) {
		return assumedPath.match(new RegExp(".+(." + suffix + ")$"))
	}

	private static pathsMatch(p: string, object: File): boolean {
		return path.normalize(p) === path.normalize(object.getPath() + "/" + object.getName())
	}

	public static getImportDeclarations(subject: File): ImportDeclaration[] {
		return subject
			.getSourceFile()
			.statements.filter(x => x.kind === SyntaxKind.ImportDeclaration)
			.map(x => x as ImportDeclaration)
	}
}
