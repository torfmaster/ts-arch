import { Noun } from "../noun/Noun"
import { Result } from "../Result"
import { Filter } from "../filter/Filter"

export interface CheckStrategy {
	execute(isNegated: boolean, subjects: Noun[], subjectFilter: Filter, objectFilter?: Filter): Result
}
