import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { codeToHtml } from "shiki"

import { productData } from "../data/product"

export type PreviewThemeId = string
export type PreviewFileKey = 'ts' | 'py' | 'go' | 'rs' | 'java' | 'bash'

type PreviewTheme = {
  name: string
  type: 'dark' | 'light'
  colors: Record<string, string>
  tokenColors: Array<{
    scope?: string | string[]
    settings?: { foreground?: string }
  }>
}

const fullPreviewThemeCatalog = productData.extension.themeCatalog.map((theme) => {
  const flavor = productData.flavors.find((entry) => entry.id === theme.schemeId)
  const publicTheme = productData.themes.find(
    (entry) => entry.schemeId === theme.schemeId && entry.variantId === theme.variantId,
  )
  return {
    id: `${theme.schemeId}-${theme.variantId}`,
    schemeId: theme.schemeId,
    variantId: theme.variantId,
    label: theme.label,
    tabLabel: theme.tabLabel || theme.label,
    summary: publicTheme?.summary || theme.label,
    uiTheme: theme.uiTheme,
    path: theme.path,
    isDefaultTheme:
      Boolean(flavor?.isDefault) &&
      String(flavor?.defaultVariant || '') === String(theme.variantId || ''),
  }
})

type PreviewThemeCatalogEntry = (typeof fullPreviewThemeCatalog)[number]

type PreviewThemeMap = Record<PreviewThemeId, PreviewTheme>

export type PreviewThemeState = {
  label: string
  panelBg: string
  stripBg: string
  stripColor: string
  stripBorder: string
  toolbarBg: string
  toolbarBorder: string
  tabColor: string
  tabHoverColor: string
  tabActiveColor: string
  switchColor: string
  switchHoverColor: string
  switchActiveColor: string
  paper: boolean
}

export type PreviewRenderMap = Record<PreviewFileKey, Record<PreviewThemeId, string>>

export const DEFAULT_PREVIEW_FILE: PreviewFileKey = 'ts'
export const DEFAULT_PREVIEW_THEME_ID = (
  fullPreviewThemeCatalog.find((theme) => theme.isDefaultTheme)?.id ||
  fullPreviewThemeCatalog[0]?.id
) as PreviewThemeId

export const previewTabs = [
  { key: 'ts', label: 'index.ts' },
  { key: 'py', label: 'main.py' },
  { key: 'go', label: 'server.go' },
  { key: 'rs', label: 'main.rs' },
  { key: 'java', label: 'App.java' },
  { key: 'bash', label: 'build.sh' },
] as const

export const previewThemeTabs = fullPreviewThemeCatalog.map((theme) => ({
  key: theme.id as PreviewThemeId,
  label: theme.tabLabel || theme.label,
  description: theme.summary,
}))

const previewThemeIds = previewThemeTabs.map((tab) => tab.key)

function getThemeMeta(themeId: PreviewThemeId): PreviewThemeCatalogEntry {
  const meta = fullPreviewThemeCatalog.find((entry) => entry.id === themeId)
  if (!meta) {
    throw new Error(`CodePreview: missing theme metadata for "${themeId}"`)
  }
  return meta
}

function loadTheme(themeId: PreviewThemeId): PreviewTheme {
  const meta = getThemeMeta(themeId)
  const themePath = resolve(process.cwd(), String(meta.path).replace(/^\.\//, ''))
  const raw = JSON.parse(readFileSync(themePath, 'utf8'))
  return {
    ...raw,
    name: meta.label,
    type: meta.uiTheme === 'vs' ? 'light' : 'dark',
  } as PreviewTheme
}

function getTokenColor(theme: PreviewTheme, scopes: string[]): string | null {
  for (const entry of theme.tokenColors || []) {
    const entryScopes = Array.isArray(entry.scope) ? entry.scope : [entry.scope]
    if (!entryScopes.some((scope) => scopes.includes(String(scope || '')))) continue
    if (entry.settings?.foreground) return entry.settings.foreground
  }
  return null
}

function requireThemeColor(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`CodePreview: missing required theme color "${key}"`)
  }
  return value
}

