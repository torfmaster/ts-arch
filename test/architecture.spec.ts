import "../jest"
import path from "path"
import {slicesOfProject} from "../src/slices/fluentapi/slices";
import {filesOfProject} from "../src/files/fluentapi/files";

describe("architecture", () => {
	jest.setTimeout(60000);

	it("components follow their inner architecture", async () => {
		const diagramLocation = path.resolve("test", "components_inner.puml")

		const rules = ["common", "files", "jest", "slices"].map(c => {
			return slicesOfProject()
				.definedBy("src/" + c + "/(**)/")
				.should()
				.adhereToDiagramInFile(diagramLocation)
		})

		for (let i = 0; i < rules.length; i++) {
			await expect(rules[i]).toPassAsync()
		}
	})

	// TODO where is the problem here ? I think it has to do with positive violations
	xit("components follow the architecture", async () => {
		const diagramLocation = path.resolve("test", "components.puml")

		const rule = slicesOfProject()
			.definedBy("src/(**)/")
			.should()
			.adhereToDiagramInFile(diagramLocation)

		await expect(rule).toPassAsync()
	})

	it("code should be cycle free", async () => {
		const rule = filesOfProject()
			.inFolder("src\/(common|files|slices|jest)")
			.should()
			.beFreeOfCycles()

		await expect(rule).toPassAsync()
	})
})
