import { tokens, type TokenSet } from "./tokens";

type VariantId = keyof typeof tokens;
type TokenId = keyof TokenSet;

interface TokenRef {
	variant: VariantId;
	token: TokenId;
}

interface ColorRowSpec {
	name: string;
	valueRef: TokenRef;
	bgRef: TokenRef | null;
	roleKey: string;
}

export interface ColorRow {
	swatch: string;
	name: string;
	hex: string;
	bgRef: string | null;
	roleKey: string;
}

const colorRowSpecs: ColorRowSpec[] = [
	{
		name: "bg · dark",
		valueRef: { variant: "dark", token: "bg" },
		bgRef: null,
		roleKey: "colors.role.bg.dark",
	},
	{
		name: "bg · dark-soft",
		valueRef: { variant: "darkSoft", token: "bg" },
		bgRef: null,
		roleKey: "colors.role.bg.darkSoft",
	},
	{
		name: "fg · dark",
		valueRef: { variant: "dark", token: "fg" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.fg.dark",
	},
	{
		name: "keyword",
		valueRef: { variant: "dark", token: "keyword" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.keyword",
	},
	{
		name: "function",
		valueRef: { variant: "dark", token: "fn" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.function",
	},
	{
		name: "string",
		valueRef: { variant: "dark", token: "string" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.string",
	},
	{
		name: "type",
		valueRef: { variant: "dark", token: "type" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.type",
	},
	{
		name: "number",
		valueRef: { variant: "dark", token: "number" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.number",
	},
	{
		name: "comment",
		valueRef: { variant: "dark", token: "comment" },
		bgRef: { variant: "dark", token: "bg" },
		roleKey: "colors.role.comment",
	},
	{
		name: "bg · light",
		valueRef: { variant: "light", token: "bg" },
		bgRef: null,
		roleKey: "colors.role.bg.light",
	},
	{
		name: "bg · light-soft",
		valueRef: { variant: "lightSoft", token: "bg" },
		bgRef: null,
		roleKey: "colors.role.bg.lightSoft",
	},
	{
		name: "fg · light",
		valueRef: { variant: "light", token: "fg" },
		bgRef: { variant: "light", token: "bg" },
		roleKey: "colors.role.fg.light",
	},
	{
		name: "fg · light-soft",
		valueRef: { variant: "lightSoft", token: "fg" },
		bgRef: { variant: "lightSoft", token: "bg" },
		roleKey: "colors.role.fg.lightSoft",
	},
];

export function getColorRows(): ColorRow[] {
	return colorRowSpecs.map((row) => {
		const swatch = tokens[row.valueRef.variant][row.valueRef.token];
		const bgRef = row.bgRef ? tokens[row.bgRef.variant][row.bgRef.token] : null;

		return {
			swatch,
			name: row.name,
			hex: swatch,
			bgRef,
			roleKey: row.roleKey,
		};
	});
}