function getPanelPalette(theme: PreviewTheme) {
  const bg = requireThemeColor(theme.colors?.['editor.background'], 'editor.background')
  const fg = requireThemeColor(theme.colors?.['editor.foreground'], 'editor.foreground')
  const sidebar = theme.colors?.['sideBar.background'] || bg
  const comment =
    getTokenColor(theme, ['comment']) ||
    fg ||
    theme.colors?.['editorLineNumber.foreground'] ||
    sidebar
  const variable =
    getTokenColor(theme, ['variable', 'variable.other.readwrite']) ||
    fg ||
    comment
  return { bg, fg, sidebar, comment, variable }
}

function buildPreviewThemeState(theme: PreviewTheme): PreviewThemeState {
  const palette = getPanelPalette(theme)
  const isLight = theme.type === 'light'
  return {
    label: theme.name,
    panelBg: palette.bg,
    stripBg: palette.sidebar,
    stripColor: palette.comment,
    stripBorder: isLight
      ? 'var(--hearth-preview-strip-border-light)'
      : 'var(--hearth-preview-strip-border-dark)',
    toolbarBg: palette.sidebar,
    toolbarBorder: isLight
      ? 'var(--hearth-preview-strip-border-light)'
      : 'var(--hearth-preview-strip-border-dark)',
    tabColor: palette.comment,
    tabHoverColor: palette.variable,
    tabActiveColor: isLight ? palette.variable : palette.fg,
    switchColor: palette.comment,
    switchHoverColor: palette.variable,
    switchActiveColor: isLight ? palette.variable : palette.fg,
    paper: isLight,
  }
}

const previewThemes = Object.fromEntries(
  previewThemeIds.map((themeId) => [themeId, loadTheme(themeId)]),
) as PreviewThemeMap

export const previewThemeStateById = Object.fromEntries(
  previewThemeIds.map((themeId) => [themeId, buildPreviewThemeState(previewThemes[themeId])]),
) as Record<PreviewThemeId, PreviewThemeState>

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

const BASE = 'https://api.vesper.dev'
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

public final class VesperService {
  private final String endpoint;
  private final Duration timeout;

  public VesperService(String endpoint) {
    this.endpoint = endpoint;
    this.timeout = Duration.ofSeconds(5);
  }

  public record Result<T>(T data, int status) {}
}`,
  bash: `#!/usr/bin/env bash
set -euo pipefail

APP_NAME="vesper"
BUILD_DIR="./dist"

echo "[\${APP_NAME}] cleaning old build"
rm -rf "\${BUILD_DIR}"

echo "[\${APP_NAME}] building site"
npm run build
`,
}

const previewLangMap: Record<PreviewFileKey, string> = {
  ts: 'typescript',
  py: 'python',
  go: 'go',
  rs: 'rust',
  java: 'java',
  bash: 'bash',
}

export function getPreviewRootStyle(themeId: PreviewThemeId = DEFAULT_PREVIEW_THEME_ID) {
  const initial =
    previewThemeStateById[themeId] ||
    previewThemeStateById[DEFAULT_PREVIEW_THEME_ID]
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
  ].join('; ')
}

export async function renderPreviewState(
  fileKey: PreviewFileKey,
  themeId: PreviewThemeId,
) {
  return codeToHtml(previewSamples[fileKey], {
    lang: previewLangMap[fileKey],
    theme: previewThemes[themeId],
  })
}

export async function buildPreviewRenderMap(): Promise<PreviewRenderMap> {
  const rendered = {} as PreviewRenderMap

  for (const fileKey of Object.keys(previewSamples) as PreviewFileKey[]) {
    const code = previewSamples[fileKey]
    const lang = previewLangMap[fileKey]
    const themeRendered = {} as Record<PreviewThemeId, string>

    for (const themeId of previewThemeIds) {
      themeRendered[themeId] = await codeToHtml(code, { lang, theme: previewThemes[themeId] })
    }

    rendered[fileKey] = themeRendered
  }

  return rendered
}
