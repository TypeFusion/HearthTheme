import { readFileSync } from "node:fs";
import { codeToHtml } from "shiki";

export type ThemeKey = "dark" | "soft" | "light" | "lightSoft";
export type PreviewFileKey = "ts" | "py" | "go" | "rs" | "java" | "bash" | "html";

type PreviewTheme = {
	name: string;
	type: "dark" | "light";
	colors: Record<string, string>;
	tokenColors: Array<{
		scope?: string | string[];
		settings?: { foreground?: string };
	}>;
};

export type PreviewThemeState = {
	label: string;
	panelBg: string;
	stripBg: string;
	stripColor: string;
	stripBorder: string;
	toolbarBg: string;
	toolbarBorder: string;
	tabColor: string;
	tabHoverColor: string;
	tabActiveColor: string;
	switchColor: string;
	switchHoverColor: string;
	switchActiveColor: string;
	paper: boolean;
};

export type PreviewRenderMap = Record<PreviewFileKey, Record<ThemeKey, string>>;

export const DEFAULT_PREVIEW_FILE: PreviewFileKey = "ts";
export const DEFAULT_PREVIEW_THEME: ThemeKey = "dark";

export const previewTabs = [
	{ key: "ts", label: "index.ts" },
	{ key: "py", label: "main.py" },
	{ key: "go", label: "server.go" },
	{ key: "rs", label: "main.rs" },
	{ key: "java", label: "App.java" },
	{ key: "bash", label: "build.sh" },
	{ key: "html", label: "index.html" },
] as const;

export const previewThemeTabs = [
	{ key: "dark", label: "Dark" },
	{ key: "soft", label: "Dark Soft" },
	{ key: "light", label: "Light" },
	{ key: "lightSoft", label: "Light Soft" },
] as const;

function loadTheme(relativePath: string, name: string, type: "dark" | "light"): PreviewTheme {
	const raw = JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
	return {
		...raw,
		name,
		type,
	} as PreviewTheme;
}

function getTokenColor(theme: PreviewTheme, scopes: string[]): string | null {
	for (const entry of theme.tokenColors || []) {
		const entryScopes = Array.isArray(entry.scope) ? entry.scope : [entry.scope];
		if (!entryScopes.some((scope) => scopes.includes(String(scope || "")))) continue;
		if (entry.settings?.foreground) return entry.settings.foreground;
	}
	return null;
}

function requireThemeColor(value: string | undefined, key: string): string {
	if (!value) {
		throw new Error(`CodePreview: missing required theme color "${key}"`);
	}
	return value;
}

function getPanelPalette(theme: PreviewTheme) {
	const bg = requireThemeColor(theme.colors?.["editor.background"], "editor.background");
	const fg = requireThemeColor(theme.colors?.["editor.foreground"], "editor.foreground");
	const sidebar = theme.colors?.["sideBar.background"] || bg;
	const comment =
		getTokenColor(theme, ["comment"]) ||
		fg ||
		theme.colors?.["editorLineNumber.foreground"] ||
		sidebar;
	const variable =
		getTokenColor(theme, ["variable", "variable.other.readwrite"]) ||
		fg ||
		comment;
	return { bg, fg, sidebar, comment, variable };
}

const HearthDark = loadTheme("../../themes/hearth-dark.json", "Hearth Dark", "dark");
const HearthDarkSoft = loadTheme("../../themes/hearth-dark-soft.json", "Hearth Dark Soft", "dark");
const HearthLight = loadTheme("../../themes/hearth-light.json", "Hearth Light", "light");
const HearthLightSoft = loadTheme("../../themes/hearth-light-soft.json", "Hearth Light Soft", "light");

const previewThemesByKey: Record<ThemeKey, PreviewTheme> = {
	dark: HearthDark,
	soft: HearthDarkSoft,
	light: HearthLight,
	lightSoft: HearthLightSoft,
};

const d = getPanelPalette(HearthDark);
const s = getPanelPalette(HearthDarkSoft);
const l = getPanelPalette(HearthLight);
const ls = getPanelPalette(HearthLightSoft);

const previewSamples: Record<PreviewFileKey, string> = {
	ts: `// async data fetching with full type safety
import { createContext, useContext } from 'react'

interface ApiResponse<T> {
  data: T
  status: number
  ok: boolean
}

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, options)
  const data = await res.json() as T
  return { data, status: res.status, ok: res.ok }
}

const BASE = 'https://api.hearthcode.dev'
const TIMEOUT = 5_000`,
	py: `# dataclass-based connection pool
from dataclasses import dataclass, field
from typing import Optional, ClassVar
import asyncio

@dataclass
class Connection:
    host: str
    port: int = 5432
    timeout: float = 30.0

class Pool:
    MAX: ClassVar[int] = 20

    def __init__(self, dsn: str):
        self.dsn = dsn
        self._pool: list[Connection] = []

    async def acquire(self) -> Optional[Connection]:
        if not self._pool:
            return None
        return self._pool.pop()`,
	go: `// HTTP server with graceful shutdown
package main

import (
  "context"
  "net/http"
  "time"
)

type Server struct {
  addr    string
  timeout time.Duration
  mux     *http.ServeMux
}

func New(addr string) *Server {
  return &Server{
    addr:    addr,
    timeout: 10 * time.Second,
    mux:     http.NewServeMux(),
  }
}`,
	rs: `// typed parser with Result and Option
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Config {
    host: String,
    port: u16,
}

fn load_config(env: &HashMap<String, String>) -> Result<Config, String> {
    let host = env.get("HOST").cloned().unwrap_or_else(|| "127.0.0.1".into());
    let port = env
        .get("PORT")
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(8080);
    Ok(Config { host, port })
}`,
	java: `// immutable service model with records
import java.time.Duration;
import java.util.List;

public final class HearthService {
  private final String endpoint;
  private final Duration timeout;

  public HearthService(String endpoint) {
    this.endpoint = endpoint;
    this.timeout = Duration.ofSeconds(5);
  }

  public record Result<T>(T data, int status) {}
}`,
	bash: `#!/usr/bin/env bash
set -euo pipefail

APP_NAME="hearth"
BUILD_DIR="./dist"

echo "[\${APP_NAME}] cleaning old build"
rm -rf "\${BUILD_DIR}"

echo "[\${APP_NAME}] building site"
npm run build
`,
	html: `<!-- Hearth UI component -->
<style>
  :root {
    --HearthCode: var(--hearth-ember);
    --bg: var(--hearth-bg);
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--HearthCode);
    border-radius: 8px;
    padding: 1.5rem;
  }
</style>

<div class="card">
  <h2>HearthCode</h2>
  <p>Code by Hearthlight</p>
</div>`,
};

