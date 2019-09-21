import { CheckStrategy } from "../CheckStrategy"
import { Noun } from "../../noun/Noun"
import { Result } from "../../Result"
import { Filter } from "../../filter/Filter"

export class HaveSubjectsStrategy implements CheckStrategy {
	execute(isNegated: boolean, nouns: Noun[], subjectFilter: Filter): Result {
		const subjects = subjectFilter.filter(nouns)
		const result = new Result()
		if (subjects.length > 0) {
			if (!isNegated) {
				result.forcePass()
			} else {
				result.forceFail()
			}
		} else {
			if (!isNegated) {
				result.forceFail()
			} else {
				result.forcePass()
			}
		}
		return result
	}
}
