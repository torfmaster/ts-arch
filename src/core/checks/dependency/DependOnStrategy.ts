import { SyntaxKind, ImportDeclaration } from "typescript"
import { CheckStrategy } from "../CheckStrategy"
import { Noun } from "../../noun/Noun"
import { File } from "../../noun/File"
import { Result, ResultEntry } from "../../Result"
import * as path from "path"
import { IgnoreConfig } from "../../TSArchConfig";
import { PathHelper } from "./PathHelper"
import { Filter } from "../../filter/Filter"
export class DependOnStrategy implements CheckStrategy {
	constructor(private ignore: IgnoreConfig) {}

	execute(isNegated: boolean, nouns: Noun[], subjectFilter: Filter, objectFilter: Filter): Result {
		const subjects = subjectFilter.filter(nouns);
		const objects = objectFilter.filter(nouns);
		const result = new Result()
		const fileObjects = File.getFrom(objects)
		const fileSubjects = File.getFrom(subjects)

		fileSubjects.forEach(s => {
			const dependencies = DependOnStrategy.getDependenciesOfSubject(
				s,
				fileObjects,
				this.ignore.js
			)
			if (dependencies.length > 0) {
				dependencies.forEach(d => {
					result.addEntry(this.buildHasDependenciesResult(s, d, isNegated))
				})
			} else {
				result.addEntry(this.buildHasNoDependenciesResult(s, isNegated))
			}
		})
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
			const assumedPath = PathHelper.assumePathOfImportedObject(subject.getSourceFile().fileName, i)
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