const previewLangMap: Record<PreviewFileKey, string> = {
	ts: "typescript",
	py: "python",
	go: "go",
	rs: "rust",
	java: "java",
	bash: "bash",
	html: "html",
};

export const previewThemeStateByKey: Record<ThemeKey, PreviewThemeState> = {
	dark: {
		label: "Hearth Dark",
		panelBg: d.bg,
		stripBg: d.sidebar,
		stripColor: d.comment,
		stripBorder: "var(--hearth-preview-strip-border-dark)",
		toolbarBg: d.sidebar,
		toolbarBorder: "var(--hearth-preview-strip-border-dark)",
		tabColor: d.comment,
		tabHoverColor: d.variable,
		tabActiveColor: d.fg,
		switchColor: d.comment,
		switchHoverColor: d.variable,
		switchActiveColor: d.fg,
		paper: false,
	},
	soft: {
		label: "Hearth Dark Soft",
		panelBg: s.bg,
		stripBg: s.sidebar,
		stripColor: s.comment,
		stripBorder: "var(--hearth-preview-strip-border-dark)",
		toolbarBg: s.sidebar,
		toolbarBorder: "var(--hearth-preview-strip-border-dark)",
		tabColor: s.comment,
		tabHoverColor: s.variable,
		tabActiveColor: s.fg,
		switchColor: s.comment,
		switchHoverColor: s.variable,
		switchActiveColor: s.fg,
		paper: false,
	},
	light: {
		label: "Hearth Light",
		panelBg: l.bg,
		stripBg: l.sidebar,
		stripColor: l.comment,
		stripBorder: "var(--hearth-preview-strip-border-light)",
		toolbarBg: l.sidebar,
		toolbarBorder: "var(--hearth-preview-strip-border-light)",
		tabColor: l.comment,
		tabHoverColor: l.variable,
		tabActiveColor: l.variable,
		switchColor: l.comment,
		switchHoverColor: l.variable,
		switchActiveColor: l.variable,
		paper: true,
	},
	lightSoft: {
		label: "Hearth Light Soft",
		panelBg: ls.bg,
		stripBg: ls.sidebar,
		stripColor: ls.comment,
		stripBorder: "var(--hearth-preview-strip-border-light)",
		toolbarBg: ls.sidebar,
		toolbarBorder: "var(--hearth-preview-strip-border-light)",
		tabColor: ls.comment,
		tabHoverColor: ls.variable,
		tabActiveColor: ls.variable,
		switchColor: ls.comment,
		switchHoverColor: ls.variable,
		switchActiveColor: ls.variable,
		paper: true,
	},
};

export function getPreviewRootStyle() {
	const initial = previewThemeStateByKey[DEFAULT_PREVIEW_THEME];
	return [
		`--preview-toolbar-bg: ${initial.toolbarBg}`,
		`--preview-toolbar-border: ${initial.toolbarBorder}`,
		`--preview-tab-color: ${initial.tabColor}`,
		`--preview-tab-hover-color: ${initial.tabHoverColor}`,
		`--preview-tab-active-color: ${initial.tabActiveColor}`,
		`--preview-switch-color: ${initial.switchColor}`,
		`--preview-switch-hover-color: ${initial.switchHoverColor}`,
		`--preview-switch-active-color: ${initial.switchActiveColor}`,
		`--preview-panel-bg: ${initial.panelBg}`,
		`--preview-strip-bg: ${initial.stripBg}`,
		`--preview-strip-color: ${initial.stripColor}`,
		`--preview-strip-border-color: ${initial.stripBorder}`,
	].join("; ");
}

export async function renderPreviewState(fileKey: PreviewFileKey, themeKey: ThemeKey) {
	return codeToHtml(previewSamples[fileKey], {
		lang: previewLangMap[fileKey],
		theme: previewThemesByKey[themeKey],
	});
}

export async function buildPreviewRenderMap(): Promise<PreviewRenderMap> {
	const rendered = {} as PreviewRenderMap;

	for (const key of Object.keys(previewSamples) as PreviewFileKey[]) {
		const code = previewSamples[key];
		const lang = previewLangMap[key];
		const [dark, soft, light, lightSoft] = await Promise.all([
			codeToHtml(code, { lang, theme: previewThemesByKey.dark }),
			codeToHtml(code, { lang, theme: previewThemesByKey.soft }),
			codeToHtml(code, { lang, theme: previewThemesByKey.light }),
			codeToHtml(code, { lang, theme: previewThemesByKey.lightSoft }),
		]);

		rendered[key] = { dark, soft, light, lightSoft };
	}

	return rendered;
}
