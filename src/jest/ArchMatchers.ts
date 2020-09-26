import {Checkable} from "../common/fluentapi/checkable";
import {Violation} from "../common/fluentapi/violation";
import {ViolatingEdge} from "../slices/assertions/admissibleEdges";
import {ViolatingNode} from "../files/assertions/matchingFiles";
import {ViolatingCycle} from "../files/assertions/freeOfCycles";

/*
 * Extending Jest and defining its type
 */
declare global {
	namespace jest {
		// tslint:disable-next-line:interface-name
		interface Matchers<R> {
			toPassAsync(): R
		}
	}
}

interface JestResult {
	pass: boolean;
	message: () => string
}

/*
 * Matcher
 */

class UnknownJestViolation implements JestViolation{
	details: Object = Object()
	message: string = "Unknown Violation found"
}

export interface JestViolation {
	message: string,
	details: Object
}

export class JestViolationFactory {

	public static from(violation: Violation): JestViolation {
		if(violation instanceof ViolatingNode) {
			return this.fromViolatingFile(violation)
		}
		if(violation instanceof ViolatingEdge) {
			return this.fromViolatingEdge(violation)
		}
		if(violation instanceof ViolatingCycle) {
			return this.fromViolatingCycle(violation)
		}
		return new UnknownJestViolation()
	}

	private static fromViolatingFile(file: ViolatingNode): JestViolation {
		return {
			message: `${file.projectedNode.label} should match ${file.checkPattern}`, // TODO we need the negation information
			details: file
		}
	}

	private static fromViolatingEdge(edge: ViolatingEdge): JestViolation {
		return {
			message: `${edge.projectedEdge.sourceLabel} -> ${edge.projectedEdge.targetLabel} is not allowed`, // TODO we need the negation information
			details: edge
		}
	}

	private static fromViolatingCycle(cycle: ViolatingCycle): JestViolation {
		let cycleText = cycle.cycle[0].sourceLabel
		cycle.cycle.forEach(c => {
			cycleText += " -> " + c.targetLabel
		})
		return {
			message: `Found cycle: ${cycleText}`, // TODO we need the negation information
			details: cycle
		}
	}

}

export class JestResultFactory {

	public static result(shouldNotPass: boolean, violations: JestViolation[]): JestResult {
		let info = shouldNotPass ? "expected to not pass\n" : "expected to pass\n"
		if (violations.length > 0) {
			violations.forEach((e) => {
				info += `${e.message}\n${JSON.stringify(e.details)}\n\n`
			})
			return { pass: false, message: () => info }
		}
		return { pass: true, message: () => info }
	}

	public static error(message): JestResult {
		return { pass: false, message: () => message }
	}

}

export function extendJestMatchers() {
	expect.extend({
		async toPassAsync(checkable:  Checkable) {
			if (!checkable) {
				return JestResultFactory.error("expected something checkable as an argument for expect()")
			}
			const violations = await checkable.check()
			const jestViolations = violations.map(v => JestViolationFactory.from(v))
			return JestResultFactory.result(this.isNot, jestViolations)
		}
	} as any)
}
