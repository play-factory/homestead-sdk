import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ApiResult } from "../core/api-result.js";
import type { CliError } from "../core/errors.js";
import { error, ok, type Result } from "../core/result.js";

const skills = [{ name: "homestead-cli", filename: "homestead-cli.md" }] as const;

export const listSkills = (): ApiResult => ({
	kind: "skill_list",
	data: { items: skills },
});

const moduleDirectory = dirname(fileURLToPath(import.meta.url));

const candidatePaths = (filename: string): readonly string[] => [
	join(moduleDirectory, "..", "skills", filename),
	join(moduleDirectory, "..", "..", "skills", filename),
];

const loadSkillFromPaths = async (
	skill: (typeof skills)[number],
	paths: readonly string[],
): Promise<Result<ApiResult, CliError>> => {
	const [path, ...remainingPaths] = paths;
	if (path === undefined) {
		return error({
			type: "config_error",
			message: "Homestead CLI skill content is missing from this installation.",
		});
	}
	try {
		const content = await readFile(path, "utf8");
		return ok({ kind: "skill", data: { ...skill, content } });
	} catch (caught) {
		if (
			caught instanceof Error &&
			"code" in caught &&
			caught.code === "ENOENT"
		) {
			return loadSkillFromPaths(skill, remainingPaths);
		}
		return error({
			type: "config_error",
			message: "Unable to read Homestead CLI skill content.",
		});
	}
};

export const loadSkill = async (
	name: string,
): Promise<Result<ApiResult, CliError>> => {
	const skill = skills.find((item) => item.name === name);
	if (skill === undefined) {
		return error({
			type: "usage_error",
			message: `Unknown skill "${name}". Run \`homestead skill list\` to see available skills.`,
		});
	}
	return loadSkillFromPaths(skill, candidatePaths(skill.filename));
};
